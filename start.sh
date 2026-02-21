#!/bin/bash

# Names of Allah PWA - Development Server Launcher
# Simple script to start the app locally

echo "🕌 Starting Names of Allah PWA..."
echo ""
echo "📱 The app will open in your browser at:"
echo "   http://localhost:8000"
echo ""
echo "📋 To test:"
echo "   1. The welcome screen should appear"
echo "   2. Open browser DevTools (F12)"
echo "   3. Check Console for any errors"
echo "   4. Go to Application tab > Service Workers"
echo ""
echo "🛑 To stop the server, press Ctrl+C"
echo ""
echo "Starting server..."
echo ""

# Try Python 3 first (most common on macOS)
if command -v python3 &> /dev/null; then
    python3 -m http.server 8000
# Fallback to Python 2
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer 8000
# Fallback to PHP
elif command -v php &> /dev/null; then
    php -S localhost:8000
else
    echo "❌ Error: No suitable web server found"
    echo "   Please install Python 3 or PHP"
    exit 1
fi
