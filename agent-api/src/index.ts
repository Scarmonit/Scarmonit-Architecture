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

// --- INNOVATIVE SOLUTIONS ENDPOINTS ---

// Generate a unique ID using timestamp + random string
function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}

// Solution types for autonomous agent integration
type SolutionCategory = 
  | 'api_gateway'
  | 'data_streaming'
  | 'ai_integration'
  | 'microservices'
  | 'event_driven'
  | 'blockchain'
  | 'nlp'
  | 'cloud_native'
  | 'service_mesh'
  | 'human_in_loop';

interface InnovativeSolution {
  id: string;
  name: string;
  category: SolutionCategory;
  description: string;
  status: 'proposed' | 'in_progress' | 'implemented' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  benefits: string[];
  createdAt: string;
  updatedAt: string;
}

// Built-in innovative solutions proposed by autonomous agent
// Static timestamp represents when these solutions were initially proposed
const PROPOSAL_DATE = '2024-01-01T00:00:00.000Z';

const proposedSolutions: InnovativeSolution[] = [
  {
    id: 'sol-001',
    name: 'API Gateway Optimization',
    category: 'api_gateway',
    description: 'Smart API gateway using ML algorithms to optimize requests and responses in real-time, reducing latency and improving performance.',
    status: 'proposed',
    priority: 'high',
    benefits: ['Reduced latency', 'Improved performance', 'Enhanced system efficiency'],
    createdAt: PROPOSAL_DATE,
    updatedAt: PROPOSAL_DATE
  },
  {
    id: 'sol-002',
    name: 'Real-Time Data Streaming',
    category: 'data_streaming',
    description: 'Streaming data architecture enabling real-time data exchange between systems for faster decision-making and improved analytics.',
    status: 'proposed',
    priority: 'high',
    benefits: ['Faster decision-making', 'Improved analytics', 'Enhanced customer experiences'],
    createdAt: PROPOSAL_DATE,
    updatedAt: PROPOSAL_DATE
  },
  {
    id: 'sol-003',
    name: 'AI-Powered Integration',
    category: 'ai_integration',
    description: 'Leveraging AI to automate integration processes including API key management, data mapping, and error handling.',
    status: 'proposed',
    priority: 'critical',
    benefits: ['Reduced integration time', 'Automated error handling', 'Intelligent data mapping'],
    createdAt: PROPOSAL_DATE,
    updatedAt: PROPOSAL_DATE
  },
  {
    id: 'sol-004',
    name: 'Microservices Architecture',
    category: 'microservices',
    description: 'Lightweight, modular services enabling greater flexibility, scalability, and fault tolerance between systems.',
    status: 'proposed',
    priority: 'medium',
    benefits: ['Greater flexibility', 'Improved scalability', 'Better fault tolerance'],
    createdAt: PROPOSAL_DATE,
    updatedAt: PROPOSAL_DATE
  },
  {
    id: 'sol-005',
    name: 'Event-Driven Architecture',
    category: 'event_driven',
    description: 'Systems publish and subscribe to events in real-time, facilitating loose coupling and improved system resilience.',
    status: 'proposed',
    priority: 'high',
    benefits: ['Loose coupling', 'Reduced dependencies', 'Improved resilience'],
    createdAt: PROPOSAL_DATE,
    updatedAt: PROPOSAL_DATE
  },
  {
    id: 'sol-006',
    name: 'Blockchain Integration',
    category: 'blockchain',
    description: 'Secure, decentralized data exchange ensuring data integrity, transparency, and immutability.',
    status: 'proposed',
    priority: 'low',
    benefits: ['Data integrity', 'Transparency', 'Immutability'],
    createdAt: PROPOSAL_DATE,
    updatedAt: PROPOSAL_DATE
  },
  {
    id: 'sol-007',
    name: 'NLP Capabilities',
    category: 'nlp',
    description: 'Natural Language Processing enabling systems to understand and generate human-like language for intuitive communication.',
    status: 'proposed',
    priority: 'medium',
    benefits: ['Intuitive communication', 'Human-machine interaction', 'Natural language understanding'],
    createdAt: PROPOSAL_DATE,
    updatedAt: PROPOSAL_DATE
  },
  {
    id: 'sol-008',
    name: 'Cloud-Native Architecture',
    category: 'cloud_native',
    description: 'Architecture leveraging cloud scalability, flexibility, and cost-effectiveness for seamless adaptation to changing demands.',
    status: 'in_progress',
    priority: 'critical',
    benefits: ['Scalability', 'Flexibility', 'Cost-effectiveness'],
    createdAt: PROPOSAL_DATE,
    updatedAt: PROPOSAL_DATE
  },
  {
    id: 'sol-009',
    name: 'Service Mesh',
    category: 'service_mesh',
    description: 'Visibility, control, and observability across microservices for better monitoring, debugging, and security.',
    status: 'proposed',
    priority: 'medium',
    benefits: ['Better monitoring', 'Improved debugging', 'Enhanced security'],
    createdAt: PROPOSAL_DATE,
    updatedAt: PROPOSAL_DATE
  },
  {
    id: 'sol-010',
    name: 'Human-in-the-Loop Integration',
    category: 'human_in_loop',
    description: 'Framework enabling humans to interact with machines through voice assistants or augmented reality interfaces.',
    status: 'proposed',
    priority: 'low',
    benefits: ['Natural interaction', 'Voice assistant support', 'AR interface compatibility'],
    createdAt: PROPOSAL_DATE,
    updatedAt: PROPOSAL_DATE
  }
];

// Get all innovative solutions
app.get('/api/solutions', async (c) => {
  // Get custom solutions from KV
  const list = await c.env.AGENT_CACHE.list({ prefix: 'solution:' });
  const customSolutions: InnovativeSolution[] = [];
  for (const key of list.keys) {
    const val = await c.env.AGENT_CACHE.get(key.name);
    if (val) customSolutions.push(JSON.parse(val));
  }
  
  // Merge built-in and custom solutions
  const allSolutions = [...proposedSolutions, ...customSolutions];
  
  // Filter by query params
  const category = c.req.query('category') as SolutionCategory | undefined;
  const status = c.req.query('status');
  const priority = c.req.query('priority');
  
  let filtered = allSolutions;
  if (category) filtered = filtered.filter(s => s.category === category);
  if (status) filtered = filtered.filter(s => s.status === status);
  if (priority) filtered = filtered.filter(s => s.priority === priority);
  
  return c.json({
    total: filtered.length,
    solutions: filtered
  });
});

// Get a specific solution by ID
app.get('/api/solutions/:id', async (c) => {
  const id = c.req.param('id');
  
  // Check built-in solutions first
  const builtIn = proposedSolutions.find(s => s.id === id);
  if (builtIn) return c.json(builtIn);
  
  // Check custom solutions in KV
  const custom = await c.env.AGENT_CACHE.get(`solution:${id}`);
  if (custom) return c.json(JSON.parse(custom));
  
  return c.json({ error: 'Solution not found' }, 404);
});

// Create or update a custom solution
app.post('/api/solutions', async (c) => {
  const body = await c.req.json();
  const id = body.id || generateId('sol');
  const solution: InnovativeSolution = {
    id,
    name: body.name || 'Unnamed Solution',
    category: body.category || 'ai_integration',
    description: body.description || '',
    status: body.status || 'proposed',
    priority: body.priority || 'medium',
    benefits: body.benefits || [],
    createdAt: body.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  await c.env.AGENT_CACHE.put(`solution:${id}`, JSON.stringify(solution));
  return c.json({ success: true, solution });
});

// Update solution status
app.patch('/api/solutions/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  
  // Get existing solution
  const existing = await c.env.AGENT_CACHE.get(`solution:${id}`);
  if (!existing) {
    // Check if it's a built-in solution
    const builtIn = proposedSolutions.find(s => s.id === id);
    if (!builtIn) return c.json({ error: 'Solution not found' }, 404);
    
    // Create a custom copy with updates
    const updated: InnovativeSolution = {
      ...builtIn,
      ...body,
      updatedAt: new Date().toISOString()
    };
    await c.env.AGENT_CACHE.put(`solution:${id}`, JSON.stringify(updated));
    return c.json({ success: true, solution: updated });
  }
  
  const solution = JSON.parse(existing);
  const updated: InnovativeSolution = {
    ...solution,
    ...body,
    updatedAt: new Date().toISOString()
  };
  
  await c.env.AGENT_CACHE.put(`solution:${id}`, JSON.stringify(updated));
  return c.json({ success: true, solution: updated });
});

// --- EVENT-DRIVEN ARCHITECTURE ENDPOINTS ---

interface SystemEvent {
  id: string;
  type: string;
  source: string;
  data: Record<string, unknown>;
  timestamp: string;
  processed: boolean;
}

// Publish an event
app.post('/api/events', async (c) => {
  const body = await c.req.json();
  const event: SystemEvent = {
    id: generateId('evt'),
    type: body.type || 'system.event',
    source: body.source || 'unknown',
    data: body.data || {},
    timestamp: new Date().toISOString(),
    processed: false
  };
  
  await c.env.AGENT_CACHE.put(`event:${event.id}`, JSON.stringify(event), {
    expirationTtl: 86400 // Events expire after 24 hours
  });
  
  return c.json({ success: true, event });
});

// Get recent events
app.get('/api/events', async (c) => {
  const list = await c.env.AGENT_CACHE.list({ prefix: 'event:' });
  const events: SystemEvent[] = [];
  for (const key of list.keys) {
    const val = await c.env.AGENT_CACHE.get(key.name);
    if (val) events.push(JSON.parse(val));
  }
  
  // Sort by timestamp descending
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  // Validate and limit the results (max 100, default 50)
  const requestedLimit = parseInt(c.req.query('limit') || '50');
  const limit = Math.min(Math.max(1, requestedLimit), 100);
  const type = c.req.query('type');
  
  let filtered = events;
  if (type) filtered = filtered.filter(e => e.type === type);
  
  return c.json({
    total: filtered.length,
    events: filtered.slice(0, limit)
  });
});

// --- INTEGRATION STATUS ENDPOINT ---

// Get real-time integration status
app.get('/api/integration-status', async (c) => {
  // Get custom solutions from KV
  const list = await c.env.AGENT_CACHE.list({ prefix: 'solution:' });
  const customSolutions: InnovativeSolution[] = [];
  for (const key of list.keys) {
    const val = await c.env.AGENT_CACHE.get(key.name);
    if (val) customSolutions.push(JSON.parse(val));
  }
  
  // Merge built-in and custom solutions for accurate metrics
  const allSolutions = [...proposedSolutions, ...customSolutions];
  
  const implementedCount = allSolutions.filter(s => s.status === 'implemented').length;
  const inProgressCount = allSolutions.filter(s => s.status === 'in_progress').length;
  const proposedCount = allSolutions.filter(s => s.status === 'proposed').length;
  const archivedCount = allSolutions.filter(s => s.status === 'archived').length;
  
  return c.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    metrics: {
      totalSolutions: allSolutions.length,
      builtInSolutions: proposedSolutions.length,
      customSolutions: customSolutions.length,
      implemented: implementedCount,
      inProgress: inProgressCount,
      proposed: proposedCount,
      archived: archivedCount,
      implementationRate: allSolutions.length > 0 
        ? Math.round((implementedCount / allSolutions.length) * 100) 
        : 0
    },
    categories: {
      api_gateway: allSolutions.filter(s => s.category === 'api_gateway').length,
      data_streaming: allSolutions.filter(s => s.category === 'data_streaming').length,
      ai_integration: allSolutions.filter(s => s.category === 'ai_integration').length,
      microservices: allSolutions.filter(s => s.category === 'microservices').length,
      event_driven: allSolutions.filter(s => s.category === 'event_driven').length,
      blockchain: allSolutions.filter(s => s.category === 'blockchain').length,
      nlp: allSolutions.filter(s => s.category === 'nlp').length,
      cloud_native: allSolutions.filter(s => s.category === 'cloud_native').length,
      service_mesh: allSolutions.filter(s => s.category === 'service_mesh').length,
      human_in_loop: allSolutions.filter(s => s.category === 'human_in_loop').length
    },
    activeCapabilities: [
      'AI Chat',
      'Artifact Analysis',
      'Agent Management',
      'Event Publishing',
      'Solution Tracking'
    ]
  });
});

export default app;