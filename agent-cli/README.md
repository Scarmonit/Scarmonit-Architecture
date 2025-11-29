# Agent CLI

> Autonomous AI agent with MCP tool access for infrastructure management

## Overview

The Agent CLI provides an autonomous AI agent that can execute tasks using 13 different MCP (Model Context Protocol) tools, including Docker, Kubernetes, file system operations, and more.

## Features

- 🧠 **LLM Integration** - Uses LM Studio for local inference
- 🔧 **13 MCP Tools** - Docker, Kubernetes, Git, files, web search, etc.
- 🔁 **ReAct Reasoning** - Iterative task solving with tool usage
- 📝 **Auto Logging** - Tasks logged to cloud dashboard
- ⚡ **Fast Execution** - Direct tool access without network overhead

## Installation

```bash
pip install requests
```

## Usage

Basic usage:

```bash
python agent.py "Your task here"
```

Examples:

```bash
# Infrastructure
python agent.py "List all Docker containers"
python agent.py "List all Kubernetes pods"

# File operations
python agent.py "List files in the current directory"
python agent.py "Read the contents of README.md"

# Shell commands
python agent.py "Run kubectl get services"
python agent.py "Check git status"
```

## Configuration

The agent is configured via class initialization in `agent.py`:

```python
agent = AgentWorker(
    agent_id="cli-agent",
    model="lfm2-1.2b"  # LM Studio model name
)
```

### Environment

- **LM Studio URL**: `http://127.0.0.1:1234/v1/chat/completions`
- **Dashboard URL**: `https://agent.scarmonit.com/api/history`
- **Model**: `lfm2-1.2b` (or any model loaded in LM Studio)

## Available Tools

### Infrastructure Management

| Tool | Description | Example Args |
|------|-------------|--------------|
| `docker_ps` | List Docker containers | `{}` |
| `docker_logs` | Get container logs | `{"container": "name", "tail": 100}` |
| `get_pods` | List Kubernetes pods | `{"namespace": "default"}` |
| `kubectl_logs` | Get pod logs | `{"pod": "name", "namespace": "default", "tail": 100}` |

### File System

| Tool | Description | Example Args |
|------|-------------|--------------|
| `list_files` | List directory contents | `{"path": "/app"}` |
| `read_file` | Read file contents | `{"path": "README.md"}` |
| `write_file` | Write to file | `{"path": "output.txt", "content": "data"}` |

### Version Control

| Tool | Description | Example Args |
|------|-------------|--------------|
| `git_status` | Git repository status | `{"repo": "/path/to/repo"}` |
| `git_log` | Git commit history | `{"repo": "/path/to/repo"}` |
| `git_diff` | Git changes diff | `{"repo": "/path/to/repo"}` |

### General Purpose

| Tool | Description | Example Args |
|------|-------------|--------------|
| `run_command` | Execute shell command | `{"command": "echo hello"}` |
| `fetch_url` | HTTP GET request | `{"url": "https://api.example.com"}` |
| `web_search` | Search the web | `{"query": "kubernetes version"}` |

## How It Works

The agent uses a **ReAct (Reasoning + Acting) loop**:

1. **Receive task** from user
2. **Query LLM** with task and tool descriptions
3. **Parse response** for tool calls or final answer
4. **Execute tool** if needed and get result
5. **Send result back** to LLM for continued reasoning
6. **Repeat** until final answer or max iterations reached
7. **Log task** to dashboard

Example flow:

```
User: "List all Docker containers"
  ↓
LLM: "TOOL: docker_ps\nARGS: {}"
  ↓
Agent: Execute docker_ps()
  ↓
Result: "my_service.1, k8s_POD_my-app..."
  ↓
LLM: "ANSWER: Container list: my_service.1, ..."
  ↓
Agent: Return answer to user + log to dashboard
```

## Files

- **`agent.py`** - Main agent worker with ReAct loop
- **`mcp_client.py`** - MCP tool interface and implementations
- **`agent_fixed.py`** - Backup version (deprecated)

## Output Example

```bash
$ python agent.py "List all Docker containers"

[cli-agent] Starting task: List all Docker containers
[cli-agent] Iteration 1/10
[cli-agent] LLM: TOOL: docker_ps
ARGS: {}...
[cli-agent] Tool result: NAMES                    STATUS
my_service.1                 Running
k8s_POD_my-app              Running
...
[cli-agent] Iteration 2/10
[cli-agent] LLM: ANSWER: Container list: my_service.1, ...
[DEBUG] Dashboard log response: 200 - {"success":true,"id":"task:..."}

==================================================
RESULT: {
  "status": "complete",
  "agent_id": "cli-agent",
  "answer": "Container list: my_service.1, k8s_POD_my-app...",
  "iterations": 2
}
```

## Troubleshooting

### Agent hangs or times out

**Problem:** Agent not receiving LLM responses

**Solution:**
1. Check LM Studio is running: `Get-Process "LM Studio"`
2. Verify model loaded: `curl http://localhost:1234/v1/models`
3. Check cloudflared tunnel: `Get-Service cloudflared`

### "Unknown tool" errors

**Problem:** Tool name not recognized

**Solution:**
- Check tool name spelling matches available tools
- Tool names are case-insensitive
- System will automatically clean `tool_name(args)` to `tool_name`

### Dashboard logging fails

**Problem:** Tasks not appearing in dashboard

**Solution:**
- Check dashboard API: `curl https://agent.scarmonit.com/health`
- Verify auth token in `agent.py`
- Check debug output: `[DEBUG] Dashboard log response: ...`

## Configuration Options

### Change LLM Model

```python
# In agent.py __init__
self.model = "your-model-name"  # Must match LM Studio loaded model
```

### Adjust Max Iterations

```python
# In agent.py __init__
self.max_iterations = 10  # Increase for more complex tasks
```

### Change Dashboard URL

```python
# In agent.py __init__
self.dashboard_url = "https://your-dashboard.com/api/history"
```

## Advanced Usage

### Custom System Prompt

Modify `self.tool_descriptions` in `agent.py` to customize the agent's behavior.

### Add New Tools

1. Add tool description to `self.tool_descriptions`
2. Add tool execution case in `execute_tool()`
3. Implement tool in `MCPClient` class

## Performance

| Metric | Value |
|--------|-------|
| Average task time | 5-10s |
| LLM response time | < 2s |
| Tool execution time | < 1s |
| Dashboard logging | < 500ms |

## Dependencies

- **Python 3.13+**
- **requests** - HTTP library
- **LM Studio** - Local LLM (running on port 1234)
- **Docker** (optional) - For docker_* tools
- **kubectl** (optional) - For kubernetes tools

## Related Components

- **[Agent API](../agent-api/README.md)** - Cloudflare Worker dashboard
- **[Web Portal](../web-portal/README.md)** - Public landing page
- **[Docs](../docs/README.md)** - Full documentation

---

Last Updated: November 28, 2025
