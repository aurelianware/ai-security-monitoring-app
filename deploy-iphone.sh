#!/bin/bash

# iPhone Deployment Script for Security App
# This script sets up HTTPS server for iPhone testing

echo "🚀 Setting up iPhone deployment for Security App..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the WebSecurityApp directory"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the app
echo "🔨 Building production app..."
npm run build

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo "📜 Installing mkcert for SSL certificates..."
    if command -v brew &> /dev/null; then
        brew install mkcert
        mkcert -install
    else
        echo "❌ Please install Homebrew first: https://brew.sh"
        exit 1
    fi
fi

# Get local IP address
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
echo "🌐 Your local IP address: $LOCAL_IP"

# Generate SSL certificate
echo "🔐 Generating SSL certificate..."
mkcert localhost $LOCAL_IP

# Install serve if not present
if ! command -v serve &> /dev/null; then
    echo "📦 Installing serve globally..."
    npm install -g serve
fi

# Start HTTPS server
echo "🚀 Starting HTTPS server..."
echo ""
echo "📱 iPhone Access Instructions:"
echo "   1. Connect your iPhone to the same WiFi network"
echo "   2. Open Safari on iPhone"
echo "   3. Go to: https://$LOCAL_IP:3000"
echo "   4. Accept the security warning"
echo "   5. Allow camera permissions"
echo "   6. Add to Home Screen for full PWA experience"
echo ""
echo "🖥️  Desktop Access:"
echo "   https://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server with SSL
serve -s build -l 3000 --ssl-cert localhost+1.pem --ssl-key localhost+1-key.pem

echo ""
echo "✅ Server stopped. Certificates are saved for future use."