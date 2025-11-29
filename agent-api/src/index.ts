import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Ai } from '@cloudflare/ai';

// Define bindings
type Bindings = {
  AGENT_CACHE: KVNamespace;
  AI: any; // Workers AI binding
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use('*', cors());

// --- AI AGENT ENDPOINTS ---

// 1. Chat with the Agent
app.post('/api/chat', async (c) => {
  const ai = new Ai(c.env.AI);
  const body = await c.req.json();
  const messages = body.messages || [{ role: 'user', content: body.prompt || 'Hello' }];

  try {
    const response = await ai.run('@cf/meta/llama-3-8b-instruct', {
      messages,
    });
    return c.json(response);
  } catch (e) {
    return c.json({ error: 'AI Generation Failed', details: e.message }, 500);
  }
});

// 2. Analyze Artifacts (The "Better" Agent part)
app.post('/api/analyze', async (c) => {
  const ai = new Ai(c.env.AI);
  const body = await c.req.json();
  const { data, type } = body;

  const prompt = `
    You are an expert software architect. Analyze the following ${type}:
    ${JSON.stringify(data)}
    
    Provide a JSON response with:
    - "risk_level": "low" | "medium" | "high"
    - "issues": string[]
    - "suggestions": string[]
  `;

  try {
    const response = await ai.run('@cf/meta/llama-3-8b-instruct', {
      messages: [{ role: 'user', content: prompt }],
    });
    return c.json(response);
  } catch (e) {
    return c.json({ error: 'Analysis Failed' }, 500);
  }
});

// --- CRUD ENDPOINTS (Ported) ---

app.get('/', (c) => c.json({ status: 'operational', agent: 'active', framework: 'Hono' }));
app.get('/health', (c) => c.json({ status: 'healthy' }));

// Agents
app.get('/api/agents', async (c) => {
  const list = await c.env.AGENT_CACHE.list({ prefix: 'agent:' });
  const agents = [];
  for (const key of list.keys) {
    const val = await c.env.AGENT_CACHE.get(key.name);
    if (val) agents.push(JSON.parse(val));
  }
  return c.json(agents);
});

app.post('/api/agents', async (c) => {
  const body = await c.req.json();
  const id = `agent:${body.id || Date.now()}`;
  await c.env.AGENT_CACHE.put(id, JSON.stringify(body));
  return c.json({ success: true, id });
});

// Artifacts
app.get('/api/artifacts', async (c) => {
  const list = await c.env.AGENT_CACHE.list({ prefix: 'artifact:' });
  const artifacts = [];
  for (const key of list.keys) {
    const val = await c.env.AGENT_CACHE.get(key.name);
    if (val) artifacts.push(JSON.parse(val));
  }
  return c.json(artifacts);
});

app.post('/api/artifacts', async (c) => {
  const body = await c.req.json();
  const id = `artifact:${body.id || Date.now()}`;
  await c.env.AGENT_CACHE.put(id, JSON.stringify(body));
  return c.json({ success: true, id });
});

// Logs
app.get('/api/logs', async (c) => {
  const list = await c.env.AGENT_CACHE.list({ prefix: 'log:' });
  const logs = [];
  for (const key of list.keys) {
    const val = await c.env.AGENT_CACHE.get(key.name);
    if (val) logs.push(JSON.parse(val));
  }
  return c.json(logs);
});

// --- INSIGHTS ENDPOINTS ---

// Define the Insight type for better type safety
interface Insight {
  id: string;
  title: string;
  content: string;
  category?: string;
  createdAt: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

// Helper function to construct insight key from ID
function getInsightKey(id: string): string {
  return id.startsWith('insight:') ? id : `insight:${id}`;
}

// Get all insights
app.get('/api/insights', async (c) => {
  const list = await c.env.AGENT_CACHE.list({ prefix: 'insight:' });
  const insights: Insight[] = [];
  for (const key of list.keys) {
    const val = await c.env.AGENT_CACHE.get(key.name);
    if (val) {
      try {
        insights.push(JSON.parse(val) as Insight);
      } catch {
        // Skip malformed entries
      }
    }
  }
  return c.json(insights);
});

// Get a specific insight by ID
app.get('/api/insights/:id', async (c) => {
  const id = c.req.param('id');
  const key = getInsightKey(id);
  const val = await c.env.AGENT_CACHE.get(key);
  if (!val) {
    return c.json({ error: 'Insight not found' }, 404);
  }
  try {
    return c.json(JSON.parse(val) as Insight);
  } catch {
    return c.json({ error: 'Failed to parse insight data' }, 500);
  }
});

// Create a new insight
app.post('/api/insights', async (c) => {
  const body = await c.req.json();
  
  // Validate required fields
  if (!body.title || !body.content) {
    return c.json({ error: 'Missing required fields: title and content are required' }, 400);
  }
  
  // Validate required fields are strings
  if (typeof body.title !== 'string' || typeof body.content !== 'string') {
    return c.json({ error: 'Invalid field types: title and content must be strings' }, 400);
  }
  
  // Validate optional fields if provided
  if (body.category !== undefined && typeof body.category !== 'string') {
    return c.json({ error: 'Invalid field type: category must be a string' }, 400);
  }
  
  if (body.source !== undefined && typeof body.source !== 'string') {
    return c.json({ error: 'Invalid field type: source must be a string' }, 400);
  }
  
  if (body.metadata !== undefined && (typeof body.metadata !== 'object' || body.metadata === null || Array.isArray(body.metadata))) {
    return c.json({ error: 'Invalid field type: metadata must be an object' }, 400);
  }
  
  // Generate unique ID using crypto.randomUUID() for collision-resistant IDs
  const id = body.id || crypto.randomUUID();
  const insight: Insight = {
    id,
    title: body.title,
    content: body.content,
    category: body.category || 'general',
    createdAt: new Date().toISOString(),
    source: body.source || 'autonomous-agent',
    metadata: body.metadata || {},
  };
  
  const key = getInsightKey(id);
  await c.env.AGENT_CACHE.put(key, JSON.stringify(insight));
  return c.json({ success: true, id, insight });
});

// Delete an insight by ID
app.delete('/api/insights/:id', async (c) => {
  const id = c.req.param('id');
  const key = getInsightKey(id);
  
  // Check if insight exists first
  const existing = await c.env.AGENT_CACHE.get(key);
  if (!existing) {
    return c.json({ error: 'Insight not found' }, 404);
  }
  
  await c.env.AGENT_CACHE.delete(key);
  return c.json({ success: true, id });
});

export default app;