# Gemini CLI Setup for Scarmonit Architecture

Write-Host "🚀 Gemini CLI Setup" -ForegroundColor Cyan
Write-Host ""

# Verify gemini.ps1 exists
if (Test-Path "C:\Users\scarm\gemini.ps1") {
    Write-Host "✅ gemini.ps1 found" -ForegroundColor Green
} else {
    Write-Host "❌ gemini.ps1 not found" -ForegroundColor Red
    exit 1
}

# Check API key
if ($env:GEMINI_API_KEY) {
    Write-Host "✅ GEMINI_API_KEY is set" -ForegroundColor Green
    Write-Host ""
    Write-Host "Try: gemini --yolo" -ForegroundColor Cyan
} else {
    Write-Host "⚠️ GEMINI_API_KEY not set" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Get your API key from: https://makersuite.google.com/app/apikey" -ForegroundColor Cyan
    Write-Host ""
    $key = Read-Host "Enter API key (or press Enter to skip)"

    if ($key) {
        [System.Environment]::SetEnvironmentVariable('GEMINI_API_KEY', $key, 'User')
        $env:GEMINI_API_KEY = $key
        Write-Host "✅ API key saved!" -ForegroundColor Green
        Write-Host "⚠️ Restart terminal to use 'gemini' command" -ForegroundColor Yellow
    }
}

