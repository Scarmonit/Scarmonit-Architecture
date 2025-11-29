# GitHub Copilot Custom Instructions for Scarmonit-Architecture

## Project Overview
You are working on **Scarmonit-Architecture**, a unified AI infrastructure monorepo for autonomous AI agents, local LLM orchestration, and intelligent infrastructure management.

**Repository:** https://github.com/Scarmonit/Scarmonit-Architecture
**Version:** 2.5.0
**Author:** Scarmonit Industries <Scarmonit@gmail.com>

## Architecture & Components

### Monorepo Structure
```
Scarmonit-Architecture/
├── web-portal/          # Main website (scarmonit.com) - React/Vite
├── agent-api/           # Backend API - TypeScript, Cloudflare Workers
├── desktop-app/         # Desktop Chat App - Electron, React, Node.js
├── copilot-extension/   # GitHub Copilot extension
├── mcp-server/          # Model Context Protocol server
├── mcp-bridge/          # MCP bridge for Claude Desktop/CLI
├── scarmonit-monitor/   # Infrastructure monitoring dashboard
└── docs/                # Documentation
```

### Component Details

| Component | Tech Stack | Deployment | Entry Point |
|-----------|------------|------------|-------------|
| web-portal | React, Vite, TypeScript | Cloudflare Pages | `src/App.tsx` |
| agent-api | TypeScript, Hono, Cloudflare Workers | Wrangler | `src/index.ts` |
| desktop-app | Electron, React, Node.js | Electron Builder | `src/main.js` |
| mcp-server | Node.js, MCP SDK | Local/Docker | `index.js` |
| mcp-bridge | Node.js, Express | Local | `index.js` |

## Coding Standards & Conventions

### TypeScript/JavaScript
- Use **strict typing** in all TypeScript files
- Use **ES6+ syntax** (arrow functions, destructuring, template literals)
- **2 spaces** indentation
- **Single quotes** for strings
- **No semicolons** (Prettier enforced)
- **Functional components with Hooks** for React

### File Naming
- React components: `PascalCase.tsx`
- Utilities/helpers: `camelCase.ts`
- Constants: `SCREAMING_SNAKE_CASE`
- Types/interfaces: `PascalCase` with `I` prefix for interfaces

### Import Order
1. External packages (react, express, etc.)
2. Internal absolute imports (@/components, etc.)
3. Relative imports (./utils, ../types)
4. Type imports (import type { ... })

## Framework-Specific Guidance

### Cloudflare Workers (agent-api)
- Use `worker-configuration.d.ts` for environment bindings
- Use native `fetch` handler or Hono framework
- Environment variables via `wrangler.toml` and Workers secrets
- Always check `wrangler.toml` compatibility before changes

### Electron (desktop-app)
- Use IPC patterns for main/renderer communication
- Enable context isolation (security best practice)
- Use preload scripts for safe API exposure
- Handle both macOS and Windows paths

### React (web-portal, desktop-app)
- Functional components only (no class components)
- Use React Hooks (useState, useEffect, useContext, etc.)
- Custom hooks in `src/hooks/` directory
- Services/API calls in `src/services/` directory

### MCP Server (mcp-server, mcp-bridge)
- Follow Model Context Protocol specification
- Tools should have clear descriptions and JSON schemas
- Handle errors gracefully with proper error responses
- Support both stdio and HTTP transports

## API Endpoints Reference

### Agent API (https://lm.scarmonit.com)
- `POST /v1/chat/completions` - OpenAI-compatible chat
- `GET /health` - Health check
- `GET /models` - List available models

### Web Portal (https://scarmonit.com)
- Static site with API proxy to agent-api
- Dashboard at `/dashboard`

## Testing Requirements
- Write tests for new features when applicable
- Use Jest for unit tests
- Use Playwright for E2E tests (web-portal)
- Test commands: `npm test`, `npm run test:e2e`

## Git Workflow
- Branch naming: `feature/`, `fix/`, `chore/`, `docs/`
- Commit messages: Conventional Commits format
- PR template in `.github/PULL_REQUEST_TEMPLATE.md`

## Security Considerations
- NEVER commit secrets, API keys, or credentials
- Use environment variables for sensitive data
- Validate all user inputs
- Enable CORS only for trusted origins
- Use CSP headers in web applications

## Behavior Guidelines
- Prefer small, atomic changes when refactoring
- Always check `package.json` in the specific workspace before suggesting imports
- If modifying the API, ensure `wrangler.toml` compatibility
- When adding dependencies, check if they're already in the workspace
- Prefer existing patterns in the codebase over new approaches
