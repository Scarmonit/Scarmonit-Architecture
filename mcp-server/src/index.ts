import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create the MCP server
const server = new McpServer({
  name: "Scarmonit MCP Server",
  version: "1.0.0",
});

// Tool: Check System Status
server.tool(
  "check_system_status",
  "Checks the health of the Scarmonit infrastructure components",
  {
    component: z.enum(["web", "api", "all"]).default("all").describe("The component to check"),
  },
  async ({ component }) => {
    // In a real app, this would ping your URLs
    const statuses = {
      web: "Online (Cloudflare Pages)",
      api: "Online (Cloudflare Workers)",
    };

    if (component === "web") return { content: [{ type: "text", text: statuses.web }] };
    if (component === "api") return { content: [{ type: "text", text: statuses.api }] };
    
    return { 
      content: [{ type: "text", text: `Web: ${statuses.web}\nAPI: ${statuses.api}` }]
    };
  }
);

// Tool: Query Documentation
server.tool(
  "query_docs",
  "Retrieves architectural documentation",
  {
    query: z.string().describe("The topic to search for"),
  },
  async ({ query }) => {
    // Mock documentation search
    return {
      content: [{
        type: "text", 
        text: `Documentation result for '${query}':\nSee docs/architecture.md for details on the unified infrastructure.` 
      }]
    };
  }
);

// Start the server using Stdio transport (standard for local MCP)
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Scarmonit MCP Server running on stdio");
}

main();
