import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Ai } from '@cloudflare/ai';

// --- INTERFACES ---

// Technology Trends Types
interface TechnologyTrend {
  name: string;
  adoptionRate: number;
  previousAdoptionRate?: number;
  applications: string[];
  benefits: string[];
  concerns?: string[];
}

interface TechnologyTrendsReport {
  id: string;
  reportDate: string;
  quarter: string;
  trends: TechnologyTrend[];
  insights: string[];
  recommendations: string[];
  submittedBy?: string;
}

// Define bindings
type Bindings = {
  AGENT_CACHE: KVNamespace;
  AI: unknown; // Workers AI binding
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

// --- TECHNOLOGY TRENDS ENDPOINTS ---

// Get the latest technology trends summary (must be before :id route)
app.get('/api/trends/summary/latest', async (c) => {
  const list = await c.env.AGENT_CACHE.list({ prefix: 'trend:' });
  if (list.keys.length === 0) {
    return c.json({ 
      message: 'No trend reports available',
      summary: null 
    });
  }
  
  // Get the most recent report by extracting numeric timestamp from key
  const sortedKeys = list.keys.sort((a, b) => {
    const aId = a.name.replace('trend:', '');
    const bId = b.name.replace('trend:', '');
    const aNum = parseInt(aId, 10);
    const bNum = parseInt(bId, 10);
    // If both are numeric timestamps, sort numerically (descending)
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return bNum - aNum;
    }
    // Fallback to string comparison
    return b.name.localeCompare(a.name);
  });
  const latestKey = sortedKeys[0];
  const val = await c.env.AGENT_CACHE.get(latestKey.name);
  
  if (!val) {
    return c.json({ error: 'Failed to retrieve latest trend report' }, 500);
  }
  
  const report = JSON.parse(val) as TechnologyTrendsReport;
  
  // Create a summary
  const summary = {
    reportId: report.id,
    reportDate: report.reportDate,
    quarter: report.quarter,
    topTrends: report.trends.slice(0, 5).map(t => ({
      name: t.name,
      adoptionRate: t.adoptionRate
    })),
    keyInsights: report.insights.slice(0, 3),
    submittedBy: report.submittedBy
  };
  
  return c.json(summary);
});

// Get all technology trends reports
app.get('/api/trends', async (c) => {
  const list = await c.env.AGENT_CACHE.list({ prefix: 'trend:' });
  const trends: TechnologyTrendsReport[] = [];
  for (const key of list.keys) {
    const val = await c.env.AGENT_CACHE.get(key.name);
    if (val) trends.push(JSON.parse(val) as TechnologyTrendsReport);
  }
  return c.json(trends);
});

// Get a specific technology trends report by ID
app.get('/api/trends/:id', async (c) => {
  const id = c.req.param('id');
  const val = await c.env.AGENT_CACHE.get(`trend:${id}`);
  if (!val) {
    return c.json({ error: 'Trend report not found' }, 404);
  }
  return c.json(JSON.parse(val) as TechnologyTrendsReport);
});

// Submit a new technology trends report
app.post('/api/trends', async (c) => {
  const body = await c.req.json();
  
  // Validate required fields
  if (!body.trends || !Array.isArray(body.trends)) {
    return c.json({ error: 'Invalid request: trends array is required' }, 400);
  }
  
  // Generate unique ID using timestamp + random suffix to avoid collisions
  const reportId = body.id || `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const report: TechnologyTrendsReport = {
    id: reportId,
    reportDate: body.reportDate || new Date().toISOString(),
    quarter: body.quarter || `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}`,
    trends: body.trends,
    insights: body.insights || [],
    recommendations: body.recommendations || [],
    submittedBy: body.submittedBy || 'Autonomous Agent'
  };
  
  await c.env.AGENT_CACHE.put(`trend:${reportId}`, JSON.stringify(report));
  return c.json({ success: true, id: reportId, report });
});

export default app;