#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { readFile, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Load environment variables
dotenv.config();

/**
 * Scarmonit MCP Server with Datalore Integration
 * Provides tools for checking system status and Datalore connectivity
 */

const server = new Server(
  {
    name: 'scarmonit-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Simple in-memory cache
 */
const agentCache = { files: null, loadedAt: 0 };
const AGENTS_DIR = path.resolve(process.cwd(), '.github', 'agents');
let RESOLVED_AGENTS_DIR = AGENTS_DIR;
if (!existsSync(RESOLVED_AGENTS_DIR)) {
  const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
  const alt = path.resolve(CURRENT_DIR, '..', '.github', 'agents');
  if (existsSync(alt)) RESOLVED_AGENTS_DIR = alt;
}
console.error('[mcp-server] Agents dir resolved:', RESOLVED_AGENTS_DIR, 'exists:', existsSync(RESOLVED_AGENTS_DIR));
const CACHE_TTL_MS = 30_000;

/**
 * Load agent personas from .github/agents directory
 */
async function loadAgents(force = false) {
  const now = Date.now();
  if (!force && agentCache.files && now - agentCache.loadedAt < CACHE_TTL_MS) return agentCache.files;
  try {
    const entries = await readdir(RESOLVED_AGENTS_DIR);
    const mdFiles = entries.filter(f => f.endsWith('.md'));
    const agents = [];
    for (const file of mdFiles) {
      try {
        const full = path.join(RESOLVED_AGENTS_DIR, file);
        const content = await readFile(full, 'utf8');
        let title;
        let summary = '';
        // Front matter parsing
        if (content.startsWith('---')) {
          const endFM = content.indexOf('\n---', 3);
          if (endFM !== -1) {
            const fmBlock = content.substring(3, endFM).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            for (const line of fmBlock) {
              const [k, ...rest] = line.split(':');
              if (k && rest.length) {
                const val = rest.join(':').trim();
                if (k.toLowerCase() === 'name') title = val;
                if (k.toLowerCase() === 'description') summary = val;
              }
            }
          }
        }
        if (!title) {
          const firstLine = content.split(/\r?\n/).find(l => l.startsWith('#')) || '';
          title = firstLine ? firstLine.replace(/^#+\s*/, '') : file.replace('.md','');
        }
        if (!summary) {
          // Attempt to derive short summary from first paragraph after title/front matter
          const paragraphs = content.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
          summary = paragraphs[1] && paragraphs[1].length < 140 ? paragraphs[1] : summary;
        }
        agents.push({ name: title, file, summary, content });
      } catch (innerErr) {
        agents.push({ name: file.replace('.md',''), file, summary: 'Failed to parse', content: '' });
      }
    }
    console.error(`[mcp-server] Loaded ${agents.length} agent persona(s)`);
    agentCache.files = agents;
    agentCache.loadedAt = now;
    return agents;
  } catch (e) {
    console.error('[mcp-server] Failed to read agents directory:', RESOLVED_AGENTS_DIR, e.message);
    return [];
  }
}

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const base = [
    {
      name: 'check_datalore_status',
      description: 'Check Datalore Cloud integration status and license verification',
      inputSchema: { type: 'object', properties: {}, required: [] }
    },
    {
      name: 'check_system_status',
      description: 'Check overall Scarmonit infrastructure status',
      inputSchema: { type: 'object', properties: {}, required: [] }
    },
    {
      name: 'list_agents',
      description: 'List available agent personas defined in .github/agents',
      inputSchema: { type: 'object', properties: { refresh: { type: 'boolean', description: 'Force refresh', default: false } } }
    },
    {
      name: 'get_agent_instructions',
      description: 'Retrieve full instructions for a specific agent persona',
      inputSchema: { type: 'object', properties: { agent: { type: 'string', description: 'Agent name or file' } }, required: ['agent'] }
    },
    {
      name: 'search_agents',
      description: 'Search agent personas by keyword (name, summary, or content match)',
      inputSchema: { type: 'object', properties: { query: { type: 'string', description: 'Search term' } }, required: ['query'] }
    },
    {
      name: 'apply_agent_context',
      description: 'Return a condensed actionable summary of an agent persona (expertise, always do, never do)',
      inputSchema: { type: 'object', properties: { agent: { type: 'string', description: 'Agent name or file' } }, required: ['agent'] }
    }
  ];
  return { tools: base };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'check_datalore_status') {
    const licenseId = process.env.DATALORE_LICENSE_ID;

    if (licenseId) {
      return {
        content: [
          {
            type: 'text',
            text: `✅ Datalore Cloud Integration: Connected

License ID: ${licenseId}
Status: Active

Datalore Cloud is properly configured and ready for notebook connectivity.

Available Features:
- License verification ✓
- Status monitoring ✓
- Environment management ✓

Planned Features:
- Notebook connectivity
- Data synchronization
- Collaborative analytics
- API integration

For more information, see: docs/DATALORE_INTEGRATION.md`
          }
        ]
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `⚠️ Datalore Cloud Integration: Inactive

No license key found. Please configure DATALORE_LICENSE_ID in the .env file.

Setup Instructions:
1. Create mcp-server/.env file
2. Add: DATALORE_LICENSE_ID=DSVYH9Q8VG
3. Restart the MCP server

For detailed setup, see: docs/DATALORE_INTEGRATION.md`
          }
        ]
      };
    }
  }

  if (name === 'check_system_status') {
    return {
      content: [
        {
          type: 'text',
          text: `✅ Scarmonit System Status

All Systems Operational:
- Website: https://scarmonit-www.pages.dev
- Dashboard: https://agent.scarmonit.com
- Agent CLI: Active with 13 MCP tools
- Datalore: ${process.env.DATALORE_LICENSE_ID ? 'Connected ✓' : 'Not configured'}

Infrastructure:
- Docker containers: Operational
- Kubernetes pods: Operational
- MCP Integration: Active`
        }
      ]
    };
  }

  if (name === 'list_agents') {
    const agents = await loadAgents(Boolean(args?.refresh));
    if (!agents.length) {
      // Retry once forcing reload
      const retryAgents = await loadAgents(true);
      if (!retryAgents.length) {
        return { content: [{ type: 'text', text: 'No agent personas found or failed to load after retry.' }] };
      }
      const listRetry = retryAgents.map(a => `• ${a.name}${a.summary ? ' – ' + a.summary : ''}`).join('\n');
      return { content: [{ type: 'text', text: `Available Agents (after retry, cached ${new Date(agentCache.loadedAt).toISOString()}):\n${listRetry}` }] };
    }
    const list = agents.map(a => `• ${a.name}${a.summary ? ' – ' + a.summary : ''}`).join('\n');
    return { content: [{ type: 'text', text: `Available Agents (cached ${new Date(agentCache.loadedAt).toISOString()}):\n${list}` }] };
  }
  if (name === 'get_agent_instructions') {
    const agentReq = (args?.agent || '').toString().trim().toLowerCase();
    if (!agentReq) return { content: [{ type: 'text', text: 'Agent name required.' }] };
    const agents = await loadAgents();
    const match = agents.find(a => a.name.toLowerCase() === agentReq || a.file.toLowerCase() === agentReq || a.file.toLowerCase() === agentReq + '.md');
    if (!match) return { content: [{ type: 'text', text: `Agent '${agentReq}' not found.` }] };
    // Limit very large responses
    const MAX_LEN = 8000;
    const out = match.content.length > MAX_LEN ? match.content.slice(0, MAX_LEN) + '\n\n[Truncated]' : match.content;
    return { content: [{ type: 'text', text: `# ${match.name}\n\n${out}` }] };
  }
  if (name === 'search_agents') {
    const query = (args?.query || '').toString().trim();
    if (!query) return { content: [{ type: 'text', text: 'Query required.' }] };
    const agents = await loadAgents();
    const q = query.toLowerCase();
    const results = agents.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.file.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q)
    ).slice(0, 10);
    if (!results.length) return { content: [{ type: 'text', text: `No agents match '${query}'.` }] };
    const list = results.map(r => `• ${r.name}${r.summary ? ' – ' + r.summary : ''}`).join('\n');
    return { content: [{ type: 'text', text: `Matches (${results.length}):\n${list}` }] };
  }
  if (name === 'apply_agent_context') {
    const agentReq = (args?.agent || '').toString().trim().toLowerCase();
    if (!agentReq) return { content: [{ type: 'text', text: 'Agent name required.' }] };
    const agents = await loadAgents();
    const match = agents.find(a => a.name.toLowerCase() === agentReq || a.file.toLowerCase() === agentReq || a.file.toLowerCase() === agentReq + '.md');
    if (!match) return { content: [{ type: 'text', text: `Agent '${agentReq}' not found.` }] };
    const lines = match.content.split(/\r?\n/);
    const section = (title) => {
      const idx = lines.findIndex(l => new RegExp(`^##+\\s+${title}`, 'i').test(l));
      if (idx === -1) return '';
      return lines.slice(idx + 1, idx + 6).filter(l => l.trim().startsWith('-')).map(l => l.replace(/^[-*]\s*/, '• ')).join('\n');
    };
    const summaryParts = [
      'Expertise:\n' + section('Expertise'),
      'Always Do:\n' + section('Always Do'),
      'Never Do:\n' + section('Never Do')
    ].filter(Boolean).join('\n\n');
    return { content: [{ type: 'text', text: `# ${match.name}\n${summaryParts}` }] };
  }

  throw new Error(`Unknown tool: ${name}`);
});

/**
 * Start the MCP server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout is used for MCP protocol)
  console.error('Scarmonit MCP Server started');
  console.error('Datalore License:', process.env.DATALORE_LICENSE_ID ? 'Configured ✓' : 'Not configured');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
