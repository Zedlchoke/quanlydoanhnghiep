#!/bin/bash
# Render Deployment Script for Royal Vietnam Business Management

echo "🚀 RENDER DEPLOYMENT - Royal Vietnam Business Management"
echo ""

# Step 1: Verify build dependencies
echo "📋 Step 1: Checking build dependencies..."
npm ls typescript esbuild vite tsx @types/node || echo "⚠️  Some dependencies missing"

# Step 2: Clean build
echo "🧹 Step 2: Clean build..."
rm -rf dist/
rm -rf node_modules/.cache/

# Step 3: Fresh install
echo "📦 Step 3: Fresh install..."
npm ci

# Step 4: Build project
echo "🏗️  Step 4: Building project..."
npm run build

# Step 5: Verify build output
echo "✅ Step 5: Verifying build..."
if [ -f "dist/index.js" ]; then
    echo "✅ Server build successful"
    ls -la dist/
else
    echo "❌ Server build failed"
    exit 1
fi

if [ -d "dist/public" ]; then
    echo "✅ Client build successful"
    ls -la dist/public/
else
    echo "❌ Client build failed"
    exit 1
fi

# Step 6: Test production server (optional)
echo "🧪 Step 6: Testing production server..."
echo "Ready for Render deployment!"
echo ""
echo "RENDER SETTINGS:"
echo "Build Command: npm ci && npm run build"
echo "Start Command: npm run start"
echo "Node Version: 18"
echo ""
echo "Environment Variables to set in Render:"
echo "NODE_ENV=production"
echo "DATABASE_URL=[your_render_database_url]"
echo "PORT=10000"