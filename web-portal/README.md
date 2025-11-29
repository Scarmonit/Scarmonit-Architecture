# Web Portal

> Premium landing page for scarmonit.com with modern UI/UX

## 🌐 Live Sites

- **Production:** [scarmonit.com](https://scarmonit.com)
- **Preview:** [scarmonit-www.pages.dev](https://scarmonit-www.pages.dev)

## 🎨 Features

- **Modern Dark Theme** - Futuristic glassmorphism design
- **Animated Grid Background** - Subtle depth and texture
- **Service Cards** - Autonomous Agents, Neural Network, Edge Compute
- **Enhanced Hover Effects** - Cyan glow with multi-layer shadows
- **AI Chat Widget** - Interactive assistant (bottom-right)
- **Status Indicators** - Real-time system status with pulse animation
- **Responsive Design** - Works on all devices

## 🚀 Local Development

### Prerequisites
- Python 3.x (for local server)
- OR any static file server

### Run Locally

**Option 1: Python**
```bash
cd web-portal
python -m http.server 8080
# Visit http://localhost:8080
```

**Option 2: npx**
```bash
cd web-portal
npx serve .
```

**Option 3: From root**
```bash
npm run dev:web
```

## 📦 Deployment

### Cloudflare Pages

```bash
# From web-portal directory
wrangler pages deploy . --project-name=scarmonit-www

# From root directory
npm run deploy:web
```

### Configuration

**Project Settings:**
- Build command: None (static site)
- Build output: `.` (current directory)
- Root directory: `web-portal`

**Custom Domain:**
- Production: scarmonit.com
- DNS: CNAME → scarmonit-www.pages.dev

## 📁 Structure

```
web-portal/
├── index.html       # Main HTML (hero, services, footer)
├── styles.css       # Enhanced CSS with animations
├── script.js        # Interactive features & chat
└── README.md        # This file
```

## 🎯 Key Components

### Hero Section
- System status badge with pulse animation
- Gradient title text
- Two CTA buttons (Launch Console, View Architecture)

### Service Cards
- **Autonomous Agents** → agent.scarmonit.com
- **Neural Network** → lm.scarmonit.com  
- **Edge Compute** → Status indicator

### Chat Widget
- Toggle button (bottom-right)
- Glass morphism design
- Message input with send button
- AI responses (placeholder for integration)

## 🎨 Design System

### Colors
```css
--bg-space: #030014
--accent-cyan: #00f0ff
--accent-purple: #b026ff
--accent-pink: #ff00aa
```

### Typography
- **Font:** Inter (Google Fonts)
- **Mono:** JetBrains Mono
- **Sizes:** Clamp-based responsive scaling

### Effects
- Animated grid background
- Glassmorphism cards
- Hover glow with cyan borders
- Smooth transitions (cubic-bezier)
- Scroll-triggered fade-in

## 🧪 Testing

### Manual Tests
1. Load page and verify grid background
2. Hover over service cards → cyan glow
3. Click buttons → verify navigation
4. Open chat widget → verify UI
5. Test on mobile devices

### Browser Compatibility
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ⚠️ IE11 not supported

## 🔧 Maintenance

### Update Content
Edit `index.html` for text/structure changes.

### Update Styles  
Edit `styles.css` for visual changes.

### Update Interactions
Edit `script.js` for behavior changes.

### Deploy Changes
```bash
npm run deploy:web
# OR
wrangler pages deploy . --project-name=scarmonit-www
```

## 🔐 Security

- All traffic over HTTPS
- Cloudflare WAF protection
- No sensitive data in client code
- CSP headers recommended

## 📊 Performance

- **Load Time:** < 2s
- **LCP:** < 1.5s
- **FID:** < 100ms
- **CLS:** < 0.1

## 🐛 Troubleshooting

**Issue:** Chat widget not opening  
**Fix:** Check JavaScript console for errors

**Issue:** Animations not smooth  
**Fix:** Disable browser extensions, check GPU acceleration

**Issue:** Deployment fails  
**Fix:** Verify wrangler authentication: `wrangler whoami`

## 📝 Notes

- No build step required (pure HTML/CSS/JS)
- Fast deployments (< 1 min)
- Git-based continuous deployment available
- Preview deployments for all commits

---

**Last Updated:** November 28, 2025
