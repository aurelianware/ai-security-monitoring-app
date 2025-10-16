#!/bin/bash
echo "=== Azure Startup Script ==="
echo "Current directory: $(pwd)"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Files in current directory:"
ls -la
echo "Checking for dist directory:"
ls -la dist/ || echo "Dist directory not found"
echo "Checking for node_modules:"
ls node_modules/ | head -5 || echo "node_modules not found"
echo "Checking package.json:"
cat package.json | grep -A5 -B5 "express" || echo "Express not found in package.json"
echo "Attempting to install dependencies:"
npm install --production
echo "Starting server:"
node server.js