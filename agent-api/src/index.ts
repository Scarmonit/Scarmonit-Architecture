import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Ai } from '@cloudflare/ai';
import logger from './utils/logger';
import { AI_MODEL, LOCAL_MODE_MESSAGE, MAX_RECENT_ITEMS, ERROR_MESSAGES, KV_PREFIX } from './config/constants';
import { z } from 'zod';

// Define minimal KVNamespace interface for local Node execution & type resolution
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  list(options?: { prefix?: string }): Promise<{ keys: { name: string }[] }>;
  delete(key: string): Promise<void>;
}

// Mock KV for Local Node.js execution
class MockKV {
  store = new Map<string, string>();
  async list({ prefix = '' }: { prefix?: string } = {}) {
    const keys = Array.from(this.store.keys())
      .filter(k => k.startsWith(prefix))
      .map(name => ({ name }));
    return { keys };
  }
  async get(key: string) { return this.store.get(key) || null; }
  async put(key: string, val: string) { this.store.set(key, val); }
  async delete(key: string) { this.store.delete(key); }
}

// Singleton MockKV for local/test mode persistence
const mockKvSingleton = new MockKV();

// Define bindings
type Bindings = {
  AGENT_CACHE: KVNamespace;
  AI: Ai;
};

// --- TYPES ---

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

// Task result interface (from #872 - overlapping with AgentTask but kept for compatibility)
type TaskResultStatus = 'pending' | 'completed' | 'failed';

interface TaskResult {
  id: string;
  task: string;
  result: string;
  status: TaskResultStatus;
  agentId?: string;
  createdAt: string;
  updatedAt: string;
}

// Types for operational efficiency (from PR #881)
interface EfficiencyMetrics {
  processingTime: {
    average: number;
    count: number;
    lastUpdated: string;
  };
  cacheStats: {
    hits: number;
    misses: number;
    hitRate: number;
  };
  errorRate: {
    total: number;
    errors: number;
    rate: number;
  };
}

interface CacheEntry {
  response: unknown;
  timestamp: number;
  ttl: number;
}

// Types for complex problem analysis endpoint (from PR #880)
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

// Research methodology types (from PR #866)
type MethodologyCategory = 'mixed-methods' | 'longitudinal' | 'mhealth' | 'big-data' | 'experimental' | 'observational';

interface ResearchMethodology {
  id: string;
  name: string;
  category: MethodologyCategory;
  description: string;
  strengths: string[];
  limitations: string[];
  contextualFactors?: string[];
  aiIntegration?: boolean;
}

interface OptimizationProposal {
  category: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  implementationSteps: string[];
}

interface ResearchAnalysisResult {
  methodology: ResearchMethodology;
  optimizations: OptimizationProposal[];
  futureDirections: string[];
  overallScore: number;
}

// Types for Insights API (from PR #862)
interface Insight {
  id: string;
  title: string;
  content: string;
  category?: string;
  createdAt: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

// Types for Technology Trends API (from PR #883)
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

// Types for AI-powered solutions messaging (from PR #859)
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

// --- CONSTANTS ---

// Default cache TTL (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use('*', cors());

// Inject Mock if missing
app.use('*', async (c, next) => {
  if (!c.env) { (c as any).env = {} as any; }
  if (!c.env.AGENT_CACHE) {
    logger.warn('Running in Local Mode: Using Mock KV');
    c.env.AGENT_CACHE = mockKvSingleton as any;
  }
  if (!c.env.AI) {
    c.env.AI = { run: async () => ({ response: LOCAL_MODE_MESSAGE }) } as any;
    logger.debug('Injected AI mock binding');
  }
  await next();
});

// --- HELPERS ---

async function getRecentContext(env: Bindings) {
  const artifactsAll = await env.AGENT_CACHE.list({ prefix: KV_PREFIX.ARTIFACT });
  const agentsAll = await env.AGENT_CACHE.list({ prefix: KV_PREFIX.AGENT });
  const artifacts = artifactsAll.keys.slice(0, MAX_RECENT_ITEMS);
  const agents = agentsAll.keys.slice(0, MAX_RECENT_ITEMS);

  let context = "Current System Context:\n";

  for (const key of artifacts) {
    const val = await env.AGENT_CACHE.get(key.name);
    if (val) context += `- Artifact: ${val}\n`;
  }

  for (const key of agents) {
    const val = await env.AGENT_CACHE.get(key.name);
    if (val) context += `- Agent Status: ${val}\n`;
  }

  return context;
}

// Generate cache key from request using FNV-1a hash for better distribution
function generateCacheKey(prefix: string, data: unknown): string {
  const str = JSON.stringify(data);
  let hash = 2166136261; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619); // FNV prime
  }
  return `${prefix}:${(hash >>> 0).toString(16)}`;
}

// Helper function to construct insight key from ID
function getInsightKey(id: string): string {
  return id.startsWith('insight:') ? id : `insight:${id}`;
}

// Extract error message safely
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// Helper to update metrics
async function updateMetrics(
  cache: KVNamespace,
  processingTime: number,
  isError: boolean,
  isCacheHit: boolean
): Promise<void> {
  const metricsData = await cache.get('metrics:efficiency');
  const metrics: EfficiencyMetrics = metricsData
    ? JSON.parse(metricsData)
    : {
        processingTime: { average: 0, count: 0, lastUpdated: new Date().toISOString() },
        cacheStats: { hits: 0, misses: 0, hitRate: 0 },
        errorRate: { total: 0, errors: 0, rate: 0 },
      };

  // Update processing time
  const newCount = metrics.processingTime.count + 1;
  metrics.processingTime.average =
    (metrics.processingTime.average * metrics.processingTime.count + processingTime) / newCount;
  metrics.processingTime.count = newCount;
  metrics.processingTime.lastUpdated = new Date().toISOString();

  // Update cache stats
  if (isCacheHit) {
    metrics.cacheStats.hits++;
  } else {
    metrics.cacheStats.misses++;
  }
  const totalCacheRequests = metrics.cacheStats.hits + metrics.cacheStats.misses;
  metrics.cacheStats.hitRate = totalCacheRequests > 0
    ? metrics.cacheStats.hits / totalCacheRequests
    : 0;

  // Update error rate
  metrics.errorRate.total++;
  if (isError) {
    metrics.errorRate.errors++;
  }
  metrics.errorRate.rate = metrics.errorRate.total > 0
    ? metrics.errorRate.errors / metrics.errorRate.total
    : 0;

  await cache.put('metrics:efficiency', JSON.stringify(metrics));
}

// Generate recommendations based on metrics
function generateRecommendations(metrics: EfficiencyMetrics): string[] {
  const recommendations: string[] = [];

  if (metrics.processingTime.average >= 1000) {
    recommendations.push('Optimize NLP algorithms to reduce processing time');
    recommendations.push('Implement additional caching for frequently accessed data');
  }

  if (metrics.errorRate.rate >= 0.05) {
    recommendations.push('Update knowledge base with latest patterns');
    recommendations.push('Implement peer-review mechanism for validation');
  }

  if (metrics.cacheStats.hitRate <= 0.5) {
    recommendations.push('Review cache key generation strategy');
    recommendations.push('Consider increasing cache TTL for stable data');
  }

  if (recommendations.length === 0) {
    recommendations.push('System is operating efficiently');
  }

  return recommendations;
}

// Generate action plan based on metrics
function generateActionPlan(metrics: EfficiencyMetrics): string[] {
  const plan: string[] = [];

  if (metrics.processingTime.average >= 500) {
    plan.push('1. Enable response caching for repeated queries');
  }

  if (metrics.errorRate.rate > 0) {
    plan.push('2. Review and improve input validation');
  }

  plan.push('3. Continue monitoring operational metrics');
  plan.push('4. Schedule periodic efficiency reviews');

  return plan;
}

// --- AI AGENT ENDPOINTS ---

// 1. Chat with the Agent (Enhanced with RAG + Caching)
app.post('/api/chat', async (c) => {
  const startTime = Date.now();
  let isCacheHit = false;
  let isError = false;

  let body: any; 
  try { 
    body = await c.req.json(); 
  } catch { 
    isError = true;
    await updateMetrics(c.env.AGENT_CACHE, Date.now() - startTime, isError, isCacheHit);
    return c.json({ error: ERROR_MESSAGES.INVALID_INPUT }, 400); 
  }

  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    isError = true;
    await updateMetrics(c.env.AGENT_CACHE, Date.now() - startTime, isError, isCacheHit);
    return c.json({ error: ERROR_MESSAGES.INVALID_INPUT }, 400);
  }

  try {
    const messages = Array.isArray(parsed.data.messages) ? parsed.data.messages : [{ role: 'user', content: parsed.data.prompt || 'Hello' }];

    // Check cache
    const cacheKey = generateCacheKey('chat', messages);
    const cachedData = await c.env.AGENT_CACHE.get(cacheKey);

    if (cachedData) {
      const cached: CacheEntry = JSON.parse(cachedData);
      if (Date.now() - cached.timestamp < cached.ttl) {
        isCacheHit = true;
        await updateMetrics(c.env.AGENT_CACHE, Date.now() - startTime, isError, isCacheHit);
        const cachedResponse = typeof cached.response === 'object' && cached.response !== null
          ? { ...cached.response, cached: true }
          : { response: cached.response, cached: true };
        return c.json(cachedResponse);
      }
    }

    const ai = new Ai(c.env.AI);
    const systemContext = await getRecentContext(c.env);
    const systemPrompt = { role: 'system', content: `You are Scarmonit, an advanced autonomous system administrator.\n${systemContext}\nYour goal is to maintain system health.` };
    const finalMessages = [systemPrompt, ...messages];
    
    const response = await ai.run(AI_MODEL, { messages: finalMessages });

    // Cache the response
    const cacheEntry: CacheEntry = {
      response,
      timestamp: Date.now(),
      ttl: CACHE_TTL,
    };
    await c.env.AGENT_CACHE.put(cacheKey, JSON.stringify(cacheEntry));

    await updateMetrics(c.env.AGENT_CACHE, Date.now() - startTime, isError, isCacheHit);
    return c.json(response);
  } catch (e: any) {
    isError = true;
    await updateMetrics(c.env.AGENT_CACHE, Date.now() - startTime, isError, isCacheHit);
    logger.error('Chat generation failure', { message: e?.message });
    return c.json({ error: ERROR_MESSAGES.AI_GENERATION_FAILED, details: e?.message }, 500);
  }
});

// 2. Analyze Artifacts (With Caching)
app.post('/api/analyze', async (c) => {
  const startTime = Date.now();
  let isCacheHit = false;
  let isError = false;

  let body: any; 
  try { 
    body = await c.req.json(); 
  } catch { 
    isError = true;
    await updateMetrics(c.env.AGENT_CACHE, Date.now() - startTime, isError, isCacheHit);
    return c.json({ error: ERROR_MESSAGES.INVALID_INPUT }, 400); 
  }

  const parsed = analyzeSchema.safeParse(body);
  if (!parsed.success) {
    isError = true;
    await updateMetrics(c.env.AGENT_CACHE, Date.now() - startTime, isError, isCacheHit);
    return c.json({ error: ERROR_MESSAGES.INVALID_INPUT }, 400);
  }

  const { data, type } = parsed.data;

  // Check cache
  const cacheKey = generateCacheKey('analyze', { data, type });
  const cachedData = await c.env.AGENT_CACHE.get(cacheKey);

  if (cachedData) {
    const cached: CacheEntry = JSON.parse(cachedData);
    if (Date.now() - cached.timestamp < cached.ttl) {
      isCacheHit = true;
      await updateMetrics(c.env.AGENT_CACHE, Date.now() - startTime, isError, isCacheHit);
      const cachedResponse = typeof cached.response === 'object' && cached.response !== null
        ? { ...cached.response, cached: true }
        : { response: cached.response, cached: true };
      return c.json(cachedResponse);
    }
  }

  const prompt = `Analyze ${type}: ${JSON.stringify(data)}`;
  try {
    const ai = new Ai(c.env.AI);
    const response = await ai.run(AI_MODEL, { messages: [{ role: 'user', content: prompt }] });

    // Cache the response
    const cacheEntry: CacheEntry = {
      response,
      timestamp: Date.now(),
      ttl: CACHE_TTL,
    };
    await c.env.AGENT_CACHE.put(cacheKey, JSON.stringify(cacheEntry));

    await updateMetrics(c.env.AGENT_CACHE, Date.now() - startTime, isError, isCacheHit);
    return c.json(response);
  } catch (e: any) {
    isError = true;
    await updateMetrics(c.env.AGENT_CACHE, Date.now() - startTime, isError, isCacheHit);
    logger.error('Analysis failure', { message: e?.message });
    return c.json({ error: ERROR_MESSAGES.ANALYSIS_FAILED, details: e?.message }, 500);
  }
});

// 3. Analyze Complex Problem - Data Collection Specialist Agent (from PR #880)
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

// --- OPERATIONAL EFFICIENCY ENDPOINTS (From PR #881) ---

// Get operational metrics
app.get('/api/metrics', async (c) => {
  const metricsData = await c.env.AGENT_CACHE.get('metrics:efficiency');
  const metrics: EfficiencyMetrics = metricsData
    ? JSON.parse(metricsData)
    : {
        processingTime: { average: 0, count: 0, lastUpdated: new Date().toISOString() },
        cacheStats: { hits: 0, misses: 0, hitRate: 0 },
        errorRate: { total: 0, errors: 0, rate: 0 },
      };

  return c.json({
    status: 'operational',
    metrics,
    recommendations: generateRecommendations(metrics),
  });
});

// Self-improvement analysis endpoint
app.get('/api/agent/analyze-efficiency', async (c) => {
  const metricsData = await c.env.AGENT_CACHE.get('metrics:efficiency');
  const metrics: EfficiencyMetrics = metricsData
    ? JSON.parse(metricsData)
    : {
        processingTime: { average: 0, count: 0, lastUpdated: new Date().toISOString() },
        cacheStats: { hits: 0, misses: 0, hitRate: 0 },
        errorRate: { total: 0, errors: 0, rate: 0 },
      };

  const analysis = {
    timestamp: new Date().toISOString(),
    areas: {
      processingTime: {
        status: metrics.processingTime.average < 1000 ? 'optimal' : 'needs_improvement',
        currentValue: `${metrics.processingTime.average}ms`,
        suggestion: metrics.processingTime.average >= 1000
          ? 'Consider implementing additional caching layers'
          : 'Processing time is within acceptable range',
      },
      accuracy: {
        status: metrics.errorRate.rate < 0.05 ? 'optimal' : 'needs_improvement',
        currentValue: `${(1 - metrics.errorRate.rate) * 100}%`,
        suggestion: metrics.errorRate.rate >= 0.05
          ? 'Review error patterns and improve input validation'
          : 'Error rate is within acceptable range',
      },
      coverage: {
        status: 'monitoring',
        currentValue: `${metrics.processingTime.count} requests processed`,
        suggestion: 'Continue monitoring request patterns',
      },
      resourceUtilization: {
        status: metrics.cacheStats.hitRate > 0.5 ? 'optimal' : 'needs_improvement',
        currentValue: `${(metrics.cacheStats.hitRate * 100).toFixed(1)}% cache hit rate`,
        suggestion: metrics.cacheStats.hitRate <= 0.5
          ? 'Increase cache utilization for frequently accessed data'
          : 'Cache utilization is efficient',
      },
    },
    actionPlan: generateActionPlan(metrics),
  };

  return c.json(analysis);
});

// --- CRUD ENDPOINTS ---

app.get('/', (c) => c.json({ status: 'operational', agent: 'active', framework: 'Hono', mode: c.env.AGENT_CACHE instanceof MockKV ? 'local' : 'edge' }));
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
  let body: any; try { body = await c.req.json(); } catch { return c.json({ error: ERROR_MESSAGES.INVALID_INPUT }, 400); }
  const parsed = agentSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: ERROR_MESSAGES.INVALID_INPUT }, 400);
  const id = `${KV_PREFIX.AGENT}${parsed.data.id}`;
  await c.env.AGENT_CACHE.put(id, JSON.stringify(parsed.data));
  logger.info('Agent stored', { id });
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
  let body: any; try { body = await c.req.json(); } catch { return c.json({ error: ERROR_MESSAGES.INVALID_INPUT }, 400); }
  const parsed = artifactSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: ERROR_MESSAGES.INVALID_INPUT }, 400);
  const id = `${KV_PREFIX.ARTIFACT}${parsed.data.id}`;
  await c.env.AGENT_CACHE.put(id, JSON.stringify(parsed.data));
  logger.info('Artifact stored', { id });
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

// --- AGENT TASK ENDPOINTS (from PR #886) ---

// Submit a completed agent task
app.post('/api/agent-tasks', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.task || !body.result) {
      return c.json({ error: 'Missing required fields: task and result' }, 400);
    }
    
    // Validate status if provided
    const validStatuses: TaskStatus[] = ['pending', 'completed', 'failed'];
    const status: TaskStatus = validStatuses.includes(body.status) ? body.status : 'pending';
    
    // Use crypto.randomUUID() for robust ID generation
    const taskId = body.id || crypto.randomUUID();
    
    const task: AgentTask = {
      id: `task:${taskId}`,
      agentId: body.agentId || 'autonomous-agent',
      task: body.task,
      result: body.result,
      status,
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

// --- TASK RESULTS ENDPOINTS (from PR #872) ---
// More structured/RESTful approach to task reporting

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

// --- COMPLEX PROBLEM ANALYSIS ENDPOINT (from PR #871 - vulnerabilities and threats) ---
app.post('/api/analyze/complex', async (c) => {
  try {
    const body = await c.req.json();
    const { problem, context, systems } = body;

    if (!problem) {
      return c.json({ error: 'Missing required field: problem' }, 400);
    }

    const ai = new Ai(c.env.AI);
    const prompt = `
      Perform a structured 5-step security analysis for the following problem:
      Problem: ${problem}
      Context: ${context || 'Industrial/Enterprise environment'}
      Systems Involved: ${systems || 'General infrastructure'}

      Follow this framework:
      1. Information Gathering (System architecture, roles, data flows)
      2. Situation Analysis (Vulnerabilities, threats, risks)
      3. Impact Assessment (Data breaches, downtime, financial loss)
      4. Plan Development (Configuration, patching, controls, education)
      5. Prioritization (Immediate vs long-term actions)

      Provide the response in JSON format.
    `;

    const response = await ai.run(AI_MODEL, { messages: [{ role: 'user', content: prompt }] });
    return c.json(response);
  } catch (e: any) {
    logger.error('Complex analysis failure', { message: e?.message });
    return c.json({ error: ERROR_MESSAGES.ANALYSIS_FAILED, details: e?.message }, 500);
  }
});

// --- RESEARCH METHODOLOGY ENDPOINTS (From PR #866) ---

// Pre-defined optimization proposals based on autonomous agent research
const optimizationProposals: OptimizationProposal[] = [
  {
    category: 'AI Integration',
    recommendation: 'Utilize AI-powered tools for data collection, processing, and analysis',
    priority: 'high',
    implementationSteps: [
      'Leverage ML algorithms to identify complex patterns',
      'Predict outcomes using trained models',
      'Personalize interventions based on AI insights'
    ]
  },
  {
    category: 'Contextual Factors',
    recommendation: 'Incorporate contextual variables to better understand self-improvement processes',
    priority: 'high',
    implementationSteps: [
      'Include environmental factors in data collection',
      'Map social support networks',
      'Account for individual differences in analysis'
    ]
  },
  {
    category: 'Measurement Tools',
    recommendation: 'Develop more nuanced and context-specific measures of self-improvement constructs',
    priority: 'medium',
    implementationSteps: [
      'Create specialized emotional intelligence measures',
      'Develop mindfulness assessment tools',
      'Integrate behavioral and physiological markers'
    ]
  },
  {
    category: 'Interdisciplinary Collaboration',
    recommendation: 'Foster collaboration between researchers from diverse fields',
    priority: 'medium',
    implementationSteps: [
      'Partner with psychology, neuroscience, and education researchers',
      'Integrate computer science expertise',
      'Develop comprehensive theories across disciplines'
    ]
  },
  {
    category: 'Longitudinal Flexibility',
    recommendation: 'Incorporate flexible, adaptive designs that allow for modifications',
    priority: 'medium',
    implementationSteps: [
      'Design adaptive research protocols',
      'Use simulation-based approaches for modeling',
      'Allow real-time adjustments based on findings'
    ]
  },
  {
    category: 'Real-World Impact',
    recommendation: 'Prioritize research with direct implications for practice and policy',
    priority: 'high',
    implementationSteps: [
      'Collaborate with practitioners and policymakers',
      'Focus on actionable outcomes',
      'Ensure community relevance'
    ]
  }
];

// Future research directions based on autonomous agent recommendations
const futureDirections = [
  'Personalized Self-Improvement: AI-powered systems providing tailored recommendations',
  'Self-Improvement Ecosystems: Study interplay with broader systems (education, employment, healthcare)',
  'Long-Term Follow-Up Studies: Longitudinal studies spanning multiple decades'
];

// Analyze research methodology and provide optimization recommendations
app.post('/api/research/analyze', async (c) => {
  try {
    const body = await c.req.json();
    const { methodology } = body as { methodology?: Partial<ResearchMethodology> };

    if (!methodology || !methodology.name || !methodology.category) {
      return c.json({
        error: 'Invalid request',
        details: 'Methodology name and category are required'
      }, 400);
    }

    // Calculate relevance score based on methodology category
    const categoryScores: Record<MethodologyCategory, number> = {
      'mixed-methods': 85,
      'longitudinal': 90,
      'mhealth': 88,
      'big-data': 92,
      'experimental': 75,
      'observational': 70
    };

    const baseScore = categoryScores[methodology.category as MethodologyCategory] || 70;
    const aiBonus = methodology.aiIntegration ? 5 : 0;
    const contextBonus = methodology.contextualFactors?.length ? 
      Math.min(methodology.contextualFactors.length, 3) : 0;

    const overallScore = Math.min(100, baseScore + aiBonus + contextBonus);

    // Filter relevant optimizations
    const relevantOptimizations = optimizationProposals.filter(opt => {
      if (methodology.aiIntegration && opt.category === 'AI Integration') return false;
      if (opt.priority === 'high') return true;
      if (methodology.category === 'longitudinal' && opt.category === 'Longitudinal Flexibility') return false;
      return true;
    });

    const result: ResearchAnalysisResult = {
      methodology: {
        id: methodology.id || `method-${crypto.randomUUID()}`,
        name: methodology.name,
        category: methodology.category as MethodologyCategory,
        description: methodology.description || '',
        strengths: methodology.strengths || [],
        limitations: methodology.limitations || [],
        contextualFactors: methodology.contextualFactors,
        aiIntegration: methodology.aiIntegration
      },
      optimizations: relevantOptimizations,
      futureDirections,
      overallScore
    };

    const analysisId = `research:${crypto.randomUUID()}`;
    await c.env.AGENT_CACHE.put(analysisId, JSON.stringify(result));

    return c.json(result);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: 'Research Analysis Failed', details: errorMessage }, 500);
  }
});

// Get optimization recommendations for a specific category
app.get('/api/research/optimize', (c) => {
  const category = c.req.query('category');
  
  if (category) {
    const filtered = optimizationProposals.filter(
      opt => opt.category.toLowerCase().includes(category.toLowerCase())
    );
    return c.json({
      category,
      optimizations: filtered,
      futureDirections
    });
  }

  return c.json({
    optimizations: optimizationProposals,
    futureDirections
  });
});

// List all research analyses
app.get('/api/research', async (c) => {
  const list = await c.env.AGENT_CACHE.list({ prefix: 'research:' });
  const analyses = [];
  for (const key of list.keys) {
    const val = await c.env.AGENT_CACHE.get(key.name);
    if (val) analyses.push(JSON.parse(val));
  }
  return c.json(analyses);
});

// --- INSIGHTS ENDPOINTS (From PR #862) ---

// Get all insights
app.get('/api/insights', async (c) => {
  const list = await c.env.AGENT_CACHE.list({ prefix: 'insight:' });
  const insights: Insight[] = [];
  for (const key of list.keys) {
    const val = await c.env.AGENT_CACHE.get(key.name);
    if (val) {
      try {
        insights.push(JSON.parse(val) as Insight);
      } catch {
        // Skip malformed entries
      }
    }
  }
  return c.json(insights);
});

// Get a specific insight by ID
app.get('/api/insights/:id', async (c) => {
  const id = c.req.param('id');
  const key = getInsightKey(id);
  const val = await c.env.AGENT_CACHE.get(key);
  if (!val) {
    return c.json({ error: 'Insight not found' }, 404);
  }
  try {
    return c.json(JSON.parse(val) as Insight);
  } catch {
    return c.json({ error: 'Failed to parse insight data' }, 500);
  }
});

// Create a new insight
app.post('/api/insights', async (c) => {
  const body = await c.req.json();
  
  // Validate required fields
  if (!body.title || !body.content) {
    return c.json({ error: 'Missing required fields: title and content are required' }, 400);
  }
  
  // Validate required fields are strings
  if (typeof body.title !== 'string' || typeof body.content !== 'string') {
    return c.json({ error: 'Invalid field types: title and content must be strings' }, 400);
  }
  
  // Validate optional fields if provided
  if (body.category !== undefined && typeof body.category !== 'string') {
    return c.json({ error: 'Invalid field type: category must be a string' }, 400);
  }
  
  if (body.source !== undefined && typeof body.source !== 'string') {
    return c.json({ error: 'Invalid field type: source must be a string' }, 400);
  }
  
  if (body.metadata !== undefined && (typeof body.metadata !== 'object' || body.metadata === null || Array.isArray(body.metadata))) {
    return c.json({ error: 'Invalid field type: metadata must be an object' }, 400);
  }
  
  // Generate unique ID using crypto.randomUUID() for collision-resistant IDs
  const id = body.id || crypto.randomUUID();
  const insight: Insight = {
    id,
    title: body.title,
    content: body.content,
    category: body.category || 'general',
    createdAt: new Date().toISOString(),
    source: body.source || 'autonomous-agent',
    metadata: body.metadata || {},
  };
  
  const key = getInsightKey(id);
  await c.env.AGENT_CACHE.put(key, JSON.stringify(insight));
  return c.json({ success: true, id, insight });
});

// Delete an insight by ID
app.delete('/api/insights/:id', async (c) => {
  const id = c.req.param('id');
  const key = getInsightKey(id);
  
  // Check if insight exists first
  const existing = await c.env.AGENT_CACHE.get(key);
  if (!existing) {
    return c.json({ error: 'Insight not found' }, 404);
  }
  
  await c.env.AGENT_CACHE.delete(key);
  return c.json({ success: true, id });
});

// --- AI-POWERED SOLUTIONS MESSAGING ENDPOINT (From PR #859) ---

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

// --- TECHNOLOGY TRENDS ENDPOINTS (from PR #883) ---

// Get the latest technology trends summary
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

// Schemas
const chatSchema = z.object({
  messages: z.array(z.object({ role: z.string(), content: z.string() })).optional(),
  prompt: z.string().optional()
});
const analyzeSchema = z.object({ data: z.any(), type: z.string().min(1) });
const agentSchema = z.object({ id: z.string().min(1), name: z.string().min(1), role: z.string().min(1) });
const artifactSchema = z.object({ id: z.string().min(1), type: z.string().min(1), content: z.any() });
