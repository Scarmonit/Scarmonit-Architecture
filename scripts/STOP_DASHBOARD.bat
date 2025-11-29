@echo off
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║         🛑 Stopping Scarmonit Dashboard                  ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

echo Stopping MCP Bridge (port 3001)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

echo Stopping Dashboard (port 8080)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

echo Stopping any remaining Node processes...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq MCP Bridge*" >nul 2>&1

timeout /t 2 /nobreak >nul

echo.
echo ✅ All services stopped
echo.
pause
