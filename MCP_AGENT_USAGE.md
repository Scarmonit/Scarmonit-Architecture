# MCP Agent Usage Guide

> This guide explains how to use the MCP (Model Context Protocol) agent tools within the Scarmonit Architecture ecosystem.

## Overview

The Scarmonit MCP Server provides AI-powered tools for infrastructure monitoring, documentation search, and agent persona management. These tools integrate seamlessly with GitHub Copilot and other AI assistants.

## Available Tools

### Infrastructure Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `check_system_status` | Check Scarmonit infrastructure health | None |
| `check_datalore_status` | Verify Datalore Cloud integration | None |

### Agent Persona Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `list_agents` | List all available agent personas | `refresh` (optional) |
| `get_agent_instructions` | Retrieve full instructions for an agent | `agent` (required) |
| `search_agents` | Search agents by keyword | `query` (required) |
| `apply_agent_context` | Get actionable summary of an agent | `agent` (required) |
| `diagnose_agents` | Diagnose agent persona loading | None |

## Getting Started

### Prerequisites

- Node.js 18 or later
- GitHub Copilot with MCP support enabled
- Access to the Scarmonit repository

### Starting the MCP Server

```bash
cd mcp-server
npm install
npm start
```

The server runs on stdio and outputs: `Scarmonit MCP Server started`

## Usage Examples

### Check System Status

Use this tool to verify that all Scarmonit services are operational:

```
Run MCP tool check_system_status
```

**Expected Response:**
```
✅ Scarmonit System Status

All Systems Operational:
- Website: https://scarmonit-www.pages.dev
- Dashboard: https://agent.scarmonit.com
- Agent CLI: Active with 13 MCP tools
- Datalore: Connected ✓
```

### List Available Agents

View all available agent personas in the repository:

```
Run MCP tool list_agents
```

### Search for Agents

Find agents matching specific keywords:

```
Run MCP tool search_agents with query "backend"
```

### Get Agent Instructions

Retrieve complete instructions for a specific agent:

```
Run MCP tool get_agent_instructions with agent "backend-engineer"
```

## Troubleshooting

### Agents Not Loading

If agent personas fail to load:

1. **Verify directory exists:**
   ```bash
   ls .github/agents/
   ```

2. **Run diagnostics:**
   ```
   Run MCP tool diagnose_agents
   ```

3. **Force refresh the cache:**
   ```
   Run MCP tool list_agents with refresh true
   ```

### Server Connection Issues

If the MCP server fails to connect:

1. Restart the server:
   ```bash
   cd mcp-server
   npm start
   ```

2. Check for port conflicts
3. Verify Node.js version is 18 or later

### Configuration Issues

Ensure MCP settings are properly configured:

- **IntelliJ/JetBrains:** Settings → Tools → Model Context Protocol
- **VS Code:** Check `.vscode/mcp.json`
- **GitHub Copilot:** Verify MCP integration is enabled

## Integration with GitHub Copilot

The MCP server integrates directly with GitHub Copilot Chat. To use:

1. Open Copilot Chat in your IDE
2. Reference MCP tools using natural language
3. The agent will automatically invoke the appropriate tool

## Support

For issues or questions:

- **GitHub Issues:** [Open an issue](https://github.com/Scarmonit/Scarmonit-Architecture/issues)
- **Email:** Scarmonit@gmail.com

---

**Built by Scarmonit Industries**
