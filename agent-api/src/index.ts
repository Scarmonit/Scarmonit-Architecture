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

// Insights - Store agent-generated insights and analysis reports
app.get('/api/insights', async (c) => {
  const list = await c.env.AGENT_CACHE.list({ prefix: 'insight:' });
  const insights = [];
  for (const key of list.keys) {
    const val = await c.env.AGENT_CACHE.get(key.name);
    if (val) insights.push(JSON.parse(val));
  }
  return c.json(insights);
});

app.post('/api/insights', async (c) => {
  const body = await c.req.json();

  // Validate required fields
  if (!body.title || !body.content) {
    return c.json({ error: 'Missing required fields: title and content' }, 400);
  }

  const timestamp = Date.now();
  const insightId = body.id || timestamp;
  const id = `insight:${insightId}`;
  const insight = {
    ...body,
    id: insightId,
    title: body.title,
    content: body.content,
    category: body.category || 'general',
    source: body.source || 'autonomous-agent',
    createdAt: new Date(timestamp).toISOString(),
  };

  await c.env.AGENT_CACHE.put(id, JSON.stringify(insight));
  return c.json({ success: true, id, insight });
});

app.get('/api/insights/:id', async (c) => {
  const insightId = c.req.param('id');
  const val = await c.env.AGENT_CACHE.get(`insight:${insightId}`);

  if (!val) {
    return c.json({ error: 'Insight not found' }, 404);
  }

  return c.json(JSON.parse(val));
});

app.delete('/api/insights/:id', async (c) => {
  const insightId = c.req.param('id');
  const existing = await c.env.AGENT_CACHE.get(`insight:${insightId}`);

  if (!existing) {
    return c.json({ error: 'Insight not found' }, 404);
  }

  await c.env.AGENT_CACHE.delete(`insight:${insightId}`);
  return c.json({ success: true, message: 'Insight deleted' });
});

export default app;