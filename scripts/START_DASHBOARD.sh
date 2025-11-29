#!/bin/bash

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║         🚀 Scarmonit Dashboard Launcher                  ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

echo "[1/2] Starting MCP Bridge Server..."
cd mcp-bridge
npm start &
BRIDGE_PID=$!
cd ..
sleep 5

echo "[2/2] Starting Web Portal..."
cd web-portal
npm run dev &
PORTAL_PID=$!
cd ..
sleep 3

echo ""
echo "✅ Dashboard is running!"
echo ""
echo "🌉 MCP Bridge:  http://localhost:3001"
echo "🌐 Web Portal:  http://localhost:5174"
echo ""
echo "Opening browser..."
sleep 2

# Open browser based on OS
if command -v xdg-open > /dev/null; then
  xdg-open http://localhost:5174
elif command -v open > /dev/null; then
  open http://localhost:5174
else
  echo "Please open http://localhost:5174 in your browser"
fi

echo ""
echo "📊 Dashboard opened"
echo ""
echo "To stop: Press Ctrl+C"
echo ""

# Wait for Ctrl+C
trap "kill $BRIDGE_PID $PORTAL_PID; exit" INT
wait
