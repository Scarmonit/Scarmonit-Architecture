# 🎯 Datalore MCP Quick Reference

## Status
✅ **Active** | License: `DSVYH9Q8VG` | Environment: Configured

---

## Quick Commands

```powershell
# Option 1: From project root
npm run dev:mcp

# Option 2: From mcp-server directory
cd mcp-server
npm start

# Option 3: Direct execution
cd mcp-server
node index.js

# Test Environment Variables
cd mcp-server
node -e "import('dotenv').then(d => { d.default.config(); console.log('License:', process.env.DATALORE_LICENSE_ID); })"
```

---

## MCP Tool Usage

### In Copilot/Junie

Ask:
- "Check Datalore status"
- "What's the Datalore license?"
- "Is Datalore Cloud connected?"

### Tool Name

`check_datalore_status`

### Response

```
✅ Datalore Cloud Integration: Connected

License ID: DSVYH9Q8VG
Status: Active

Datalore Cloud is properly configured and ready for notebook connectivity.
```

---

## Files Modified

| File | Status | Purpose |
|------|--------|---------|
| `mcp-server/.env` | ✅ Created | License storage |
| `mcp-server/index.js` | ✅ Updated | Tool implementation |
| `mcp-server/package.json` | ✅ Updated | Dependencies |
| `README.md` | ✅ Updated | Component docs |
| `docs/DATALORE_INTEGRATION.md` | ✅ Created | Full guide |

---

## Configuration

### MCP Server Config
**Location:** `C:\Users\scarm\AppData\Local\github-copilot\intellij\mcp.json`

```json
{
  "scarmonit-architecture": {
    "type": "stdio",
    "command": "node",
    "args": ["C:\\Users\\scarm\\IdeaProjects\\Scarmonit-Architecture\\mcp-server\\index.js"],
    "autoApprove": true
  }
}
```

### Environment Variables
**Location:** `mcp-server/.env`

```bash
DATALORE_LICENSE_ID=DSVYH9Q8VG
```

---

## Restart Required

⚠️ **Important:** Restart IntelliJ IDEA to activate MCP changes

---

## Documentation

📖 **Full Guide:** `docs/DATALORE_INTEGRATION.md`  
📖 **MCP Server:** `mcp-server/README.md`  
📖 **Architecture:** `README.md`

---

## Support

**Check Status:** Use `check_datalore_status` MCP tool  
**Logs:** Run `npm start` and check output  
**Issues:** See `docs/DATALORE_INTEGRATION.md` troubleshooting

---

**Last Updated:** November 28, 2025  
**Version:** 1.0.0  
**Status:** 🟢 Operational

