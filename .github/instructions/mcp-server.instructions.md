---
applyTo: "mcp-server/**/*.{js,ts},mcp-bridge/**/*.{js,ts}"
---

# MCP Server Instructions

## Protocol Compliance
- Follow Model Context Protocol specification
- Implement required server capabilities
- Handle all message types properly

## Tool Definition
```javascript
{
  name: 'tool_name',
  description: 'Clear description of what the tool does',
  inputSchema: {
    type: 'object',
    properties: {
      param: { type: 'string', description: 'Parameter description' }
    },
    required: ['param']
  }
}
```

## Error Handling
```javascript
{
  isError: true,
  content: [{
    type: 'text',
    text: 'Error message with context'
  }]
}
```

## Transport Support
- Stdio transport for CLI integrations
- HTTP/SSE transport for web integrations
- Handle connection lifecycle properly

## Best Practices
- Tools should be atomic and focused
- Provide detailed descriptions for AI understanding
- Return structured, parseable responses
- Log operations for debugging
- Handle timeouts gracefully

## Integration Points
- Claude Desktop: `claude_desktop_config.json`
- Claude CLI: `~/.claude/settings.json`
- Custom clients: HTTP endpoints
