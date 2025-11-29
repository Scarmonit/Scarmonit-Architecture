import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { Ai } from '@cloudflare/ai'

// Define bindings
type Bindings = {
  AGENT_CACHE: KVNamespace
  AI: Ai
}

// Types for operational efficiency
interface EfficiencyMetrics {
  processingTime: {
    average: number
    count: number
    lastUpdated: string
  }
  cacheStats: {
    hits: number
    misses: number
    hitRate: number
  }
  errorRate: {
    total: number
    errors: number
    rate: number
  }
}

interface CacheEntry {
  response: unknown
  timestamp: number
  ttl: number
}

// Default cache TTL (5 minutes)
const CACHE_TTL = 5 * 60 * 1000

// Generate cache key from request
function generateCacheKey(prefix: string, data: unknown): string {
  const hash = JSON.stringify(data)
    .split('')
    .reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
  return `${prefix}:${Math.abs(hash)}`
}

// Extract error message safely
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

const app = new Hono<{ Bindings: Bindings }>()

// Middleware
app.use('*', cors())

// --- OPERATIONAL EFFICIENCY ENDPOINTS ---

// Get operational metrics
app.get('/api/metrics', async (c) => {
  const metricsData = await c.env.AGENT_CACHE.get('metrics:efficiency')
  const metrics: EfficiencyMetrics = metricsData
    ? JSON.parse(metricsData)
    : {
        processingTime: { average: 0, count: 0, lastUpdated: new Date().toISOString() },
        cacheStats: { hits: 0, misses: 0, hitRate: 0 },
        errorRate: { total: 0, errors: 0, rate: 0 },
      }

  return c.json({
    status: 'operational',
    metrics,
    recommendations: generateRecommendations(metrics),
  })
})

// Self-improvement analysis endpoint
app.get('/api/agent/analyze-efficiency', async (c) => {
  const metricsData = await c.env.AGENT_CACHE.get('metrics:efficiency')
  const metrics: EfficiencyMetrics = metricsData
    ? JSON.parse(metricsData)
    : {
        processingTime: { average: 0, count: 0, lastUpdated: new Date().toISOString() },
        cacheStats: { hits: 0, misses: 0, hitRate: 0 },
        errorRate: { total: 0, errors: 0, rate: 0 },
      }

  const analysis = {
    timestamp: new Date().toISOString(),
    areas: {
      processingTime: {
        status: metrics.processingTime.average < 1000 ? 'optimal' : 'needs_improvement',
        currentValue: `${metrics.processingTime.average}ms`,
        suggestion: metrics.processingTime.average >= 1000
          ? 'Consider implementing additional caching layers'
          : 'Processing time is within acceptable range',
      },
      accuracy: {
        status: metrics.errorRate.rate < 0.05 ? 'optimal' : 'needs_improvement',
        currentValue: `${(1 - metrics.errorRate.rate) * 100}%`,
        suggestion: metrics.errorRate.rate >= 0.05
          ? 'Review error patterns and improve input validation'
          : 'Error rate is within acceptable range',
      },
      coverage: {
        status: 'monitoring',
        currentValue: `${metrics.processingTime.count} requests processed`,
        suggestion: 'Continue monitoring request patterns',
      },
      resourceUtilization: {
        status: metrics.cacheStats.hitRate > 0.5 ? 'optimal' : 'needs_improvement',
        currentValue: `${(metrics.cacheStats.hitRate * 100).toFixed(1)}% cache hit rate`,
        suggestion: metrics.cacheStats.hitRate <= 0.5
          ? 'Increase cache utilization for frequently accessed data'
          : 'Cache utilization is efficient',
      },
    },
    actionPlan: generateActionPlan(metrics),
  }

  return c.json(analysis)
})

// Generate recommendations based on metrics
function generateRecommendations(metrics: EfficiencyMetrics): string[] {
  const recommendations: string[] = []

  if (metrics.processingTime.average >= 1000) {
    recommendations.push('Optimize NLP algorithms to reduce processing time')
    recommendations.push('Implement additional caching for frequently accessed data')
  }

  if (metrics.errorRate.rate >= 0.05) {
    recommendations.push('Update knowledge base with latest patterns')
    recommendations.push('Implement peer-review mechanism for validation')
  }

  if (metrics.cacheStats.hitRate <= 0.5) {
    recommendations.push('Review cache key generation strategy')
    recommendations.push('Consider increasing cache TTL for stable data')
  }

  if (recommendations.length === 0) {
    recommendations.push('System is operating efficiently')
  }

  return recommendations
}

// Generate action plan based on metrics
function generateActionPlan(metrics: EfficiencyMetrics): string[] {
  const plan: string[] = []

  if (metrics.processingTime.average >= 500) {
    plan.push('1. Enable response caching for repeated queries')
  }

  if (metrics.errorRate.rate > 0) {
    plan.push('2. Review and improve input validation')
  }

  plan.push('3. Continue monitoring operational metrics')
  plan.push('4. Schedule periodic efficiency reviews')

  return plan
}

// Helper to update metrics
async function updateMetrics(
  cache: KVNamespace,
  processingTime: number,
  isError: boolean,
  isCacheHit: boolean
): Promise<void> {
  const metricsData = await cache.get('metrics:efficiency')
  const metrics: EfficiencyMetrics = metricsData
    ? JSON.parse(metricsData)
    : {
        processingTime: { average: 0, count: 0, lastUpdated: new Date().toISOString() },
        cacheStats: { hits: 0, misses: 0, hitRate: 0 },
        errorRate: { total: 0, errors: 0, rate: 0 },
      }

  // Update processing time
  const newCount = metrics.processingTime.count + 1
  metrics.processingTime.average =
    (metrics.processingTime.average * metrics.processingTime.count + processingTime) / newCount
  metrics.processingTime.count = newCount
  metrics.processingTime.lastUpdated = new Date().toISOString()

  // Update cache stats
  if (isCacheHit) {
    metrics.cacheStats.hits++
  } else {
    metrics.cacheStats.misses++
  }
  const totalCacheRequests = metrics.cacheStats.hits + metrics.cacheStats.misses
  metrics.cacheStats.hitRate = totalCacheRequests > 0
    ? metrics.cacheStats.hits / totalCacheRequests
    : 0

  // Update error rate
  metrics.errorRate.total++
  if (isError) {
    metrics.errorRate.errors++
  }
  metrics.errorRate.rate = metrics.errorRate.total > 0
    ? metrics.errorRate.errors / metrics.errorRate.total
    : 0

  await cache.put('metrics:efficiency', JSON.stringify(metrics))
}

// --- AI AGENT ENDPOINTS ---

// 1. Chat with the Agent (with caching for improved efficiency)
app.post('/api/chat', async (c) => {
  const startTime = Date.now()
  const ai = new Ai(c.env.AI)
  let isCacheHit = false
  let isError = false

  try {
    const body = await c.req.json()

    // Input validation for accuracy
    if (!body || (typeof body !== 'object')) {
      isError = true
      await updateMetrics(c.env.AGENT_CACHE, Date.now() - startTime, isError, isCacheHit)
      return c.json({ error: 'Invalid request body', code: 'INVALID_INPUT' }, 400)
    }

    const messages = body.messages || [{ role: 'user', content: body.prompt || 'Hello' }]

    // Check cache for response (processing time optimization)
    const cacheKey = generateCacheKey('chat', messages)
    const cachedData = await c.env.AGENT_CACHE.get(cacheKey)

    if (cachedData) {
      const cached: CacheEntry = JSON.parse(cachedData)
      if (Date.now() - cached.timestamp < cached.ttl) {
        isCacheHit = true
        await updateMetrics(c.env.AGENT_CACHE, Date.now() - startTime, isError, isCacheHit)
        return c.json({ ...cached.response as object, cached: true })
      }
    }

    const response = await ai.run('@cf/meta/llama-3-8b-instruct', {
      messages,
    })

    // Cache the response
    const cacheEntry: CacheEntry = {
      response,
      timestamp: Date.now(),
      ttl: CACHE_TTL,
    }
    await c.env.AGENT_CACHE.put(cacheKey, JSON.stringify(cacheEntry))

    await updateMetrics(c.env.AGENT_CACHE, Date.now() - startTime, isError, isCacheHit)
    return c.json(response)
  } catch (e) {
    isError = true
    await updateMetrics(c.env.AGENT_CACHE, Date.now() - startTime, isError, isCacheHit)
    return c.json({
      error: 'AI Generation Failed',
      details: getErrorMessage(e),
      code: 'AI_ERROR',
    }, 500)
  }
})

// 2. Analyze Artifacts (The "Better" Agent part - with caching)
app.post('/api/analyze', async (c) => {
  const startTime = Date.now()
  const ai = new Ai(c.env.AI)
  let isCacheHit = false
  let isError = false

  try {
    const body = await c.req.json()

    // Input validation for accuracy
    if (!body || typeof body !== 'object') {
      isError = true
      await updateMetrics(c.env.AGENT_CACHE, Date.now() - startTime, isError, isCacheHit)
      return c.json({ error: 'Invalid request body', code: 'INVALID_INPUT' }, 400)
    }

    const { data, type } = body

    if (!data || !type) {
      isError = true
      await updateMetrics(c.env.AGENT_CACHE, Date.now() - startTime, isError, isCacheHit)
      return c.json({
        error: 'Missing required fields',
        required: ['data', 'type'],
        code: 'MISSING_FIELDS',
      }, 400)
    }

    // Check cache
    const cacheKey = generateCacheKey('analyze', { data, type })
    const cachedData = await c.env.AGENT_CACHE.get(cacheKey)

    if (cachedData) {
      const cached: CacheEntry = JSON.parse(cachedData)
      if (Date.now() - cached.timestamp < cached.ttl) {
        isCacheHit = true
        await updateMetrics(c.env.AGENT_CACHE, Date.now() - startTime, isError, isCacheHit)
        return c.json({ ...cached.response as object, cached: true })
      }
    }

    const prompt = `
      You are an expert software architect. Analyze the following ${type}:
      ${JSON.stringify(data)}
      
      Provide a JSON response with:
      - "risk_level": "low" | "medium" | "high"
      - "issues": string[]
      - "suggestions": string[]
    `

    const response = await ai.run('@cf/meta/llama-3-8b-instruct', {
      messages: [{ role: 'user', content: prompt }],
    })

    // Cache the response
    const cacheEntry: CacheEntry = {
      response,
      timestamp: Date.now(),
      ttl: CACHE_TTL,
    }
    await c.env.AGENT_CACHE.put(cacheKey, JSON.stringify(cacheEntry))

    await updateMetrics(c.env.AGENT_CACHE, Date.now() - startTime, isError, isCacheHit)
    return c.json(response)
  } catch (e) {
    isError = true
    await updateMetrics(c.env.AGENT_CACHE, Date.now() - startTime, isError, isCacheHit)
    return c.json({
      error: 'Analysis Failed',
      details: getErrorMessage(e),
      code: 'ANALYSIS_ERROR',
    }, 500)
  }
})

// --- CRUD ENDPOINTS (Ported) ---

app.get('/', (c) => c.json({ status: 'operational', agent: 'active', framework: 'Hono' }))
app.get('/health', (c) => c.json({ status: 'healthy' }))

// Agents
app.get('/api/agents', async (c) => {
  const list = await c.env.AGENT_CACHE.list({ prefix: 'agent:' })
  const agents = []
  for (const key of list.keys) {
    const val = await c.env.AGENT_CACHE.get(key.name)
    if (val) agents.push(JSON.parse(val))
  }
  return c.json(agents)
})

app.post('/api/agents', async (c) => {
  const body = await c.req.json()
  const id = `agent:${body.id || Date.now()}`
  await c.env.AGENT_CACHE.put(id, JSON.stringify(body))
  return c.json({ success: true, id })
})

// Artifacts
app.get('/api/artifacts', async (c) => {
  const list = await c.env.AGENT_CACHE.list({ prefix: 'artifact:' })
  const artifacts = []
  for (const key of list.keys) {
    const val = await c.env.AGENT_CACHE.get(key.name)
    if (val) artifacts.push(JSON.parse(val))
  }
  return c.json(artifacts)
})

app.post('/api/artifacts', async (c) => {
  const body = await c.req.json()
  const id = `artifact:${body.id || Date.now()}`
  await c.env.AGENT_CACHE.put(id, JSON.stringify(body))
  return c.json({ success: true, id })
})

// Logs
app.get('/api/logs', async (c) => {
  const list = await c.env.AGENT_CACHE.list({ prefix: 'log:' })
  const logs = []
  for (const key of list.keys) {
    const val = await c.env.AGENT_CACHE.get(key.name)
    if (val) logs.push(JSON.parse(val))
  }
  return c.json(logs)
})

export default app