# Deploy Component

Deploy Scarmonit components to production.

## Deployment Targets

### Web Portal (Cloudflare Pages)
```bash
cd web-portal
npm run build
npx wrangler pages deploy dist --project-name=scarmonit-www
```

### Agent API (Cloudflare Workers)
```bash
cd agent-api
wrangler deploy
```

### Full Stack
```bash
npm run deploy:all
```

## Pre-deployment Checklist
- [ ] All tests passing
- [ ] TypeScript compilation successful
- [ ] No secrets in code
- [ ] Environment variables configured
- [ ] Build successful locally

## Post-deployment Verification
- [ ] Health endpoints responding
- [ ] Core functionality working
- [ ] No console errors
- [ ] Monitoring/logging active

## Rollback
```bash
# Workers rollback
wrangler rollback

# Pages - redeploy previous version from dashboard
```
