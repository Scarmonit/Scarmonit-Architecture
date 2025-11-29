@echo off
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║         🚀 Scarmonit Dashboard Launcher                  ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

echo [1/2] Starting MCP Bridge Server...
start "MCP Bridge" cmd /k "cd mcp-bridge && npm start"
timeout /t 5 /nobreak > nul

echo [2/2] Starting Web Portal...
start "Web Portal" cmd /k "cd web-portal && npm run dev"
timeout /t 3 /nobreak > nul

echo.
echo ✅ Dashboard starting up!
echo.
echo 🌉 MCP Bridge:  http://localhost:3001
echo 🌐 Web Portal:  http://localhost:5174
echo.
echo Press any key to open dashboard in browser...
pause > nul

start http://localhost:5174

echo.
echo 📊 Dashboard opened in browser
echo.
echo To stop: Close both command windows or press Ctrl+C
echo.
