# Debug Issue

Systematically debug an issue in the Scarmonit codebase.

## Debug Process
1. **Reproduce** - Understand the exact steps to reproduce
2. **Locate** - Find the relevant code files
3. **Analyze** - Review the code flow and identify root cause
4. **Fix** - Implement minimal fix
5. **Verify** - Confirm the fix resolves the issue

## Information Needed
- Which component? (web-portal, agent-api, desktop-app, mcp-server)
- Error message or unexpected behavior
- Steps to reproduce
- Expected vs actual behavior

## Common Debug Locations
- **API errors**: `agent-api/src/index.ts`
- **UI issues**: `web-portal/src/App.tsx` or specific component
- **Desktop app**: `desktop-app/src/main.js` (main) or `src/renderer/`
- **MCP errors**: `mcp-server/index.js` or `mcp-bridge/index.js`

## Debug Commands
```bash
# Check TypeScript errors
npx tsc --noEmit

# Run in development mode with logs
npm run dev

# Check Cloudflare Worker logs
wrangler tail

# Test MCP server
node mcp-server/test.mjs
```
