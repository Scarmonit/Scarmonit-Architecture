# AI Context & System Prompt

> **Note to AI Assistants (Junie, Lingma, etc.):** use this file to understand the project context.

## Project Identity
**Name:** Scarmonit-Architecture
**Goal:** Unified AI Infrastructure (Web, API, Desktop).

## Monorepo Structure
1.  **`web-portal/`**:
    *   **Tech:** HTML, CSS, JavaScript (Cloudflare Pages).
    *   **Role:** Landing page and lightweight web interface.
2.  **`agent-api/`**:
    *   **Tech:** TypeScript, Cloudflare Workers.
    *   **Role:** The brain. OpenAI-compatible API wrapper, rate limiting, local LLM orchestration.
3.  **`desktop-app/`**:
    *   **Tech:** Electron, React, Node.js.
    *   **Role:** The heavy client. Local model management, rich chat interface.

## Key Architecture Rules
*   **Deployment:** Everything deploys to Cloudflare (Pages/Workers) except the desktop app build.
*   **API Communication:** Desktop app talks to `agent-api` or directly to local LLM (e.g., LM Studio on localhost:1234).
*   **State:** Prefer local state in React; use Context for global app state.

## Developer Guidelines
*   **Linting:** ESLint recommended rules.
*   **Formatting:** Prettier default (2 spaces).
*   **Testing:** No heavy test suite yet; manual verification required for UI.
