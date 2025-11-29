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

// --- AI-POWERED SOLUTIONS MESSAGING ---

// Types for messaging content
interface KeyMessage {
  id: number;
  title: string;
  description: string;
}

interface MessagingContent {
  headline: string;
  subheadline: string;
  keyMessages: KeyMessage[];
  benefits: string[];
  industries: string[];
  callToAction: {
    text: string;
    description: string;
  };
}

// AI-Powered Solutions Messaging Endpoint
app.get('/api/messaging/ai-solutions', (c) => {
  const messaging: MessagingContent = {
    headline: 'Unlocking the Power of AI-Powered Solutions',
    subheadline: 'Revolutionizing industries with game-changing AI capabilities',
    keyMessages: [
      {
        id: 1,
        title: 'Unlock the Power of Data',
        description: 'Leverage AI-powered solutions to unlock actionable insights from vast amounts of data.',
      },
      {
        id: 2,
        title: 'Augment Human Capabilities',
        description: 'Automate repetitive tasks and enhance accuracy with AI-driven tools.',
      },
      {
        id: 3,
        title: 'Transform Industries',
        description: 'Revolutionize healthcare, finance, e-commerce, education, and more with AI-powered solutions.',
      },
      {
        id: 4,
        title: 'Stay Ahead of the Competition',
        description: 'Drive innovation and growth through real-time data-driven insights.',
      },
      {
        id: 5,
        title: 'Unlock New Opportunities',
        description: 'Discover how AI-powered solutions can take your business to new heights.',
      },
    ],
    benefits: [
      'Identify patterns and trends, optimizing processes for improved efficiency',
      'Predict customer behavior, enhancing personalized experiences',
      'Anticipate market shifts, making informed investments',
      'Automate repetitive tasks, freeing up resources for high-value activities',
      'Enhance accuracy and speed in data processing, reducing errors and increasing productivity',
      'Unlock new revenue streams through intelligent forecasting and predictive analytics',
    ],
    industries: [
      'Healthcare - AI-driven diagnosis and treatment plans',
      'Finance - Automated processing and risk assessment',
      'E-commerce - Personalized product recommendations and chatbots',
      'Education - Adaptive learning and intelligent tutoring',
    ],
    callToAction: {
      text: 'Get Ready to Unlock Your Potential',
      description: 'Join the AI-powered revolution and discover how these cutting-edge solutions can transform your business.',
    },
  };

  return c.json(messaging);
});

export default app;