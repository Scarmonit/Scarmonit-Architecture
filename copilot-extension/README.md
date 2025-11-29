# Scarmonit Copilot Extension

This is a custom **GitHub Copilot Extension** (Agent) designed to integrate with the Scarmonit Architecture.

## Features
- **Custom Persona:** Knows the specific context of Scarmonit.
- **MCP Stub:** Prepared to connect to Model Context Protocol servers.

## Setup

1. **Deploy the Worker:**
   ```bash
   cd copilot-extension
   npm install
   npm run deploy
   ```
   *Note the URL provided by Wrangler (e.g., `https://scarmonit-copilot-agent.your-subdomain.workers.dev`).*

2. **Create GitHub App:**
   - Go to [GitHub Settings > Developer Settings > GitHub Apps](https://github.com/settings/apps).
   - Click "New GitHub App".
   - **Name:** `scarmonit-agent`
   - **Homepage URL:** Your Worker URL.
   - **Callback URL:** `Your Worker URL/callback` (not strictly used for this simple agent but required).
   - **Permissions:** Select `Copilot Chat` -> `Access: Read and Write`.
   - **Copilot:** In the sidebar, select "Copilot".
     - **App Type:** Agent.
     - **URL:** `Your Worker URL/agent/chat`.
     - **Inference Description:** "Helps with Scarmonit architecture questions."

3. **Install App:**
   - Install the GitHub App on your account/organization.

4. **Use in Copilot:**
   - Open GitHub Copilot Chat in WebStorm (or VS Code).
   - Type `@scarmonit-agent hello`.

## MCP Integration
To fully integrate MCP:
1. Host an MCP Server (e.g., `mcp-server.scarmonit.com`) that exposes tools over HTTP/SSE.
2. Update `wrangler.toml` with the URL.
3. Modify `src/index.ts` to fetch tools from that URL and execute them.
