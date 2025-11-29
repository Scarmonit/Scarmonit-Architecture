# Migration Guide

## Overview

This guide helps you migrate existing Scarmonit components into the unified architecture repository.

## Prerequisites

- Git installed
- Access to existing project directories
- GitHub CLI (optional, but recommended)

## Migration Steps

### 1. Clone the Architecture Repository

```bash
git clone https://github.com/Scarmonit/Scarmonit-Architecture.git
cd Scarmonit-Architecture
```

### 2. Migrate Web Portal

**Source:** `C:\Users\scarm\LLM\` (or your current location)
**Destination:** `web-portal/`

```bash
# Copy web portal files
cp -r /path/to/current/website/* ./web-portal/

# Update any hardcoded paths
# Update API endpoints to point to lm.scarmonit.com
```

**Files to migrate:**
- `index.html`
- `styles.css`
- `script.js`
- All assets in `public/` or `assets/`

### 3. Migrate Agent API (Cloudflare Worker)

**Source:** `C:\Users\scarm\src\microservices\cloudflare-worker.ts` and `C:\Users\scarm\wrangler.toml`
**Destination:** `agent-api/`

```bash
# Copy worker files
cp /path/to/wrangler.toml ./agent-api/
cp /path/to/cloudflare-worker.ts ./agent-api/src/index.ts

# Update wrangler.toml project name if needed
```

**Files to migrate:**
- `wrangler.toml` - Cloudflare configuration
- `src/index.ts` - Main worker code
- `package.json` - Dependencies

### 4. Migrate Desktop App

**Source:** `C:\Users\scarm\AntigravityProjects\CommandCenter\ai-chat-desktop`
**Destination:** `desktop-app/`

```bash
# Copy desktop app
cp -r /path/to/ai-chat-desktop/* ./desktop-app/
```

**Files to migrate:**
- `src/` - All source code
- `package.json`
- `electron-builder.yml` or similar config
- `assets/` and `icons/`

### 5. Update Configuration Files

#### Web Portal
Create `web-portal/.env`:
```env
API_ENDPOINT=https://lm.scarmonit.com
ENVIRONMENT=production
```

#### Agent API
Create `agent-api/.env`:
```env
LM_STUDIO_URL=http://localhost:1234/v1
API_KEY=your_api_key_here
CORS_ORIGIN=https://scarmonit.com
```

#### Desktop App
Create `desktop-app/.env`:
```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
LM_STUDIO_ENDPOINT=https://lm.scarmonit.com
```

### 6. Test Locally

```bash
# Test web portal
cd web-portal
npm install
npm run dev

# Test agent API
cd ../agent-api
npm install
wrangler dev

# Test desktop app
cd ../desktop-app
npm install
npm start
```

### 7. Commit and Push

```bash
git add .
git commit -m "Migrate all components to unified architecture"
git push origin main
```

### 8. Deploy

```bash
# Deploy web portal
cd web-portal
npm run deploy

# Deploy agent API
cd ../agent-api
wrangler deploy
```

## PowerShell Migration Script

For Windows users, here's a PowerShell script to automate the migration:

```powershell
# migration-script.ps1

# Set paths
$archRepo = "C:\Users\scarm\Scarmonit-Architecture"
$webSource = "C:\Users\scarm\LLM"
$workerSource = "C:\Users\scarm\src\microservices"
$desktopSource = "C:\Users\scarm\AntigravityProjects\CommandCenter\ai-chat-desktop"

# Create directories
New-Item -Path "$archRepo\web-portal" -ItemType Directory -Force
New-Item -Path "$archRepo\agent-api\src" -ItemType Directory -Force
New-Item -Path "$archRepo\desktop-app" -ItemType Directory -Force

# Copy web portal
Copy-Item -Path "$webSource\*" -Destination "$archRepo\web-portal" -Recurse -Force

# Copy agent API
Copy-Item -Path "$workerSource\cloudflare-worker.ts" -Destination "$archRepo\agent-api\src\index.ts" -Force
Copy-Item -Path "C:\Users\scarm\wrangler.toml" -Destination "$archRepo\agent-api\wrangler.toml" -Force

# Copy desktop app
Copy-Item -Path "$desktopSource\*" -Destination "$archRepo\desktop-app" -Recurse -Force

Write-Host "Migration complete! Files copied to $archRepo"
```

## Post-Migration Checklist

- [ ] All files copied successfully
- [ ] Environment variables configured
- [ ] Dependencies installed (`npm install` in each directory)
- [ ] Local testing passed
- [ ] Git repository updated
- [ ] Production deployments successful
- [ ] DNS and domain settings verified
- [ ] Old repositories archived or deleted

## Troubleshooting

### Issue: Module not found errors
**Solution:** Run `npm install` in each component directory

### Issue: API endpoints not working
**Solution:** Check `.env` files and update CORS settings

### Issue: Cloudflare Worker deployment fails
**Solution:** Verify `wrangler.toml` and run `wrangler login`

## Support

For issues or questions:
- **Email:** Scarmonit@gmail.com
- **GitHub Issues:** [Open an issue](https://github.com/Scarmonit/Scarmonit-Architecture/issues)

---

**Note:** This migration guide assumes you have owner-level access to all services. If you encounter permission issues, verify your account settings.
