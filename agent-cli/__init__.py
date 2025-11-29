"""
Multi-Agent AI CLI Package
Autonomous agents with MCP tool access
"""
from .agent import AgentWorker
from .orchestrator import MultiAgentOrchestrator
from .mcp_client import MCPClient

__version__ = "0.1.0"
__all__ = ["AgentWorker", "MultiAgentOrchestrator", "MCPClient"]
