"""
Tool Schemas and Registry - Defines available tools for agents
"""
from dataclasses import dataclass
from typing import Callable, Any, Optional


@dataclass
class ToolDefinition:
    name: str
    description: str
    parameters: dict[str, str]  # param_name -> description
    examples: list[str] = None


# Complete tool registry with descriptions for agent prompts
TOOL_REGISTRY = {
    # Filesystem tools
    "list_files": ToolDefinition(
        name="list_files",
        description="List files and directories in a given path",
        parameters={"path": "Directory path to list contents of"},
        examples=["list_files(path='C:/Users')"]
    ),
    "read_file": ToolDefinition(
        name="read_file",
        description="Read the contents of a file",
        parameters={"path": "Full path to the file to read"},
        examples=["read_file(path='C:/Users/scarm/test.txt')"]
    ),
    "write_file": ToolDefinition(
        name="write_file",
        description="Write content to a file",
        parameters={
            "path": "Full path to the file to write",
            "content": "Content to write to the file"
        },
        examples=["write_file(path='/tmp/test.txt', content='Hello World')"]
    ),

    # Git tools
    "git_status": ToolDefinition(
        name="git_status",
        description="Get the git status of a repository",
        parameters={"repo": "Path to the git repository"},
        examples=["git_status(repo='C:/Users/scarm/projects/myrepo')"]
    ),
    "git_log": ToolDefinition(
        name="git_log",
        description="Get recent git commit history",
        parameters={
            "repo": "Path to the git repository",
            "max_count": "Maximum number of commits to return (default: 5)"
        },
        examples=["git_log(repo='/home/user/project', max_count=10)"]
    ),
    "git_diff": ToolDefinition(
        name="git_diff",
        description="Show git diff for uncommitted changes",
        parameters={"repo": "Path to the git repository"},
        examples=["git_diff(repo='./myproject')"]
    ),

    # Kubernetes tools
    "get_pods": ToolDefinition(
        name="get_pods",
        description="List Kubernetes pods in a namespace",
        parameters={"namespace": "Kubernetes namespace (default: 'default')"},
        examples=["get_pods(namespace='kube-system')"]
    ),
    "get_deployments": ToolDefinition(
        name="get_deployments",
        description="List Kubernetes deployments in a namespace",
        parameters={"namespace": "Kubernetes namespace (default: 'default')"},
        examples=["get_deployments(namespace='production')"]
    ),
    "describe_pod": ToolDefinition(
        name="describe_pod",
        description="Get detailed information about a specific pod",
        parameters={
            "name": "Name of the pod",
            "namespace": "Kubernetes namespace (default: 'default')"
        },
        examples=["describe_pod(name='nginx-abc123', namespace='default')"]
    ),

    # Docker tools
    "docker_ps": ToolDefinition(
        name="docker_ps",
        description="List running Docker containers",
        parameters={"all": "Show all containers, not just running (default: False)"},
        examples=["docker_ps()", "docker_ps(all=True)"]
    ),
    "docker_logs": ToolDefinition(
        name="docker_logs",
        description="Get logs from a Docker container",
        parameters={
            "container": "Container name or ID",
            "tail": "Number of lines to show (default: 100)"
        },
        examples=["docker_logs(container='nginx', tail=50)"]
    ),

    # Network/HTTP tools
    "fetch_url": ToolDefinition(
        name="fetch_url",
        description="Fetch content from a URL",
        parameters={"url": "The URL to fetch"},
        examples=["fetch_url(url='https://api.github.com/users/octocat')"]
    ),

    # Shell tools
    "run_command": ToolDefinition(
        name="run_command",
        description="Run a shell command and return output. Use carefully.",
        parameters={"command": "Shell command to execute"},
        examples=["run_command(command='whoami')", "run_command(command='dir')"]
    ),

    # Search tools
    "search_files": ToolDefinition(
        name="search_files",
        description="Search for files matching a pattern",
        parameters={
            "path": "Directory to search in",
            "pattern": "Glob pattern to match (e.g., '*.py')"
        },
        examples=["search_files(path='C:/projects', pattern='*.py')"]
    ),
    "grep": ToolDefinition(
        name="grep",
        description="Search for text pattern in files",
        parameters={
            "pattern": "Text or regex pattern to search for",
            "path": "File or directory to search in"
        },
        examples=["grep(pattern='TODO', path='./src')"]
    ),
}


def get_tools_for_prompt() -> str:
    """Generate tool descriptions for agent system prompts"""
    lines = []
    for name, tool in TOOL_REGISTRY.items():
        params = ", ".join([f"{k}: {v}" for k, v in tool.parameters.items()])
        lines.append(f"- {name}: {tool.description}")
        lines.append(f"  Parameters: {params}")
    return "\n".join(lines)


def get_tool_names() -> list[str]:
    """Get list of all available tool names"""
    return list(TOOL_REGISTRY.keys())


def get_tool_schema(tool_name: str) -> Optional[ToolDefinition]:
    """Get schema for a specific tool"""
    return TOOL_REGISTRY.get(tool_name)


if __name__ == "__main__":
    print("Available Tools:")
    print("=" * 50)
    print(get_tools_for_prompt())
