# 🤖 Scarmonit Discord Bot

Personal infrastructure agent for managing deployments, PRs, and server tasks from Discord mobile.

## Quick Deploy

### Docker (on your server)
```bash
cd discord-bot
cp .env.example .env
# Edit .env with your tokens
docker-compose up -d
```

### Railway
```bash
cd discord-bot
railway up
```

## Discord Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select "Scarmonit" application
3. **Bot** tab: Reset Token, enable **Message Content Intent**
4. **OAuth2 → URL Generator**: Scopes `bot` + `applications.commands`, Permissions: Send Messages, Read History, View Channels
5. Use URL to invite bot to your server

## Commands

| Command | Description |
|---------|-------------|
| `!prs [repo]` | Check open PRs |
| `!deploy <platform> [project]` | Deploy (cloudflare/railway/vercel/hetzner) |
| `!agent <task>` | Run orchestrator task |
| `!run <cmd>` | Execute shell command |
| `!status` | Infrastructure overview |
| `!ping` | Bot latency |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_TOKEN` | Yes | Discord bot token |
| `GITHUB_TOKEN` | No | GitHub PAT for PR access |
| `ALLOWED_USER_IDS` | No | Your Discord user ID |
| `ORCHESTRATOR_URL` | No | Orchestrator service URL |
