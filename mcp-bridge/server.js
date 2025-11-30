#!/usr/bin/env node

import { spawn } from 'child_process'
import express from 'express'
import cors from 'cors'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

/**
 * MCP Bridge Server
 *
 * Bridges HTTP requests to stdio MCP servers.
 * Runs locally to enable web-portal → MCP server communication.
 */

const app = express()
const PORT = 3001

// MCP server configurations
const MCP_SERVERS = {
  'scarmonit-architecture': {
    command: 'node',
    args: [process.env.MCP_SERVER_PATH || '../mcp-server/build/index.js'],
    env: { LOG_LEVEL: 'INFO' }
  },
  'llm-framework-devops': {
    command: 'node',
    args: [process.env.DEVOPS_MCP_PATH || '../llm-framework-devops/src/servers/devops-mcp-server.js'], // Placeholder fallback
    env: { LOG_LEVEL: 'INFO' }
  }
}

// Active MCP client connections
const clients = new Map()

// Middleware
app.use(cors({
  origin: ['http://localhost:5174', 'http://localhost:4173', 'https://scarmonit-www.pages.dev'],
  credentials: true
}))
app.use(express.json())

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

/**
 * Initialize MCP client connection to a server
 */
async function connectMCPServer(serverName) {
  if (clients.has(serverName)) {
    return clients.get(serverName)
  }

  const config = MCP_SERVERS[serverName]
  if (!config) {
    throw new Error(`Unknown MCP server: ${serverName}`)
  }

  console.log(`🔌 Connecting to MCP server: ${serverName}`)

  try {
    const client = new Client({
      name: 'mcp-bridge',
      version: '1.0.0'
    }, {
      capabilities: {}
    })

    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args,
      env: { ...process.env, ...config.env }
    })

    await client.connect(transport)
    console.log(`✅ Connected to ${serverName}`)

    clients.set(serverName, client)
    return client
  } catch (error) {
    console.error(`❌ Failed to connect to ${serverName}:`, error.message)
    throw error
  }
}

/**
 * Route tool to appropriate MCP server
 */
function getServerForTool(toolName) {
  if (toolName.startsWith('check_') || toolName.includes('datalore')) {
    return 'scarmonit-architecture'
  }
  if (toolName.startsWith('docker_') || toolName.startsWith('k8s_')) {
    return 'llm-framework-devops'
  }
  return 'scarmonit-architecture' // default
}

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  const health = {
    status: 'online',
    timestamp: new Date().toISOString(),
    servers: {}
  }

  for (const [name, client] of clients.entries()) {
    health.servers[name] = 'connected'
  }

  res.json(health)
})

/**
 * Server-specific health check
 */
app.get('/api/health/:server', async (req, res) => {
  const { server } = req.params

  try {
    const client = await connectMCPServer(server)
    res.json({
      server,
      status: 'connected',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(503).json({
      server,
      status: 'disconnected',
      error: error.message
    })
  }
})

/**
 * List available tools from a server
 */
app.get('/api/tools/:server', async (req, res) => {
  const { server } = req.params

  try {
    const client = await connectMCPServer(server)
    const tools = await client.listTools()

    res.json({
      server,
      tools: tools.tools.map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema
      }))
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to list tools',
      message: error.message
    })
  }
})

/**
 * Call a tool (auto-route to correct server)
 */
app.post('/api/tools/:tool', async (req, res) => {
  const { tool } = req.params
  const args = req.body

  const startTime = Date.now()

  try {
    // Determine which server handles this tool
    const serverName = getServerForTool(tool)
    console.log(`🔧 Routing ${tool} → ${serverName}`)

    // Connect to server if needed
    const client = await connectMCPServer(serverName)

    // Call the tool
    const result = await client.callTool({
      name: tool,
      arguments: args
    })

    const duration = Date.now() - startTime

    res.json({
      status: 'success',
      data: result.content,
      server: serverName,
      executionTime: duration,
      timestamp: Date.now()
    })
  } catch (error) {
    const duration = Date.now() - startTime

    console.error(`❌ Tool call failed: ${tool}`, error.message)

    res.status(500).json({
      status: 'error',
      error: error.message,
      tool,
      executionTime: duration,
      timestamp: Date.now()
    })
  }
})

/**
 * Call tool on specific server (bypass auto-routing)
 */
app.post('/api/tools/:server/:tool', async (req, res) => {
  const { server, tool } = req.params
  const args = req.body

  const startTime = Date.now()

  try {
    const client = await connectMCPServer(server)

    const result = await client.callTool({
      name: tool,
      arguments: args
    })

    const duration = Date.now() - startTime

    res.json({
      status: 'success',
      data: result.content,
      server,
      executionTime: duration,
      timestamp: Date.now()
    })
  } catch (error) {
    const duration = Date.now() - startTime

    res.status(500).json({
      status: 'error',
      error: error.message,
      tool,
      server,
      executionTime: duration,
      timestamp: Date.now()
    })
  }
})

/**
 * Graceful shutdown
 */
process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down MCP bridge...')

  for (const [name, client] of clients.entries()) {
    try {
      await client.close()
      console.log(`✅ Disconnected from ${name}`)
    } catch (error) {
      console.error(`❌ Error disconnecting ${name}:`, error.message)
    }
  }

  process.exit(0)
})

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║           🌉 MCP Bridge Server Running                    ║
║                                                           ║
║  HTTP API:    http://localhost:${PORT}                      ║
║  Health:      GET  /api/health                            ║
║  Tools:       POST /api/tools/:tool                       ║
║  Direct:      POST /api/tools/:server/:tool               ║
║                                                           ║
║  Configured Servers:                                      ║
║  • scarmonit-architecture                                 ║
║  • llm-framework-devops                                   ║
╚═══════════════════════════════════════════════════════════╝
  `)

  // Pre-connect to servers for faster first request
  console.log('🔄 Pre-connecting to MCP servers...')
  Promise.all(
    Object.keys(MCP_SERVERS).map(name =>
      connectMCPServer(name).catch(err =>
        console.error(`⚠️  Failed to pre-connect ${name}:`, err.message)
      )
    )
  ).then(() => {
    console.log('✅ All servers connected\n')
  })
})
