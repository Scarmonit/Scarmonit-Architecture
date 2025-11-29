import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Ai } from '@cloudflare/ai';
import { AsyncTaskQueue, BackgroundTaskHandler, type TaskResult } from './async';

// Define bindings
type Bindings = {
  AGENT_CACHE: KVNamespace;
  AI: Ai; // Workers AI binding
};

// Type for variables passed in context
type Variables = {
  backgroundHandler: BackgroundTaskHandler;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Initialize background task handler per request
app.use('*', async (c, next) => {
  const handler = new BackgroundTaskHandler({ maxRetries: 3 });
  // Note: ExecutionContext is not directly available in Hono middleware
  // The handler can be used for task queue operations
  c.set('backgroundHandler', handler);
  await next();
});

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

// --- ASYNC TASK QUEUE ENDPOINTS ---

// Request body type for task submission
interface TaskSubmission {
  tasks: Array<{
    id?: string;
    type: 'delay' | 'compute' | 'fetch';
    payload?: unknown;
    priority?: number;
  }>;
  options?: {
    maxConcurrency?: number;
    timeout?: number;
  };
}

// Process multiple tasks concurrently using the producer-consumer pattern
app.post('/api/tasks/process', async (c) => {
  try {
    const body = await c.req.json() as TaskSubmission;
    
    if (!body.tasks || !Array.isArray(body.tasks)) {
      return c.json({ error: 'Invalid request: tasks array required' }, 400);
    }

    const queue = new AsyncTaskQueue<unknown>({
      maxConcurrency: body.options?.maxConcurrency ?? 5,
      timeout: body.options?.timeout ?? 30000,
    });

    // Add tasks to the queue (producer pattern)
    for (const taskDef of body.tasks) {
      const taskId = taskDef.id ?? `task-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      queue.enqueue({
        id: taskId,
        priority: taskDef.priority ?? 0,
        execute: async () => {
          switch (taskDef.type) {
            case 'delay':
              // Simulated async operation with delay
              const delay = typeof taskDef.payload === 'number' ? taskDef.payload : 100;
              await new Promise((resolve) => setTimeout(resolve, delay));
              return { type: 'delay', delayed: delay };
              
            case 'compute':
              // Simulated computation
              const input = taskDef.payload ?? 0;
              const result = typeof input === 'number' ? input * 2 : 0;
              return { type: 'compute', result };
              
            case 'fetch':
              // Simulated data fetch from KV
              const key = typeof taskDef.payload === 'string' ? taskDef.payload : 'default';
              const data = await c.env.AGENT_CACHE.get(key);
              return { type: 'fetch', key, data };
              
            default:
              return { type: 'unknown', payload: taskDef.payload };
          }
        },
      });
    }

    // Process all tasks (consumer pattern)
    const results = await queue.processAll();
    
    // Convert Map to array for JSON response
    const resultArray: TaskResult<unknown>[] = [];
    results.forEach((value) => resultArray.push(value));

    return c.json({
      success: true,
      totalTasks: body.tasks.length,
      results: resultArray,
    });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: 'Task processing failed', details: errorMessage }, 500);
  }
});

// Get task queue status endpoint
app.get('/api/tasks/status', (c) => {
  return c.json({
    status: 'ready',
    description: 'Async task queue is ready to process tasks',
    patterns: {
      producerConsumer: 'POST /api/tasks/process - Submit tasks for concurrent processing',
      supportedTypes: ['delay', 'compute', 'fetch'],
    },
  });
});

export default app;