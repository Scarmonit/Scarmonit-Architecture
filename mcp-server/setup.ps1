# Scarmonit MCP Server Setup Script

Write-Host "Setting up Scarmonit MCP Server..." -ForegroundColor Cyan

# Navigate to mcp-server directory
Set-Location "C:\Users\scarm\IdeaProjects\Scarmonit-Architecture\mcp-server"

# Clean previous installation
Write-Host "`nCleaning previous installation..." -ForegroundColor Yellow
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "package-lock.json" -Force -ErrorAction SilentlyContinue

# Install dependencies
Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
npm install

# Test the server
Write-Host "`nTesting MCP server..." -ForegroundColor Yellow
Write-Host "Starting server (press Ctrl+C to stop)..." -ForegroundColor Gray

# Start the server
node index.js

