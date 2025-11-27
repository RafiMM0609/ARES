#!/usr/bin/env bash

# ARES Setup Validation Script
# This script validates the development environment setup

set -e

echo "🔍 Validating ARES Setup..."
echo ""

# Check Node.js version
echo "✓ Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "  Node.js: $NODE_VERSION"
echo ""

# Check npm version
echo "✓ Checking npm version..."
NPM_VERSION=$(npm -v)
echo "  npm: $NPM_VERSION"
echo ""

# Check if dependencies are installed
echo "✓ Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "  ✅ node_modules directory found"
else
    echo "  ❌ node_modules not found. Run 'npm install'"
    exit 1
fi
echo ""

# Check if project structure exists
echo "✓ Checking project structure..."
if [ -f "src/lib/sqlite.ts" ]; then
    echo "  ✅ SQLite database configuration found"
else
    echo "  ❌ src/lib/sqlite.ts not found"
    exit 1
fi

if [ -f "src/lib/auth.ts" ]; then
    echo "  ✅ Authentication module found"
else
    echo "  ❌ src/lib/auth.ts not found"
    exit 1
fi
echo ""

# Check environment example file
echo "✓ Checking environment template..."
if [ -f ".env.example" ]; then
    echo "  ✅ .env.example found"
else
    echo "  ⚠️  .env.example not found"
fi

if [ -f ".env.local" ]; then
    echo "  ✅ .env.local found"
else
    echo "  ⚠️  .env.local not found. Copy from .env.example"
fi
echo ""

# Try to build the project
echo "✓ Checking build..."
if npm run build > /dev/null 2>&1; then
    echo "  ✅ Build successful"
else
    echo "  ❌ Build failed. Run 'npm run build' for details"
    exit 1
fi
echo ""

echo "=========================================="
echo "✅ All checks passed!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Copy environment: cp .env.example .env.local"
echo "2. Start development: npm run dev"
echo "3. Open http://localhost:3000"
echo ""
echo "The SQLite database will be automatically created in data/ares.db"
echo ""
