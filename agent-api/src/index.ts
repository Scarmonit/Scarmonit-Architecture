import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { Ai } from '@cloudflare/ai'

// Type definitions for request bodies
interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatRequestBody {
  messages?: ChatMessage[]
  prompt?: string
}

interface AnalyzeRequestBody {
  data: unknown
  type: string
}

interface AgentBody {
  id?: string | number
  [key: string]: unknown
}

interface ArtifactBody {
  id?: string | number
  [key: string]: unknown
}

// Define bindings
type Bindings = {
  AGENT_CACHE: KVNamespace
  AI: Fetcher // Workers AI binding
}

const app = new Hono<{ Bindings: Bindings }>()

// Middleware
app.use('*', cors())

// Helper function for safe JSON parsing
async function safeParseJson<T>(c: { req: { json: () => Promise<T> } }): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const data = await c.req.json() as T
    return { success: true, data }
  } catch {
    return { success: false, error: 'Invalid JSON in request body' }
  }
}

// Helper function to extract error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Unknown error'
}

// --- AI AGENT ENDPOINTS ---

// 1. Chat with the Agent
app.post('/api/chat', async (c) => {
  const parseResult = await safeParseJson<ChatRequestBody>(c)
  if (!parseResult.success) {
    return c.json({ error: 'Bad Request', details: parseResult.error }, 400)
  }

  const body = parseResult.data
  const ai = new Ai(c.env.AI)
  const messages = body.messages || [{ role: 'user' as const, content: body.prompt || 'Hello' }]

  try {
    const response = await ai.run('@cf/meta/llama-3-8b-instruct', {
      messages,
    })
    return c.json(response)
  } catch (e: unknown) {
    return c.json({ error: 'AI Generation Failed', details: getErrorMessage(e) }, 500)
  }
})

// 2. Analyze Artifacts (The "Better" Agent part)
app.post('/api/analyze', async (c) => {
  const parseResult = await safeParseJson<AnalyzeRequestBody>(c)
  if (!parseResult.success) {
    return c.json({ error: 'Bad Request', details: parseResult.error }, 400)
  }

  const { data, type } = parseResult.data

  // Input validation
  if (!type || typeof type !== 'string') {
    return c.json({ error: 'Bad Request', details: 'Missing or invalid "type" field' }, 400)
  }

  if (data === undefined) {
    return c.json({ error: 'Bad Request', details: 'Missing "data" field' }, 400)
  }

  const ai = new Ai(c.env.AI)

  const prompt = `
    You are an expert software architect. Analyze the following ${type}:
    ${JSON.stringify(data)}
    
    Provide a JSON response with:
    - "risk_level": "low" | "medium" | "high"
    - "issues": string[]
    - "suggestions": string[]
  `

  try {
    const response = await ai.run('@cf/meta/llama-3-8b-instruct', {
      messages: [{ role: 'user', content: prompt }],
    })
    return c.json(response)
  } catch (e: unknown) {
    return c.json({ error: 'Analysis Failed', details: getErrorMessage(e) }, 500)
  }
})

// --- CRUD ENDPOINTS (Ported) ---

app.get('/', (c) => c.json({ status: 'operational', agent: 'active', framework: 'Hono' }))
app.get('/health', (c) => c.json({ status: 'healthy' }))

// Agents
app.get('/api/agents', async (c) => {
  try {
    const list = await c.env.AGENT_CACHE.list({ prefix: 'agent:' })
    const agents: unknown[] = []
    for (const key of list.keys) {
      const val = await c.env.AGENT_CACHE.get(key.name)
      if (val) agents.push(JSON.parse(val))
    }
    return c.json(agents)
  } catch (e: unknown) {
    return c.json({ error: 'Failed to fetch agents', details: getErrorMessage(e) }, 500)
  }
})

app.post('/api/agents', async (c) => {
  const parseResult = await safeParseJson<AgentBody>(c)
  if (!parseResult.success) {
    return c.json({ error: 'Bad Request', details: parseResult.error }, 400)
  }

  try {
    const body = parseResult.data
    const id = `agent:${body.id || Date.now()}`
    await c.env.AGENT_CACHE.put(id, JSON.stringify(body))
    return c.json({ success: true, id })
  } catch (e: unknown) {
    return c.json({ error: 'Failed to create agent', details: getErrorMessage(e) }, 500)
  }
})

// Artifacts
app.get('/api/artifacts', async (c) => {
  try {
    const list = await c.env.AGENT_CACHE.list({ prefix: 'artifact:' })
    const artifacts: unknown[] = []
    for (const key of list.keys) {
      const val = await c.env.AGENT_CACHE.get(key.name)
      if (val) artifacts.push(JSON.parse(val))
    }
    return c.json(artifacts)
  } catch (e: unknown) {
    return c.json({ error: 'Failed to fetch artifacts', details: getErrorMessage(e) }, 500)
  }
})

app.post('/api/artifacts', async (c) => {
  const parseResult = await safeParseJson<ArtifactBody>(c)
  if (!parseResult.success) {
    return c.json({ error: 'Bad Request', details: parseResult.error }, 400)
  }

  try {
    const body = parseResult.data
    const id = `artifact:${body.id || Date.now()}`
    await c.env.AGENT_CACHE.put(id, JSON.stringify(body))
    return c.json({ success: true, id })
  } catch (e: unknown) {
    return c.json({ error: 'Failed to create artifact', details: getErrorMessage(e) }, 500)
  }
})

// Logs
app.get('/api/logs', async (c) => {
  try {
    const list = await c.env.AGENT_CACHE.list({ prefix: 'log:' })
    const logs: unknown[] = []
    for (const key of list.keys) {
      const val = await c.env.AGENT_CACHE.get(key.name)
      if (val) logs.push(JSON.parse(val))
    }
    return c.json(logs)
  } catch (e: unknown) {
    return c.json({ error: 'Failed to fetch logs', details: getErrorMessage(e) }, 500)
  }
})

export default app