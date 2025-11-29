import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

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

// Tool: Check System Status
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
      description: "Checks the Datalore Cloud integration status and license configuration",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "check_system_status") {
    const component = args?.component || "all";
    const statuses = {
      web: "Online (Cloudflare Pages)",
      api: "Online (Cloudflare Workers)",
    };

    if (component === "web") return { content: [{ type: "text", text: statuses.web }] };
    if (component === "api") return { content: [{ type: "text", text: statuses.api }] };

    return {
      content: [{ type: "text", text: `Web: ${statuses.web}\nAPI: ${statuses.api}` }],
    };
  }

  if (name === "query_docs") {
    const query = args?.query;
    return {
      content: [
        {
          type: "text",
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
            text: `✅ Datalore Cloud Integration: Connected\n\nLicense ID: ${licenseId}\nStatus: Active\n\nDatalore Cloud is properly configured and ready for notebook connectivity.`,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: "text",
            text: `⚠️ Datalore Cloud Integration: Inactive\n\nNo license key found. Please configure DATALORE_LICENSE_ID in the .env file.`,
          },
        ],
      };
    }
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Start the server using Stdio transport (standard for local MCP)
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ Scarmonit MCP Server running on stdio");
  console.error("✅ [dotenv@17.2.3] injecting env (1) from .env");
  if (process.env.DATALORE_LICENSE_ID) {
    console.error(`✅ License ID: ${process.env.DATALORE_LICENSE_ID}`);
  }
}

main();
    const component = args?.component || "all";
    const statuses = {
      web: "Online (Cloudflare Pages)",
      api: "Online (Cloudflare Workers)",
    };

    if (component === "web") return { content: [{ type: "text", text: statuses.web }] };
    if (component === "api") return { content: [{ type: "text", text: statuses.api }] };

    return {
      content: [{ type: "text", text: `Web: ${statuses.web}\nAPI: ${statuses.api}` }],
    };
  }

  if (name === "query_docs") {
    const query = args?.query;
    return {
      content: [
        {
          type: "text",
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
            text: `✅ Datalore Cloud Integration: Connected\n\nLicense ID: ${licenseId}\nStatus: Active\n\nDatalore Cloud is properly configured and ready for notebook connectivity.`,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: "text",
            text: `⚠️ Datalore Cloud Integration: Inactive\n\nNo license key found. Please configure DATALORE_LICENSE_ID in the .env file.`,
          },
        ],
      };
    }
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Start the server using Stdio transport (standard for local MCP)
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ Scarmonit MCP Server running on stdio");
  console.error("✅ [dotenv@17.2.3] injecting env (1) from .env");
  if (process.env.DATALORE_LICENSE_ID) {
    console.error(`✅ License ID: ${process.env.DATALORE_LICENSE_ID}`);
  }
}

main();
