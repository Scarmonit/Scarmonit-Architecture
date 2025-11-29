import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Ai } from '@cloudflare/ai';

// Define bindings
type Bindings = {
  AGENT_CACHE: KVNamespace;
  AI: unknown; // Workers AI binding
};

// Task result status type
type TaskResultStatus = 'pending' | 'completed' | 'failed';

// Task result interface for autonomous agent task completions
interface TaskResult {
  id: string;
  task: string;
  result: string;
  status: TaskResultStatus;
  agentId?: string;
  createdAt: string;
  updatedAt: string;
}

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

// --- TASK RESULTS ENDPOINTS ---
// Autonomous agent task completions

// List all task results
app.get('/api/task-results', async (c) => {
  const list = await c.env.AGENT_CACHE.list({ prefix: 'task-result:' });
  const taskResults: TaskResult[] = [];
  for (const key of list.keys) {
    const val = await c.env.AGENT_CACHE.get(key.name);
    if (val) taskResults.push(JSON.parse(val) as TaskResult);
  }
  return c.json(taskResults);
});

// Get a specific task result by ID
app.get('/api/task-results/:id', async (c) => {
  const id = c.req.param('id');
  const val = await c.env.AGENT_CACHE.get(`task-result:${id}`);
  if (!val) {
    return c.json({ error: 'Task result not found' }, 404);
  }
  return c.json(JSON.parse(val) as TaskResult);
});

// Create a new task result (for autonomous agents to report task completions)
app.post('/api/task-results', async (c) => {
  const body = await c.req.json();
  
  // Validate required fields (check for non-empty strings)
  if (!body.task?.trim() || !body.result?.trim()) {
    return c.json({ error: 'Missing required fields: task and result' }, 400);
  }

  const now = new Date().toISOString();
  const id = body.id || crypto.randomUUID();
  const taskResult: TaskResult = {
    id,
    task: body.task,
    result: body.result,
    status: body.status || 'completed',
    agentId: body.agentId,
    createdAt: now,
    updatedAt: now,
  };

  await c.env.AGENT_CACHE.put(`task-result:${id}`, JSON.stringify(taskResult));
  return c.json({ success: true, id, taskResult }, 201);
});

// Update a task result
app.put('/api/task-results/:id', async (c) => {
  const id = c.req.param('id');
  const existing = await c.env.AGENT_CACHE.get(`task-result:${id}`);
  
  if (!existing) {
    return c.json({ error: 'Task result not found' }, 404);
  }

  const body = await c.req.json();
  const existingData = JSON.parse(existing) as TaskResult;
  const now = new Date().toISOString();
  
  const updated: TaskResult = {
    ...existingData,
    task: body.task ?? existingData.task,
    result: body.result ?? existingData.result,
    status: body.status ?? existingData.status,
    agentId: body.agentId ?? existingData.agentId,
    updatedAt: now,
  };

  await c.env.AGENT_CACHE.put(`task-result:${id}`, JSON.stringify(updated));
  return c.json({ success: true, taskResult: updated });
});

// Delete a task result
app.delete('/api/task-results/:id', async (c) => {
  const id = c.req.param('id');
  const existing = await c.env.AGENT_CACHE.get(`task-result:${id}`);
  
  if (!existing) {
    return c.json({ error: 'Task result not found' }, 404);
  }

  await c.env.AGENT_CACHE.delete(`task-result:${id}`);
  return c.json({ success: true, message: 'Task result deleted' });
});

export default app;