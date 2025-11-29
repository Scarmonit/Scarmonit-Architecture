# Scarmonit Architecture - AI Agent Instructions

## Project Identity
You are working on **Scarmonit-Architecture**, a monorepo for unified AI infrastructure including autonomous agents, LLM orchestration, and infrastructure management.

## Repository Structure

```
Scarmonit-Architecture/
├── web-portal/          # React/Vite frontend (scarmonit.com)
├── agent-api/           # Cloudflare Workers API (TypeScript)
├── desktop-app/         # Electron desktop application
├── copilot-extension/   # GitHub Copilot extension
├── mcp-server/          # Model Context Protocol server
├── mcp-bridge/          # MCP bridge for Claude integrations
├── scarmonit-monitor/   # Infrastructure monitoring
└── docs/                # Documentation
```

## Jules Integration
For specific instructions on configuring and using Jules with this repository, please refer to [JULES_SETUP.md](./JULES_SETUP.md).

## Always Do
- Read existing code before making changes
- Check `package.json` in each workspace before adding dependencies
- Follow existing code patterns and conventions
- Use TypeScript strict mode in all `.ts` files
- Write descriptive commit messages using Conventional Commits
- Validate changes don't break existing functionality
- Use 2-space indentation, single quotes, no semicolons

## Ask First
- Before making architectural changes
- Before adding new dependencies to shared packages
- Before modifying CI/CD workflows
- Before changing environment variable schemas
- Before refactoring across multiple workspaces

## Never Do
- Commit secrets, API keys, or credentials
- Skip TypeScript type checking
- Use `any` type without justification
- Break backwards compatibility without warning
- Modify `wrangler.toml` without understanding Workers config
- Push directly to main branch
- Remove existing tests without replacement

## Build & Test Commands

### Root Level
```bash
npm run install:all     # Install all workspace dependencies
npm run dev             # Start all services concurrently
npm run deploy:all      # Deploy web and API
npm test                # Run all tests
```

### Per Workspace
```bash
# Web Portal
cd web-portal && npm run dev
cd web-portal && npm run build

# Agent API
cd agent-api && wrangler dev
cd agent-api && wrangler deploy

# Desktop App
cd desktop-app && npm start
cd desktop-app && npm run build

# MCP Server
cd mcp-server && npm start
```

## Validation Steps
After making changes, always:
1. Run `npm run build` in affected workspace
2. Run tests if available
3. Check TypeScript compilation: `npx tsc --noEmit`
4. Verify no secrets are exposed

## Key Technologies
- **Frontend:** React 18+, Vite, TypeScript
- **Backend:** Cloudflare Workers, Hono, TypeScript
- **Desktop:** Electron, React, Node.js
- **MCP:** Node.js, @modelcontextprotocol/sdk
- **Deployment:** Cloudflare Pages, Cloudflare Workers, Docker

## File Conventions
- React components: `ComponentName.tsx`
- Utilities: `utilityName.ts`
- Types: `types.ts` or `*.types.ts`
- Hooks: `useHookName.ts`
- Services: `serviceName.ts`

## Error Handling
- Use try/catch for async operations
- Log errors with context information
- Return appropriate HTTP status codes in APIs
- Display user-friendly error messages in UIs
