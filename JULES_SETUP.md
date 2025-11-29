# Jules Integration Guide

This guide summarizes the official Jules documentation relevant to the Scarmonit Architecture repository and explains how to configure Jules to work effectively with this monorepo.

## Why Jules?

Scarmonit Architecture is a monorepo that consolidates autonomous agents, API servers, desktop apps and a web portal. Jules can automate code maintenance, run tests and refactor code, but it needs guidance to understand your project’s conventions.

## Agents & Tools Description

The `AGENTS.md` file at the root of the repo should describe the purpose of each workspace (web portal, agent API, desktop app, GitHub Copilot extension, MCP server and monitor) along with coding standards, naming conventions and important build/test commands. Jules uses this file to understand how to work on your codebase. Keep this file up to date whenever project structure or conventions change.

## Environment Setup

*   **Secure VM:** Jules runs every task inside a secure virtual machine (VM). The VM clones your repository, installs dependencies and runs tests in isolation.
*   **Infer Configuration:** For simple projects, Jules reads `AGENTS.md` or your `README.md` to infer how to install dependencies and run tests. Ensure these files clearly document the commands to bootstrap your project.
*   **Initial Setup Script:** For complex projects, provide an Initial Setup script in your Jules configuration. This script should:
    1.  Install dependencies (e.g., run `npm run install:all` for Scarmonit’s workspaces).
    2.  Build all workspaces (e.g., `npm run build` or `cd <workspace> && npm run build`).
    3.  Run tests (e.g., `npm test`).
*   **Run and Snapshot:** After entering the setup commands, run **Run and Snapshot** in the Jules UI to verify the setup and create a snapshot for future tasks.

## Available Tools

The Jules VM comes with many pre‑installed tools (Node.js, npm, Yarn, Python, Go, Java, Rust, Docker, compilers, etc.). You can call `node --version` or `python --version` in your setup script to verify tool versions. If your project needs additional dependencies, install them in the setup script.

## Best Practices for Jules Tasks

*   **Keep AGENTS.md up to date:** Jules uses this file to understand your project’s conventions, tools and how to interact with your agents.
*   **Provide clear Build & Test commands:** Use the existing `AGENTS.md` sections (Build & Test Commands, Validation Steps, Key Technologies, etc.) as guidance.
*   **External Access:** Jules cannot access external URLs by default. For documentation reading tasks, include relevant docs in the repository or summarise them in `AGENTS.md`.
*   **Plan Review:** Before making large changes, Jules generates a plan. Review the plan carefully before approving any modifications.
*   **Commit Messages:** Use descriptive commit messages following Conventional Commits. Ensure that changes do not break existing functionality and verify that no secrets are exposed.
