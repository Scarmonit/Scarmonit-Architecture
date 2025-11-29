# Scarmonit Architecture

Unified AI Infrastructure Architecture for autonomous agents, local LLM orchestration, and edge computing.

## 📂 Project Structure

```
Scarmonit-Architecture/
├── web-portal/          # Public landing page (Cloudflare Pages)
│   ├── index.html       # Main entry point with Chat Widget
│   ├── styles.css       # "Gemini Nano" futuristic styling
│   └── script.js        # UI interactions and Chat logic
│
├── agent-api/           # AI Agent Backend (Cloudflare Worker)
│   ├── src/
│   │   └── index.ts     # Main Worker logic (OpenAI compatible)
│   └── wrangler.toml    # Worker configuration
│
├── desktop-app/         # Local Client (Electron)
│   ├── main.js          # Electron entry point
│   ├── index.html       # Desktop UI
│   └── package.json     # Dependencies
│
└── docs/                # Documentation
    └── MIGRATION.md     # Migration history
```

## 🚀 Quick Start

### 1. Web Portal
The public face of the infrastructure.
```bash
cd web-portal
# Deploy to Cloudflare Pages
npx wrangler pages deploy . --project-name scarmonit-www
```

### 2. Agent API (Backend)
The brain handling requests and routing to LLMs.
```bash
cd agent-api
# Deploy Worker
npx wrangler deploy
```

### 3. Desktop App
The client for local interaction.
```bash
cd desktop-app
npm install
npm start
```

## 🛠 Development

This repository is structured for easy access by AI CLI tools (Claude, Cursor, Copilot). 
- **Root context:** Contains all sub-projects.
- **Clear separation:** Frontend, Backend, and Native Client are isolated.

## 🔗 Live Services
- **Website:** [scarmonit.com](https://scarmonit.com)
- **Agent API:** [agent.scarmonit.com](https://agent.scarmonit.com)
- **LM Studio:** [lm.scarmonit.com](https://lm.scarmonit.com)