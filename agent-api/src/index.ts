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
  store = new Map();
  async list({ prefix = '' }: { prefix?: string }) {
    const keys = Array.from(this.store.keys())
      .filter(k => k.startsWith(prefix))
      .map(name => ({ name }));
    return { keys };
  }
  async get(key) { return this.store.get(key) || null; }
  async put(key, val) { this.store.set(key, val); }
}

// Singleton MockKV for local/test mode persistence
const mockKvSingleton = new MockKV();

// Define bindings
type Bindings = {
  AGENT_CACHE: KVNamespace;
  AI: any; // Workers AI binding
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use('*', cors());

// Inject Mock if missing
app.use('*', async (c, next) => {
  // Ensure env object exists (Hono sets c.env only when provided; tests may omit)
  if (!c.env) { (c as any).env = {} as any; }
  if (!c.env.AGENT_CACHE) {
    logger.warn('Running in Local Mode: Using Mock KV');
    c.env.AGENT_CACHE = mockKvSingleton as any;
  }
  if (!c.env.AI) {
    c.env.AI = { run: async () => ({ response: LOCAL_MODE_MESSAGE }) };
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

  // Fetch artifacts
  for (const key of artifacts) {
    const val = await env.AGENT_CACHE.get(key.name);
    if (val) context += `- Artifact: ${val}\n`;
  }

  // Fetch agents
  for (const key of agents) {
    const val = await env.AGENT_CACHE.get(key.name);
    if (val) context += `- Agent Status: ${val}\n`;
  }

  return context;
}

// --- AI AGENT ENDPOINTS ---

// 1. Chat with the Agent (Enhanced with RAG)
app.post('/api/chat', async (c) => {
  let body: any;
  try { body = await c.req.json(); } catch { return c.json({ error: ERROR_MESSAGES.INVALID_INPUT }, 400); }
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: ERROR_MESSAGES.INVALID_INPUT }, 400);
  try {
    const ai = new Ai(c.env.AI);
    let messages = Array.isArray(parsed.data.messages) ? parsed.data.messages : [{ role: 'user', content: parsed.data.prompt || 'Hello' }];
    const systemContext = await getRecentContext(c.env);
    const systemPrompt = { role: 'system', content: `You are Scarmonit, an advanced autonomous system administrator.\n${systemContext}\nYour goal is to maintain system health.` };
    messages = [systemPrompt, ...messages];
    const response = await ai.run(AI_MODEL, { messages });
    return c.json(response);
  } catch (e: any) {
    logger.error('Chat generation failure', { message: e?.message });
    return c.json({ error: ERROR_MESSAGES.AI_GENERATION_FAILED, details: e?.message }, 500);
  }
});

// 2. Analyze Artifacts (The "Better" Agent part)
app.post('/api/analyze', async (c) => {
  let body: any;
  try { body = await c.req.json(); } catch { return c.json({ error: ERROR_MESSAGES.INVALID_INPUT }, 400); }
  const parsed = analyzeSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: ERROR_MESSAGES.INVALID_INPUT }, 400);
  const { data, type } = parsed.data;
  const prompt = `Analyze ${type}: ${JSON.stringify(data)}`;
  try {
    const ai = new Ai(c.env.AI);
    const response = await ai.run(AI_MODEL, { messages: [{ role: 'user', content: prompt }] });
    return c.json(response);
  } catch (e: any) {
    logger.error('Analysis failure', { message: e?.message });
    return c.json({ error: ERROR_MESSAGES.ANALYSIS_FAILED, details: e?.message }, 500);
  }
});

// --- CRUD ENDPOINTS (Ported) ---

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

export default app;

// Schemas
const chatSchema = z.object({
  messages: z.array(z.object({ role: z.string(), content: z.string() })).optional(),
  prompt: z.string().optional()
});
const analyzeSchema = z.object({ data: z.any(), type: z.string().min(1) });
const agentSchema = z.object({ id: z.string().min(1), name: z.string().min(1), role: z.string().min(1) });
const artifactSchema = z.object({ id: z.string().min(1), type: z.string().min(1), content: z.any() });

