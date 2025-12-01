# Scarmonit MCP Server

The Scarmonit MCP Server is a powerful backend component of the Scarmonit Architecture, designed to integrate seamlessly with AI tools like GitHub Copilot. It exposes a set of tools that provide insights into the health of the Scarmonit infrastructure, allow for documentation queries, and manage Datalore Cloud integration.

## Features

- **Infrastructure Health Checks**: Monitor the status of Scarmonit's web and API components.
- **Documentation Search**: Quickly find relevant architectural documentation.
- **Datalore Cloud Integration**: Manage and verify the status of the Datalore Cloud license.
- **Agent Persona Management**: List, view, and search for different agent personas.
- **Troubleshooting**: Get help with common activation issues for JetBrains IDE plugins.

## Installation

To get the MCP server up and running, follow these steps:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/scarmonit/scarmonit-architecture.git
   cd scarmonit-architecture/mcp-server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

4. **Run the server**:
   ```bash
   npm start
   ```

   You should see the following output in your terminal:
   ```
   Scarmonit MCP Server running on stdio
   ```

## API Documentation

The server exposes the following tools:

### `check_system_status`

Checks the health of the Scarmonit infrastructure components.

**Parameters:**

- `component` (string, optional): The component to check. Can be `"web"`, `"api"`, or `"all"`. Defaults to `"all"`.

**Example Usage:**

```json
{
  "tool": "check_system_status",
  "arguments": {
    "component": "web"
  }
}
```

### `query_docs`

Retrieves architectural documentation.

**Parameters:**

- `query` (string, required): The topic to search for.

**Example Usage:**

```json
{
  "tool": "query_docs",
  "arguments": {
    "query": "deployment"
  }
}
```

### `check_datalore_status`

Checks the Datalore Cloud integration status and license.

**Parameters:**

- None

**Example Usage:**

```json
{
  "tool": "check_datalore_status",
  "arguments": {}
}
```

### `list_agents`

Lists the available agent personas.

**Parameters:**

- `refresh` (boolean, optional): Whether to force a refresh of the agent cache. Defaults to `false`.

**Example Usage:**

```json
{
  "tool": "list_agents",
  "arguments": {
    "refresh": true
  }
}
```

### `get_agent_instructions`

Retrieves the full instructions for a specific agent persona.

**Parameters:**

- `agent` (string, required): The name of the agent.

**Example Usage:**

```json
{
  "tool": "get_agent_instructions",
  "arguments": {
    "agent": "developer"
  }
}
```

### `search_agents`

Searches for agent personas by keyword.

**Parameters:**

- `query` (string, required): The search term.

**Example Usage:**

```json
{
  "tool": "search_agents",
  "arguments": {
    "query": "typescript"
  }
}
```

### `apply_agent_context`

Returns a condensed, actionable summary of an agent persona.

**Parameters:**

- `agent` (string, required): The name of the agent.

**Example Usage:**

```json
{
  "tool": "apply_agent_context",
  "arguments": {
    "agent": "developer"
  }
}
```

### `troubleshoot_activation`

Helps troubleshoot activation issues for JetBrains IDE plugins.

**Parameters:**

- `issue` (string, required): The type of activation issue. Can be one of `"corrupted_data"`, `"dns_filter"`, `"ja_netfilter"`, `"access_issue"`, `"permission_denied"`, or `"other"`.
- `platform` (string, required): The operating system. Can be one of `"windows"`, `"mac"`, or `"linux"`.

**Example Usage:**

```json
{
  "tool": "troubleshoot_activation",
  "arguments": {
    "issue": "permission_denied",
    "platform": "mac"
  }
}
```

### `diagnose_agents`

Diagnoses the agent personas, reporting the resolved directory, count, cache age, and last load time.

**Parameters:**

- None

**Example Usage:**

```json
{
  "tool": "diagnose_agents",
  "arguments": {}
}
```

## Configuration

The server can be configured using a `.env` file in the `mcp-server` directory. The following environment variables are supported:

- `DATALORE_LICENSE_ID`: The license ID for Datalore Cloud integration.

## Development and Testing

To run the server in development mode, you can use the following command:

```bash
npm run build && npm start
```

To run the tests, use the following command:

```bash
npm test
```

## Troubleshooting

If you encounter any issues with the server, try the following:

- **"Module not found" errors**: Delete the `node_modules` directory and the `package-lock.json` file, then run `npm install` again.
- **Server not starting**: Make sure you have Node.js version 18 or higher installed. You can also try running `node build/index.js` manually to see more detailed error messages.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
