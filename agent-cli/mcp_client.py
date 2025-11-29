"""
MCP Client - Tool execution layer for AI agents
Uses direct shell commands for reliability on Windows
"""
import subprocess
import json
import os
from typing import Any, Optional

try:
    from kubernetes import client, config
    K8S_AVAILABLE = True
except ImportError:
    K8S_AVAILABLE = False

try:
    from ddgs import DDGS
    DDG_AVAILABLE = True
except ImportError:
    DDG_AVAILABLE = False


class MCPClient:
    """Client for executing tools - uses shell commands directly for reliability"""

    def __init__(self):
        self.platform = os.name  # 'nt' for Windows, 'posix' for Linux
        self.available_tools = [
            "list_files", "read_file", "write_file",
            "git_status", "git_log", "git_diff",
            "get_pods", "docker_ps", "docker_logs",
            "run_command", "fetch_url", "kubectl_logs",
            "web_search"
        ]
        
        self.v1_api = None
        if K8S_AVAILABLE:
            try:
                config.load_kube_config()
                self.v1_api = client.CoreV1Api()
            except Exception as e:
                print(f"Warning: Failed to load kubeconfig: {e}")

    def _run_cmd(self, cmd: str, timeout: int = 30) -> dict:
        """Execute a shell command and return results"""
        try:
            result = subprocess.run(
                cmd,
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            # On MSYS/Windows, returncode can be weird even with success
            # Check for output as success indicator
            has_output = bool(result.stdout.strip())
            has_error = bool(result.stderr.strip()) and not has_output
            success = has_output or (result.returncode == 0 and not has_error)
            
            return {
                "success": success,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "returncode": result.returncode
            }
        except subprocess.TimeoutExpired:
            return {"success": False, "error": f"Timeout after {timeout}s", "stdout": "", "stderr": ""}
        except Exception as e:
            return {"success": False, "error": str(e), "stdout": "", "stderr": ""}

    # ============ Filesystem Tools ============ 

    def list_files(self, path: str) -> dict:
        """List files in a directory"""
        if self.platform == "nt":
            cmd = f'dir /b "{path}"'
        else:
            cmd = f'ls -la "{path}"'
        return self._run_cmd(cmd)

    def read_file(self, path: str) -> dict:
        """Read contents of a file"""
        if self.platform == "nt":
            cmd = f'type "{path}"'
        else:
            cmd = f'cat "{path}"'
        return self._run_cmd(cmd)

    def write_file(self, path: str, content: str) -> dict:
        """Write content to a file"""
        try:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            return {"success": True, "stdout": f"Written to {path}", "stderr": ""}
        except Exception as e:
            return {"success": False, "error": str(e), "stdout": "", "stderr": str(e)}

    def search_files(self, path: str, pattern: str) -> dict:
        """Search for files matching a pattern"""
        if self.platform == "nt":
            cmd = rf'dir /s /b "{path}\{pattern}"'
        else:
            cmd = f'find "{path}" -name "{pattern}"'
        return self._run_cmd(cmd, timeout=60)

    # ============ Git Tools ============ 

    def git_status(self, repo: str) -> dict:
        """Get git status of a repository"""
        cmd = f'git -C "{repo}" status'
        return self._run_cmd(cmd)

    def git_log(self, repo: str, max_count: int = 5) -> dict:
        """Get recent git commits"""
        cmd = f'git -C "{repo}" log --oneline -n {max_count}'
        return self._run_cmd(cmd)

    def git_diff(self, repo: str) -> dict:
        """Show git diff"""
        cmd = f'git -C "{repo}" diff --stat'
        return self._run_cmd(cmd)

    # ============ Kubernetes Tools ============ 

    def get_pods(self, namespace: str = "default") -> dict:
        """List Kubernetes pods"""
        if self.v1_api:
            try:
                pods = self.v1_api.list_namespaced_pod(namespace)
                output = "NAME\tREADY\tSTATUS\tRESTARTS\tAGE\n"
                for pod in pods.items:
                    ready = f"{sum(1 for c in pod.status.container_statuses if c.ready)}/{len(pod.spec.containers)}" if pod.status.container_statuses else "0/0"
                    restarts = sum(c.restart_count for c in pod.status.container_statuses) if pod.status.container_statuses else 0
                    # Simplified age calculation
                    age = "N/A" 
                    output += f"{pod.metadata.name}\t{ready}\t{pod.status.phase}\t{restarts}\t{age}\n"
                return {"success": True, "stdout": output, "stderr": ""}
            except Exception as e:
                return {"success": False, "error": str(e), "stdout": "", "stderr": str(e)}
        else:
            cmd = f'kubectl get pods -n {namespace} -o wide'
            return self._run_cmd(cmd)

    def describe_pod(self, name: str, namespace: str = "default") -> dict:
        """Describe a specific pod"""
        cmd = f'kubectl describe pod {name} -n {namespace}'
        return self._run_cmd(cmd, timeout=60)

    def kubectl_logs(self, pod: str, namespace: str = "default", tail: int = 100) -> dict:
        """Get logs from a Kubernetes pod"""
        if self.v1_api:
            try:
                logs = self.v1_api.read_namespaced_pod_log(name=pod, namespace=namespace, tail_lines=tail)
                return {"success": True, "stdout": logs, "stderr": ""}
            except Exception as e:
                return {"success": False, "error": str(e), "stdout": "", "stderr": str(e)}
        else:
            cmd = f'kubectl logs {pod} -n {namespace} --tail {tail}'
            return self._run_cmd(cmd, timeout=60)

    # ============ Docker Tools ============ 

    def docker_ps(self, all_containers: bool = False) -> dict:
        """List Docker containers"""
        flag = "-a" if all_containers else ""
        cmd = f'docker ps {flag} --format "table {{{{.Names}}}}\t{{{{.Status}}}}\t{{{{.Image}}}} "'
        return self._run_cmd(cmd)

    def docker_logs(self, container: str, tail: int = 100) -> dict:
        """Get Docker container logs"""
        cmd = f'docker logs --tail {tail} {container}'
        return self._run_cmd(cmd)

    def docker_inspect(self, container: str) -> dict:
        """Inspect a Docker container"""
        cmd = f'docker inspect {container}'
        return self._run_cmd(cmd)

    # ============ Network Tools ============ 

    def fetch_url(self, url: str) -> dict:
        """Fetch content from a URL"""
        cmd = f'curl -s "{url}"'
        return self._run_cmd(cmd, timeout=30)

    def web_search(self, query: str, max_results: int = 5) -> dict:
        """Search the web using DuckDuckGo"""
        if not DDG_AVAILABLE:
            return {"success": False, "error": "duckduckgo-search library not installed", "stdout": "", "stderr": ""}
        
        try:
            results = DDGS().text(query, max_results=max_results)
            # Format results as JSON string for the agent
            return {"success": True, "stdout": json.dumps(results, indent=2), "stderr": ""}
        except Exception as e:
            return {"success": False, "error": str(e), "stdout": "", "stderr": str(e)}

    # ============ Generic Command ============ 

    def run_command(self, command: str) -> dict:
        """Run an arbitrary shell command"""
        return self._run_cmd(command, timeout=30)


if __name__ == "__main__":
    print("=" * 60)
    print("MCP Client Test")
    print("=" * 60)

    client = MCPClient()
    print(f"Platform: {client.platform}")
    print(f"K8s Native Support: {K8S_AVAILABLE and client.v1_api is not None}")
    print(f"Available tools: {client.available_tools}")

    print("\n--- Test: list_files ---")
    result = client.list_files("C:/Users/scarm")
    print(f"Success: {result['success']}")
    if result['stdout']:
        lines = result['stdout'].strip().split('\n')[:5]
        print("First 5 items:")
        for line in lines:
            print(f"  {line}")

    print("\n--- Test: docker_ps ---")
    result = client.docker_ps()
    print(f"Success: {result['success']}")
    if result['stdout']:
        print(result['stdout'][:300])

    print("\n--- Test: get_pods ---")
    result = client.get_pods()
    print(f"Success: {result['success']}")
    if result['stdout']:
        print(result['stdout'][:300])

    print("\n--- Test: run_command ---")
    result = client.run_command("echo Hello from MCP Client!")
    print(f"Success: {result['success']}")
    print(f"Output: {result['stdout'].strip()}")