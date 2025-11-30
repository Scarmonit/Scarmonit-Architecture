FROM node:20-alpine

WORKDIR /app

# Copy mcp-server dependencies and build
COPY mcp-server/package.json mcp-server/package-lock.json* ./mcp-server/
WORKDIR /app/mcp-server
RUN npm ci
COPY mcp-server/ ./
RUN npm run build

# Copy mcp-bridge dependencies
WORKDIR /app/mcp-bridge
COPY mcp-bridge/package.json mcp-bridge/package-lock.json* ./
RUN npm ci

# Copy mcp-bridge source
COPY mcp-bridge/ ./

# Copy .github/agents for mcp-server to access
WORKDIR /app
COPY .github/agents ./.github/agents

# Set workdir back to bridge
WORKDIR /app/mcp-bridge

# Environment variables
ENV NODE_ENV=production
ENV MCP_SERVER_PATH=/app/mcp-server/build/index.js

EXPOSE 3001

CMD ["node", "server.js"]
