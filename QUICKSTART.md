# 🚀 Scarmonit Dashboard - Quick Start

## ⚡ Instant Launch

### Windows
```cmd
START_DASHBOARD.bat
```

### Linux/Mac
```bash
./START_DASHBOARD.sh
```

---

## 🌐 Access Points

After starting:

| Service | URL | Purpose |
|---------|-----|---------|
| **Dashboard** | http://localhost:8080 | Main UI |
| **MCP Bridge** | http://localhost:3001/api/health | API Server |

---

## ✅ Verify It's Working

1. **Open Dashboard:** http://localhost:8080
2. **Open Browser Console:** Press F12
3. **Run Test:**
   ```javascript
   testMCPRouter()
   ```
4. **Expected Result:**
   ```
   ✅ 8/8 tests passed
   ```

---

## 🧪 Manual API Testing

### Health Check
```bash
curl http://localhost:3001/api/health
```

### System Status
```bash
curl -X POST http://localhost:3001/api/tools/check_system_status \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Datalore Status
```bash
curl -X POST http://localhost:3001/api/tools/check_datalore_status \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 🛑 Stopping Services

### Windows
```cmd
STOP_DASHBOARD.bat
```

### Linux/Mac
```bash
./STOP_DASHBOARD.sh
```

### Manual Stop
```bash
# Stop MCP Bridge
lsof -ti:3001 | xargs kill -9

# Stop Dashboard
lsof -ti:8080 | xargs kill -9
```

---

## 🔧 Troubleshooting

### "Port already in use"
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Kill process on port 8080
lsof -ti:8080 | xargs kill -9
```

### "MCP Bridge not responding"
1. Check it's running: `curl http://localhost:3001/api/health`
2. Restart: `STOP_DASHBOARD && START_DASHBOARD`
3. Check MCP servers in IntelliJ: Settings → Tools → Model Context Protocol

### "Dashboard shows all offline"
1. Verify bridge is running: `curl http://localhost:3001/api/health`
2. Check browser console for CORS errors
3. Clear browser cache: Ctrl+Shift+R

### "Cannot access brucege.com" (ja-netfilter issue)
This is unrelated to Scarmonit. If you see this:
1. Edit `ja-netfilter/config/dns.conf`
2. Delete line: `equal brucege.com`
3. Restart IntelliJ

---

## 📊 Dashboard Features

### System Status Cards
- Web Portal
- MCP Server
- Agent API
- Copilot Extension
- Docker
- Kubernetes

### Auto-Refresh
- Interval: 30 seconds (10s in dev mode)
- Configurable in `.env.local`

### Telemetry
- Error tracking
- Performance metrics
- Available in console: `getTelemetry().export()`

---

## 🚀 Production Deployment

### Deploy Cloudflare Worker
```bash
cd agent-api
npx wrangler login
npm run deploy
```

### Deploy Web Portal
```bash
cd web-portal
npm run build
npx wrangler pages deploy dist --project-name scarmonit-www
```

See `README_DEPLOYMENT_COMPLETE.md` for full guide.

---

## 📚 Documentation

- **Complete Guide:** `README_DEPLOYMENT_COMPLETE.md`
- **MCP Integration:** `web-portal/README_MCP_INTEGRATION.md`
- **Bridge Server:** `mcp-bridge/README.md`
- **CF Worker:** `agent-api/README.md`

---

## ✨ Status

- **MCP Bridge:** 🟢 Running (port 3001)
- **Dashboard:** 🟢 Serving (port 8080)
- **MCP Servers:** 🟢 Connected (2/2)
- **Tools Available:** 6+ (auto-routed)

---

**Ready to use!** Open http://localhost:8080 🚀
