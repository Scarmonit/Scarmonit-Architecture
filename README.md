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
├── mcp-server/          # MCP Server & Integrations
│   ├── src/             # TypeScript source
│   └── package.json
│
├── mcp-bridge/          # HTTP Bridge for MCP Server
│   ├── server.js
│   └── Dockerfile
│
├── docs/                # Comprehensive documentation
│   ├── setup.md         # Setup and installation
│   ├── deployment.md    # Deployment guides
│   └── api.md           # API documentation
│
└── scripts/             # Automation and deployment scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Git
- Cloudflare account (for worker deployment)

### 🐳 Docker Setup (Recommended)

We provide a `docker-compose` setup to run the Web Portal and MCP Server (with Bridge) together.

```bash
# Clone the repository
git clone https://github.com/Scarmonit/Scarmonit-Architecture.git
cd Scarmonit-Architecture

# Run services
docker-compose up --build
```

- **Web Portal:** http://localhost:8080
- **MCP Bridge:** http://localhost:3000 (Internal: 3001)

### 💻 Local Development

```bash
# Install all dependencies
npm run install:all

# Start full stack (Web, API, Desktop, MCP)
npm run dev

# Or start individual components
npm run dev:web
npm run dev:api
npm run dev:mcp
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

**Tech Stack:** Node.js, TypeScript, MCP SDK, Datalore Cloud API

## CI Status

[![Agent API CI](https://github.com/Scarmonit/Scarmonit-Architecture/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Scarmonit/Scarmonit-Architecture/actions/workflows/ci.yml)

## 🔧 Development

### Working with AI CLI Tools

This repository is optimized for AI CLI tools like **Claude Code CLI**, **Cursor**, and **GitHub Copilot**:

```bash
# Example: Using Claude Code CLI
code-cli --project=Scarmonit-Architecture --task="Add new API endpoint"
```

## 🌐 Deployment

### Web Portal
```bash
cd web-portal
npm run deploy
```

### Agent API
```bash
cd agent-api
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

## 🔐 Environment Variables

Create `.env` files in each component directory based on `.env.example`.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary to Scarmonit Industries.

## 📧 Contact

**Email:** Scarmonit@gmail.com

---

<div align="center">
  <strong>Built with ⚡ by Scarmonit Industries</strong>
  <br>
  <em>Intelligence at the Speed of Thought</em>
</div>
