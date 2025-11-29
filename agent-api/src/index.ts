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

export default app;

// Schemas
const chatSchema = z.object({
  messages: z.array(z.object({ role: z.string(), content: z.string() })).optional(),
  prompt: z.string().optional()
});
const analyzeSchema = z.object({ data: z.any(), type: z.string().min(1) });
const agentSchema = z.object({ id: z.string().min(1), name: z.string().min(1), role: z.string().min(1) });
const artifactSchema = z.object({ id: z.string().min(1), type: z.string().min(1), content: z.any() });