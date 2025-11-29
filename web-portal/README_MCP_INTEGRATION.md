# 🔌 MCP Integration Architecture

> **Multi-Server Router Implementation for Scarmonit Web Portal**

## 📋 Overview

The web portal now integrates with multiple MCP (Model Context Protocol) servers via a unified routing layer. This enables real-time infrastructure monitoring with Docker, Kubernetes, and custom Scarmonit tools.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Web Portal (React)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              App.tsx (UI Layer)                      │  │
│  │  • Health cards  • Deployment controls  • Logs       │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         useMCPHealth() Hook                          │  │
│  │  • Auto-refresh  • Error handling  • State mgmt      │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          MCPRouter (Service Layer)                   │  │
│  │  getSystemHealth() → check_system_status             │  │
│  │  getDataloreStatus() → check_datalore_status         │  │
│  │  getDockerStatus() → docker_ps                       │  │
│  │  getKubernetesStatus() → k8s_get_pods/deployments    │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         MCPClient (Transport Layer)                  │  │
│  │  • HTTP/WS client  • Retry logic  • Cache (30s)      │  │
│  │  • Tool routing  • Health checks                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│            Agent API (Cloudflare Worker)                    │
│         https://agent-api.scarmonit.workers.dev             │
│  • MCP proxy  • CORS handling  • Request routing           │
└─────────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         ▼                                    ▼
┌──────────────────────┐          ┌──────────────────────┐
│ scarmonit-architecture│          │ llm-framework-devops │
│   MCP Server (stdio)  │          │   MCP Server (stdio) │
│ ┌──────────────────┐ │          │ ┌──────────────────┐ │
│ │ check_system_    │ │          │ │ docker_ps        │ │
│ │  status          │ │          │ │ docker_inspect   │ │
│ │ check_datalore_  │ │          │ │ k8s_get_pods     │ │
│ │  status          │ │          │ │ k8s_get_deployments│ │
│ └──────────────────┘ │          │ └──────────────────┘ │
└──────────────────────┘          └──────────────────────┘
```

## 📁 File Structure

```
web-portal/src/
├── types/
│   └── mcp.ts                    # Type definitions for MCP tools
├── clients/
│   └── mcpClient.ts              # HTTP transport layer
├── services/
│   ├── mcpRouter.ts              # High-level API wrapper
│   ├── telemetry.ts              # Error/performance tracking
│   └── mcpRouter.test.ts         # Test harness
├── hooks/
│   └── useMCPHealth.ts           # React hook for health checks
└── App.tsx                       # Dashboard UI
```

## 🔧 Tool Inventory

### Scarmonit Architecture Server
| Tool | Purpose | Input | Output |
|------|---------|-------|--------|
| `check_system_status` | Overall system health | None | Services list, infra status |
| `check_datalore_status` | Datalore integration | None | License, features, connectivity |

### LLM Framework DevOps Server
| Tool | Purpose | Input | Output |
|------|---------|-------|--------|
| `docker_ps` | List containers | `{ all?: boolean }` | Container list with status |
| `docker_inspect` | Container details | `{ containerId: string }` | Full container metadata |
| `k8s_get_pods` | List pods | `{ namespace?: string }` | Pods with restarts/status |
| `k8s_get_deployments` | List deployments | `{ namespace?: string }` | Deployment replica counts |

## 🚀 Usage Examples

### 1. Dashboard Auto-Refresh (Default)

```typescript
// App.tsx
const mcpHealth = useMCPHealth({
  enableAutoRefresh: true,
  refreshInterval: 30000,  // 30 seconds
  runOnMount: true
})

// Access data
mcpHealth.docker?.running        // Number of running containers
mcpHealth.kubernetes?.healthy    // K8s cluster health
mcpHealth.system?.overall        // 'healthy' | 'degraded' | 'offline'
```

### 2. Manual Health Check

```typescript
import { getMCPRouter } from './services/mcpRouter'

const router = getMCPRouter()

// Single service check
const dockerStatus = await router.getDockerStatus()
console.log(`Running: ${dockerStatus.running}/${dockerStatus.total}`)

// Full health check
const health = await router.runFullHealthCheck()
```

### 3. Direct Tool Call

```typescript
import { getMCPClient } from './clients/mcpClient'

const client = getMCPClient()

const result = await client.callTool({
  tool: 'docker_ps',
  args: { all: true }
})

if (result.status === 'success') {
  console.log(result.data)
}
```

### 4. Browser Console Testing

```javascript
// Open DevTools console on the dashboard
testMCPRouter()

// Or manually
const tester = new MCPRouterTester()
const results = await tester.runAllTests()

// Export results
copy(tester.exportResults())
```

## 📊 Telemetry & Debugging

### View Performance Metrics

```typescript
import { getTelemetry } from './services/telemetry'

const telemetry = getTelemetry()

// Error summary
const errors = telemetry.getErrorSummary()
console.log(`Total errors: ${errors.total}`)
console.log('By category:', errors.byCategory)

// Performance metrics
const perf = telemetry.getPerformanceMetrics()
console.log('Avg response times:', perf.operations)
```

### Export Telemetry Data

```typescript
const telemetry = getTelemetry()
const exportData = telemetry.export()

// Download as JSON
const blob = new Blob([exportData], { type: 'application/json' })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = 'scarmonit-telemetry.json'
a.click()
```

## ⚙️ Configuration

### Environment Variables

```env
# web-portal/.env
VITE_API_URL=https://agent-api.scarmonit.workers.dev
VITE_MCP_SERVER_URL=ws://localhost:3000
VITE_HEALTH_CHECK_INTERVAL=30000
VITE_REQUEST_TIMEOUT=5000
```

### MCP Server Configuration

```json
// C:/Users/scarm/AppData/Local/github-copilot/intellij/mcp.json
{
  "mcpServers": {
    "scarmonit-architecture": {
      "type": "stdio",
      "command": "node",
      "args": ["C:\\...\\mcp-server\\index.js"],
      "autoApprove": true  // Safe (read-only tools)
    },
    "llm-framework-devops": {
      "type": "stdio",
      "command": "node",
      "args": ["C:\\...\\devops-mcp-server.js"],
      "autoApprove": false  // Requires approval for destructive ops
    }
  }
}
```

## 🧪 Testing

### Run Test Suite

```bash
# In browser console (with dashboard loaded)
testMCPRouter()
```

### Expected Output

```
🧪 Starting MCP Router Test Suite...

🔬 Running: System Health Check
  ✅ PASSED (234ms)
🔬 Running: Datalore Status Check
  ✅ PASSED (156ms)
🔬 Running: Docker Status Check
  ✅ PASSED (312ms)
🔬 Running: Kubernetes Status Check
  ✅ PASSED (401ms)
🔬 Running: Full Health Check
  ✅ PASSED (892ms)
🔬 Running: MCP Services Health
  ✅ PASSED (203ms)
🔬 Running: Telemetry Tracking
  ✅ PASSED (89ms)
🔬 Running: Error Handling
  ✅ PASSED (45ms)

📊 Test Results Summary:
Total: 8
✅ Passed: 8
❌ Failed: 0
```

## 🐛 Troubleshooting

### Issue: "Agent API unreachable"

**Symptoms:** All health checks timeout or return errors

**Solution:**
1. Verify Agent API is deployed: `curl https://agent-api.scarmonit.workers.dev/api/health`
2. Check CORS settings in Cloudflare Worker
3. Review browser console for CORS errors

### Issue: "MCP tools not found"

**Symptoms:** Specific tools return "Unknown tool" errors

**Solution:**
1. Verify MCP server is running: Check IntelliJ MCP panel
2. Confirm tool name in `mcp-server/index.js` matches `types/mcp.ts`
3. Restart MCP server: Settings → Tools → Model Context Protocol → Restart

### Issue: "Stale data in dashboard"

**Symptoms:** Dashboard shows old status despite changes

**Solution:**
1. Check auto-refresh is enabled: `mcpHealth.refresh()`
2. Clear cache manually: `getMCPClient().clearCache()`
3. Verify refresh interval: Should be 30000ms (30s)

## 🔒 Security Considerations

### autoApprove Settings

- ✅ **Safe tools** (read-only): `check_*`, `docker_ps`, `k8s_get_*`
  - Set `autoApprove: true`

- ⚠️ **Destructive tools**: `docker_stop`, `k8s_scale`, `k8s_delete`
  - Set `autoApprove: false` → Requires manual confirmation

### CORS Configuration

Agent API must whitelist dashboard origin:

```typescript
// agent-api.scarmonit.workers.dev
const ALLOWED_ORIGINS = [
  'http://localhost:5174',
  'https://scarmonit-www.pages.dev',
  'https://agent.scarmonit.com'
]
```

## 📝 Next Steps

1. **Deploy Agent API** → Implement MCP proxy in Cloudflare Worker
2. **Add Real Deployments** → Wire deployment buttons to CI/CD triggers
3. **Expand Tool Catalog** → Add Git, Terraform, and monitoring tools
4. **Add Authentication** → Secure Agent API with JWT/OAuth
5. **Real-time Updates** → WebSocket transport for live status updates

## 📚 Resources

- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)
- [Scarmonit MCP Server Code](../../mcp-server/index.js)
- [Web Portal Deployment Guide](./DEPLOYMENT.md)
- [Performance Analysis](./PERFORMANCE_ANALYSIS.md)
