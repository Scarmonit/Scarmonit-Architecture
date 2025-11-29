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
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: 'AI Generation Failed', details: errorMessage }, 500);
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
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: 'Analysis Failed', details: errorMessage }, 500);
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

// --- AGENT TASK REPORTS ---

// Get all agent task reports
app.get('/api/reports', async (c) => {
  const list = await c.env.AGENT_CACHE.list({ prefix: 'report:' });
  const reports = [];
  for (const key of list.keys) {
    const val = await c.env.AGENT_CACHE.get(key.name);
    if (val) reports.push(JSON.parse(val));
  }
  return c.json(reports);
});

// Get a specific report by ID
app.get('/api/reports/:id', async (c) => {
  const id = c.req.param('id');
  const key = id.startsWith('report:') ? id : `report:${id}`;
  const val = await c.env.AGENT_CACHE.get(key);
  if (!val) {
    return c.json({ error: 'Report not found' }, 404);
  }
  return c.json(JSON.parse(val));
});

// Submit a new agent task report
app.post('/api/reports', async (c) => {
  const body = await c.req.json();
  
  // Validate required fields
  if (!body.task) {
    return c.json({ error: 'Missing required field: task' }, 400);
  }
  
  const timestamp = Date.now();
  const reportId = body.id || crypto.randomUUID();
  const id = `report:${reportId}`;
  
  const report = {
    id: reportId,
    task: body.task,
    result: body.result || '',
    status: body.status || 'completed',
    agentId: body.agentId || 'autonomous-agent',
    findings: body.findings || [],
    recommendations: body.recommendations || [],
    nextSteps: body.nextSteps || [],
    metadata: body.metadata || {},
    createdAt: new Date(timestamp).toISOString(),
  };
  
  await c.env.AGENT_CACHE.put(id, JSON.stringify(report));
  return c.json({ success: true, id: reportId, report }, 201);
});

// Update an existing report
app.put('/api/reports/:id', async (c) => {
  const id = c.req.param('id');
  const key = id.startsWith('report:') ? id : `report:${id}`;
  const existing = await c.env.AGENT_CACHE.get(key);
  
  if (!existing) {
    return c.json({ error: 'Report not found' }, 404);
  }
  
  const body = await c.req.json();
  const existingReport = JSON.parse(existing);
  
  // Only allow updating specific fields
  const allowedFields = ['task', 'result', 'status', 'findings', 'recommendations', 'nextSteps', 'metadata'];
  const updates: Record<string, unknown> = {};
  
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }
  
  const updatedReport = {
    ...existingReport,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  await c.env.AGENT_CACHE.put(key, JSON.stringify(updatedReport));
  return c.json({ success: true, report: updatedReport });
});

// Delete a report
app.delete('/api/reports/:id', async (c) => {
  const id = c.req.param('id');
  const key = id.startsWith('report:') ? id : `report:${id}`;
  const existing = await c.env.AGENT_CACHE.get(key);
  
  if (!existing) {
    return c.json({ error: 'Report not found' }, 404);
  }
  
  await c.env.AGENT_CACHE.delete(key);
  return c.json({ success: true, message: 'Report deleted' });
});

export default app;