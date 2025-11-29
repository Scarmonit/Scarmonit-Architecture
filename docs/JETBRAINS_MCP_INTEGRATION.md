# JetBrains MCP Integration Guide

## 🎯 Overview

This guide explains how to integrate the Scarmonit MCP servers with JetBrains IDEs (WebStorm, IntelliJ IDEA) and GitHub Copilot.

## 📋 Prerequisites

- JetBrains IDE (WebStorm 2024.3+ or IntelliJ IDEA 2024.3+)
- GitHub Copilot subscription
- Node.js 18+ installed
- MCP Server running

## 🔧 Configuration Files

### 1. MCP Server Configuration (`.idea/mcp-config.json`)
Defines all MCP servers available to the IDE:
- **scarmonit-architecture**: Main project MCP server with agent tools
- **filesystem**: File system operations
- **git**: Git repository operations  
- **github**: GitHub API integration

### 2. MCP Settings (`.idea/mcp-settings.xml`)
JetBrains IDE-specific MCP configuration with:
- Server definitions
- Environment variables
- Tool mappings
- Enable/disable flags

### 3. Copilot Agents (`.idea/copilot-agents.xml`)
Custom Copilot agents that can use MCP tools:
- **Backend Engineer**: Cloudflare Workers & APIs
- **Frontend Engineer**: React & TypeScript
- **MCP Specialist**: MCP server development
- **Security Reviewer**: Security & vulnerability assessment

## 🚀 Setup Instructions

### Step 1: Verify MCP Server
```powershell
cd mcp-server
npm install
node index.js
```

Expected output:
```
[mcp-server] Agents dir resolved: C:\Users\scarm\IdeaProjects\Scarmonit-Architecture\.github\agents exists: true
[mcp-server] Loaded 4 agent personas from .github/agents
MCP Server running on stdio
```

### Step 2: Configure JetBrains IDE

#### Option A: Automatic (Files Already Created)
The configuration files are already in `.idea/`:
- `.idea/mcp-config.json` ✅
- `.idea/mcp-settings.xml` ✅  
- `.idea/copilot-agents.xml` ✅
- `.idea/copilot-settings.xml` ✅

#### Option B: Manual Configuration
1. Open WebStorm/IntelliJ IDEA
2. Go to `Settings` → `Tools` → `MCP Servers`
3. Click `Add Server`
4. Configure each server:

**Scarmonit Architecture Server:**
```
Name: scarmonit-architecture
Command: node
Arguments: C:/Users/scarm/IdeaProjects/Scarmonit-Architecture/mcp-server/index.js
Environment: DATALORE_LICENSE_ID=DSVYH9Q8VG
```

**Filesystem Server:**
```
Name: filesystem
Command: npx
Arguments: -y @modelcontextprotocol/server-filesystem C:/Users/scarm/IdeaProjects/Scarmonit-Architecture
```

**Git Server:**
```
Name: git
Command: uvx
Arguments: mcp-server-git --repository C:/Users/scarm/IdeaProjects/Scarmonit-Architecture
```

**GitHub Server:**
```
Name: github
Command: npx
Arguments: @modelcontextprotocol/server-github
Environment: GITHUB_PERSONAL_ACCESS_TOKEN=***REDACTED***
```

> Note: Do NOT commit secrets. Set `GITHUB_PERSONAL_ACCESS_TOKEN` via a secure environment variable or CI secret store.

### Step 3: Enable GitHub Copilot Agents

1. Open `Settings` → `Tools` → `GitHub Copilot`
2. Enable **Agent Mode**
3. Verify available agents:
   - ⚙️ Backend Engineer
   - 🎨 Frontend Engineer
   - 🔌 MCP Specialist
   - 🔒 Security Reviewer

### Step 4: Test the Integration

#### Test MCP Tools
In Copilot Chat, try:
```
@mcp-specialist list available agents
```

Expected: List of agents from `.github/agents/`

#### Test Agent Context
```
@backend-engineer help me add a new API endpoint
```

Expected: Copilot uses backend-engineer context and suggests Cloudflare Workers patterns

#### Test MCP Commands
```
Use check_datalore_status to verify the integration
```

Expected: Returns Datalore license status

## 🛠️ Available MCP Tools

### Scarmonit Architecture Server Tools

1. **check_datalore_status**
   - Verifies Datalore Cloud integration
   - No parameters required

2. **check_system_status**
   - Overall infrastructure health check
   - No parameters required

3. **list_agents**
   - Lists all agent personas from `.github/agents/`
   - Optional: `refresh: boolean`

4. **get_agent_instructions**
   - Retrieves full instructions for a specific agent
   - Required: `agent: string` (agent name or file)

5. **search_agents**
   - Searches agents by keyword
   - Required: `query: string`

6. **apply_agent_context**
   - Returns condensed agent expertise summary
   - Required: `agent: string`

7. **diagnose_agents**
   - Diagnostic information about agent loading
   - No parameters required

### Filesystem Server Tools
- `read_file`: Read file contents
- `write_file`: Write to file
- `list_directory`: List directory contents
- `create_directory`: Create new directory

### Git Server Tools
- `git_status`: Check repository status
- `git_diff`: Show changes
- `git_log`: View commit history
- `git_commit`: Create commit

### GitHub Server Tools
- `search_repositories`: Search repos
- `create_issue`: Create GitHub issue
- `list_pull_requests`: List PRs
- `get_file_contents`: Get file from GitHub

## 🎯 Using Copilot with MCP

### Example 1: List Available Agents
**Prompt:**
```
Show me all available agent personas in this project
```

**Copilot will:**
1. Use `list_agents` MCP tool
2. Return formatted list from `.github/agents/`

### Example 2: Get Agent Instructions
**Prompt:**
```
@mcp-specialist what are the instructions for the backend-engineer agent?
```

**Copilot will:**
1. Use `get_agent_instructions` with `agent: "backend-engineer"`
2. Return full markdown content

### Example 3: Check System Status
**Prompt:**
```
Check if all Scarmonit systems are operational
```

**Copilot will:**
1. Use `check_system_status` MCP tool
2. Return infrastructure status

### Example 4: Search Agents
**Prompt:**
```
Find agents related to security
```

**Copilot will:**
1. Use `search_agents` with `query: "security"`
2. Return matching agents

## 🔍 Troubleshooting

### MCP Server Not Showing in IDE

**Check:**
1. Restart WebStorm/IntelliJ
2. Verify `.idea/mcp-settings.xml` exists
3. Check IDE version (2024.3+ required)
4. Enable experimental features if needed

**Fix:**
```powershell
# Restart IDE
# Or manually reload project:
# File → Invalidate Caches → Invalidate and Restart
```

### Tools Not Available in Copilot

**Check:**
1. MCP server is running
2. Copilot agents are enabled
3. Tool names match exactly

**Test manually:**
```powershell
cd mcp-server
.\start-mcp.ps1
```

### Environment Variables Not Working

**Fix:**
Edit `.idea/mcp-config.json` and ensure:
```json
{
  "mcpServers": {
    "scarmonit-architecture": {
      "env": {
        "DATALORE_LICENSE_ID": "DSVYH9Q8VG"
      }
    }
  }
}
```

### Agent Instructions Not Loading

**Check:**
```powershell
# Verify agents directory exists
Test-Path .github\agents

# List agents
Get-ChildItem .github\agents\*.md
```

**Test:**
In Copilot Chat:
```
diagnose_agents
```

## 📊 Verification Checklist

- [ ] MCP server starts without errors
- [ ] `.idea/mcp-config.json` exists
- [ ] `.idea/mcp-settings.xml` exists
- [ ] `.idea/copilot-agents.xml` exists
- [ ] IDE recognizes MCP servers
- [ ] Copilot shows custom agents
- [ ] MCP tools work in Copilot Chat
- [ ] Agent instructions load properly

## 🎉 Success Indicators

You'll know it's working when:

✅ **In IDE Settings:**
- `Settings` → `Tools` → `MCP Servers` shows 4 servers
- All servers show as "Connected" or "Active"

✅ **In Copilot Chat:**
- Can use `@backend-engineer`, `@frontend-engineer`, etc.
- Can invoke MCP tools like `check_datalore_status`
- Copilot references agent context from `.github/agents/`

✅ **In Code Editor:**
- Copilot suggestions match agent patterns
- Error handling follows project standards
- Code style matches configuration

## 📚 Additional Resources

- [Model Context Protocol Spec](https://modelcontextprotocol.io/)
- [JetBrains MCP Plugin Docs](https://www.jetbrains.com/help/idea/mcp.html)
- [GitHub Copilot Agents](https://docs.github.com/copilot/agents)
- Project MCP Server: `mcp-server/README.md`

## 🆘 Getting Help

1. **Check logs:**
   ```powershell
   cat mcp-server\server.log
   cat mcp-server\error.log
   ```

2. **Test MCP server:**
   ```powershell
   npm test
   ```

3. **Diagnose agents:**
   In Copilot Chat:
   ```
   Use diagnose_agents tool
   ```

4. **Restart everything:**
   ```powershell
   # Stop MCP server (Ctrl+C)
   # Restart IDE
   # Start MCP server again
   .\mcp-server\start-mcp.ps1
   ```

---

**Created**: November 29, 2025  
**Last Updated**: November 29, 2025  
**Maintainer**: Parker Dunn (Scarmonit@gmail.com)  
**Project**: Scarmonit-Architecture
