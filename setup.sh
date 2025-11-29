#!/bin/bash
set -e

echo "Starting setup..."

if [ ! -f package.json ]; then
  echo "Error: package.json not found!"
  exit 1
fi

echo "Installing dependencies..."
npm install

echo "Verifying workspace builds..."
# We try to build web-portal as a test
echo "Building web-portal..."
npm run build -w web-portal

echo "Setup complete!"
