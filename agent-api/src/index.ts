import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Ai } from '@cloudflare/ai';

// Define bindings
type Bindings = {
  AGENT_CACHE: KVNamespace;
  AI: unknown;
};

// Types for complex problem analysis endpoint
interface AnalyzeProblemRequest {
  description: string;
  domain?: string;
  stakeholders?: string[];
  dataTypes?: string[];
  dataSources?: string[];
  context?: string;
}

type ProblemComplexity = 'low' | 'medium' | 'high';

interface ProblemAnalysis {
  summary: string;
  keyInsights: string[];
  recommendedActions: string[];
  dataCollectionPlan: string[];
  riskFactors: string[];
  complexity: ProblemComplexity;
}

interface AnalyzeProblemResponse {
  analysis: ProblemAnalysis;
  metadata: {
    domain: string;
    analyzedAt: string;
    version: string;
  };
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

// 3. Analyze Complex Problem - Data Collection Specialist Agent
app.post('/api/analyze-problem', async (c) => {
  const ai = new Ai(c.env.AI);
  let body: AnalyzeProblemRequest;

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  // Validate required field
  if (!body.description || typeof body.description !== 'string' || body.description.trim().length === 0) {
    return c.json({ error: 'Missing required field: description' }, 400);
  }

  // Validate optional array fields
  const arrayFields = ['stakeholders', 'dataTypes', 'dataSources'] as const;
  for (const field of arrayFields) {
    if (body[field] !== undefined && !Array.isArray(body[field])) {
      return c.json({ error: `Field ${field} must be an array` }, 400);
    }
  }

  const domain = body.domain || 'general';
  const stakeholders = body.stakeholders?.join(', ') || 'not specified';
  const dataTypes = body.dataTypes?.join(', ') || 'text';
  const dataSources = body.dataSources?.join(', ') || 'not specified';
  const additionalContext = body.context || '';

  const prompt = `You are an expert data collection specialist AI agent. Analyze the following complex problem and provide a comprehensive analysis.

Problem Description: ${body.description}
Domain: ${domain}
Stakeholders: ${stakeholders}
Preferred Data Types: ${dataTypes}
Data Sources: ${dataSources}
${additionalContext ? `Additional Context: ${additionalContext}` : ''}

Provide a detailed analysis in JSON format with exactly this structure:
{
  "summary": "Brief summary of the problem (1-2 sentences)",
  "keyInsights": ["insight1", "insight2", "insight3"],
  "recommendedActions": ["action1", "action2", "action3"],
  "dataCollectionPlan": ["step1", "step2", "step3"],
  "riskFactors": ["risk1", "risk2"],
  "complexity": "low" | "medium" | "high"
}

Focus on:
1. Understanding the core problem
2. Identifying key data points needed
3. Suggesting actionable next steps
4. Highlighting potential risks or challenges`;

  try {
    const response = await ai.run('@cf/meta/llama-3-8b-instruct', {
      messages: [{ role: 'user', content: prompt }],
    });

    // Extract the response text
    const responseText = typeof response === 'object' && response !== null && 'response' in response
      ? String(response.response)
      : '';

    // Try to parse JSON from the response
    let analysis: ProblemAnalysis;
    try {
      // Try to extract JSON from the response text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback structure if no JSON found
        analysis = {
          summary: responseText.slice(0, 200),
          keyInsights: ['Analysis generated - see summary'],
          recommendedActions: ['Review the generated analysis'],
          dataCollectionPlan: ['Gather more context about the problem'],
          riskFactors: ['Incomplete information may affect accuracy'],
          complexity: 'medium' as ProblemComplexity,
        };
      }
    } catch {
      // Fallback if JSON parsing fails
      analysis = {
        summary: responseText.slice(0, 200),
        keyInsights: ['Analysis generated - see summary'],
        recommendedActions: ['Review the generated analysis'],
        dataCollectionPlan: ['Gather more context about the problem'],
        riskFactors: ['Incomplete information may affect accuracy'],
        complexity: 'medium' as ProblemComplexity,
      };
    }

    const result: AnalyzeProblemResponse = {
      analysis,
      metadata: {
        domain,
        analyzedAt: new Date().toISOString(),
        version: '1.0.0',
      },
    };

    return c.json(result);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: 'Problem Analysis Failed', details: errorMessage }, 500);
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