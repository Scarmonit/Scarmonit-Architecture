# MCP Usage Guide

> Complete guide for using the Model Context Protocol (MCP) integration in the Scarmonit Architecture.

## What is MCP?

The Model Context Protocol (MCP) is a standardized way for AI assistants to interact with external tools and data sources. Scarmonit implements MCP to provide:

- **Infrastructure Monitoring:** Real-time health checks for all services
- **Documentation Search:** Intelligent queries across architecture documentation
- **Agent Personas:** Custom AI agent configurations for specific tasks

## Quick Start

### 1. Start the MCP Server

```bash
cd mcp-server
npm install
npm start
```

### 2. Configure Your IDE

**For JetBrains IDEs:**
1. Open Settings → Tools → Model Context Protocol
2. Add the Scarmonit MCP server configuration
3. Restart your IDE

**For VS Code:**
1. Create or update `.vscode/mcp.json`
2. Add the server configuration
3. Reload the window

### 3. Start Using Tools

In your AI assistant, you can now use commands like:

```
Check the system status
List available agents
Search for backend-related agents
```

## Architecture

```
┌──────────────────┐
│   AI Assistant   │
│  (Copilot, etc.) │
└────────┬─────────┘
         │ MCP Protocol
         ▼
┌──────────────────────────┐
│    Scarmonit MCP Server  │
│    (stdio transport)     │
└────────┬─────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────┐
│ Tools │ │ Agents│
└───────┘ └───────┘
```

## Available Tools

| Tool | Purpose |
|------|---------|
| `check_system_status` | Monitor infrastructure health |
| `check_datalore_status` | Verify Datalore integration |
| `list_agents` | List available agent personas |
| `get_agent_instructions` | Get detailed agent instructions |
| `search_agents` | Search agents by keyword |
| `apply_agent_context` | Get actionable agent summary |
| `diagnose_agents` | Debug agent loading issues |

## Best Practices

1. **Use specific tools:** Rather than asking general questions, invoke specific tools for accurate results.

2. **Refresh when needed:** If data seems stale, use the `refresh` parameter with `list_agents`.

3. **Check diagnostics:** When troubleshooting, start with `diagnose_agents` to understand the current state.

## Related Documentation

- [MCP Agent Usage](MCP_AGENT_USAGE.md) - Detailed tool usage guide
- [Quick Start](QUICKSTART.md) - Get started quickly
- [MCP Server README](mcp-server/README.md) - Server documentation

---

**Built by Scarmonit Industries**
