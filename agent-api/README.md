# ☁️ Scarmonit Agent API

> **Cloudflare Worker for MCP proxy and agent orchestration**

## Overview

The Agent API runs on Cloudflare's edge network and serves as the production backend for the web-portal dashboard. It proxies MCP tool calls to backend servers and provides mock data when servers are unavailable.

## Architecture

```
┌──────────────────┐
│   Web Portal     │
│  (Static Site)   │
└────────┬─────────┘
         │ HTTPS
         ▼
┌──────────────────────────────┐
│  Agent API Worker            │
│  agent-api.scarmonit.        │
│  workers.dev                 │
│                              │
│  • CORS handling             │
│  • Tool routing              │
│  • Mock responses            │
│  • Rate limiting             │
└────────┬─────────────────────┘
         │ HTTP/WS
         ▼
┌──────────────────────────────┐
│  Backend MCP Servers         │
│  (stdio → HTTP bridge)       │
│                              │
│  • scarmonit-architecture    │
│  • llm-framework-devops      │
└──────────────────────────────┘
```

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start dev server (with hot reload)
npm run dev

# Test locally
curl http://localhost:8787/api/health
```

### Deploy to Cloudflare

```bash
# Deploy to workers.dev
npm run deploy

# Deploy to production
npm run deploy -- --env production

# View live logs
npm run tail
```

## API Endpoints

### Health Check

```bash
GET https://agent-api.scarmonit.workers.dev/api/health
```

Response:
```json
{
  "status": "online",
  "environment": "production",
  "timestamp": "2025-11-29T06:50:00.000Z",
  "services": {
    "worker": "operational",
    "mcpBridge": "configured"
  }
}
```

### Call Tool

```bash
POST https://agent-api.scarmonit.workers.dev/api/tools/check_system_status
Content-Type: application/json

{}
```

Response:
```json
{
  "status": "success",
  "data": {
    "operational": true,
    "services": [...],
    "infrastructure": {...}
  },
  "server": "scarmonit-architecture",
  "executionTime": 87,
  "timestamp": 1701234567890
}
```

### Analyze Complex Problem

Analyze a complex problem using the data collection specialist AI agent.

```bash
POST https://agent-api.scarmonit.workers.dev/api/analyze-problem
Content-Type: application/json

{
  "description": "How can we improve customer retention for our SaaS product?",
  "domain": "business",
  "stakeholders": ["product team", "customer success", "marketing"],
  "dataTypes": ["user behavior", "churn data", "feedback surveys"],
  "dataSources": ["analytics platform", "CRM", "support tickets"],
  "context": "We've seen a 15% increase in churn over the last quarter"
}
```

Response:
```json
{
  "analysis": {
    "summary": "Customer churn analysis indicates multiple potential causes...",
    "keyInsights": [
      "Churn correlates with reduced feature engagement after week 3",
      "Support ticket volume precedes cancellation by 2 weeks",
      "Price sensitivity highest in SMB segment"
    ],
    "recommendedActions": [
      "Implement proactive engagement during critical adoption period",
      "Create early warning system based on support interactions",
      "Review pricing tiers for small business customers"
    ],
    "dataCollectionPlan": [
      "Extract user engagement metrics from analytics platform",
      "Correlate support ticket history with churn events",
      "Survey recently churned customers for qualitative feedback"
    ],
    "riskFactors": [
      "Data quality may vary across sources",
      "Historical bias in customer feedback"
    ],
    "complexity": "medium"
  },
  "metadata": {
    "domain": "business",
    "analyzedAt": "2025-11-29T13:53:19.653Z",
    "version": "1.0.0"
  }
}
```

#### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `description` | string | Yes | The problem description to analyze |
| `domain` | string | No | Problem domain (e.g., "business", "technology", "healthcare") |
| `stakeholders` | string[] | No | List of stakeholders involved |
| `dataTypes` | string[] | No | Types of data to collect (e.g., "text", "metrics") |
| `dataSources` | string[] | No | Preferred data sources |
| `context` | string | No | Additional context for the analysis |

## Configuration

### Environment Variables

Set via Cloudflare dashboard or CLI:

```bash
# Set secret (not visible in wrangler.toml)
wrangler secret put API_KEY
wrangler secret put MCP_SERVER_URL

# Public vars (in wrangler.toml)
ENVIRONMENT=production
LOG_LEVEL=INFO
ALLOWED_ORIGINS=https://scarmonit-www.pages.dev,https://agent.scarmonit.com
```

### CORS Origins

Edit `wrangler.toml`:

```toml
[[unsafe.bindings]]
name = "ALLOWED_ORIGINS"
type = "plain_text"
text = "http://localhost:5174,https://your-domain.com"
```

## Mock Mode

When MCP servers are unavailable (or for testing), the worker returns mock data:

```typescript
const MOCK_DATA = {
  check_system_status: {
    operational: true,
    services: [...]
  },
  docker_ps: {
    containers: [...]
  }
}
```

To disable mock mode and require real backend:
- Set `MCP_SERVER_URL` environment variable
- Implement backend connection logic in `src/index.ts`

## Connecting to Backend MCP Servers

### Option 1: Cloudflare Tunnel

Use Cloudflare Tunnel to expose local MCP bridge:

```bash
# Install cloudflared
npm install -g cloudflared

# Create tunnel
cloudflared tunnel create scarmonit-mcp

# Route tunnel to local bridge
cloudflared tunnel route dns scarmonit-mcp mcp.scarmonit.com

# Run tunnel
cloudflared tunnel run scarmonit-mcp --url http://localhost:3001
```

Update worker:
```typescript
const MCP_SERVER_URL = 'https://mcp.scarmonit.com'
```

### Option 2: Durable Objects

Deploy MCP bridge as Cloudflare Durable Object:

```typescript
// src/mcp-durable-object.ts
export class MCPBridge implements DurableObject {
  async fetch(request: Request) {
    // Handle MCP stdio connections
  }
}
```

### Option 3: Workers KV Cache

Cache MCP responses in Workers KV for faster response:

```bash
wrangler kv:namespace create MCP_CACHE
```

```typescript
// Store response
await env.MCP_CACHE.put(tool, JSON.stringify(result), {
  expirationTtl: 60
})

// Retrieve response
const cached = await env.MCP_CACHE.get(tool)
```

## Monitoring

### View Live Logs

```bash
npm run tail
```

### Metrics Dashboard

https://dash.cloudflare.com → Workers → agent-api-scarmonit → Metrics

Key metrics:
- Requests per second
- Error rate
- P50/P95/P99 latency
- CPU time

### Alerts

Set up alerts in Cloudflare dashboard:
- Error rate > 5%
- Latency P95 > 500ms
- CPU time > 50ms

## Rate Limiting

Add rate limiting to prevent abuse:

```typescript
// src/rate-limiter.ts
export async function checkRateLimit(
  request: Request,
  env: Env
): Promise<boolean> {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown'
  const key = `rate_limit:${ip}`

  const count = await env.MCP_CACHE.get(key)
  if (count && parseInt(count) > 100) {
    return false
  }

  await env.MCP_CACHE.put(key, String((parseInt(count || '0') + 1)), {
    expirationTtl: 60
  })

  return true
}
```

## Security

### API Key Authentication

```typescript
function validateApiKey(request: Request, env: Env): boolean {
  const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '')
  return apiKey === env.API_KEY
}
```

### Request Signing

Use HMAC to sign requests:

```typescript
async function verifySignature(
  request: Request,
  env: Env
): Promise<boolean> {
  const signature = request.headers.get('X-Signature')
  const body = await request.text()

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(env.API_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  )

  const expectedSignature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(body)
  )

  return signature === btoa(String.fromCharCode(...new Uint8Array(expectedSignature)))
}
```

## Performance

### Caching Strategy

```typescript
// Cache successful responses
if (result.status === 'success') {
  ctx.waitUntil(
    env.MCP_CACHE.put(cacheKey, JSON.stringify(result), {
      expirationTtl: 30
    })
  )
}
```

### Edge Routing

Worker runs on 300+ Cloudflare edge locations for <50ms latency worldwide.

### Compression

Cloudflare automatically compresses responses with Brotli/gzip.

## Troubleshooting

### "Worker not found"

- Verify deployment: `wrangler deployments list`
- Check route: `wrangler routes list`

### "CORS error"

- Add origin to `ALLOWED_ORIGINS` in wrangler.toml
- Check browser console for exact origin

### "MCP server timeout"

- Verify `MCP_SERVER_URL` is set
- Test backend directly: `curl $MCP_SERVER_URL/api/health`
- Check Cloudflare Tunnel status

## Cost

Cloudflare Workers pricing (as of 2024):

- **Free tier:** 100,000 requests/day
- **Paid plan:** $5/month for 10M requests
- **Additional:** $0.50 per million requests

Estimated cost for Scarmonit:
- 1,000 users × 10 requests/day = 300,000 requests/month
- **Total:** $0 (within free tier)

## CI/CD Integration

Deploy automatically on push to main:

```yaml
# .github/workflows/deploy-worker.yml
name: Deploy Worker

on:
  push:
    branches: [main]
    paths:
      - 'agent-api/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: agent-api
```

## License

MIT © Scarmonit Industries
