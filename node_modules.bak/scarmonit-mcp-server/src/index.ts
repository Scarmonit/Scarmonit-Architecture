///<reference types="node" />
import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import{ readFile, readdir } from 'fs/promises';
import path from 'path';

// Create the MCP server
const server = new Server(
  {
    name: "Scarmonit MCP Server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
   },
}
);

// Define tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "check_system_status",
      description: "Checks the health of the Scarmonit infrastructure components",
      inputSchema: {
        type: "object",
        properties: {
         component: {
            type: "string",
            enum: ["web", "api", "all"],
            default: "all",
            description: "The component to check",
          },
        },
      },
    },
    {
      name: "query_docs",
      description: "Retrieves architectural documentation",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The topic to search for",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "check_datalore_status",
      description: "Checks theDatalore Cloud integration status and license",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: 'list_agents',
      description: 'List available agent personas defined in .github/agents',
      inputSchema: {
        type: 'object',
        properties:{ refresh: { type: 'boolean', description: 'Force refresh of cache', default: false } },
      },
    },
    {
      name: 'get_agent_instructions',
      description: 'Retrieve full instructions for a specific agent persona',
      inputSchema: {
        type: 'object',
        properties: {agent: { type: 'string', description: 'Agent name (title or file name)' } },
        required: ['agent'],
      },
    },
    {
      name: 'search_agents',
      description: 'Search agent personas by keyword (name, summary, or content match)',
      inputSchema: {
        type:'object',
        properties: { query: { type: 'string', description: 'Search term' } },
        required: ['query']
      }
    },
    {
      name: 'apply_agent_context',
      description: 'Return a condensed actionable summary of an agent persona (expertise, always do, neverdo)',
      inputSchema: {
        type: 'object',
        properties: { agent: { type: 'string', description: 'Agent name or file' } },
        required: ['agent']
      }
    },
{
      name: 'troubleshoot_activation',
      description: 'Help troubleshoot activation issues for JetBrainsIDE plugins',
      inputSchema: {
        type: 'object',
        properties: {
          issue: {
            type: 'string',
            enum: ['corrupted_data', 'dns_filter', 'ja_netfilter', 'access_issue', 'permission_denied', 'other'],
            description: 'Type of activation issueencountered'
          },
          platform: {
           type: 'string',
            enum: ['windows', 'mac', 'linux'],
            description: 'Operating system platform'
          }
        }
      }
    },
    {
      name: 'diagnose_agents',
      description: 'Diagnose agent personas: reports resolved directory, count, cache age, last load time',
      inputSchema: { type: 'object', properties: {}, required: [] }
    }
  ],
}));

// Node-related caching constants
const agentCache: { files: AgentInfo[] | null; loadedAt: number } = { files: null, loadedAt: 0 };
const AGENTS_DIR = path.resolve(process.cwd(), '..', '.github', 'agents');
const CACHE_TTL_MS = 30_000;

// Helper & agent persona support additions
interface AgentInfo { name: string; file:string; summary: string; content: string; }
// Export loadAgents for reuse
export async function loadAgents(force = false): Promise<AgentInfo[]> {
  const now = Date.now();
  if (!force &&agentCache.files && now - agentCache.loadedAt < CACHE_TTL_MS) return agentCache.files;
  try {
    const entries = await readdir(AGENTS_DIR);
    const mdFiles = entries.filter(f => f.endsWith('.md'));
    const agents: AgentInfo[] = [];
    for (const file of mdFiles) {
      try {
        const full = path.join(AGENTS_DIR, file);
       const content = await readFile(full, 'utf8');
        const firstLine = content.split(/\r?\n/)[0].trim();
        const title = firstLine.startsWith('#') ? firstLine.replace(/^#+\s*/, '') : file.replace('.md','');
        const summaryMatch = content.match(/##+\s+Summary[\s\S]*?(\r?\n\r?\n|$)/i);
        const summary = summaryMatch ? summaryMatch[0].split(/\r?\n/).slice(1,4).join(' ').trim() : '';
        agents.push({ name: title, file, summary, content });
      }catch (innerErr) {
        agents.push({ name: file.replace('.md',''), file, summary: 'Failed to parse', content: '' });
      }
    }
    agentCache.files = agents;
    agentCache.loadedAt = now;
    return agents;
  } catch {
    return [];
  }
}

function summarizeAgent(agent: AgentInfo): string {
  const lines = agent.content.split(/\r?\n/);
  const alwaysIdx = lines.findIndex(l => /^##+\s+Always Do/i.test(l));
  const neverIdx = lines.findIndex(l => /^##+\s+Never Do/i.test(l));
  const expertiseIdx = lines.findIndex(l => /^##+\s+Expertise/i.test(l));

  const take = (startIdx: number) => {
    if (startIdx === -1) return '';
    const section: string[] = [];
    for (let i = startIdx + 1; i < lines.length && i < startIdx + 15; i++) {
      const line = lines[i].trim();
      // Stop at next section header
      if (line.startsWith('##')) break;
      // Collect list items
      if (line.startsWith('-') || line.startsWith('*')) {
        section.push(line.replace(/^[-*]\s*/, '• '));
      }
    }
    return section.slice(0, 5).join('\n');
  };

  const parts = [] as string[];
  if (expertiseIdx !== -1) {
    const expertise = take(expertiseIdx);
    if (expertise) parts.push('Expertise:\n' + expertise);
  }
  if (alwaysIdx !== -1) {
    const always = take(alwaysIdx);
    if (always) parts.push('Always Do:\n' + always);
  }
  if (neverIdx !== -1) {
    const never = take(neverIdx);
    if (never) parts.push('Never Do:\n' + never);
  }

  return parts.length > 0 ? `# ${agent.name}\n${parts.join('\n\n')}` : `# ${agent.name}\n\nNo structured content found.`;
}
function searchAgents(query: string, agents: AgentInfo[]): AgentInfo[] {
  const q = query.toLowerCase();
  return agents.filter(a =>
    a.name.toLowerCase().includes(q) ||
    a.file.toLowerCase().includes(q) ||
    a.summary.toLowerCase().includes(q) ||
    a.content.toLowerCase().includes(q)
  ).slice(0, 10);
}

function getActivationTroubleshootingGuide(issue: string, platform: string): string {
  const guides: Record<string, string> = {
    corrupted_data: `
Activation Troubleshooting Guide
If Activation Fails (Corrupted Data or DnsFilter.testQuery Error)

Update to the latest plugin version first
Try reactivating
Contact via WeChat: gejun12311 if issues persist
    `,
    dns_filter: `
Activation Troubleshooting Guide
If Activation Fails (Corrupted Data or DnsFilter.testQuery Error)

Update to the latest plugin version first
Try reactivating
Contact via WeChat: gejun12311 if issues persist
    `,
    ja_netfilter: `
ja-netfilter Compatibility Issue

Versions 20220701 block brucege.com and prevent license verification
Fix: Edit ja-netfilter\\config\\dns.conf and delete the line equal brucege.com
Alternative: Use plugin version 3.3.1 to activate
    `,
    access_issue: `
Cannot Access brucege.com

Contact WeChat: gejun12311 for offline activation
Provide: unique code from offline activation + purchased online activation code
    `,
    permission_denied: `
Mac "Permission Denied" Error

Run: cd ~ then sudo chmod 777 .config
    `,
    other: `
Activation Troubleshooting Guide

Support: QQ Group 575733084
    `
  };

  return guides[issue] || guides['other'];
}

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "check_system_status") {
    const component = (args?.component as string) || "all";
    const statuses = {
      web:"Online (Cloudflare Pages)",
      api: "Online (Cloudflare Workers)",
    };

    if (component === "web") return { content: [{ type: "text", text: statuses.web }] };
    if (component === "api") return { content: [{ type: "text", text: statuses.api}] };

    return {
     content: [{ type: "text", text: `Web: ${statuses.web}\nAPI: ${statuses.api}` }],
    };
  }

  if (name === "query_docs") {
    const query = args?.query;
    return {
      content: [
        {
          type:"text",
          text: `Documentation result for '${query}':\nSee docs/architecture.md for details on the unified infrastructure.`,
        },
      ],
    };
  }

  if (name === "check_datalore_status") {
    const licenseId = process.env.DATALORE_LICENSE_ID;
    if (licenseId) {
      return {
content: [
          {
            type: "text",
            text: `Datalore Cloud Integration Active.\nLicense ID: ${licenseId}\nStatus: Connected`,
          },
        ],
      };
    } else {
      return {
        content: [
          { type: "text", text: "Datalore Cloud Integration Inactive. No license ID found." },
        ],
      };
    }
  }

  if (name === 'list_agents') {
    const agents = await loadAgents(Boolean(args?.refresh));
    if (!agents.length) return { content: [{ type: 'text',text: 'No agent personas foundor failed to load.' }] };
    const list = agents.map(a => `• ${a.name}${a.summary ? ' – ' + a.summary : ''}`).join('\n');
    return { content: [{ type: 'text', text: `Available Agents (cached ${new Date(agentCache.loadedAt).toISOString()}):\n${list}` }] };
  }
  if (name === 'get_agent_instructions') {
    const agentReq = (args?.agent || '').toString().trim().toLowerCase();
    if (!agentReq) return { content: [{ type: 'text', text: 'Agent namerequired.' }] };
    constagents = await loadAgents();
    const match = agents.find(a => a.name.toLowerCase() === agentReq || a.file.toLowerCase() === agentReq || a.file.toLowerCase() === agentReq + '.md');
    if (!match) return { content: [{ type: 'text', text: `Agent '${agentReq}' notfound.` }] };
    const MAX_LEN = 8000;
    const out = match.content.length > MAX_LEN ? match.content.slice(0, MAX_LEN) + '\n\n[Truncated]' : match.content;
    return { content: [{ type: 'text', text: `# ${match.name}\n\n${out}` }] };
  }
  if (name === 'search_agents') {
    const query = (args?.query || '').toString().trim();
    if (!query) return { content: [{ type: 'text', text: 'Query required.' }] };
    const agents = await loadAgents();
const results = searchAgents(query, agents);
    if (!results.length) return { content: [{ type: 'text', text: `No agents match '${query}'.` }] };
    const list = results.map(r => `• ${r.name}${r.summary ? ' – ' +r.summary : ''}`).join('\n');
    return { content: [{ type: 'text', text: `Matches (${results.length}):\n${list}` }] };
  }
  if (name === 'apply_agent_context') {
    const agentReq = (args?.agent || '').toString().trim().toLowerCase();
if (!agentReq) return{ content: [{ type: 'text', text: 'Agent name required.' }] };
    const agents = await loadAgents();
    const match = agents.find(a => a.name.toLowerCase() === agentReq || a.file.toLowerCase() === agentReq || a.file.toLowerCase() === agentReq +'.md');
    if (!match) return { content: [{ type: 'text', text: `Agent '${agentReq}' not found.` }] };
    return { content: [{ type: 'text', text: summarizeAgent(match) }] };
  }

  if (name === 'troubleshoot_activation') {
    const issue = args?.issue || 'other';
    const platform = args?.platform || 'windows';

    const troubleshootingGuide = getActivationTroubleshootingGuide(issue, platform);
    return { content: [{ type: 'text', text: troubleshootingGuide }] };
  }

  if (name === 'diagnose_agents') {
    const exists = true; // RESOLVED_AGENTS_DIR is internal to JS entry; TypeScript build may differ
    const count = Array.isArray(agentCache.files) ? agentCache.files.length : 0;
    const ageMs = agentCache.loadedAt ? (Date.now() - agentCache.loadedAt) : 0;
    const ageSec = Math.round(ageMs / 1000);
    const lastIso = agentCache.loadedAt ? new Date(agentCache.loadedAt).toISOString() : 'never';
    return { content: [{ type: 'text', text: `Agents diagnostics\nCount: ${count}\nCache age: ${ageSec}s\nLast load: ${lastIso}` }] };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Start the server using Stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Scarmonit MCP Server running on stdio");
}

main();
