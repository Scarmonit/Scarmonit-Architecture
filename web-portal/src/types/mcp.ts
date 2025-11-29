/**
 * MCP (Model Context Protocol) Type Definitions
 *
 * Defines the contract between the web-portal and MCP servers.
 * Supports multiple server backends with unified response format.
 */

export type MCPServerName =
  | 'scarmonit-architecture'
  | 'llm-framework-devops'
  | 'llm-framework-project'
  | 'llm-framework-filesystem'

export type ToolStatus = 'success' | 'error' | 'loading' | 'idle'

export interface MCPToolResult<T = unknown> {
  status: ToolStatus
  data?: T
  error?: string
  executionTime?: number
  timestamp: number
  server: MCPServerName
  tool: string
}

export interface MCPServerConfig {
  name: MCPServerName
  endpoint: string
  transport: 'http' | 'ws' | 'stdio'
  autoApprove: boolean
}

// Tool catalog for scarmonit-architecture server
export interface ScarmonitTools {
  check_datalore_status: {
    input: Record<string, never>
    output: {
      connected: boolean
      licenseId?: string
      status: string
      features: string[]
    }
  }
  check_system_status: {
    input: Record<string, never>
    output: {
      operational: boolean
      services: Array<{
        name: string
        url?: string
        status: 'online' | 'offline'
      }>
      infrastructure: Record<string, string>
    }
  }
}

// Tool catalog for llm-framework-devops server
export interface DevOpsTools {
  docker_ps: {
    input: { all?: boolean }
    output: {
      containers: Array<{
        id: string
        name: string
        image: string
        status: string
        ports: string[]
      }>
    }
  }
  docker_inspect: {
    input: { containerId: string }
    output: Record<string, unknown>
  }
  k8s_get_pods: {
    input: { namespace?: string }
    output: {
      pods: Array<{
        name: string
        namespace: string
        status: string
        restarts: number
      }>
    }
  }
  k8s_get_deployments: {
    input: { namespace?: string }
    output: {
      deployments: Array<{
        name: string
        namespace: string
        replicas: number
        ready: number
      }>
    }
  }
}

// Union type for all available tools
export type AvailableTools = keyof ScarmonitTools | keyof DevOpsTools

// Generic tool call interface
export interface ToolCallRequest<T extends AvailableTools> {
  tool: T
  args?: T extends keyof ScarmonitTools
    ? ScarmonitTools[T]['input']
    : T extends keyof DevOpsTools
    ? DevOpsTools[T]['input']
    : never
  server?: MCPServerName // Optional: auto-routed if omitted
}

// Tool routing map
export const TOOL_SERVER_MAP: Record<string, MCPServerName> = {
  // Scarmonit tools
  check_datalore_status: 'scarmonit-architecture',
  check_system_status: 'scarmonit-architecture',

  // DevOps tools
  docker_ps: 'llm-framework-devops',
  docker_inspect: 'llm-framework-devops',
  k8s_get_pods: 'llm-framework-devops',
  k8s_get_deployments: 'llm-framework-devops',
}
