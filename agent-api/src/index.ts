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

// 3. Autonomous Agent Task - Complex Problem Analysis
// Endpoint for data collection specialist agent to analyze complex problems
interface AgentTaskRequest {
  task: string;
  context?: string;
  sources?: string[];
  dataType?: 'text' | 'numbers' | 'images' | 'mixed';
}

interface AgentTaskResponse {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: {
    analysis: string;
    dataCollected: string[];
    recommendations: string[];
    nextSteps: string[];
  };
  error?: string;
  timestamp: string;
}

app.post('/api/agent/task', async (c) => {
  const ai = new Ai(c.env.AI);
  
  let body: AgentTaskRequest;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ 
      error: 'Invalid JSON body',
      status: 'failed',
      timestamp: new Date().toISOString()
    }, 400);
  }

  // Input validation
  if (!body.task || typeof body.task !== 'string' || body.task.trim() === '') {
    return c.json({ 
      error: 'Task description is required',
      status: 'failed',
      timestamp: new Date().toISOString()
    }, 400);
  }

  const taskId = `task_${Date.now()}`;
  const validDataTypes = ['text', 'numbers', 'images', 'mixed'];
  const dataType = body.dataType && validDataTypes.includes(body.dataType) 
    ? body.dataType 
    : 'text';

  const systemPrompt = `You are a data collection specialist AI agent. Your role is to analyze complex problems and provide structured insights.

When given a task:
1. Break down the problem into manageable components
2. Identify what data would be relevant to collect
3. Provide analysis and recommendations
4. Suggest concrete next steps

Format your response with clear sections:
- ANALYSIS: Your detailed analysis of the problem
- RECOMMENDATIONS: Specific actionable recommendations (one per line, prefixed with "- ")
- NEXT STEPS: Concrete next steps to take (one per line, prefixed with "- ")`;

  const userPrompt = `Task: ${body.task.trim()}
${body.context ? `\nContext: ${body.context}` : ''}
${body.sources && body.sources.length > 0 ? `\nSources to consider: ${body.sources.join(', ')}` : ''}
Data type focus: ${dataType}

Please analyze this problem and provide your analysis, recommendations, and suggested next steps.`;

  try {
    const response = await ai.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
    });

    // Extract the response text
    const responseText = typeof response === 'object' && response !== null && 'response' in response 
      ? String(response.response) 
      : JSON.stringify(response);

    // Parse recommendations and next steps from the response
    const extractListItems = (text: string, section: string): string[] => {
      const sectionRegex = new RegExp(`${section}[:\\s]*([\\s\\S]*?)(?=(?:ANALYSIS|RECOMMENDATIONS|NEXT STEPS)[:\\s]|$)`, 'i');
      const match = text.match(sectionRegex);
      if (!match) return [];
      
      const items = match[1]
        .split('\n')
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(line => line.length > 0 && line.length < 500);
      
      return items.slice(0, 10); // Limit to 10 items
    };

    // Store the task result in KV cache
    const taskResult: AgentTaskResponse = {
      taskId,
      status: 'completed',
      result: {
        analysis: responseText,
        dataCollected: body.sources || [],
        recommendations: extractListItems(responseText, 'RECOMMENDATIONS'),
        nextSteps: extractListItems(responseText, 'NEXT STEPS')
      },
      timestamp: new Date().toISOString()
    };

    await c.env.AGENT_CACHE.put(`task:${taskId}`, JSON.stringify(taskResult), {
      expirationTtl: 86400 // 24 hours
    });

    return c.json(taskResult);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    const errorResponse: AgentTaskResponse = {
      taskId,
      status: 'failed',
      error: `Task processing failed: ${errorMessage}`,
      timestamp: new Date().toISOString()
    };
    return c.json(errorResponse, 500);
  }
});

// Get task status/result by ID
app.get('/api/agent/task/:taskId', async (c) => {
  const taskId = c.req.param('taskId');
  
  if (!taskId) {
    return c.json({ error: 'Task ID is required' }, 400);
  }

  const result = await c.env.AGENT_CACHE.get(`task:${taskId}`);
  
  if (!result) {
    return c.json({ error: 'Task not found', taskId }, 404);
  }

  try {
    return c.json(JSON.parse(result));
  } catch {
    return c.json({ error: 'Invalid task data', taskId }, 500);
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

export default app;