# Scarmonit Architecture - Quick Reference

**AI-Friendly Command Reference for Working with this Project**

## 📁 Project Location

```
C:\Users\scarm\Scarmonit-Architecture\
```

## 🗂️ Directory Structure

```
Scarmonit-Architecture/
├── web-portal/       # scarmonit.com landing page
├── agent-api/        # agent.scarmonit.com worker
├── agent-cli/        # AI agent with MCP tools
└── docs/             # Documentation
```

## ⚡ Quick Commands

### Deploy Web Portal

```powershell
cd C:\Users\scarm\Scarmonit-Architecture\web-portal
wrangler pages deploy . --project-name=scarmonit-www
```

### Deploy Agent API

```powershell
cd C:\Users\scarm\Scarmonit-Architecture\agent-api
wrangler deploy --env production
```

### Run Agent

```powershell
cd C:\Users\scarm\Scarmonit-Architecture\agent-cli
python agent.py "Your task here"
```

### Test Everything

```powershell
# Test web portal
curl https://scarmonit.com

# Test agent API health
curl https://agent.scarmonit.com/health

# Test agent API history
curl https://agent.scarmonit.com/api/history

# Test LM Studio
curl http://localhost:1234/v1/models

# Run agent test
python C:\Users\scarm\Scarmonit-Architecture\agent-cli\agent.py "test"
```

## 📝 File Locations

### Web Portal Files
- **HTML:** `C:\Users\scarm\Scarmonit-Architecture\web-portal\index.html`
- **CSS:** `C:\Users\scarm\Scarmonit-Architecture\web-portal\styles.css`
- **JS:** `C:\Users\scarm\Scarmonit-Architecture\web-portal\script.js`

### Agent API Files
- **Worker:** `C:\Users\scarm\Scarmonit-Architecture\agent-api\src\index.ts`
- **Config:** `C:\Users\scarm\Scarmonit-Architecture\agent-api\wrangler.toml`

### Agent CLI Files
- **Agent:** `C:\Users\scarm\Scarmonit-Architecture\agent-cli\agent.py`
- **MCP Tools:** `C:\Users\scarm\Scarmonit-Architecture\agent-cli\mcp_client.py`

## 🔧 Common Edits

### Change Website Content

Edit: `C:\Users\scarm\Scarmonit-Architecture\web-portal\index.html`

Then deploy:
```powershell
cd C:\Users\scarm\Scarmonit-Architecture\web-portal
wrangler pages deploy . --project-name=scarmonit-www
```

### Change Website Styling

Edit: `C:\Users\scarm\Scarmonit-Architecture\web-portal\styles.css`

Then deploy (same as above)

### Modify Agent Behavior

Edit: `C:\Users\scarm\Scarmonit-Architecture\agent-cli\agent.py`

Look for:
- `self.tool_descriptions` - Tool list and examples
- `parse_response()` - How agent parses LLM output
- `execute_tool()` - Tool execution logic
- `run()` - Main ReAct loop

### Update Agent API

Edit: `C:\Users\scarm\Scarmonit-Architecture\agent-api\src\index.ts`

Then deploy:
```powershell
cd C:\Users\scarm\Scarmonit-Architecture\agent-api
wrangler deploy --env production
```

## 🌐 Live URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Web Portal | https://scarmonit.com | Public landing page |
| Agent Dashboard | https://agent.scarmonit.com | Task history viewer |
| LM Studio API | https://lm.scarmonit.com | LLM endpoint |

## 🛠️ Tools & Dependencies

### Required
- **Node.js 22+** - For Cloudflare Workers
- **Python 3.13+** - For AI agents
- **Wrangler CLI** - Cloudflare deployment
- **LM Studio** - Local LLM (port 1234)

### Optional
- **Docker** - For docker_* tools
- **kubectl** - For kubernetes tools
- **Git** - For git_* tools

## 🔍 Debugging

### Check LM Studio
```powershell
Get-Process "LM Studio"
curl http://localhost:1234/v1/models
```

### Check Cloudflared Tunnel
```powershell
Get-Service cloudflared
```

### View Agent Logs
Run agent with verbose output enabled (check `agent.py`)

### View Dashboard Logs
Visit: https://agent.scarmonit.com
Click "Refresh" to see latest tasks

## 📖 Documentation Files

- **Main README:** `C:\Users\scarm\Scarmonit-Architecture\README.md`
- **Agent CLI:** `C:\Users\scarm\Scarmonit-Architecture\agent-cli\README.md`
- **This File:** `C:\Users\scarm\Scarmonit-Architecture\docs\QUICK_REFERENCE.md`

## 💡 Tips for AI Assistants

### When Making Changes
1. Always work in `C:\Users\scarm\Scarmonit-Architecture\`
2. Update relevant README when changing functionality  
3. Test locally before deploying
4. Use `wrangler deploy` not `wrangler publish`

### When Deploying
1. Web portal: Use `wrangler pages deploy`
2. Agent API: Use `wrangler deploy --env production`
3. Agent CLI: No deployment needed (runs locally)

### When Troubleshooting
1. Check relevant component README first
2. Verify all services running (LM Studio, cloudflared)
3. Test endpoint health checks
4. Check dashboard for task logs

### Project Conventions
- **TypeScript** for Cloudflare Workers
- **Python** for CLI agents
- **Vanilla JS** for web portal (no frameworks)
- **Markdown** for documentation

## 🚀 Deployment Checklist

### Before Deploying

- [ ] Test locally
- [ ] Update version/date in files
- [ ] Check all URLs are correct
- [ ] Verify no sensitive data in code
- [ ] Update documentation if needed

### After Deploying

- [ ] Test live URL
- [ ] Check browser console for errors
- [ ] Verify API endpoints respond
- [ ] Test agent task execution
- [ ] Check dashboard shows tasks

## 📞 Common Issues

### "Module not found" errors
Solution: Run `npm install` in agent-api directory

### "wrangler command not found"
Solution: `npm install -g wrangler`

### Agent hangs
Solution: Check LM Studio is running and model loaded

### Dashboard empty
Solution: Click "Refresh" button or check `/api/history` directly

### Website not updating
Solution: May need to wait for Cloudflare cache to clear (5-10 min) or purge cache

---

**Quick Help Command:**
```powershell
# Open main README
code C:\Users\scarm\Scarmonit-Architecture\README.md
```

Last Updated: November 28, 2025
