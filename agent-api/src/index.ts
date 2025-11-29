interface Env {
  // Add environment bindings here
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Route handling
    switch (url.pathname) {
      case '/':
        return new Response(JSON.stringify({
          name: 'Scarmonit Agent API',
          version: '1.0.0',
          status: 'operational',
          timestamp: new Date().toISOString(),
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });

      case '/health':
        return new Response(JSON.stringify({
          status: 'healthy',
          runtime: 'cloudflare-workers',
          timestamp: new Date().toISOString(),
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });

      case '/api/status':
        return new Response(JSON.stringify({
          services: {
            api: 'online',
            database: 'online',
            cache: 'online',
          },
          region: request.cf?.colo || 'unknown',
          timestamp: new Date().toISOString(),
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });

      default:
        // Handle /api/tools/:toolName
        const toolMatch = url.pathname.match(/^\/api\/tools\/(.+)/);
        if (toolMatch) {
          const toolName = toolMatch[1];
          let resultData = {};

          // Mock responses based on tool name
          if (toolName === 'check_system_status') {
            resultData = {
              operational: true,
              services: [
                { name: 'Web Portal', status: 'online', url: 'https://scarmonit.scarmonit-www.pages.dev' },
                { name: 'Agent API', status: 'online', url: 'https://agent-api.scarmonit.workers.dev' },
                { name: 'MCP Server', status: 'online' },
                { name: 'Copilot Extension', status: 'online' }
              ],
              infrastructure: {
                docker: 'Active',
                kubernetes: 'Active'
              }
            };
          } else if (toolName === 'check_datalore_status') {
             resultData = {
                connected: true,
                licenseId: 'DL-MOCK-12345',
                status: 'Active',
                features: ['notebooks', 'reports']
             };
          } else if (toolName === 'docker_ps') {
             resultData = {
                containers: [
                   { id: 'c1', name: 'scarmonit-web', image: 'web-portal:latest', status: 'Up 2 hours', ports: ['8080:80'] },
                   { id: 'c2', name: 'mcp-server', image: 'node:20-alpine', status: 'Up 2 hours', ports: ['3000:3000'] }
                ]
             };
          } else if (toolName === 'k8s_get_pods') {
             resultData = {
                pods: [
                   { name: 'agent-api-7d6f8', namespace: 'default', status: 'Running', restarts: 0 },
                   { name: 'redis-master-0', namespace: 'default', status: 'Running', restarts: 1 }
                ]
             };
          } else if (toolName === 'k8s_get_deployments') {
             resultData = {
                deployments: [
                   { name: 'agent-api', namespace: 'default', replicas: 1, ready: 1 }
                ]
             };
          } else {
             // Generic fallback for unknown tools
             resultData = { message: `Tool ${toolName} executed successfully (mock)` };
          }

          return new Response(JSON.stringify({
             status: 'success',
             data: resultData,
             executionTime: 150,
             timestamp: Date.now(),
             server: 'scarmonit-architecture',
             tool: toolName
          }), {
             headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        return new Response(JSON.stringify({
          error: 'Not Found',
          path: url.pathname,
          availableEndpoints: ['/', '/health', '/api/status', '/api/tools/*'],
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }
  },
};
