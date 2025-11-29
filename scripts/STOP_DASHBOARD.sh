#!/bin/bash

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║         🛑 Stopping Scarmonit Dashboard                  ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

echo "Stopping MCP Bridge (port 3001)..."
lsof -ti:3001 2>/dev/null | xargs kill -9 2>/dev/null || echo "Not running"

echo "Stopping Dashboard (port 8080)..."
lsof -ti:8080 2>/dev/null | xargs kill -9 2>/dev/null || echo "Not running"

echo "Stopping Dashboard (port 5174)..."
lsof -ti:5174 2>/dev/null | xargs kill -9 2>/dev/null || echo "Not running"

sleep 1

echo ""
echo "✅ All services stopped"
echo ""
