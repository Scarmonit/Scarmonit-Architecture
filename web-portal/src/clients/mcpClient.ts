/*
  MCP Client for Web Portal
  - Provides a typed wrapper to call MCP tools across multiple servers via a local bridge endpoint
  - Assumes a local MCP HTTP bridge is available (e.g., Copilot/IntelliJ exposing MCP over localhost)
  - If not available, gracefully degrades and returns mock responses
*/

export type McpToolCall = {
  server: string; // e.g., 'scarmonit-architecture' or 'llm-framework-devops'
  name: string;   // tool name
  args?: Record<string, unknown>;
};

export type McpContent = { type: 'text'; text: string };
export type McpToolResult = { content: McpContent[] };

export interface McpClientOptions {
  baseUrl?: string; // e.g., 'http://localhost:3000/mcp' for HTTP bridge
  timeoutMs?: number;
}

export class McpClient {
  private baseUrl: string;
  private timeoutMs: number;

  constructor(options: McpClientOptions = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3000/mcp';
    this.timeoutMs = options.timeoutMs || 5000;
  }

  async callTool(call: McpToolCall): Promise<McpToolResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(call),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`MCP call failed (${res.status})`);
      }
      const data = (await res.json()) as McpToolResult;
      return data;
    } catch (err) {
      clearTimeout(timer);
      // Graceful degradation with safe defaults
      const text = this.fallbackResponse(call, err as Error);
      return { content: [{ type: 'text', text }] };
    }
  }

  private fallbackResponse(call: McpToolCall, err: Error): string {
    const base = `MCP bridge unavailable or call failed: ${err.message}`;
    // Minimal, safe mock per tool
    if (call.name === 'check_system_status') {
      const component = (call.args?.component as string) || 'all';
      if (component === 'web') return `${base}\nMock: Web Online`;
      if (component === 'api') return `${base}\nMock: API Online`;
      return `${base}\nMock: Web Online\nMock: API Online`;
    }
    if (call.name === 'check_datalore_status') {
      return `${base}\nMock: Datalore Cloud Integration: Connected (license: DSVYH9Q8VG)`;
    }
    // Generic
    return `${base}\nMock tool: ${call.name}`;
  }
}

