# Web Portal

> **Scarmonit.com** - Premium futuristic AI infrastructure landing page

## 🌐 Live Site

**Production:** [https://scarmonit.com](https://scarmonit.com)  
**Preview:** [https://d8221c76.scarmonit-www.pages.dev](https://d8221c76.scarmonit-www.pages.dev)

## 📋 Overview

The Scarmonit web portal is the primary public-facing interface showcasing the AI infrastructure ecosystem. It features:

- **Interactive service cards** with nano-effect hover animations
- **Integrated AI chat interface** for user engagement
- **Responsive design** optimized for all devices
- **Real-time status indicators** (System Online • v2.5.0)

## 🎨 Features

### Service Cards
1. **Autonomous Agents** 🤖
   - Self-directed AI agents
   - Complex task execution
   - Link: [https://agent.scarmonit.com](https://agent.scarmonit.com)

2. **Neural Network** 🧠
   - Local LLM inference
   - OpenAI-compatible API
   - Link: [https://lm.scarmonit.com](https://lm.scarmonit.com)

3. **Edge Compute** ⚡
   - Cloudflare Workers
   - Distributed serverless
   - Status: Active

## 🚀 Development

### Prerequisites
```bash
npm install -g http-server  # For local testing
```

### Local Development
```bash
cd web-portal

# Option 1: Simple HTTP server
http-server -p 8080

# Option 2: Python server
python -m http.server 8080

# Visit http://localhost:8080
```

### File Structure
```
web-portal/
├── index.html       # Main HTML file
├── styles.css       # Stylesheet
├── script.js        # JavaScript logic
├── public/          # Static assets
│   ├── images/
│   └── icons/
└── .env.example     # Environment variables template
```

## 🌐 Deployment

### Cloudflare Pages

1. **Connect Repository**
   - Go to Cloudflare Pages dashboard
   - Connect Scarmonit-Architecture repo
   - Set build directory: `web-portal`

2. **Build Configuration**
   ```yaml
   Build command: (none)
   Build output directory: /
   Root directory: web-portal
   ```

3. **Custom Domain**
   - Add custom domain: `scarmonit.com`
   - Configure DNS: CNAME to Cloudflare Pages

### Manual Deployment
```bash
# Deploy to Cloudflare Pages
cd web-portal
npx wrangler pages deploy . --project-name=scarmonit-www
```

## 🔧 Configuration

### Environment Variables

Create `.env` file:
```env
API_ENDPOINT=https://lm.scarmonit.com
AGENT_DASHBOARD=https://agent.scarmonit.com
ENVIRONMENT=production
```

### Update API Endpoints

In `script.js`, update:
```javascript
const API_BASE_URL = 'https://lm.scarmonit.com';
const AGENT_URL = 'https://agent.scarmonit.com';
```

## 🎯 Key Components

### AI Chat Interface
- Located in footer
- Powered by Scarmonit AI
- Real-time responses

### Status Indicator
- Real-time system status
- Version display (v2.5.0)
- Operational status

### Navigation Links
- Agent Dashboard
- LM Studio API
- Documentation

## 📦 Migration from LLM Directory

Copy files from your current location:
```bash
# From C:\Users\scarm\LLM\
cp -r /path/to/LLM/* ./web-portal/
```

## 🧪 Testing

### Browser Testing
- Chrome/Edge: ✅ Fully supported
- Firefox: ✅ Fully supported
- Safari: ✅ Fully supported
- Mobile: ✅ Responsive design

### Performance
- Lighthouse Score: 95+
- First Contentful Paint: < 1s
- Time to Interactive: < 2s

## 🔐 Security

- HTTPS enforced
- Content Security Policy configured
- No sensitive data in client-side code
- API keys stored securely (never in frontend)

## 📝 Maintenance

### Update Content
1. Edit `index.html` for structure changes
2. Update `styles.css` for styling
3. Modify `script.js` for functionality

### Version Updates
Update version in `index.html`:
```html
<div class="status">System Online • v2.5.0</div>
```

## 🐛 Troubleshooting

### Issue: Styles not loading
**Solution:** Check CSS file path and clear browser cache

### Issue: Chat not working
**Solution:** Verify API endpoint and CORS settings

### Issue: Links broken
**Solution:** Ensure all links use HTTPS and correct domains

## 📧 Support

**Email:** Scarmonit@gmail.com  
**GitHub Issues:** [Report an issue](https://github.com/Scarmonit/Scarmonit-Architecture/issues)

---

**Tech Stack:** HTML5, CSS3, JavaScript, Cloudflare Pages  
**Status:** ✅ Production Ready  
**Last Updated:** November 2025
