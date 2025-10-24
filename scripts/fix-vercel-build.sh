#!/bin/bash

################################################################################
# Vercel Build Fix Script
# Fixes React 19 vs Radix UI dependency conflicts
# Author: AppCompatCheck Team
# Date: January 2025
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🚀 Vercel Build Fix Script - React 18 Migration      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Backup current package-lock.json
echo -e "${YELLOW}📦 Step 1: Backing up package-lock.json...${NC}"
if [ -f package-lock.json ]; then
    cp package-lock.json package-lock.json.backup
    echo -e "${GREEN}✅ Backup created: package-lock.json.backup${NC}"
else
    echo -e "${YELLOW}⚠️  No package-lock.json found to backup${NC}"
fi
echo ""

# Step 2: Clean existing installation
echo -e "${YELLOW}🧹 Step 2: Cleaning existing installation...${NC}"
rm -rf node_modules
rm -f package-lock.json
echo -e "${GREEN}✅ Cleaned node_modules and package-lock.json${NC}"
echo ""

# Step 3: Verify configuration files
echo -e "${YELLOW}🔍 Step 3: Verifying configuration files...${NC}"

# Check .npmrc
if [ -f .npmrc ]; then
    echo -e "${GREEN}✅ .npmrc found${NC}"
    if grep -q "legacy-peer-deps=true" .npmrc; then
        echo -e "${GREEN}✅ legacy-peer-deps enabled in .npmrc${NC}"
    else
        echo -e "${YELLOW}⚠️  Adding legacy-peer-deps to .npmrc...${NC}"
        echo "legacy-peer-deps=true" >> .npmrc
    fi
else
    echo -e "${YELLOW}⚠️  Creating .npmrc...${NC}"
    cat > .npmrc << 'EOF'
# NPM Configuration for AppCompatCheck
legacy-peer-deps=true
strict-peer-dependencies=false
engine-strict=false
auto-install-peers=true
EOF
    echo -e "${GREEN}✅ .npmrc created${NC}"
fi

# Check vercel.json
if [ -f vercel.json ]; then
    echo -e "${GREEN}✅ vercel.json found${NC}"
else
    echo -e "${YELLOW}⚠️  Creating vercel.json...${NC}"
    cat > vercel.json << 'EOF'
{
  "buildCommand": "npm install --legacy-peer-deps && npm run build",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": "nextjs",
  "env": {
    "NPM_CONFIG_LEGACY_PEER_DEPS": "true"
  },
  "build": {
    "env": {
      "NPM_CONFIG_LEGACY_PEER_DEPS": "true",
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  }
}
EOF
    echo -e "${GREEN}✅ vercel.json created${NC}"
fi
echo ""

# Step 4: Install dependencies
echo -e "${YELLOW}📥 Step 4: Installing dependencies with legacy-peer-deps...${NC}"
npm install --legacy-peer-deps
echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
echo ""

# Step 5: Verify React version
echo -e "${YELLOW}🔍 Step 5: Verifying React version...${NC}"
REACT_VERSION=$(node -p "require('./package.json').dependencies.react")
echo -e "   React version in package.json: ${GREEN}${REACT_VERSION}${NC}"

if npm ls react 2>/dev/null | grep -q "react@18"; then
    echo -e "${GREEN}✅ React 18.x is installed${NC}"
else
    echo -e "${RED}❌ React version mismatch detected${NC}"
    echo -e "${YELLOW}   Running: npm ls react${NC}"
    npm ls react || true
fi
echo ""

# Step 6: Run dependency check
echo -e "${YELLOW}🔍 Step 6: Running dependency check...${NC}"
if [ -f scripts/check-dependencies.js ]; then
    npm run check-deps || true
else
    echo -e "${YELLOW}⚠️  Dependency check script not found, skipping...${NC}"
fi
echo ""

# Step 7: Test build
echo -e "${YELLOW}🏗️  Step 7: Testing build...${NC}"
if npm run build; then
    echo -e "${GREEN}✅ Build successful!${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    echo -e "${YELLOW}   Check the error messages above${NC}"
    exit 1
fi
echo ""

# Step 8: Summary
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  ✅ Fix Applied Successfully            ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo -e "  1. ${YELLOW}Commit the changes:${NC}"
echo -e "     ${BLUE}git add .npmrc vercel.json package.json package-lock.json${NC}"
echo -e "     ${BLUE}git commit -m 'fix: Resolve React 19 vs Radix UI dependency conflicts'${NC}"
echo -e "     ${BLUE}git push${NC}"
echo ""
echo -e "  2. ${YELLOW}Vercel will automatically deploy with the new configuration${NC}"
echo ""
echo -e "  3. ${YELLOW}Monitor the build at:${NC} https://vercel.com/dashboard"
echo ""
echo -e "${GREEN}🎉 All fixes have been applied!${NC}"
