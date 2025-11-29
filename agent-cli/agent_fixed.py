"""Agent Worker - Autonomous agent with MCP tool access and ReAct reasoning
FIXED VERSION: Better prompt and fallback handling for local LLMs
"""
import json
import re
import requests
from typing import Optional
from mcp_client import MCPClient


class AgentWorker:
    """Single agent that can reason and use MCP tools"""
    
    def __init__(self, agent_id: str, model: str = "ai/llama3.2"):
        self.agent_id = agent_id
        self.model = model
        self.model_url = "http://127.0.0.1:12434/engines/llama.cpp/v1/chat/completions"
        self.mcp = MCPClient()
        self.history = []
        self.max_iterations = 10
        
        # IMPROVED: More explicit tool format for local LLMs
        self.tool_descriptions = """
## CRITICAL: Tool Call Format
You MUST use this EXACT format when calling tools:

TOOL: tool_name
ARGS: {"key": "value"}

DO NOT write raw commands like "docker ps" or "ls -la".
Use the tool names below instead.

## Available Tools:
- list_files: List directory contents
  Example: TOOL: list_files
           ARGS: {"path": "C:/Users"}

- read_file: Read a file's content
  Example: TOOL: read_file
           ARGS: {"path": "C:/test.txt"}

- docker_ps: List Docker containers (no args needed)
  Example: TOOL: docker_ps
           ARGS: {}

- docker_logs: Get container logs
  Example: TOOL: docker_logs
           ARGS: {"container": "nginx", "tail": 50}

- git_status: Check git repository status
  Example: TOOL: git_status
           ARGS: {"repo": "C:/project"}

- git_log: Recent commits
  Example: TOOL: git_log
           ARGS: {"repo": "C:/project"}

- run_command: Execute any shell command
  Example: TOOL: run_command
           ARGS: {"command": "whoami"}

- fetch_url: HTTP GET request
  Example: TOOL: fetch_url
           ARGS: {"url": "https://example.com"}

## Response Format:
1. Think about what to do
2. Call ONE tool using the format above
3. Wait for result
4. When done, respond with: ANSWER: <your final answer>

REMEMBER: Use TOOL: and ARGS: format, not raw commands!
"""
    
    def query_llm(self, messages: list) -> str:
        """Send messages to local LLM and get response"""
        try:
            response = requests.post(
                self.model_url,
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": 0.3,  # Lower for more consistent formatting
                    "max_tokens": 800
                },
                timeout=60
            )
            if response.status_code == 200:
                return response.json()["choices"][0]["message"]["content"]
            return f"Error: {response.status_code} - {response.text}"
        except Exception as e:
            return f"Error querying LLM: {e}"
    
    def parse_response(self, response: str) -> dict:
        """Parse agent response for tool calls or final answer - with fallback handling"""
        response = response.strip()
        
        # Check for final answer
        if "ANSWER:" in response:
            answer = response.split("ANSWER:", 1)[1].strip()
            return {"type": "answer", "content": answer}
        
        # Check for properly formatted tool call
        if "TOOL:" in response:
            try:
                tool_line = response.split("TOOL:", 1)[1].split("\n")[0].strip()
                args_part = response.split("ARGS:", 1)[1].strip() if "ARGS:" in response else "{}"
                try:
                    args = json.loads(args_part.split("\n")[0])
                except:
                    args = {}
                return {"type": "tool", "tool": tool_line, "args": args}
            except Exception as e:
                return {"type": "error", "content": f"Failed to parse tool call: {e}"}
        
        # FALLBACK: Detect raw shell commands and convert them
        raw_command_patterns = [
            (r'docker\s+ps', 'docker_ps', {}),
            (r'docker\s+logs\s+(\w+)', 'docker_logs', lambda m: {"container": m.group(1)}),
            (r'docker\s+info', 'run_command', {"command": "docker info"}),
            (r'systemctl\s+status\s+(\w+)', 'run_command', lambda m: {"command": f"sc query {m.group(1)}"}),  # Windows equivalent
            (r'kubectl\s+get\s+pods', 'get_pods', {}),
            (r'git\s+status', 'git_status', {"repo": "."}),
            (r'git\s+log', 'git_log', {"repo": "."}),
            (r'ls\s+-?\w*\s*(.+)?', 'list_files', lambda m: {"path": m.group(1) or "."}),
            (r'dir\s+(.+)?', 'list_files', lambda m: {"path": m.group(1) or "."}),
            (r'cat\s+(.+)', 'read_file', lambda m: {"path": m.group(1)}),
            (r'curl\s+(.+)', 'fetch_url', lambda m: {"url": m.group(1)}),
            (r'nmap\s+', 'run_command', {"command": "echo nmap not available"}),
        ]
        
        response_lower = response.lower()
        for pattern, tool_name, args_func in raw_command_patterns:
            match = re.search(pattern, response_lower)
            if match:
                args = args_func(match) if callable(args_func) else args_func
                print(f"  [Fallback] Converted raw command to: {tool_name}")
                return {"type": "tool", "tool": tool_name, "args": args}
        
        # If no tool pattern found, treat as a thought
        return {"type": "thought", "content": response}
    
    def execute_tool(self, tool_name: str, args: dict) -> str:
        """Execute an MCP tool and return result"""
        tool_name = tool_name.lower().strip()
        
        try:
            if tool_name == "list_files":
                result = self.mcp.list_files(args.get("path", "."))
            elif tool_name == "read_file":
                result = self.mcp.read_file(args.get("path"))
            elif tool_name == "write_file":
                result = self.mcp.write_file(args.get("path"), args.get("content", ""))
            elif tool_name == "git_status":
                result = self.mcp.git_status(args.get("repo", "."))
            elif tool_name == "git_log":
                result = self.mcp.git_log(args.get("repo", "."))
            elif tool_name == "get_pods":
                result = self.mcp.get_pods(args.get("namespace", "default"))
            elif tool_name == "docker_ps":
                result = self.mcp.docker_ps()
            elif tool_name == "docker_logs":
                result = self.mcp.docker_logs(args.get("container"), args.get("tail", 100))
            elif tool_name == "run_command":
                result = self.mcp.run_command(args.get("command"))
            elif tool_name == "fetch_url":
                result = self.mcp.fetch_url(args.get("url"))
            else:
                return f"Unknown tool: {tool_name}. Available: list_files, read_file, docker_ps, git_status, run_command, fetch_url"
            
            if result["success"]:
                output = result["stdout"][:2000]
                return output if output.strip() else "(empty output)"
            else:
                return f"Tool error: {result.get('stderr', result.get('error', 'Unknown error'))}"
        except Exception as e:
            return f"Exception executing tool: {e}"
    
    def run(self, task: str) -> dict:
        """Run the agent on a task using ReAct loop"""
        print(f"\n[{self.agent_id}] Starting task: {task}")
        
        messages = [
            {
                "role": "system", 
                "content": f"You are a helpful agent. {self.tool_descriptions}\n\nAlways use TOOL: format, never raw commands."
            },
            {"role": "user", "content": task}
        ]
        
        for i in range(self.max_iterations):
            print(f"[{self.agent_id}] Iteration {i+1}/{self.max_iterations}")
            
            response = self.query_llm(messages)
            print(f"[{self.agent_id}] LLM: {response[:200]}...")
            
            parsed = self.parse_response(response)
            self.history.append({"iteration": i+1, "response": response, "parsed": parsed})
            
            if parsed["type"] == "answer":
                return {
                    "status": "complete",
                    "agent_id": self.agent_id,
                    "answer": parsed["content"],
                    "iterations": i + 1
                }
            
            elif parsed["type"] == "tool":
                tool_result = self.execute_tool(parsed["tool"], parsed["args"])
                print(f"[{self.agent_id}] Tool [{parsed['tool']}]: {tool_result[:200]}...")
                
                messages.append({"role": "assistant", "content": response})
                messages.append({
                    "role": "user", 
                    "content": f"Tool result:\n{tool_result}\n\nContinue reasoning or provide ANSWER."
                })
            
            elif parsed["type"] == "error":
                messages.append({"role": "assistant", "content": response})
                messages.append({
                    "role": "user", 
                    "content": f"Error: {parsed['content']}\n\nUse correct format:\nTOOL: tool_name\nARGS: {{}}"
                })
            
            else:
                # Thought - nudge toward action
                messages.append({"role": "assistant", "content": response})
                messages.append({
                    "role": "user", 
                    "content": "Now use a TOOL (format: TOOL: name\\nARGS: {}) or provide ANSWER:"
                })
        
        return {
            "status": "max_iterations",
            "agent_id": self.agent_id,
            "partial_history": self.history[-3:],
            "iterations": self.max_iterations
        }


if __name__ == "__main__":
    agent = AgentWorker("test-agent")
    
    print("=" * 60)
    print("AGENT TEST (Fixed Version)")
    print("=" * 60)
    
    # Test task
    result = agent.run("List files in C:/Users/scarm/ai_cli and check if Docker is running")
    
    print("\n" + "=" * 60)
    print("RESULT:")
    print(json.dumps(result, indent=2))
