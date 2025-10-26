#!/bin/bash

# ARES Supabase Setup Validation Script
# This script validates the Supabase installation and setup

set -e

echo "🔍 Validating ARES Supabase Setup..."
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

# Check if Supabase CLI is installed
echo "✓ Checking Supabase CLI..."
if npx supabase --version > /dev/null 2>&1; then
    SUPABASE_VERSION=$(npx supabase --version)
    echo "  Supabase CLI: $SUPABASE_VERSION"
else
    echo "  ❌ Supabase CLI not found"
    exit 1
fi
echo ""

# Check if Docker is running
echo "✓ Checking Docker..."
if docker info > /dev/null 2>&1; then
    DOCKER_VERSION=$(docker --version)
    echo "  Docker: $DOCKER_VERSION"
    echo "  ✅ Docker is running"
else
    echo "  ❌ Docker is not running or not installed"
    echo "  Please start Docker Desktop and try again"
    exit 1
fi
echo ""

# Check if project structure exists
echo "✓ Checking project structure..."
if [ -f "supabase/config.toml" ]; then
    echo "  ✅ supabase/config.toml found"
else
    echo "  ❌ supabase/config.toml not found"
    exit 1
fi

if [ -d "supabase/migrations" ]; then
    MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
    echo "  ✅ Found $MIGRATION_COUNT migration(s)"
else
    echo "  ❌ supabase/migrations directory not found"
    exit 1
fi

if [ -f "supabase/seed/seed.sql" ]; then
    echo "  ✅ Seed data file found"
else
    echo "  ⚠️  Seed data file not found (optional)"
fi
echo ""

# Check package.json scripts
echo "✓ Checking npm scripts..."
if grep -q "supabase:start" package.json; then
    echo "  ✅ Supabase scripts configured"
else
    echo "  ❌ Supabase scripts not configured in package.json"
    exit 1
fi
echo ""

# Check environment example file
echo "✓ Checking environment template..."
if [ -f ".env.local.example" ]; then
    echo "  ✅ .env.local.example found"
else
    echo "  ⚠️  .env.local.example not found"
fi
echo ""

echo "=========================================="
echo "✅ All checks passed!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Start Supabase: npm run supabase:start"
echo "2. Copy environment: cp .env.local.example .env.local"
echo "3. Start development: npm run dev"
echo ""
echo "For detailed instructions, see:"
echo "- INSTALLATION.md"
echo "- SUPABASE_LOCAL_SETUP.md"
echo ""
