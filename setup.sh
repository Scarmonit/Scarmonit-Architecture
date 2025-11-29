#!/bin/bash
set -e

# Install dependencies for all workspaces
echo "Installing dependencies..."
npm install

# Run tests
echo "Running tests..."
npm test
