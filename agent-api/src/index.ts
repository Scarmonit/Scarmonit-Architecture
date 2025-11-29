import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Ai } from '@cloudflare/ai';

// Define bindings
type Bindings = {
  AGENT_CACHE: KVNamespace;
  AI: Ai;
};

// Agent task types
type TaskStatus = 'pending' | 'completed' | 'failed';

interface AgentTask {
  id: string;
  agentId: string;
  task: string;
  result: string;
  status: TaskStatus;
  timestamp: number;
  metadata?: Record<string, unknown>;
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

// --- AGENT TASK ENDPOINTS ---

// Submit a completed agent task
app.post('/api/agent-tasks', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.task || !body.result) {
      return c.json({ error: 'Missing required fields: task and result' }, 400);
    }
    
    const task: AgentTask = {
      id: `task:${body.id || Date.now()}`,
      agentId: body.agentId || 'autonomous-agent',
      task: body.task,
      result: body.result,
      status: body.status || 'completed',
      timestamp: Date.now(),
      metadata: body.metadata
    };
    
    await c.env.AGENT_CACHE.put(task.id, JSON.stringify(task));
    
    return c.json({ 
      success: true, 
      id: task.id,
      message: 'Task recorded successfully'
    });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: 'Failed to record task', details: errorMessage }, 500);
  }
});

// Retrieve agent task history
app.get('/api/agent-tasks', async (c) => {
  try {
    const list = await c.env.AGENT_CACHE.list({ prefix: 'task:' });
    const tasks: AgentTask[] = [];
    
    for (const key of list.keys) {
      const val = await c.env.AGENT_CACHE.get(key.name);
      if (val) {
        tasks.push(JSON.parse(val) as AgentTask);
      }
    }
    
    // Sort by timestamp descending (most recent first)
    tasks.sort((a, b) => b.timestamp - a.timestamp);
    
    return c.json(tasks);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: 'Failed to retrieve tasks', details: errorMessage }, 500);
  }
});

// Get a specific agent task by ID
app.get('/api/agent-tasks/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const taskId = id.startsWith('task:') ? id : `task:${id}`;
    
    const val = await c.env.AGENT_CACHE.get(taskId);
    
    if (!val) {
      return c.json({ error: 'Task not found' }, 404);
    }
    
    return c.json(JSON.parse(val) as AgentTask);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: 'Failed to retrieve task', details: errorMessage }, 500);
  }
});

export default app;