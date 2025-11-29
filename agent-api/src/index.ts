import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { Ai } from '@cloudflare/ai'
import { createLogger } from './utils/logger'
import { createCacheService, generateCacheKey } from './utils/cache'
import {
  validateChatRequest,
  validateAnalyzeRequest,
  validateAgentRequest,
  createValidationErrorResponse,
  getErrorMessage,
} from './utils/validation'
import { getMetricsCollector, createTimingMiddleware } from './utils/metrics'
import { AI_MODEL, CACHE_TTL, HTTP_STATUS, CACHE_PREFIXES } from './config/constants'

// Define bindings
type Bindings = {
  AGENT_CACHE: KVNamespace
  AI: Ai // Workers AI binding
}

const app = new Hono<{ Bindings: Bindings }>()
const logger = createLogger('AgentAPI')

// Middleware
app.use('*', cors())

// Request timing middleware
app.use('*', async (c, next) => {
  const timing = createTimingMiddleware()
  const startTime = timing.start()
  await next()
  const duration = timing.end(startTime)

  // Record metrics
  const metrics = getMetricsCollector()
  metrics.record({
    endpoint: c.req.path,
    method: c.req.method,
    statusCode: c.res.status,
    duration,
    cached: c.res.headers.get('X-Cache-Hit') === 'true',
  })
})

// --- AI AGENT ENDPOINTS ---

// 1. Chat with the Agent (with caching and validation)
app.post('/api/chat', async (c) => {
  const ai = new Ai(c.env.AI)
  const cache = createCacheService(c.env.AGENT_CACHE)

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, HTTP_STATUS.BAD_REQUEST)
  }

  // Validate request
  const validation = validateChatRequest(body)
  if (!validation.valid) {
    return c.json(createValidationErrorResponse(validation), HTTP_STATUS.BAD_REQUEST)
  }

  const request = body as { messages?: Array<{ role: string; content: string }>; prompt?: string }
  const messages = request.messages || [{ role: 'user', content: request.prompt || 'Hello' }]

  // Generate cache key for this request
  const cacheKey = generateCacheKey(CACHE_PREFIXES.AI_RESPONSE, { messages })

  try {
    // Try to get from cache first (improves processing time)
    const { data: response, cached } = await cache.getOrSet(
      cacheKey,
      async () => {
        logger.info('AI request - cache miss', { endpoint: '/api/chat' })
        return await ai.run(AI_MODEL, { messages })
      },
      CACHE_TTL.AI_RESPONSE
    )

    if (cached) {
      c.header('X-Cache-Hit', 'true')
      logger.info('AI request - cache hit', { endpoint: '/api/chat' })
    }

    return c.json(response)
  } catch (error) {
    logger.error('AI generation failed', { error: getErrorMessage(error) })
    return c.json(
      { error: 'AI Generation Failed', details: getErrorMessage(error) },
      HTTP_STATUS.INTERNAL_ERROR
    )
  }
})

// 2. Analyze Artifacts (with validation and error handling)
app.post('/api/analyze', async (c) => {
  const ai = new Ai(c.env.AI)
  const cache = createCacheService(c.env.AGENT_CACHE)

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, HTTP_STATUS.BAD_REQUEST)
  }

  // Validate request
  const validation = validateAnalyzeRequest(body)
  if (!validation.valid) {
    return c.json(createValidationErrorResponse(validation), HTTP_STATUS.BAD_REQUEST)
  }

  const request = body as { data: unknown; type: string }
  const { data, type } = request

  const prompt = `
    You are an expert software architect. Analyze the following ${type}:
    ${JSON.stringify(data)}
    
    Provide a JSON response with:
    - "risk_level": "low" | "medium" | "high"
    - "issues": string[]
    - "suggestions": string[]
  `

  // Generate cache key for analysis
  const cacheKey = generateCacheKey(CACHE_PREFIXES.AI_RESPONSE, { type, data })

  try {
    const { data: response, cached } = await cache.getOrSet(
      cacheKey,
      async () => {
        logger.info('Analysis request - cache miss', { endpoint: '/api/analyze', type })
        return await ai.run(AI_MODEL, {
          messages: [{ role: 'user', content: prompt }],
        })
      },
      CACHE_TTL.AI_RESPONSE
    )

    if (cached) {
      c.header('X-Cache-Hit', 'true')
      logger.info('Analysis request - cache hit', { endpoint: '/api/analyze' })
    }

    return c.json(response)
  } catch (error) {
    logger.error('Analysis failed', { error: getErrorMessage(error) })
    return c.json(
      { error: 'Analysis Failed', details: getErrorMessage(error) },
      HTTP_STATUS.INTERNAL_ERROR
    )
  }
})

// --- CRUD ENDPOINTS (Ported) ---

app.get('/', (c) => c.json({ status: 'operational', agent: 'active', framework: 'Hono' }))
app.get('/health', (c) => c.json({ status: 'healthy' }))

// Metrics endpoint for operational efficiency monitoring
app.get('/api/metrics', (c) => {
  const metrics = getMetricsCollector()
  return c.json(metrics.getAggregated())
})

// Get recent request metrics (for debugging)
app.get('/api/metrics/recent', (c) => {
  const metrics = getMetricsCollector()
  const count = parseInt(c.req.query('count') || '10', 10)
  return c.json(metrics.getRecent(count))
})

// Agents
app.get('/api/agents', async (c) => {
  const list = await c.env.AGENT_CACHE.list({ prefix: CACHE_PREFIXES.AGENT })
  const agents: unknown[] = []
  for (const key of list.keys) {
    const val = await c.env.AGENT_CACHE.get(key.name)
    if (val) agents.push(JSON.parse(val))
  }
  return c.json(agents)
})

app.post('/api/agents', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, HTTP_STATUS.BAD_REQUEST)
  }

  // Validate request
  const validation = validateAgentRequest(body)
  if (!validation.valid) {
    return c.json(createValidationErrorResponse(validation), HTTP_STATUS.BAD_REQUEST)
  }

  const request = body as { id?: string; name: string; type: string }
  const id = `${CACHE_PREFIXES.AGENT}${request.id || Date.now()}`
  await c.env.AGENT_CACHE.put(id, JSON.stringify(body))
  logger.info('Agent created', { id })
  return c.json({ success: true, id }, HTTP_STATUS.CREATED)
})

// Artifacts
app.get('/api/artifacts', async (c) => {
  const list = await c.env.AGENT_CACHE.list({ prefix: CACHE_PREFIXES.ARTIFACT })
  const artifacts: unknown[] = []
  for (const key of list.keys) {
    const val = await c.env.AGENT_CACHE.get(key.name)
    if (val) artifacts.push(JSON.parse(val))
  }
  return c.json(artifacts)
})

app.post('/api/artifacts', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, HTTP_STATUS.BAD_REQUEST)
  }

  const request = body as { id?: string }
  const id = `${CACHE_PREFIXES.ARTIFACT}${request.id || Date.now()}`
  await c.env.AGENT_CACHE.put(id, JSON.stringify(body))
  logger.info('Artifact created', { id })
  return c.json({ success: true, id }, HTTP_STATUS.CREATED)
})

// Logs
app.get('/api/logs', async (c) => {
  const list = await c.env.AGENT_CACHE.list({ prefix: CACHE_PREFIXES.LOG })
  const logs: unknown[] = []
  for (const key of list.keys) {
    const val = await c.env.AGENT_CACHE.get(key.name)
    if (val) logs.push(JSON.parse(val))
  }
  return c.json(logs)
})

export default app