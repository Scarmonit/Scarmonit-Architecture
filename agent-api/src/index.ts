import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Ai } from '@cloudflare/ai';

// Define bindings
type Bindings = {
  AGENT_CACHE: KVNamespace;
  AI: unknown; // Workers AI binding
};

// Research methodology types
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

// --- RESEARCH METHODOLOGY ENDPOINTS ---

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
    // Scores reflect research methodology effectiveness based on current AI/ML trends:
    // - big-data (92): Highest potential for AI integration and pattern recognition
    // - longitudinal (90): Strong for tracking long-term self-improvement outcomes
    // - mhealth (88): Good accessibility and data collection capabilities
    // - mixed-methods (85): Comprehensive but requires more coordination
    // - experimental (75): Traditional approach, limited AI integration potential
    // - observational (70): Baseline score, limited intervention capability
    const categoryScores: Record<MethodologyCategory, number> = {
      'mixed-methods': 85,
      'longitudinal': 90,
      'mhealth': 88,
      'big-data': 92,
      'experimental': 75,
      'observational': 70
    };

    const baseScore = categoryScores[methodology.category as MethodologyCategory] || 70;
    // AI integration adds 5 points (max) as it aligns with optimization proposals
    const aiBonus = methodology.aiIntegration ? 5 : 0;
    // Each contextual factor adds 1 point (max 3) for comprehensive analysis
    const contextBonus = methodology.contextualFactors?.length ? 
      Math.min(methodology.contextualFactors.length, 3) : 0;

    const overallScore = Math.min(100, baseScore + aiBonus + contextBonus);

    // Filter relevant optimizations based on methodology
    const relevantOptimizations = optimizationProposals.filter(opt => {
      if (methodology.aiIntegration && opt.category === 'AI Integration') {
        return false; // Already integrated
      }
      if (opt.priority === 'high') return true;
      if (methodology.category === 'longitudinal' && opt.category === 'Longitudinal Flexibility') {
        return false; // Already using longitudinal design
      }
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

    // Store analysis result for future reference using crypto.randomUUID() for collision-safe IDs
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

export default app;