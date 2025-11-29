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

// --- AUTONOMOUS AGENT TASK MANAGEMENT ---

// Types for task requests
interface TaskRequest {
  taskId?: string;
  agentType?: string;
  task: string;
  domain?: 'healthcare' | 'finance' | 'technology' | 'general';
  stakeholders?: string[];
  dataTypes?: ('text' | 'images' | 'videos' | 'spreadsheets' | 'urls')[];
  sourceUrl?: string;
  additionalContext?: string;
}

interface TaskResponse {
  taskId: string;
  status: 'pending' | 'in_progress' | 'needs_clarification' | 'completed';
  result?: string;
  clarificationNeeded?: string[];
  timestamp: string;
}

// Helper function to ensure consistent task key formatting
function formatTaskKey(taskId: string): string {
  return taskId.startsWith('task:') ? taskId : `task:${taskId}`;
}

// Helper function to determine task status based on clarification data
function determineTaskStatus(
  clarificationData: Partial<TaskRequest>
): TaskResponse['status'] {
  // Task moves to 'in_progress' when essential context is provided
  const hasEssentialContext = Boolean(
    clarificationData.domain ||
    (clarificationData.stakeholders && clarificationData.stakeholders.length > 0) ||
    (clarificationData.dataTypes && clarificationData.dataTypes.length > 0)
  );
  
  return hasEssentialContext ? 'in_progress' : 'needs_clarification';
}

// 3. Submit task to autonomous agent with context
app.post('/api/tasks', async (c) => {
  const body = await c.req.json() as TaskRequest;
  
  // Validate required fields
  if (!body.task) {
    return c.json({ error: 'Task description is required' }, 400);
  }

  const taskId = formatTaskKey(body.taskId || `${Date.now()}`);
  const task: TaskResponse = {
    taskId,
    status: 'pending',
    timestamp: new Date().toISOString(),
  };

  // Store task in KV
  await c.env.AGENT_CACHE.put(taskId, JSON.stringify({
    ...body,
    ...task,
  }));

  return c.json({
    success: true,
    taskId,
    message: 'Task submitted successfully',
    status: task.status,
  });
});

// 4. Get task status
app.get('/api/tasks/:taskId', async (c) => {
  const taskId = c.req.param('taskId');
  const key = formatTaskKey(taskId);
  const val = await c.env.AGENT_CACHE.get(key);
  
  if (!val) {
    return c.json({ error: 'Task not found' }, 404);
  }
  
  return c.json(JSON.parse(val));
});

// 5. List all tasks
app.get('/api/tasks', async (c) => {
  const list = await c.env.AGENT_CACHE.list({ prefix: 'task:' });
  const tasks = [];
  for (const key of list.keys) {
    const val = await c.env.AGENT_CACHE.get(key.name);
    if (val) tasks.push(JSON.parse(val));
  }
  return c.json(tasks);
});

// 6. Analyze complex problem with domain context
app.post('/api/analyze-complex', async (c) => {
  const ai = new Ai(c.env.AI);
  const body = await c.req.json() as TaskRequest;

  // Validate input
  if (!body.task) {
    return c.json({ error: 'Task description is required' }, 400);
  }

  // Build context-aware prompt based on domain and data types
  const domainContext = body.domain 
    ? `Domain: ${body.domain}\n` 
    : '';
  
  const stakeholderContext = body.stakeholders?.length 
    ? `Stakeholders: ${body.stakeholders.join(', ')}\n`
    : '';
  
  const dataTypeContext = body.dataTypes?.length
    ? `Data types to consider: ${body.dataTypes.join(', ')}\n`
    : '';
  
  const urlContext = body.sourceUrl
    ? `Reference URL: ${body.sourceUrl}\n`
    : '';
  
  const additionalInfo = body.additionalContext
    ? `Additional context: ${body.additionalContext}\n`
    : '';

  const prompt = `
You are an expert data collection specialist AI agent analyzing a complex problem.

${domainContext}${stakeholderContext}${dataTypeContext}${urlContext}${additionalInfo}

Problem to analyze:
${body.task}

Provide a comprehensive JSON response with:
- "analysis": A detailed analysis of the problem
- "data_requirements": Array of specific data that needs to be collected
- "recommended_sources": Array of suggested data sources
- "risk_assessment": "low" | "medium" | "high"
- "complexity_score": Number from 1-10
- "next_steps": Array of actionable next steps
- "clarification_questions": Array of questions if more information is needed
  `;

  try {
    const response = await ai.run('@cf/meta/llama-3-8b-instruct', {
      messages: [{ role: 'user', content: prompt }],
    });

    // Store the analysis result as a task
    const taskId = formatTaskKey(body.taskId || `${Date.now()}`);
    await c.env.AGENT_CACHE.put(taskId, JSON.stringify({
      ...body,
      taskId,
      status: 'completed',
      result: response,
      timestamp: new Date().toISOString(),
    }));

    return c.json({
      success: true,
      taskId,
      ...response,
    });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: 'Complex Analysis Failed', details: errorMessage }, 500);
  }
});

// 7. Agent request for clarification (handles the autonomous agent feedback loop)
app.post('/api/tasks/:taskId/clarify', async (c) => {
  const taskId = c.req.param('taskId');
  const key = formatTaskKey(taskId);
  const body = await c.req.json() as Partial<TaskRequest>;
  
  // Get existing task
  const existingTask = await c.env.AGENT_CACHE.get(key);
  
  if (!existingTask) {
    return c.json({ error: 'Task not found' }, 404);
  }

  const task = JSON.parse(existingTask);
  
  // Update task with clarification response using helper for status determination
  const updatedTask = {
    ...task,
    ...body,
    status: determineTaskStatus(body),
    lastUpdated: new Date().toISOString(),
  };

  await c.env.AGENT_CACHE.put(key, JSON.stringify(updatedTask));

  return c.json({
    success: true,
    message: 'Task updated with clarification',
    task: updatedTask,
  });
});

export default app;