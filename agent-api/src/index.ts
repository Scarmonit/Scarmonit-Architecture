import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env, ChatMessage, ChatRequestBody, AnalyzeRequestBody, Agent, Artifact } from '../worker-configuration.d'

// Define Hono bindings using shared Env type
type Bindings = Env

const app = new Hono<{ Bindings: Bindings }>()

// Helper to extract error message safely
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

// Input validation helpers
const isValidChatRequest = (body: unknown): body is ChatRequestBody => {
  if (typeof body !== 'object' || body === null) {
    return false
  }
  const req = body as ChatRequestBody
  if (req.messages !== undefined) {
    if (!Array.isArray(req.messages)) return false
    for (const msg of req.messages) {
      if (typeof msg !== 'object' || msg === null) return false
      if (typeof msg.role !== 'string' || typeof msg.content !== 'string') return false
    }
  }
  if (req.prompt !== undefined && typeof req.prompt !== 'string') {
    return false
  }
  return true
}

const isValidAnalyzeRequest = (body: unknown): body is AnalyzeRequestBody => {
  if (typeof body !== 'object' || body === null) {
    return false
  }
  const req = body as AnalyzeRequestBody
  return req.data !== undefined && typeof req.type === 'string' && req.type.length > 0
}

// Middleware
app.use('*', cors())

// --- AI AGENT ENDPOINTS ---

// 1. Chat with the Agent
app.post('/api/chat', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body', code: 'INVALID_JSON' }, 400)
  }

  if (!isValidChatRequest(body)) {
    return c.json({
      error: 'Invalid request body',
      details: 'Expected { messages?: [{role, content}], prompt?: string }',
      code: 'INVALID_REQUEST'
    }, 400)
  }

  const messages: ChatMessage[] = body.messages || [
    { role: 'user', content: body.prompt || 'Hello' }
  ]

  try {
    const response = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages,
    })
    return c.json(response)
  } catch (error: unknown) {
    return c.json({
      error: 'AI Generation Failed',
      details: getErrorMessage(error),
      code: 'AI_ERROR'
    }, 500)
  }
})

// 2. Analyze Artifacts (The "Better" Agent part)
app.post('/api/analyze', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body', code: 'INVALID_JSON' }, 400)
  }

  if (!isValidAnalyzeRequest(body)) {
    return c.json({
      error: 'Invalid request body',
      details: 'Expected { data: any, type: string }',
      code: 'INVALID_REQUEST'
    }, 400)
  }

  const { data, type } = body

  const prompt = `
    You are an expert software architect. Analyze the following ${type}:
    ${JSON.stringify(data)}
    
    Provide a JSON response with:
    - "risk_level": "low" | "medium" | "high"
    - "issues": string[]
    - "suggestions": string[]
  `

  try {
    const response = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [{ role: 'user', content: prompt }],
    })
    return c.json(response)
  } catch (error: unknown) {
    return c.json({
      error: 'Analysis Failed',
      details: getErrorMessage(error),
      code: 'AI_ERROR'
    }, 500)
  }
})

// --- CRUD ENDPOINTS (Ported) ---

app.get('/', (c) => c.json({ status: 'operational', agent: 'active', framework: 'Hono' }))
app.get('/health', (c) => c.json({ status: 'healthy' }))

// Agents
app.get('/api/agents', async (c) => {
  try {
    const list = await c.env.AGENT_CACHE.list({ prefix: 'agent:' })
    const agents: Agent[] = []
    for (const key of list.keys) {
      const val = await c.env.AGENT_CACHE.get(key.name)
      if (val) {
        try {
          agents.push(JSON.parse(val) as Agent)
        } catch {
          // Skip malformed entries
        }
      }
    }
    return c.json(agents)
  } catch (error: unknown) {
    return c.json({
      error: 'Failed to fetch agents',
      details: getErrorMessage(error),
      code: 'KV_ERROR'
    }, 500)
  }
})

app.post('/api/agents', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body', code: 'INVALID_JSON' }, 400)
  }

  if (typeof body !== 'object' || body === null) {
    return c.json({ error: 'Request body must be an object', code: 'INVALID_REQUEST' }, 400)
  }

  const agent = body as Agent
  const id = `agent:${agent.id || Date.now()}`

  try {
    await c.env.AGENT_CACHE.put(id, JSON.stringify(agent))
    return c.json({ success: true, id })
  } catch (error: unknown) {
    return c.json({
      error: 'Failed to store agent',
      details: getErrorMessage(error),
      code: 'KV_ERROR'
    }, 500)
  }
})

// Artifacts
app.get('/api/artifacts', async (c) => {
  try {
    const list = await c.env.AGENT_CACHE.list({ prefix: 'artifact:' })
    const artifacts: Artifact[] = []
    for (const key of list.keys) {
      const val = await c.env.AGENT_CACHE.get(key.name)
      if (val) {
        try {
          artifacts.push(JSON.parse(val) as Artifact)
        } catch {
          // Skip malformed entries
        }
      }
    }
    return c.json(artifacts)
  } catch (error: unknown) {
    return c.json({
      error: 'Failed to fetch artifacts',
      details: getErrorMessage(error),
      code: 'KV_ERROR'
    }, 500)
  }
})

app.post('/api/artifacts', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body', code: 'INVALID_JSON' }, 400)
  }

  if (typeof body !== 'object' || body === null) {
    return c.json({ error: 'Request body must be an object', code: 'INVALID_REQUEST' }, 400)
  }

  const artifact = body as Artifact
  const id = `artifact:${artifact.id || Date.now()}`

  try {
    await c.env.AGENT_CACHE.put(id, JSON.stringify(artifact))
    return c.json({ success: true, id })
  } catch (error: unknown) {
    return c.json({
      error: 'Failed to store artifact',
      details: getErrorMessage(error),
      code: 'KV_ERROR'
    }, 500)
  }
})

// Logs
app.get('/api/logs', async (c) => {
  try {
    const list = await c.env.AGENT_CACHE.list({ prefix: 'log:' })
    const logs: unknown[] = []
    for (const key of list.keys) {
      const val = await c.env.AGENT_CACHE.get(key.name)
      if (val) {
        try {
          logs.push(JSON.parse(val))
        } catch {
          // Skip malformed entries
        }
      }
    }
    return c.json(logs)
  } catch (error: unknown) {
    return c.json({
      error: 'Failed to fetch logs',
      details: getErrorMessage(error),
      code: 'KV_ERROR'
    }, 500)
  }
})

export default app