/*
  MCP Router: maps dashboard intents to specific MCP servers/tools
  Option B: Multi-server routing (recommended)
*/
import { McpClient } from '../clients/mcpClient';

export type HealthSummary = {
  web: string;
  api: string;
  datalore: string;
};

const client = new McpClient({ baseUrl: 'http://localhost:3000/mcp', timeoutMs: 4000 });

export async function getHealthSummary(): Promise<HealthSummary> {
  const [webRes, apiRes, dataloreRes] = await Promise.all([
    client.callTool({ server: 'scarmonit-architecture', name: 'check_system_status', args: { component: 'web' } }),
    client.callTool({ server: 'scarmonit-architecture', name: 'check_system_status', args: { component: 'api' } }),
    client.callTool({ server: 'scarmonit-architecture', name: 'check_datalore_status' }),
  ]);

  return {
    web: webRes.content?.[0]?.text || 'Unknown',
    api: apiRes.content?.[0]?.text || 'Unknown',
    datalore: dataloreRes.content?.[0]?.text || 'Unknown',
  };
}

export async function checkDockerContainers(): Promise<string> {
  // Route to devops server for Docker operations
  const res = await client.callTool({ server: 'llm-framework-devops', name: 'docker_ps' });
  return res.content?.[0]?.text || 'No output';
}

export async function checkKubernetesPods(namespace = 'default'): Promise<string> {
  const res = await client.callTool({
    server: 'llm-framework-devops',
    name: 'k8s_get_pods',
    args: { namespace },
  });
  return res.content?.[0]?.text || 'No output';
}

