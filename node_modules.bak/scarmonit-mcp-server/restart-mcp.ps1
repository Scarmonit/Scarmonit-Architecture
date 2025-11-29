# Scarmonit MCP Server - Restart Script
# Kills existing Node processes and allows fresh MCP server start

Write-Host "🔄 Restarting Scarmonit MCP Server..." -ForegroundColor Cyan

# Kill existing Node processes
Write-Host "`n📌 Stopping existing Node processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force
    Write-Host "   ✅ Stopped $($nodeProcesses.Count) Node process(es)" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No Node processes running" -ForegroundColor Gray
}

Start-Sleep -Seconds 1

# Verify MCP server file exists
$mcpServerPath = "C:\Users\scarm\IdeaProjects\Scarmonit-Architecture\mcp-server\index.js"
if (Test-Path $mcpServerPath) {
    Write-Host "`n✅ MCP Server found: $mcpServerPath" -ForegroundColor Green
} else {
    Write-Host "`n❌ ERROR: MCP Server not found at: $mcpServerPath" -ForegroundColor Red
    exit 1
}

# Check agents directory
$agentsDir = "C:\Users\scarm\IdeaProjects\Scarmonit-Architecture\.github\agents"
if (Test-Path $agentsDir) {
    $agentFiles = Get-ChildItem -Path $agentsDir -Filter "*.md"
    Write-Host "✅ Agents directory found: $($agentFiles.Count) persona(s)" -ForegroundColor Green
} else {
    Write-Host "❌ WARNING: Agents directory not found" -ForegroundColor Yellow
}

# Check MCP config
$mcpConfigPath = "$env:LOCALAPPDATA\github-copilot\intellij\mcp.json"
if (Test-Path $mcpConfigPath) {
    Write-Host "✅ MCP config found: $mcpConfigPath" -ForegroundColor Green

    $mcpConfig = Get-Content $mcpConfigPath -Raw | ConvertFrom-Json
    if ($mcpConfig.mcpServers.'scarmonit-architecture') {
        Write-Host "✅ Scarmonit MCP server registered in config" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Scarmonit MCP server NOT in config" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  MCP config not found (may be created on first run)" -ForegroundColor Yellow
}

Write-Host "`n🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Restart JetBrains IDE (IntelliJ/WebStorm/PyCharm)" -ForegroundColor White
Write-Host "   2. Open Copilot Chat" -ForegroundColor White
Write-Host "   3. Run: list_agents" -ForegroundColor White
Write-Host "`n📚 Quick Reference: C:\Users\scarm\Desktop\COPILOT_AGENTS_QUICKREF.txt" -ForegroundColor Gray
Write-Host "📖 Full Guide: MCP_AGENT_USAGE.md`n" -ForegroundColor Gray
