#!/bin/bash

# Production Build Script for Alerta Ilo
# This script prepares and builds the application for production deployment

set -e  # Exit on any error

echo "🚀 Starting production build for Alerta Ilo..."

# Check if required environment variables are set
if [ -z "$REACT_APP_FIREBASE_API_KEY" ]; then
    echo "⚠️  Warning: REACT_APP_FIREBASE_API_KEY not set. Using .env.production file."
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf build/
rm -rf node_modules/.cache/

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# Run linting
echo "🔍 Running ESLint..."
npm run lint

# Run tests
echo "🧪 Running tests..."
npm run test:ci

# Build for production
echo "🏗️  Building for production..."
export NODE_ENV=production
export REACT_APP_ENVIRONMENT=production
npm run build

# Analyze bundle size
echo "📊 Analyzing bundle size..."
npm run analyze

# Verify build
echo "✅ Verifying build..."
if [ ! -d "build" ]; then
    echo "❌ Build directory not found!"
    exit 1
fi

if [ ! -f "build/index.html" ]; then
    echo "❌ index.html not found in build!"
    exit 1
fi

echo "🎉 Production build completed successfully!"
echo "📁 Build files are in the 'build' directory"
echo "🚀 Ready for deployment with: npm run deploy"