# Scarmonit Architecture

> **Unified AI Infrastructure** - A consolidated ecosystem for autonomous AI agents, local LLM orchestration, and intelligent infrastructure management.

[![System Status](https://img.shields.io/badge/status-online-success)](https://scarmonit.com)
[![Version](https://img.shields.io/badge/version-2.5.0-blue)](https://github.com/Scarmonit/Scarmonit-Architecture)

## 🏗️ Architecture Overview

This repository consolidates all Scarmonit AI infrastructure components into a unified, AI CLI-friendly architecture.

```
Scarmonit-Architecture/
├── web-portal/          # Main website (scarmonit.com)
│   ├── public/          # Static assets
│   ├── src/             # React/HTML source
│   └── package.json
│
├── agent-api/           # Cloudflare Worker (lm-studio-lfm2-agent)
│   ├── src/             # Worker TypeScript code
│   ├── wrangler.toml    # Cloudflare configuration
│   └── package.json
│
├── desktop-app/         # AI Chat Desktop Application
│   ├── src/             # Electron/Desktop app source
│   └── package.json
│
├── docs/                # Comprehensive documentation
│   ├── setup.md         # Setup and installation
│   ├── deployment.md    # Deployment guides
│   └── api.md           # API documentation
│
└── scripts/             # Automation and deployment scripts
    ├── deploy-all.sh    # Deploy all components
    ├── setup-local.sh   # Local development setup
    └── backup.sh        # Backup configurations
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Git
- Cloudflare account (for worker deployment)
- Netlify/Cloudflare Pages (for web deployment)

### Clone & Setup
```bash
# Clone the repository
git clone https://github.com/Scarmonit/Scarmonit-Architecture.git
cd Scarmonit-Architecture

# Install all dependencies
npm run install:all

# Start development environment
npm run dev
```

## 📦 Components

### 1. Web Portal (`web-portal/`)
**Live:** [https://scarmonit.com](https://scarmonit.com)

- Premium futuristic AI infrastructure landing page
- Interactive service cards with nano-effects
- Integrated AI chat interface
- Responsive design

**Tech Stack:** HTML, CSS, JavaScript, Cloudflare Pages

### 2. Agent API (`agent-api/`)
**Endpoint:** [https://lm.scarmonit.com](https://lm.scarmonit.com)

- OpenAI-compatible API wrapper
- Local LM Studio integration
- Cloudflare Worker edge deployment
- Rate limiting and authentication

**Tech Stack:** TypeScript, Cloudflare Workers, Wrangler

### 3. Desktop App (`desktop-app/`)

- AI chat desktop application
- Multi-LLM support (Claude, Gemini, ChatGPT)
- Local and cloud model orchestration
- Electron-based cross-platform

**Tech Stack:** Electron, React, Node.js

### 4. MCP Server & Integrations (`mcp-server/`)

**Status:** Active | **Datalore Integration:** ✅ Connected

Model Context Protocol (MCP) server providing AI tools and integrations:

#### Features:
- **Infrastructure Monitoring**: Real-time health checks for web and API components
- **Documentation Query**: Intelligent search across architecture docs
- **Datalore Cloud Integration**: Full connectivity for data science notebooks

#### Datalore Cloud Setup:
```bash
# From project root:
npm run dev:mcp
```

#### Available MCP Tools:
1. `check_system_status` - Monitor infrastructure health
2. `query_docs` - Search documentation
3. `check_datalore_status` - Verify Datalore integration

**Tech Stack:** Node.js, TypeScript, MCP SDK, Datalore Cloud API

## 🔧 Development

### Working with AI CLI Tools

This repository is optimized for AI CLI tools like **Claude Code CLI**, **Cursor**, and **GitHub Copilot**:

```bash
# Example: Using Claude Code CLI
code-cli --project=Scarmonit-Architecture --task="Add new API endpoint"

# Example: Quick navigation
# All components have clear entry points:
# - web-portal/index.html
# - agent-api/src/index.ts
# - desktop-app/src/main.js
```

### Local Development

**Web Portal:**
```bash
cd web-portal
npm install
npm run dev
```

**Agent API:**
```bash
cd agent-api
npm install
wrangler dev
```

**Desktop App:**
```bash
cd desktop-app
npm install
npm start
```

## 🌐 Deployment

### Web Portal
```bash
cd web-portal
# Deploy to Cloudflare Pages
npm run deploy
```

### Agent API
```bash
cd agent-api
# Deploy to Cloudflare Workers
wrangler deploy
```

### Full Stack Deployment
```bash
# Deploy everything at once
npm run deploy:all
```

## 📚 Documentation

- **[Setup Guide](docs/setup.md)** - Complete setup instructions
- **[Deployment Guide](docs/deployment.md)** - Production deployment
- **[API Documentation](docs/api.md)** - API reference
- **[Architecture Decisions](docs/architecture.md)** - Design decisions
- **[AI Model Deployment](docs/AI_MODEL_DEPLOYMENT.md)** - Best practices for AI model deployment

## 🔐 Environment Variables

Create `.env` files in each component directory:

```env
# agent-api/.env
LM_STUDIO_URL=http://localhost:1234/v1
API_KEY=your_api_key_here

# desktop-app/.env  
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary to Scarmonit Industries.

## 🔗 Links

- **Website:** [https://scarmonit.com](https://scarmonit.com)
- **Agent Dashboard:** [https://agent.scarmonit.com](https://agent.scarmonit.com)
- **API Endpoint:** [https://lm.scarmonit.com](https://lm.scarmonit.com)
- **GitHub:** [https://github.com/Scarmonit](https://github.com/Scarmonit)

## 📧 Contact

**Email:** Scarmonit@gmail.com

---

<div align="center">
  <strong>Built with ⚡ by Scarmonit Industries</strong>
  <br>
  <em>Intelligence at the Speed of Thought</em>
</div>

## 🛠️ Troubleshooting & Support

### JetBrains IDE Activation Issues
If you're experiencing activation problems with JetBrains IDEs (IntelliJ, WebStorm, PyCharm, etc.):

**Run Diagnostic Tool:**
```powershell
.\diagnose-activation.ps1
```

**Common Issues:**
- Activation fails with corrupted data or DnsFilter error
- ja-netfilter blocking brucege.com
- Cannot access activation server
- Mac "Permission denied" error

**Quick Fixes:**
- Update plugin to latest version
- Edit ja-netfilter DNS config if installed
- Use offline activation if network blocked
- Fix permissions on Mac: `sudo chmod 777 ~/.config`

**📖 Full Guide:** [docs/JETBRAINS_ACTIVATION_GUIDE.md](docs/JETBRAINS_ACTIVATION_GUIDE.md)

**Support Channels:**
- WeChat: gejun12311
- QQ Group: 575733084

### MCP Agent Personas Issues
If agent personas aren't loading in Copilot Chat:

**Run Diagnostic:**
```powershell
.\mcp-server\restart-mcp.ps1
```

**Test Tools:
```
Run MCP tool list_agents
```

**📖 Full Guide:** [MCP_AGENT_USAGE.md](MCP_AGENT_USAGE.md)
