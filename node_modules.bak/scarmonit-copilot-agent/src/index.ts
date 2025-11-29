import { Hono } from 'hono';

const app = new Hono<{ Bindings: { MCP_SERVER_URL: string } }>();

// 1. Root endpoint for Copilot to verify functionality
app.get('/', (c) => c.text('Scarmonit Copilot Agent is running!'));

// 2. The main chat completion endpoint called by GitHub Copilot
app.post('/agent/chat', async (c) => {
  const body = await c.req.json();
  const messages = body.messages;
  const userMessage = messages[messages.length - 1];

  // 3. MCP Tool Integration Logic
  // In a real scenario, we would:
  // a. Check if the user's prompt requires a tool.
  // b. Call the MCP server (hosted elsewhere) to get available tools.
  // c. Execute the tool.
  
  let toolResult = null;
  if (userMessage.content.includes('status')) {
    // Mocking an MCP tool call
    toolResult = {
      tool: 'check_system_status',
      result: 'All systems operational. Cloudflare Worker: Healthy.'
    };
  }

  // 4. Construct the response stream
  // Copilot expects Server-Sent Events (SSE) or a JSON response.
  // For simplicity here, we return a JSON completion (non-streaming for this demo).
  
  const responseText = toolResult 
    ? `I checked the system using the MCP tool '${toolResult.tool}'. Result: ${toolResult.result}`
    : `I am your custom Scarmonit Agent. You said: "${userMessage.content}". I can help you navigate the Scarmonit Architecture.`;

  return c.json({
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: responseText,
        },
        finish_reason: 'stop',
      },
    ],
  });
});

export default app;
