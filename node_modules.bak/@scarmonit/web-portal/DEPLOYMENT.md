# Web Portal Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- Node.js 20+ (for local development)

---

## 📦 Docker Deployment

### Option 1: Docker Compose (Recommended)

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f web-portal

# Stop
docker-compose down
```

Access at: http://localhost:8080

### Option 2: Docker CLI

```bash
# Build the image
docker build -t scarmonit/web-portal:latest .

# Run the container
docker run -d \
  --name scarmonit-web-portal \
  -p 8080:80 \
  --restart unless-stopped \
  scarmonit/web-portal:latest

# Check logs
docker logs -f scarmonit-web-portal

# Stop and remove
docker stop scarmonit-web-portal
docker rm scarmonit-web-portal
```

### Option 3: Multi-Architecture Build

```bash
# Build for multiple platforms (ARM + x86)
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t scarmonit/web-portal:latest \
  --push .
```

---

## 🔧 Environment Variables

Create a `.env` file in the web-portal directory:

```bash
# Application
NODE_ENV=production
VITE_APP_NAME=Scarmonit Control Center

# API Configuration
VITE_API_URL=https://agent-api.scarmonit.workers.dev
VITE_AGENT_URL=https://agent.scarmonit.com

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=false

# Performance
VITE_CACHE_ENABLED=true
VITE_HEALTH_CHECK_INTERVAL=30000
```

---

## 🏗️ Build Locally

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

---

## 📊 Performance Verification

### Run Lighthouse Audit

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse http://localhost:8080 --view
```

**Target Scores:**
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

### Bundle Size Analysis

```bash
# Build with analysis
npm run build

# Check dist folder size
du -sh dist/
```

**Target Sizes:**
- Total Bundle (gzipped): < 150KB
- Initial JS: < 100KB
- CSS: < 20KB

---

## 🔒 Security Configuration

### Update Nginx Headers

Edit the Dockerfile nginx config section to add custom security headers:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
```

### SSL/TLS Configuration (Production)

For production deployment with HTTPS:

```bash
# Using Cloudflare Pages (Recommended)
# 1. Push to GitHub
# 2. Connect to Cloudflare Pages
# 3. Configure build: npm run build
# 4. Set output directory: dist

# Or using reverse proxy (Nginx/Traefik)
# See docs/NGINX_SSL.md for detailed configuration
```

---

## 🔍 Health Checks

### Container Health

```bash
# Check health status
docker inspect scarmonit-web-portal | grep -A 5 Health

# Manual health check
curl http://localhost:8080/health
```

Expected response: `healthy`

### Application Status

```bash
# Check all endpoints
curl -I http://localhost:8080/
curl -I http://localhost:8080/health
```

---

## 📈 Monitoring

### View Logs

```bash
# Docker logs
docker logs -f scarmonit-web-portal

# Nginx access logs (inside container)
docker exec scarmonit-web-portal tail -f /var/log/nginx/access.log

# Nginx error logs (inside container)
docker exec scarmonit-web-portal tail -f /var/log/nginx/error.log
```

### Performance Metrics

```bash
# Container stats
docker stats scarmonit-web-portal

# Resource usage
docker exec scarmonit-web-portal ps aux
```

---

## 🚨 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs scarmonit-web-portal

# Check nginx config
docker run --rm scarmonit/web-portal nginx -t
```

### Build Fails

```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker build --no-cache -t scarmonit/web-portal:latest .
```

### Performance Issues

```bash
# Check compression
curl -H "Accept-Encoding: gzip" -I http://localhost:8080/

# Check cache headers
curl -I http://localhost:8080/assets/index.js
```

---

## 🌐 Production Deployment Options

### Option 1: Cloudflare Pages (Recommended)

```bash
# 1. Push to GitHub
git add .
git commit -m "Deploy web portal"
git push origin main

# 2. Configure Cloudflare Pages
# - Framework: Vite
# - Build command: npm run build
# - Output directory: dist
# - Environment: Node.js 20
```

**Benefits:**
- ✅ Free SSL/TLS
- ✅ Global CDN
- ✅ Automatic deployments
- ✅ DDoS protection
- ✅ Web Analytics

### Option 2: Docker on Cloud (AWS/GCP/Azure)

```bash
# Push to container registry
docker tag scarmonit/web-portal:latest gcr.io/YOUR_PROJECT/web-portal:latest
docker push gcr.io/YOUR_PROJECT/web-portal:latest

# Deploy to Cloud Run (GCP)
gcloud run deploy web-portal \
  --image gcr.io/YOUR_PROJECT/web-portal:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Option 3: Kubernetes

```bash
# Create deployment
kubectl create deployment web-portal --image=scarmonit/web-portal:latest

# Expose service
kubectl expose deployment web-portal --port=80 --type=LoadBalancer

# Check status
kubectl get pods
kubectl get services
```

---

## 📋 Deployment Checklist

### Before Deploy
- [ ] Run `npm run lint` (no errors)
- [ ] Run `npm run build` (successful)
- [ ] Check bundle size (< 150KB gzipped)
- [ ] Test locally with `npm run preview`
- [ ] Update environment variables
- [ ] Review security headers
- [ ] Test health check endpoint

### After Deploy
- [ ] Verify health check: `curl https://your-domain.com/health`
- [ ] Run Lighthouse audit (score > 90)
- [ ] Test all routes
- [ ] Check error logs
- [ ] Monitor performance metrics
- [ ] Verify HTTPS/SSL
- [ ] Test cross-browser compatibility

---

## 🔄 Update Strategy

### Rolling Update (Zero Downtime)

```bash
# Build new version
docker build -t scarmonit/web-portal:v2 .

# Start new container
docker run -d --name web-portal-v2 -p 8081:80 scarmonit/web-portal:v2

# Test new version
curl http://localhost:8081/health

# Update load balancer to point to new version
# Stop old container after verification
docker stop web-portal-v1
docker rm web-portal-v1
```

### Blue-Green Deployment

```bash
# Deploy to blue environment
docker-compose -f docker-compose.blue.yml up -d

# Switch traffic after testing
# Update DNS/load balancer

# Keep green as rollback option
```

---

## 📞 Support

**Documentation:**
- Performance Analysis: `PERFORMANCE_ANALYSIS.md`
- Architecture: `../docs/AI_CONTEXT.md`
- Migration Guide: `../docs/MIGRATION.md`

**Issues:**
- GitHub: https://github.com/scarmonit/architecture/issues
- Email: scarmonit@gmail.com

---

**Last Updated:** November 29, 2025  
**Version:** 1.0.0

