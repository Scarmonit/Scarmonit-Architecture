# Scarmonit MCP Server

Model Context Protocol server for Scarmonit Architecture project integration with GitHub Copilot and other AI tools.

## 🎯 Features

- **Infrastructure Monitoring**: Check health of Scarmonit web and API components
- **Documentation Search**: Query architectural documentation
- **Datalore Cloud Integration**: Full connectivity for JetBrains Datalore notebooks

## 🚀 Setup

1. Install dependencies:
```bash
cd mcp-server
npm install
```

2. Configure environment (already done):
```bash
# .env file contains:
DATALORE_LICENSE_ID=DSVYH9Q8VG
```

3. Test the server:
```bash
npm start
```

The server should output: `Scarmonit MCP Server running on stdio`

## 📋 Available Tools

### check_system_status
Checks the health of Scarmonit infrastructure components.

**Parameters:**
- `component` (enum): "web", "api", or "all" (default: "all")

**Example:**
```json
{
  "component": "all"
}
```

### query_docs
Retrieves architectural documentation.

**Parameters:**
- `query` (string): The topic to search for

**Example:**
```json
{
  "query": "deployment"
}
```

### check_datalore_status
Verifies Datalore Cloud integration and license status.

**Parameters:** None

**Response:**
```
✅ Datalore Cloud Integration: Connected

License ID: DSVYH9Q8VG
Status: Active

Datalore Cloud is properly configured and ready for notebook connectivity.
```

## ⚙️ Configuration

The server is already configured in your GitHub Copilot MCP settings at:
`C:\Users\scarm\AppData\Local\github-copilot\intellij\mcp.json`

## Troubleshooting

If you see module not found errors:
1. Delete `node_modules` folder
2. Delete `package-lock.json`
3. Run `npm install` again

If the server doesn't start:
- Make sure Node.js 18+ is installed
- Check that the path in `mcp.json` is correct
- Try running `node index.js` manually to see error messages

