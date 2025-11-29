---
applyTo: "agent-api/**/*.ts"
---

# Cloudflare Workers Instructions

## Handler Pattern
- Use Hono framework or native fetch handler
- Always return Response objects
- Handle CORS headers properly

## Environment Bindings
- Define bindings in `worker-configuration.d.ts`
- Access via `env` parameter in handlers
- Never hardcode secrets - use Workers secrets

## Request Handling
```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle request
  }
}
```

## Error Handling
- Return appropriate HTTP status codes
- Use structured JSON error responses
- Log errors for debugging

## Performance
- Use `ctx.waitUntil()` for background tasks
- Leverage edge caching when appropriate
- Minimize cold start impact

## CORS Configuration
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}
```

## Wrangler Commands
- `wrangler dev` - Local development
- `wrangler deploy` - Production deployment
- `wrangler secret put NAME` - Add secrets
