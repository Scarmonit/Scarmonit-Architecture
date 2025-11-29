/*
  MCP Router: maps dashboard intents to specific MCP servers/tools
  Option B: Multi-server routing (recommended)
*/
import { McpClient } from '../clients/mcpClient';
import { info, error } from '../utils/logger';

export type HealthSummary = {
  web: string;
  api: string;
  datalore: string;
};

const client = new McpClient({ baseUrl: 'http://localhost:3000/mcp', timeoutMs: 4000 });

/**
 * Aggregate basic health summary across key services.
 */
export async function getHealthSummary(): Promise<HealthSummary> {
  const started = performance.now();
  try {
    const [webRes, apiRes, dataloreRes] = await Promise.all([
      client.callTool({ server: 'scarmonit-architecture', name: 'check_system_status', args: { component: 'web' } }),
      client.callTool({ server: 'scarmonit-architecture', name: 'check_system_status', args: { component: 'api' } }),
      client.callTool({ server: 'scarmonit-architecture', name: 'check_datalore_status' }),
    ]);
    const summary = {
      web: webRes.content?.[0]?.text || 'Unknown',
      api: apiRes.content?.[0]?.text || 'Unknown',
      datalore: dataloreRes.content?.[0]?.text || 'Unknown',
    };
    info('Health summary retrieved', { durationMs: Math.round(performance.now() - started) });
    return summary;
  } catch (e) {
    error('Failed to retrieve health summary', { message: (e as Error).message });
    return { web: 'Error', api: 'Error', datalore: 'Error' };
  }
}

/**
 * Invoke Docker status tool via devops server.
 */
export async function checkDockerContainers(): Promise<string> {
  try {
    const res = await client.callTool({ server: 'llm-framework-devops', name: 'docker_ps' });
    return res.content?.[0]?.text || 'No output';
  } catch (e) {
    error('Docker status failed', { message: (e as Error).message });
    return 'Docker status error';
  }
}

/**
 * Invoke Kubernetes pod listing.
 */
export async function checkKubernetesPods(namespace = 'default'): Promise<string> {
  try {
    const res = await client.callTool({
      server: 'llm-framework-devops',
      name: 'k8s_get_pods',
      args: { namespace },
    });
    return res.content?.[0]?.text || 'No output';
  } catch (e) {
    error('Kubernetes status failed', { message: (e as Error).message, namespace });
    return 'Kubernetes status error';
  }
}

export interface AgentDiagnostics {
  dir: string;
  exists: boolean;
  count: number;
  cacheAgeSeconds: number;
  lastLoad: string;
  raw: string;
}

/**
 * Retrieve diagnostics for agent personas from MCP server.
 */
export async function diagnoseAgents(): Promise<AgentDiagnostics> {
  try {
    const res = await client.callTool({ server: 'scarmonit-architecture', name: 'diagnose_agents' });
    const text = res.content?.[0]?.text || '';
    // Expected format lines: Dir:, Exists:, Count:, Cache age:, Last load:
    const lines = text.split(/\n+/);
    const map: Record<string, string> = {};
    lines.forEach(l => {
      const m = l.match(/^(Dir|Exists|Count|Cache age|Last load):\s*(.*)$/i);
      if (m) map[m[1].toLowerCase()] = m[2];
    });
    const diagnostics: AgentDiagnostics = {
      dir: map['dir'] || 'unknown',
      exists: (map['exists'] || '').toLowerCase() === 'true',
      count: parseInt(map['count'] || '0', 10),
      cacheAgeSeconds: parseInt((map['cache age'] || '0').replace(/s$/, ''), 10),
      lastLoad: map['last load'] || 'unknown',
      raw: text,
    };
    info('Agent diagnostics retrieved', { count: diagnostics.count });
    return diagnostics;
  } catch (e) {
    error('Agent diagnostics failed', { message: (e as Error).message });
    return { dir: 'error', exists: false, count: 0, cacheAgeSeconds: 0, lastLoad: 'error', raw: '' };
  }
}
