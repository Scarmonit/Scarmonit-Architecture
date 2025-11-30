#!/usr/bin/env python3
"""
Scarmonit Discord Bot
A personal agent bot for Parker to manage infrastructure from mobile.

Commands:
  !prs [repo]        - Check open PRs (all repos or specific)
  !deploy <service>  - Trigger deployment
  !agent <task>      - Run orchestrator task
  !status            - Infrastructure status
  !run <command>     - Execute shell command on server
  !help              - Show commands
"""

import os
import sys
import json
import asyncio
import aiohttp
import subprocess
from datetime import datetime
from typing import Optional
import discord
from discord.ext import commands
from discord import app_commands

# Configuration
DISCORD_TOKEN = os.environ.get("DISCORD_TOKEN")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
GITHUB_USERNAME = os.environ.get("GITHUB_USERNAME", "Scarmonit")
ALLOWED_USER_IDS = os.environ.get("ALLOWED_USER_IDS", "").split(",")
WEBHOOK_SECRET = os.environ.get("WEBHOOK_SECRET", "scarmonit-secret")

REPOS = [
    "Scarmonit/A2A",
    "Scarmonit/automoutazion", 
    "Scarmonit/Autonomous",
    "Scarmonit/orchestrator",
    "Scarmonit/Scarmonit-Architecture",
]

intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True

bot = commands.Bot(command_prefix="!", intents=intents, help_command=None)

def is_authorized(ctx):
    return str(ctx.author.id) in ALLOWED_USER_IDS or not ALLOWED_USER_IDS[0]

class GitHubAPI:
    def __init__(self, token: str):
        self.token = token
        self.base_url = "https://api.github.com"
        self.headers = {"Authorization": f"token {token}", "Accept": "application/vnd.github.v3+json"}

    async def get_prs(self, repo: str, state: str = "open") -> list:
        async with aiohttp.ClientSession() as session:
            url = f"{self.base_url}/repos/{repo}/pulls?state={state}"
            async with session.get(url, headers=self.headers) as resp:
                return await resp.json() if resp.status == 200 else []

    async def get_all_prs(self, state: str = "open") -> dict:
        results = {}
        for repo in REPOS:
            prs = await self.get_prs(repo, state)
            if prs:
                results[repo] = prs
        return results

class DeployManager:
    def __init__(self):
        self.services = {
            "cloudflare": self._deploy_cloudflare,
            "railway": self._deploy_railway,
            "vercel": self._deploy_vercel,
            "hetzner": self._deploy_hetzner,
        }

    async def deploy(self, service: str, project: Optional[str] = None) -> str:
        if service.lower() in self.services:
            return await self.services[service.lower()](project)
        return f"❌ Unknown service: {service}. Available: {', '.join(self.services.keys())}"

    async def _deploy_cloudflare(self, project: Optional[str]) -> str:
        try:
            cmd = "cd ~/projects && wrangler deploy" if not project else f"cd ~/projects/{project} && wrangler deploy"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=120)
            return f"✅ Cloudflare deploy successful" if result.returncode == 0 else f"❌ Deploy failed\n```{result.stderr[-500:]}```"
        except Exception as e:
            return f"❌ Error: {str(e)}"

    async def _deploy_railway(self, project: Optional[str]) -> str:
        try:
            cmd = "railway up" if not project else f"railway up --service {project}"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=120)
            return f"✅ Railway deploy successful" if result.returncode == 0 else f"❌ Deploy failed"
        except Exception as e:
            return f"❌ Error: {str(e)}"

    async def _deploy_vercel(self, project: Optional[str]) -> str:
        try:
            cmd = "vercel --prod" if not project else f"cd ~/projects/{project} && vercel --prod"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=120)
            return f"✅ Vercel deploy successful" if result.returncode == 0 else f"❌ Deploy failed"
        except Exception as e:
            return f"❌ Error: {str(e)}"

    async def _deploy_hetzner(self, project: Optional[str]) -> str:
        try:
            cmd = f"ssh hetzner 'cd /opt/{project or 'app'} && docker-compose pull && docker-compose up -d'"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=180)
            return f"✅ Hetzner deploy successful" if result.returncode == 0 else f"❌ Deploy failed"
        except Exception as e:
            return f"❌ Error: {str(e)}"

class AgentOrchestrator:
    def __init__(self):
        self.orchestrator_url = os.environ.get("ORCHESTRATOR_URL", "http://localhost:8080")

    async def run_task(self, task: str) -> str:
        try:
            async with aiohttp.ClientSession() as session:
                payload = {"task": task, "source": "discord", "timestamp": datetime.utcnow().isoformat()}
                async with session.post(f"{self.orchestrator_url}/task", json=payload, timeout=aiohttp.ClientTimeout(total=300)) as resp:
                    if resp.status == 200:
                        result = await resp.json()
                        return f"✅ Task completed\n```{json.dumps(result, indent=2)[:1500]}```"
                    return f"❌ Task failed: {resp.status}"
        except:
            return await self._run_local(task)

    async def _run_local(self, task: str) -> str:
        task_map = {"check logs": "journalctl -u app --since '1 hour ago' | tail -50", "disk space": "df -h", "memory": "free -h", "processes": "ps aux --sort=-%mem | head -20", "docker status": "docker ps -a"}
        for key, cmd in task_map.items():
            if key in task.lower():
                try:
                    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
                    return f"📊 {key.title()}\n```{result.stdout[:1500]}```"
                except Exception as e:
                    return f"❌ Error: {str(e)}"
        return f"🤔 Unknown task: {task}"

github = GitHubAPI(GITHUB_TOKEN) if GITHUB_TOKEN else None
deployer = DeployManager()
orchestrator = AgentOrchestrator()

@bot.event
async def on_ready():
    print(f"🤖 {bot.user} is online!")
    try:
        synced = await bot.tree.sync()
        print(f"✅ Synced {len(synced)} slash commands")
    except Exception as e:
        print(f"❌ Failed to sync: {e}")
    await bot.change_presence(activity=discord.Activity(type=discord.ActivityType.watching, name="your infrastructure 👁️"))

@bot.command(name="help")
async def help_command(ctx):
    embed = discord.Embed(title="🤖 Scarmonit Bot", description="Your personal infrastructure agent", color=discord.Color.blue())
    commands_list = """**GitHub**: `!prs [repo]` - Check open PRs
**Deploy**: `!deploy <platform> [project]` - Deploy (cloudflare/railway/vercel/hetzner)
**Agent**: `!agent <task>` - Run task | `!run <cmd>` - Shell command
**Status**: `!status` - Overview | `!ping` - Latency"""
    embed.add_field(name="Commands", value=commands_list, inline=False)
    await ctx.send(embed=embed)

@bot.command(name="ping")
async def ping(ctx):
    await ctx.send(f"🏓 Pong! `{round(bot.latency * 1000)}ms`")

@bot.command(name="prs")
async def prs(ctx, repo: Optional[str] = None):
    if not github:
        await ctx.send("❌ GitHub token not configured")
        return
    async with ctx.typing():
        if repo and repo.lower() != "all":
            full_repo = repo if "/" in repo else f"{GITHUB_USERNAME}/{repo}"
            prs_list = await github.get_prs(full_repo)
            if not prs_list:
                await ctx.send(f"✅ No open PRs in `{full_repo}`")
                return
            embed = discord.Embed(title=f"📋 Open PRs: {full_repo}", color=discord.Color.green())
            for pr in prs_list[:10]:
                embed.add_field(name=f"#{pr['number']} {pr['title'][:50]}", value=f"by {pr['user']['login']} • [View]({pr['html_url']})", inline=False)
            await ctx.send(embed=embed)
        else:
            all_prs = await github.get_all_prs()
            if not all_prs:
                await ctx.send("✅ No open PRs across all repos!")
                return
            embed = discord.Embed(title="📋 Open PRs Across All Repos", color=discord.Color.green())
            for repo_name, prs_list in all_prs.items():
                pr_text = "\n".join([f"• #{pr['number']} {pr['title'][:40]}..." for pr in prs_list[:5]])
                embed.add_field(name=f"{repo_name} ({len(prs_list)})", value=pr_text or "None", inline=False)
            await ctx.send(embed=embed)

@bot.command(name="deploy")
async def deploy(ctx, platform: str, project: Optional[str] = None):
    if not is_authorized(ctx):
        await ctx.send("❌ Unauthorized")
        return
    await ctx.send(f"🚀 Deploying to {platform}...")
    async with ctx.typing():
        result = await deployer.deploy(platform, project)
        await ctx.send(result[:2000])

@bot.command(name="agent")
async def agent(ctx, *, task: str):
    if not is_authorized(ctx):
        await ctx.send("❌ Unauthorized")
        return
    await ctx.send(f"🤖 Running task: `{task}`")
    async with ctx.typing():
        result = await orchestrator.run_task(task)
        await ctx.send(result)

@bot.command(name="run")
async def run_command(ctx, *, command: str):
    if not is_authorized(ctx):
        await ctx.send("❌ Unauthorized")
        return
    dangerous = ["rm -rf", "mkfs", "> /dev", "dd if=", ":(){ :|:& };:"]
    if any(d in command for d in dangerous):
        await ctx.send("❌ Command blocked for safety")
        return
    await ctx.send(f"⚡ Running: `{command[:50]}...`")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=60)
        output = result.stdout or result.stderr or "No output"
        await ctx.send(f"```{output[:1800]}```")
    except subprocess.TimeoutExpired:
        await ctx.send("⏱️ Command timed out")
    except Exception as e:
        await ctx.send(f"❌ Error: {str(e)}")

@bot.command(name="status")
async def status(ctx):
    embed = discord.Embed(title="📊 Infrastructure Status", color=discord.Color.blue(), timestamp=datetime.utcnow())
    try:
        disk = subprocess.run("df -h / | tail -1 | awk '{print $5}'", shell=True, capture_output=True, text=True)
        mem = subprocess.run("free -h | grep Mem | awk '{print $3\"/\"$2}'", shell=True, capture_output=True, text=True)
        embed.add_field(name="💾 Disk", value=disk.stdout.strip() or "N/A", inline=True)
        embed.add_field(name="🧠 Memory", value=mem.stdout.strip() or "N/A", inline=True)
    except Exception as e:
        embed.add_field(name="Error", value=str(e), inline=False)
    if github:
        try:
            all_prs = await github.get_all_prs()
            total_prs = sum(len(prs) for prs in all_prs.values())
            embed.add_field(name="📋 Open PRs", value=str(total_prs), inline=True)
        except:
            pass
    await ctx.send(embed=embed)

@bot.tree.command(name="prs", description="Check open pull requests")
@app_commands.describe(repo="Repository name (optional)")
async def slash_prs(interaction: discord.Interaction, repo: Optional[str] = None):
    await interaction.response.defer()
    if not github:
        await interaction.followup.send("❌ GitHub token not configured")
        return
    all_prs = await github.get_all_prs()
    total = sum(len(p) for p in all_prs.values())
    await interaction.followup.send(f"📋 **{total}** open PRs across {len(all_prs)} repos")

@bot.tree.command(name="deploy", description="Deploy to a platform")
@app_commands.describe(platform="Deployment platform", project="Project name (optional)")
@app_commands.choices(platform=[
    app_commands.Choice(name="Cloudflare", value="cloudflare"),
    app_commands.Choice(name="Railway", value="railway"),
    app_commands.Choice(name="Vercel", value="vercel"),
    app_commands.Choice(name="Hetzner", value="hetzner"),
])
async def slash_deploy(interaction: discord.Interaction, platform: str, project: Optional[str] = None):
    await interaction.response.defer()
    result = await deployer.deploy(platform, project)
    await interaction.followup.send(result[:2000])

@bot.event
async def on_command_error(ctx, error):
    if isinstance(error, commands.MissingRequiredArgument):
        await ctx.send(f"❌ Missing argument: `{error.param.name}`")
    elif not isinstance(error, commands.CommandNotFound):
        await ctx.send(f"❌ Error: {str(error)[:200]}")

if __name__ == "__main__":
    if not DISCORD_TOKEN:
        print("❌ DISCORD_TOKEN required")
        sys.exit(1)
    print("🚀 Starting Scarmonit Bot...")
    bot.run(DISCORD_TOKEN)
