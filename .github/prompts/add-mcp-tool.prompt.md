# Add MCP Tool

Create a new tool for the MCP server.

## Location
- `mcp-server/index.js` - Main MCP server
- `mcp-bridge/index.js` - Bridge server

## Requirements
- Clear tool name (snake_case)
- Descriptive description for AI understanding
- JSON Schema for input validation
- Proper error handling
- Structured response format

## Template
```javascript
{
  name: 'tool_name',
  description: 'Detailed description of what this tool does and when to use it',
  inputSchema: {
    type: 'object',
    properties: {
      param1: {
        type: 'string',
        description: 'Description of param1'
      },
      param2: {
        type: 'number',
        description: 'Description of param2'
      }
    },
    required: ['param1']
  }
}

// Handler
async function handleToolName({ param1, param2 }) {
  try {
    // Implementation
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    }
  } catch (error) {
    return {
      isError: true,
      content: [{
        type: 'text',
        text: `Error: ${error.message}`
      }]
    }
  }
}
```

Please specify:
1. Tool name and purpose
2. Input parameters needed
3. Expected output format
4. Error scenarios to handle
