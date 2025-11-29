# 🌉 MCP Bridge Server

> **HTTP-to-stdio bridge for Model Context Protocol servers**

## Overview

The MCP Bridge Server enables HTTP clients (like the web-portal) to communicate with stdio-based MCP servers. It acts as a translation layer:

```
Web Portal (HTTP) → MCP Bridge (stdio) → MCP Servers
```

## Quick Start

```bash
# Install dependencies
npm install

# Start the bridge
npm start

# Or with auto-reload
npm run dev
```

Server runs at: **http://localhost:3001**

## Architecture

```
┌─────────────────────────────────────────┐
│      Web Portal (HTTP Client)           │
│   http://localhost:5174                 │
└─────────────────┬───────────────────────┘
                  │
                  ▼ HTTP POST
┌─────────────────────────────────────────┐
│      MCP Bridge Server                  │
│   http://localhost:3001                 │
│                                          │
│  • Routes tools to correct server       │
│  • Manages stdio connections            │
│  • Handles CORS & auth                  │
│  • Connection pooling                   │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼ stdio             ▼ stdio
┌──────────────┐    ┌──────────────┐
│  scarmonit-  │    │ llm-framework│
│ architecture │    │   -devops    │
│  MCP Server  │    │  MCP Server  │
└──────────────┘    └──────────────┘
```

## API Endpoints

### Health Check

```bash
# Overall health
GET http://localhost:3001/api/health

# Server-specific health
GET http://localhost:3001/api/health/scarmonit-architecture
```

### List Tools

```bash
# List all tools from a server
GET http://localhost:3001/api/tools/scarmonit-architecture
GET http://localhost:3001/api/tools/llm-framework-devops
```

### Call Tool (Auto-routing)

```bash
# Bridge automatically routes to correct server
POST http://localhost:3001/api/tools/check_system_status
Content-Type: application/json

{}
```

```bash
# Docker example
POST http://localhost:3001/api/tools/docker_ps
Content-Type: application/json

{"all": true}
```

### Call Tool (Explicit Server)

```bash
# Bypass routing, call specific server
POST http://localhost:3001/api/tools/scarmonit-architecture/check_system_status
Content-Type: application/json

{}
```

## Tool Routing

The bridge automatically routes tools based on naming patterns:

| Tool Pattern | Routes To |
|-------------|-----------|
| `check_*` | scarmonit-architecture |
| `*datalore*` | scarmonit-architecture |
| `docker_*` | llm-framework-devops |
| `k8s_*` | llm-framework-devops |

## Response Format

### Success Response

```json
{
  "status": "success",
  "data": {
    "operational": true,
    "services": [...]
  },
  "server": "scarmonit-architecture",
  "executionTime": 234,
  "timestamp": 1701234567890
}
```

### Error Response

```json
{
  "status": "error",
  "error": "Tool not found: invalid_tool",
  "tool": "invalid_tool",
  "executionTime": 12,
  "timestamp": 1701234567890
}
```

## Configuration

Edit `server.js` to add/modify MCP servers:

```javascript
const MCP_SERVERS = {
  'scarmonit-architecture': {
    command: 'node',
    args: ['path/to/mcp-server/index.js'],
    env: { LOG_LEVEL: 'INFO' }
  },
  'your-custom-server': {
    command: 'python',
    args: ['path/to/server.py'],
    env: { DEBUG: 'true' }
  }
}
```

## Testing

### Using cURL

```bash
# Health check
curl http://localhost:3001/api/health

# Call tool
curl -X POST http://localhost:3001/api/tools/check_system_status \
  -H "Content-Type: application/json" \
  -d '{}'

# Docker status
curl -X POST http://localhost:3001/api/tools/docker_ps \
  -H "Content-Type: application/json" \
  -d '{"all": true}'
```

### Using Web Portal

1. Start bridge: `npm start`
2. Start web-portal: `cd ../web-portal && npm run dev`
3. Open http://localhost:5174
4. Dashboard will auto-connect to bridge

### Using Browser Console

```javascript
// Test from web-portal
fetch('http://localhost:3001/api/tools/check_system_status', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
})
.then(r => r.json())
.then(console.log)
```

## Development

### Enable Debug Logging

Set `LOG_LEVEL=DEBUG` in `.env`:

```env
LOG_LEVEL=DEBUG
```

### Watch Mode

Auto-reload on file changes:

```bash
npm run dev
```

### Connection Pooling

Bridge maintains persistent connections to MCP servers for faster response times. Connections are established on first request and reused.

## Production Deployment

For production, replace this bridge with a Cloudflare Worker:

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────┐
│ Web Portal  │─────▶│ Cloudflare Worker│─────▶│ MCP Servers │
│ (Browser)   │      │  (Edge Runtime)  │      │  (Backend)  │
└─────────────┘      └──────────────────┘      └─────────────┘
```

See: `../agent-api/README.md` for Worker implementation.

## Troubleshooting

### "Connection refused"

- Ensure bridge is running: `npm start`
- Check port 3001 is not in use: `netstat -an | grep 3001`
- Verify web-portal uses correct URL: `.env.local` should have `VITE_API_URL=http://localhost:3001`

### "MCP server not responding"

- Check MCP server paths in `server.js` are correct
- Verify MCP servers work independently via IntelliJ MCP panel
- Check stderr logs: `node server.js 2>&1 | tee bridge.log`

### "CORS error in browser"

- Verify origin is whitelisted in `server.js`:
  ```javascript
  app.use(cors({
    origin: ['http://localhost:5174', 'http://localhost:4173']
  }))
  ```

### "Tool not found"

- List available tools: `GET /api/tools/scarmonit-architecture`
- Check tool name matches exactly (case-sensitive)
- Verify routing logic in `getServerForTool()`

## Performance

- **First request:** ~500-1000ms (includes server startup)
- **Subsequent requests:** ~50-200ms (connection pooled)
- **Concurrent requests:** Supported (Node.js async I/O)

## Security Notes

- ⚠️ **Local development only** - No authentication
- 🔒 **Production:** Use Cloudflare Worker with JWT/OAuth
- 🚫 **Firewall:** Block port 3001 from external access
- ✅ **CORS:** Whitelist only trusted origins

## License

MIT © Scarmonit Industries
