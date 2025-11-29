# MCP Quick Start

> Get up and running with MCP tools in under 5 minutes.

## Prerequisites

- Node.js 18 or later
- Git access to the repository

## Step 1: Install Dependencies

```bash
cd mcp-server
npm install
```

## Step 2: Start the Server

```bash
npm start
```

You should see:
```
Scarmonit MCP Server started
Datalore License: Configured ✓
```

## Step 3: Test the Tools

### Using curl (optional verification)

```bash
# If running the MCP bridge
curl http://localhost:3001/api/health
```

### Using GitHub Copilot

In Copilot Chat, try:
- "Check the system status"
- "List all available agents"
- "Search for frontend agents"

## Common Commands

| Action | Command |
|--------|---------|
| Check health | `check_system_status` |
| View agents | `list_agents` |
| Find agents | `search_agents query:"backend"` |
| Get details | `get_agent_instructions agent:"backend-engineer"` |

## Troubleshooting

### Server won't start

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Tools not responding

1. Verify server is running
2. Check IDE MCP configuration
3. Restart your IDE

## Next Steps

- Read the full [MCP Usage Guide](MCP_USAGE_GUIDE.md)
- Explore [Agent Usage](MCP_AGENT_USAGE.md)
- Review the [Dashboard Quick Start](QUICKSTART.md)

---

**Built by Scarmonit Industries**
