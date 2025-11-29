# Datalore Cloud Integration

> **Status:** ✅ Active | **License:** DSVYH9Q8VG

## Overview

Datalore Cloud is integrated into the Scarmonit Architecture MCP server, providing seamless connectivity between JetBrains Datalore notebooks and the AI infrastructure.

## Configuration

### License Information
- **License ID:** `DSVYH9Q8VG`
- **Storage:** `mcp-server/.env`
- **Status:** Active and configured

### Environment Variables

```bash
# mcp-server/.env
DATALORE_LICENSE_ID=DSVYH9Q8VG
```

## MCP Integration

### Tool: check_datalore_status

The MCP server provides a dedicated tool for checking Datalore integration status.

**Usage in Copilot/AI Tools:**
```javascript
// Automatically available when MCP server is running
check_datalore_status()
```

**Response when active:**
```
✅ Datalore Cloud Integration: Connected

License ID: DSVYH9Q8VG
Status: Active

Datalore Cloud is properly configured and ready for notebook connectivity.
```

**Response when inactive:**
```
⚠️ Datalore Cloud Integration: Inactive

No license key found. Please configure DATALORE_LICENSE_ID in the .env file.
```

## Usage

### In GitHub Copilot

When working in your IDE with GitHub Copilot, the MCP server automatically provides Datalore context:

1. Open any file in the Scarmonit Architecture project
2. Ask Copilot: "Check Datalore status"
3. Copilot will use the `check_datalore_status` tool

### In Junie (JetBrains AI)

Junie can access the MCP server tools directly:

1. Ensure MCP server is configured in `mcp.json`
2. Restart IntelliJ IDEA
3. Ask Junie about Datalore integration

### Manual Testing

Test the integration directly:

```bash
cd mcp-server
npm start
```

The server runs in stdio mode and waits for MCP protocol messages.

## Features Enabled

### ✅ Current Features

- **License Verification**: Automatic validation of Datalore license
- **Status Monitoring**: Real-time integration status checks
- **Environment Management**: Secure credential storage via `.env`

### 🔄 Planned Features

- **Notebook Connectivity**: Direct connection to Datalore notebooks
- **Data Synchronization**: Sync datasets between Scarmonit and Datalore
- **Collaborative Analytics**: Multi-user notebook access
- **API Integration**: Direct Datalore API calls from MCP tools

## Architecture

```
┌─────────────────────────────────────────────────┐
│           GitHub Copilot / Junie                │
│                    (Client)                     │
└────────────────────┬────────────────────────────┘
                     │ MCP Protocol
                     │
┌────────────────────▼────────────────────────────┐
│          Scarmonit MCP Server                   │
│         (index.js - stdio transport)            │
│                                                 │
│  Tools:                                         │
│  - check_system_status                          │
│  - query_docs                                   │
│  - check_datalore_status ◄─────┐                │
│                                 │                │
└─────────────────────────────────┼────────────────┘
                                  │
                                  │ .env
┌─────────────────────────────────▼────────────────┐
│      Environment Configuration                   │
│                                                  │
│  DATALORE_LICENSE_ID=DSVYH9Q8VG                  │
│                                                  │
└──────────────────────────────────────────────────┘
```

## Troubleshooting

### License Not Found

**Error:**
```
⚠️ Datalore Cloud Integration: Inactive
No license key found.
```

**Solution:**
1. Check `.env` file exists in `mcp-server/`
2. Verify it contains: `DATALORE_LICENSE_ID=DSVYH9Q8VG`
3. Restart the MCP server

### dotenv Module Not Found

**Error:**
```
Cannot find module 'dotenv'
```

**Solution:**
```bash
cd mcp-server
npm install dotenv
```

### MCP Server Not Starting

**Error:**
```
Cannot find module '@modelcontextprotocol/sdk'
```

**Solution:**
```bash
cd mcp-server
npm install
```

## Security

### Best Practices

- ✅ License ID stored in `.env` (not committed to Git)
- ✅ `.env` added to `.gitignore`
- ✅ Environment variables loaded at runtime
- ✅ No hardcoded credentials in source code

### `.gitignore` Entry

Ensure your `.gitignore` includes:
```
# Environment variables
.env
.env.local
.env.*.local
```

## Next Steps

### Enhance Integration

1. **Add Datalore API Client**: Direct API calls to Datalore Cloud
2. **Notebook Management**: List, create, and manage notebooks via MCP
3. **Data Pipeline**: Sync data between Scarmonit services and Datalore
4. **Collaborative Features**: Share notebooks within team

### Example Future Tool

```javascript
// Future MCP tool: create_datalore_notebook
server.tool(
  "create_datalore_notebook",
  "Creates a new Datalore notebook",
  {
    name: z.string().describe("Notebook name"),
    language: z.enum(["python", "r", "kotlin"]),
  },
  async ({ name, language }) => {
    // API call to Datalore Cloud
    // Using DATALORE_LICENSE_ID for authentication
  }
);
```

## Resources

- **Datalore Cloud**: https://datalore.jetbrains.com/
- **MCP Protocol**: https://modelcontextprotocol.io/
- **Scarmonit Docs**: See `docs/` folder

## Support

For issues with Datalore integration:
1. Check MCP server logs: `npm start`
2. Verify license in `.env` file
3. Test with `check_datalore_status` tool
4. Review this documentation

---

**Last Updated:** November 28, 2025  
**Integration Status:** ✅ Active  
**License:** DSVYH9Q8VG

