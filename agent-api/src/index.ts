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
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: 'AI Generation Failed', details: message }, 500);
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

// Task submission types
interface AgentTask {
  id?: string;
  task: string;
  result: string;
  status: 'completed' | 'pending' | 'failed';
  agentType?: string;
  createdAt?: string;
}

// List all agent tasks
app.get('/api/tasks', async (c) => {
  const list = await c.env.AGENT_CACHE.list({ prefix: 'task:' });
  const tasks: AgentTask[] = [];
  for (const key of list.keys) {
    const val = await c.env.AGENT_CACHE.get(key.name);
    if (val) tasks.push(JSON.parse(val));
  }
  return c.json(tasks);
});

// Get a specific task by ID
app.get('/api/tasks/:id', async (c) => {
  const id = c.req.param('id');
  const val = await c.env.AGENT_CACHE.get(`task:${id}`);
  if (!val) {
    return c.json({ error: 'Task not found' }, 404);
  }
  return c.json(JSON.parse(val));
});

// Submit a new agent task report
app.post('/api/tasks', async (c) => {
  const body = await c.req.json<AgentTask>();

  // Validate required fields are present and non-empty
  const task = body.task?.trim();
  const result = body.result?.trim();

  if (!task || !result) {
    return c.json({ error: 'Missing required fields: task and result must be non-empty strings' }, 400);
  }

  // Use crypto.randomUUID() for robust ID generation to avoid collisions
  const taskId = body.id || crypto.randomUUID();
  const taskData: AgentTask = {
    id: taskId,
    task,
    result,
    status: body.status || 'completed',
    agentType: body.agentType || 'autonomous',
    createdAt: new Date().toISOString(),
  };

  const key = `task:${taskId}`;
  await c.env.AGENT_CACHE.put(key, JSON.stringify(taskData));

  return c.json({ success: true, id: taskId, task: taskData });
});

// --- TECHNOLOGY INSIGHTS ENDPOINTS ---

// Technology insight types
interface TechnologyInsight {
  category: string;
  title: string;
  description: string;
  relevance: 'high' | 'medium' | 'low';
}

// Technology insights data
const technologyInsights: TechnologyInsight[] = [
  {
    category: 'Cloud Computing',
    title: 'Cloud-Native Applications',
    description: 'Cloud computing continues to dominate with cloud-native applications and hybrid architectures enabling scalability, flexibility, and cost-effectiveness.',
    relevance: 'high',
  },
  {
    category: 'Artificial Intelligence',
    title: 'AI and Machine Learning',
    description: 'AI and ML are essential components across industries, improving decision-making, automating processes, and enhancing customer experiences.',
    relevance: 'high',
  },
  {
    category: 'Internet of Things',
    title: 'IoT Ecosystem',
    description: 'The IoT landscape is rapidly evolving with more connected devices generating vast amounts of data for intelligent processing.',
    relevance: 'high',
  },
  {
    category: 'API Development',
    title: 'API-First Development',
    description: 'Microservices architecture drives API-first development, enabling greater flexibility, scalability, and reusability.',
    relevance: 'high',
  },
  {
    category: 'Blockchain',
    title: 'Distributed Ledger Technology',
    description: 'Blockchain and DLT offer secure, decentralized, and transparent data management in finance, supply chain, and healthcare.',
    relevance: 'medium',
  },
  {
    category: 'Security',
    title: 'Cybersecurity',
    description: 'Evolving cybersecurity threats require staying up-to-date with security best practices, protocols, and compliance tools.',
    relevance: 'high',
  },
  {
    category: 'Data Analytics',
    title: 'Analytics and Visualization',
    description: 'Data-driven decision-making drives demand for advanced analytics and visualization tools to gain insights from large datasets.',
    relevance: 'high',
  },
  {
    category: 'Serverless',
    title: 'Serverless Computing',
    description: 'Serverless architecture enables efficient scaling and cost reduction by deploying code in response to events without server management.',
    relevance: 'high',
  },
  {
    category: 'Networking',
    title: '5G Networks',
    description: '5G networks enable faster data speeds, lower latency, and increased capacity for IoT devices and real-time applications.',
    relevance: 'medium',
  },
  {
    category: 'Emerging Tech',
    title: 'Quantum Computing',
    description: 'Quantum computing has potential to transform industries by solving complex problems in medicine, finance, and climate modeling.',
    relevance: 'medium',
  },
];

// Get current technology insights
app.get('/api/insights', (c) => {
  return c.json({
    insights: technologyInsights,
    generatedAt: new Date().toISOString(),
    count: technologyInsights.length,
  });
});

// Get insights by category (uses partial matching for flexible searching)
app.get('/api/insights/:category', (c) => {
  const category = c.req.param('category').toLowerCase();

  // Filter using partial matching to allow flexible category searches
  // e.g., "cloud" matches "Cloud Computing", "ai" matches "Artificial Intelligence"
  const filtered = technologyInsights.filter(
    (insight) => insight.category.toLowerCase().includes(category)
  );

  if (filtered.length === 0) {
    return c.json({ error: `No insights found for category: ${category}` }, 404);
  }

  return c.json({
    insights: filtered,
    category,
    count: filtered.length,
  });
});

export default app;