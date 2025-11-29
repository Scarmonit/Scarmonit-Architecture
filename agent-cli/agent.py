"""Agent Worker - Autonomous agent with MCP tool access and ReAct reasoning"""
import json
import requests
import argparse
from typing import Optional
from mcp_client import MCPClient

class AgentWorker:
    """Single agent that can reason and use MCP tools"""
    
    def __init__(self, agent_id: str, model: str = "lfm2-1.2b"):
        self.agent_id = agent_id
        self.model = model
        self.model_url = "http://127.0.0.1:1234/v1/chat/completions"
        self.dashboard_url = "https://agent.scarmonit.com/api/history"
        # Use the same token as generated before
        self.auth_token = "8d5e0667caed6312a559d56bfb23db4895977907974ceda28d20fbd3fb9812d5"
        self.mcp = MCPClient()
        self.history = []
        self.max_iterations = 10
        
        # Tool descriptions for the agent
        self.tool_descriptions = """
Available Tools:
1. list_files(path) - List files in a directory
2. read_file(path) - Read contents of a file
3. write_file(path, content) - Write content to a file
4. git_status(repo) - Get git status of a repository
5. git_log(repo) - Get recent git commits
6. get_pods(namespace) - List Kubernetes pods (default: "default")
7. kubectl_logs(pod, namespace, tail) - Get logs from a Kubernetes pod (default namespace: "default", default tail: 100)
8. docker_ps() - List running Docker containers
9. docker_logs(container, tail) - Get logs from a container (default tail: 100)
10. run_command(command) - Run any shell command
11. fetch_url(url) - Fetch content from a URL
12. web_search(query) - Search the web for information

FORMAT INSTRUCTIONS:
To call a tool, you MUST use this exact format. Do not add any other text or markdown code blocks around it.
TOOL: tool_name
ARGS: {"arg_name": "value", "another_arg": "another_value"}

The ARGS MUST be a valid JSON dictionary.

Example 1: Listing files
TOOL: list_files
ARGS: {"path": "/app"}

Example 2: Running a shell command
TOOL: run_command
ARGS: {"command": "ls -la /tmp"}

Example 3: Searching the web
TOOL: web_search
ARGS: {"query": "latest kubernetes version"}

When you have the final answer, respond with:
ANSWER: <your answer>
"""

    def log_to_dashboard(self, task: str, status: str, details: dict):
        """Push logs to the cloud dashboard"""
        try:
            response = requests.post(
                self.dashboard_url,
                json={
                    "agent_id": self.agent_id,
                    "task": task,
                    "status": status,
                    "details": details
                },
                headers={"Authorization": f"Bearer {self.auth_token}"},
                timeout=5
            )
            print(f"[DEBUG] Dashboard log response: {response.status_code} - {response.text[:200]}")
        except Exception as e:
            print(f"Warning: Failed to log to dashboard: {e}")
    
    def query_llm(self, messages: list) -> str:
        """Send messages to local LLM and get response"""
        try:
            response = requests.post(
                self.model_url,
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 1000
                },
                timeout=600
            )
            if response.status_code == 200:
                return response.json()["choices"][0]["message"]["content"]
            return f"Error: {response.status_code} - {response.text}"
        except Exception as e:
            return f"Error querying LLM: {e}"
    
    def parse_response(self, response: str) -> dict:
        """Parse agent response for tool calls or final answer"""
        response = response.strip()
        
        # Prioritize TOOL over ANSWER
        if "TOOL:" in response:
            try:
                tool_line = response.split("TOOL:", 1)[1].split("\n")[0].strip()
                # Clean up tool name - remove parameter descriptions like "list_files(path)"
                if "(" in tool_line:
                    tool_line = tool_line.split("(")[0].strip()
                args_part = response.split("ARGS:", 1)[1].strip() if "ARGS:" in response else "{}"
                # Try to parse JSON args - handle multi-line JSON
                try:
                    # Find complete JSON by matching braces
                    brace_count = 0
                    json_end = 0
                    started = False
                    for idx, ch in enumerate(args_part):
                        if ch == "{":
                            brace_count += 1
                            started = True
                        elif ch == "}":
                            brace_count -= 1
                        if started and brace_count == 0:
                            json_end = idx + 1
                            break
                    
                    if json_end > 0:
                        json_str = args_part[:json_end]
                    else:
                        # Fallback: take first line if no valid JSON structure found
                        json_str = args_part.split("\n")[0]
                    
                    # Clean potential markdown wrapping
                    json_str = json_str.replace("```json", "").replace("```", "").strip()
                        
                    args = json.loads(json_str)
                except:
                    # Fallback if JSON parsing fails
                    args = {"raw": args_part.split("\n")[0]}
                    
                return {"type": "tool", "tool": tool_line, "args": args}
            except Exception as e:
                return {"type": "error", "content": f"Failed to parse tool call: {e}"}

        if "ANSWER:" in response:
            answer = response.split("ANSWER:", 1)[1].strip()
            return {"type": "answer", "content": answer}
        
        # FALLBACK: Catch raw shell commands that LLM outputs without TOOL: format
        raw_patterns = ['docker ps', 'docker logs', 'systemctl', 'kubectl', 'curl ', 'git status', 'nmap ', 'ipconfig']
        for p in raw_patterns:
            if p.lower() in response.lower():
                cmd = response.split(chr(10))[0].strip()
                for prefix in ['let me run ', 'running ', 'execute ']:
                    if cmd.lower().startswith(prefix):
                        cmd = cmd[len(prefix):]
                print(f'[FALLBACK] Routing raw command: {cmd[:50]}')
                return {"type": "tool", "tool": "run_command", "args": {"command": cmd}}

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
                result = self.mcp.git_status(args.get("repo"))
            elif tool_name == "git_log":
                result = self.mcp.git_log(args.get("repo"))
            elif tool_name == "get_pods":
                result = self.mcp.get_pods(args.get("namespace", "default"))
            elif tool_name == "kubectl_logs":
                result = self.mcp.kubectl_logs(args.get("pod"), args.get("namespace", "default"), args.get("tail", 100))
            elif tool_name == "docker_ps":
                result = self.mcp.docker_ps()
            elif tool_name == "docker_logs":
                result = self.mcp.docker_logs(args.get("container"), args.get("tail", 100))
            elif tool_name == "run_command":
                # Handle list args like ["docker", "ps"] by joining them
                if isinstance(args, list):
                    cmd = " ".join(str(x) for x in args)
                elif isinstance(args, dict):
                    cmd = args.get("command")
                else:
                    cmd = str(args)
                result = self.mcp.run_command(cmd)
            elif tool_name == "fetch_url":
                result = self.mcp.fetch_url(args.get("url"))
            elif tool_name == "web_search":
                result = self.mcp.web_search(args.get("query"))
            else:
                return f"Unknown tool: {tool_name}"
            
            if result["success"]:
                return result["stdout"][:1000]  # Truncate to save context
            else:
                return f"Tool error: {result.get('stderr', result.get('error', 'Unknown error'))}"
        except Exception as e:
            return f"Exception executing tool: {e}"
    
    def run(self, task: str) -> dict:
        """Run the agent on a task using ReAct loop"""
        print(f"\n[{self.agent_id}] Starting task: {task}")
        
        messages = [
            {"role": "system", "content": f"You are an autonomous agent with access to tools. {self.tool_descriptions}\n\nIMPORTANT: Use web_search for current events or anything after your knowledge cutoff. After getting useful tool results, provide ANSWER immediately - do not make unnecessary extra searches. Be concise."}, 
            {"role": "user", "content": task}
        ]
        
        for i in range(self.max_iterations):
            print(f"[{self.agent_id}] Iteration {i+1}/{self.max_iterations}")
            
            response = self.query_llm(messages)
            # Force tool use on first turn if model is not using tools correctly
            if i == 0 and "TOOL:" not in response:
                # Detect common task patterns and force correct tool usage
                task_lower = task.lower()
                if "docker" in task_lower and ("list" in task_lower or "container" in task_lower):
                    response = "TOOL: docker_ps\nARGS: {}"
                elif "kubernetes" in task_lower or "pod" in task_lower:
                    response = "TOOL: get_pods\nARGS: {}"
                elif "file" in task_lower and "list" in task_lower:
                    response = "TOOL: list_files\nARGS: {\"path\": \".\"}"
                elif "status" in task_lower or "check" in task_lower:
                    response = "TOOL: get_pods\nARGS: {}"
            
            print(f"[{self.agent_id}] LLM: {response[:200]}...")
            
            parsed = self.parse_response(response)
            self.history.append({"iteration": i+1, "response": response, "parsed": parsed})
            
            if parsed["type"] == "answer":
                result = {
                    "status": "complete",
                    "agent_id": self.agent_id,
                    "answer": parsed["content"],
                    "iterations": i + 1
                }
                self.log_to_dashboard(task, "complete", result)
                return result
            
            elif parsed["type"] == "tool":
                tool_result = self.execute_tool(parsed["tool"], parsed["args"])
                print(f"[{self.agent_id}] Tool result: {tool_result[:200]}...")
                
                messages.append({"role": "assistant", "content": response})
                messages.append({"role": "user", "content": f"Tool result:\n{tool_result}\n\nContinue reasoning or provide ANSWER."})
            
            else:
                # Just a thought, continue
                messages.append({"role": "assistant", "content": response})
                messages.append({"role": "user", "content": "Continue. Use a TOOL or provide ANSWER."})
        
        result = {
            "status": "max_iterations",
            "agent_id": self.agent_id,
            "partial_history": self.history[-3:],
            "iterations": self.max_iterations
        }
        self.log_to_dashboard(task, "timeout", result)
        return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AI Agent CLI")
    parser.add_argument("--model", type=str, default="lfm2-1.2b", help="Model to use")
    parser.add_argument("task", nargs="?", default="Check docker container status", help="Task to execute")
    args = parser.parse_args()

    agent = AgentWorker("cli-agent", model=args.model)
    result = agent.run(args.task)
    print("\n" + "=" * 50)
    print("RESULT:", json.dumps(result, indent=2))
