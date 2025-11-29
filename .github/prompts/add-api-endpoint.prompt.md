# Add API Endpoint

Create a new API endpoint in the agent-api Cloudflare Worker.

## Requirements
- Follow existing routing patterns in `agent-api/src/index.ts`
- Add proper TypeScript types for request/response
- Include CORS headers
- Add error handling with appropriate status codes
- Document the endpoint in comments

## Template
```typescript
// Handler for [ENDPOINT_NAME]
app.METHOD('/path', async (c) => {
  try {
    const body = await c.req.json()
    // Validation
    // Business logic
    return c.json({ success: true, data: result })
  } catch (error) {
    return c.json({ error: 'Error message' }, 500)
  }
})
```

Please specify:
1. HTTP method (GET, POST, PUT, DELETE)
2. Endpoint path
3. Request body schema
4. Response schema
5. Any authentication requirements
