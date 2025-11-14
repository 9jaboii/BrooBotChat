#!/bin/bash

# BrooBot Backend Startup Script
# This script safely starts the backend server

echo "🚀 BrooBot Backend Startup"
echo "=========================="
echo ""

# Check if port 3001 is in use
PORT=3001
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port $PORT is already in use"
    echo ""
    echo "Options:"
    echo "  1. Kill the process and restart"
    echo "  2. Use a different port"
    echo "  3. Exit"
    echo ""
    read -p "Choose (1/2/3): " choice

    case $choice in
        1)
            echo "🔪 Killing process on port $PORT..."
            lsof -ti:$PORT | xargs kill -9 2>/dev/null
            sleep 1
            echo "✅ Port cleared"
            ;;
        2)
            read -p "Enter new port number: " NEW_PORT
            PORT=$NEW_PORT
            echo "📝 Using port $PORT"
            echo "⚠️  Don't forget to update frontend to use port $PORT"
            export PORT=$NEW_PORT
            ;;
        3)
            echo "👋 Exiting..."
            exit 0
            ;;
        *)
            echo "❌ Invalid choice. Exiting..."
            exit 1
            ;;
    esac
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found"
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ .env created"
    echo ""
    echo "📝 Configure your API keys in .env before deploying to production"
    echo ""
fi

# Display configuration
echo "📋 Configuration:"
echo "   Port: $PORT"

if [ -f ".env" ]; then
    if grep -q "ANTHROPIC_API_KEY=sk-ant-" .env 2>/dev/null; then
        echo "   Claude API: ✅ Configured"
    else
        echo "   Claude API: ⚠️  Not configured (using mock mode)"
    fi

    if grep -q "USE_MOCK_MODE=true" .env 2>/dev/null; then
        echo "   Mock Mode: ✅ Enabled"
    else
        echo "   Mock Mode: ❌ Disabled"
    fi
fi

echo ""
echo "🚀 Starting server..."
echo ""

# Start the server
npm start
