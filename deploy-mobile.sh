#!/bin/bash

echo "🚀 iPhone HTTPS Deployment Script"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run from WebSecurityApp directory"
    exit 1
fi

# Get local IP
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "192.168.1.100")
echo "📱 Local IP: $LOCAL_IP"

# Check if mkcert is available
if command -v mkcert >/dev/null 2>&1; then
    echo "🔐 Generating SSL certificate..."
    mkcert localhost $LOCAL_IP
    
    echo "🚀 Starting HTTPS server..."
    npx vite --host 0.0.0.0 --port 3000 --https --https-cert localhost+1.pem --https-key localhost+1-key.pem
else
    echo "⚠️  mkcert not found. Install with: brew install mkcert"
    echo "📱 Starting HTTP server (limited camera features)..."
    npx vite --host 0.0.0.0 --port 3000
fi

echo ""
echo "📱 iPhone Instructions:"
echo "   1. Connect iPhone to same WiFi"
echo "   2. Open Safari on iPhone"
echo "   3. Go to: https://$LOCAL_IP:3000 (or http://$LOCAL_IP:3000)"
echo "   4. Accept security warning if using HTTPS"
echo "   5. Allow camera permissions"
echo "   6. Test object detection and storage!"
echo ""