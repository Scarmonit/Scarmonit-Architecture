/**
 * Cloudflare Worker for LM Studio LFM2 Agent
 *
 * Edge deployment of LFM2 agent with TypeScript integration.
 * Provides REST API for agent execution with CORS support.
 */

interface Env {
  LM_STUDIO_API_URL: string;
  AGENT_AUTH_TOKEN: string;
  AGENT_CACHE: KVNamespace;
  AGENT_HISTORY: KVNamespace;
}

interface AgentRequest {
  instruction: string;
  tools?: string[];
  model?: string;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    // CORS headers for browser access
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', 
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({ status: 'healthy', timestamp: Date.now() }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Agent Dashboard
    if (url.pathname === '/') {
      const html = 
        '<!DOCTYPE html>' +
        '<html lang="en">' +
        '<head>' +
        '<meta charset="UTF-8">' +
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
        '<title>AI Agent Dashboard</title>' +
        '<style>' +
        'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif; background: #f0f2f5; margin: 0; padding: 20px; }' +
        '.container { max-width: 1000px; margin: 0 auto; }' +
        'header { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }' +
        'h1 { margin: 0; color: #1a1a1a; }' +
        '.status { padding: 5px 10px; border-radius: 15px; font-size: 0.9em; font-weight: bold; }' +
        '.status.online { background: #e6fffa; color: #00b894; }' +
        '.card { background: #fff; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }' +
        'table { width: 100%; border-collapse: collapse; }' +
        'th, td { text-align: left; padding: 12px; border-bottom: 1px solid #eee; }' +
        'th { color: #666; font-weight: 600; }' +
        'tr:hover { background: #f9f9f9; }' +
        '.logs { font-family: monospace; background: #1a1a1a; color: #e0e0e0; padding: 15px; border-radius: 6px; overflow-x: auto; max-height: 400px; overflow-y: auto; white-space: pre-wrap; }' +
        '.refresh-btn { background: #3182ce; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; transition: background 0.2s; }' +
        '.refresh-btn:hover { background: #2c5282; }' +
        '</style>' +
        '<script>' +
        'async function fetchHistory() {' +
        '    const res = await fetch("/api/history");' +
        '    const data = await res.json();' +
        '    const tbody = document.getElementById("history-body");' +
        '    tbody.innerHTML = "";' +
        '    data.forEach(task => {' +
        '        const row = document.createElement("tr");' +
        '        row.innerHTML =' +
        '            "<td>" + new Date(task.timestamp).toLocaleString() + "</td>" +' +
        '            "<td>" + task.agent_id + "</td>" +' +
        '            "<td>" + task.task + "</td>" +' +
        '            "<td>" + task.status + "</td>" +' +
        '            "<td><button onclick=\"viewLogs(\"" + task.id + "\")\">View Logs</button></td>";' +
        '        tbody.appendChild(row);' +
        '    });' +
        '}' +
        'async function viewLogs(id) {' +
        '    const res = await fetch("/api/history/" + id);' +
        '    const data = await res.json();' +
        '    document.getElementById("log-viewer").innerText = JSON.stringify(data, null, 2);' +
        '}' +
        'window.onload = fetchHistory;' +
        '</script>' +
        '</head>' +
        '<body>' +
        '<div class="container">' +
        '<header>' +
        '<h1>🤖 AI Agent Dashboard</h1>' +
        '<div>' +
        '<span class="status online">● System Online</span>' +
        '<button class="refresh-btn" onclick="fetchHistory()">Refresh</button>' +
        '</div>' +
        '</header>' +
        '<div class="card">' +
        '<h2>Recent Tasks</h2>' +
        '<table>' +
        '<thead>' +
        '<tr>' +
        '<th>Time</th>' +
        '<th>Agent</th>' +
        '<th>Task</th>' +
        '<th>Status</th>' +
        '<th>Action</th>' +
        '</tr>' +
        '</thead>' +
        '<tbody id="history-body">' +
        '<!-- Data populated by JS -->' +
        '</tbody>' +
        '</table>' +
        '</div>' +
        '<div class="card">' +
        '<h2>Task Details / Logs</h2>' +
        '<div id="log-viewer" class="logs">Select a task to view details...</div>' +
        '</div>' +
        '</div>' +
        '</body>' +
        '</html>';

      return new Response(html, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });
    }

    // History API: List tasks
    if (url.pathname === '/api/history' && request.method === 'GET') {
      const keys = await env.AGENT_HISTORY.list({ limit: 10, prefix: 'task:' });
      const tasks = [];
      for (const key of keys.keys) {
        const task = await env.AGENT_HISTORY.get(key.name, 'json');
        if (task) tasks.push({ id: key.name, ...task });
      }
      // Sort by timestamp desc
      tasks.sort((a, b) => b.timestamp - a.timestamp);
      return new Response(JSON.stringify(tasks), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // History API: Get specific task
    if (url.pathname.startsWith('/api/history/') && request.method === 'GET') {
      const id = url.pathname.split('/').pop();
      const task = await env.AGENT_HISTORY.get(id, 'json');
      return new Response(JSON.stringify(task), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // History API: Ingest logs (POST)
    if (url.pathname === '/api/history' && request.method === 'POST') {
      const body = await request.json();
      const id = `task:${Date.now()}`;
      await env.AGENT_HISTORY.put(id, JSON.stringify({
        timestamp: Date.now(),
        ...body
      }));
      return new Response(JSON.stringify({ success: true, id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // OpenAI Compatible Chat Completions Endpoint
    if (url.pathname === '/v1/chat/completions' && request.method === 'POST') {
      try {
        const body = await request.json();

        // Forward the request to LM Studio
        const response = await fetch(env.LM_STUDIO_API_URL + '/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.AGENT_AUTH_TOKEN || 'lm-studio'}`,
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`LM Studio API error (${response.status}): ${errText}`);
        }

        const result = await response.json();

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: {
              message: error instanceof Error ? error.message : 'Unknown error',
              type: 'internal_error',
              param: null,
              code: 'internal_error'
            }
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Agent execution endpoint
    if (url.pathname === '/execute' && request.method === 'POST') {
      try {
        const body: AgentRequest = await request.json();

        if (!body.instruction) {
          return new Response(
            JSON.stringify({ success: false, error: 'Missing instruction' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Check cache for recent identical requests
        const cacheKey = `agent:${JSON.stringify(body)}`;
        const cached = await env.AGENT_CACHE.get(cacheKey);

        if (cached) {
          return new Response(
            cached,
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Call LM Studio API (OpenAI Compatible)
        const response = await fetch(env.LM_STUDIO_API_URL + '/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // LM Studio usually doesn't strictly enforce the token for local connections, 
            // but we pass it if configured or typically 'Authorization: Bearer lm-studio'
            Authorization: `Bearer ${env.AGENT_AUTH_TOKEN || 'lm-studio'}`,
          },
          body: JSON.stringify({
            model: body.model || 'lfm2-1.2b', // Default to the model we saw loaded
            messages: [
              { role: "system", content: "You are a helpful AI agent." },
              { role: "user", content: body.instruction }
            ],
            stream: false
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`LM Studio API error (${response.status}): ${errText}`);
        }

        const result = await response.json();

        // Cache successful results for 5 minutes
        ctx.waitUntil(
          env.AGENT_CACHE.put(cacheKey, JSON.stringify(result), {
            expirationTtl: 300,
          })
        );

        // Return the result directly (OpenAI format)
        return new Response(
          JSON.stringify(result),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // 404 for unknown routes
    return new Response('Not Found', {
      status: 404,
      headers: corsHeaders,
    });
  },
};
