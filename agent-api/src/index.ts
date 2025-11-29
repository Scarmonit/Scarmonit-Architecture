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

// 3. Complex Problem Analysis - Structured five-step analysis framework
interface ComplexProblemInput {
  problemDescription: string;
  systemArchitecture?: string;
  userRoles?: string[];
  networkTopology?: string;
  dataStorage?: string;
  logs?: string;
  additionalContext?: string;
}

interface AnalysisResult {
  step: string;
  findings: string[];
  recommendations: string[];
}

interface ComplexProblemResponse {
  problemSummary: string;
  analysis: AnalysisResult[];
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  prioritizedActions: string[];
  implementationTimeline: string;
}

app.post('/api/analyze/complex', async (c) => {
  const ai = new Ai(c.env.AI);
  
  let body: ComplexProblemInput;
  try {
    body = await c.req.json() as ComplexProblemInput;
  } catch (parseError) {
    return c.json({ error: 'Invalid JSON in request body' }, 400);
  }

  // Validate required field
  if (!body.problemDescription || typeof body.problemDescription !== 'string') {
    return c.json({ 
      error: 'Missing required field: problemDescription',
      usage: {
        required: ['problemDescription'],
        optional: ['systemArchitecture', 'userRoles', 'networkTopology', 'dataStorage', 'logs', 'additionalContext']
      }
    }, 400);
  }

  const contextParts: string[] = [
    `Problem Description: ${body.problemDescription}`
  ];

  if (body.systemArchitecture) {
    contextParts.push(`System Architecture: ${body.systemArchitecture}`);
  }
  if (body.userRoles && body.userRoles.length > 0) {
    contextParts.push(`User Roles: ${body.userRoles.join(', ')}`);
  }
  if (body.networkTopology) {
    contextParts.push(`Network Topology: ${body.networkTopology}`);
  }
  if (body.dataStorage) {
    contextParts.push(`Data Storage: ${body.dataStorage}`);
  }
  if (body.logs) {
    contextParts.push(`Logs/Incident Reports: ${body.logs}`);
  }
  if (body.additionalContext) {
    contextParts.push(`Additional Context: ${body.additionalContext}`);
  }

  const contextString = contextParts.join('\n\n');

  const prompt = `
You are an expert security analyst and system architect. Analyze the following complex problem using a structured five-step approach.

${contextString}

Provide your analysis in the following JSON format:
{
  "problemSummary": "Brief summary of the problem",
  "analysis": [
    {
      "step": "1. Information Gathering",
      "findings": ["List of gathered information and observations"],
      "recommendations": ["Recommendations based on findings"]
    },
    {
      "step": "2. Situation Analysis", 
      "findings": ["Identified vulnerabilities, threats, and risks"],
      "recommendations": ["Security improvements to address findings"]
    },
    {
      "step": "3. Impact Assessment",
      "findings": ["Potential consequences including data breaches, system compromise, financial/reputational damage"],
      "recommendations": ["Mitigation strategies for each impact"]
    },
    {
      "step": "4. Plan Development",
      "findings": ["Configuration changes, patches, controls, and education needed"],
      "recommendations": ["Specific implementation steps"]
    },
    {
      "step": "5. Prioritization",
      "findings": ["Priority ranking of actions based on impact and feasibility"],
      "recommendations": ["Implementation order and stakeholder involvement"]
    }
  ],
  "overallRiskLevel": "low|medium|high|critical",
  "prioritizedActions": ["Ordered list of recommended actions"],
  "implementationTimeline": "Suggested timeline for implementation"
}

Respond only with valid JSON.
`;

  try {
    const response = await ai.run('@cf/meta/llama-3-8b-instruct', {
      messages: [{ role: 'user', content: prompt }],
    });
    
    return c.json({
      success: true,
      input: {
        problemDescription: body.problemDescription,
        hasSystemArchitecture: !!body.systemArchitecture,
        hasUserRoles: !!(body.userRoles && body.userRoles.length > 0),
        hasNetworkTopology: !!body.networkTopology,
        hasDataStorage: !!body.dataStorage,
        hasLogs: !!body.logs,
        hasAdditionalContext: !!body.additionalContext
      },
      analysis: response
    });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: 'Complex Analysis Failed', details: errorMessage }, 500);
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