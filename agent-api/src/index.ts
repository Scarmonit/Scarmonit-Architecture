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
        return new Response(JSON.stringify({
          error: 'Not Found',
          path: url.pathname,
          availableEndpoints: ['/', '/health', '/api/status'],
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }
  },
};
