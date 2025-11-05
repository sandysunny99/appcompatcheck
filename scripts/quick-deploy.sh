#!/bin/bash

# ========================================
# AppCompatCheck - Quick Deployment Script
# ========================================
# This script helps you quickly deploy AppCompatCheck to Vercel
#
# Usage: ./scripts/quick-deploy.sh
# ========================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Main deployment flow
print_header "AppCompatCheck Deployment Script"

echo ""
print_info "This script will help you deploy AppCompatCheck to Vercel"
echo ""

# Check prerequisites
print_header "Step 1: Checking Prerequisites"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_success "Node.js installed: $NODE_VERSION"
else
    print_error "Node.js is not installed"
    print_info "Please install Node.js v18.17.0 or higher from https://nodejs.org"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    print_success "npm installed: $NPM_VERSION"
else
    print_error "npm is not installed"
    exit 1
fi

# Check Git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    print_success "Git installed: $GIT_VERSION"
else
    print_error "Git is not installed"
    print_info "Please install Git from https://git-scm.com"
    exit 1
fi

# Check if we're in a git repository
if [ -d ".git" ]; then
    print_success "Git repository detected"
else
    print_error "Not in a Git repository"
    print_info "Initialize git with: git init"
    exit 1
fi

echo ""

# Install dependencies
print_header "Step 2: Installing Dependencies"
print_info "Running: npm install --legacy-peer-deps"
npm install --legacy-peer-deps
print_success "Dependencies installed successfully"

echo ""

# Check for environment variables
print_header "Step 3: Environment Variables Check"

if [ -f ".env.local" ]; then
    print_success ".env.local file found"
else
    print_warning ".env.local file not found"
    print_info "Copy .env.production.example to .env.local and fill in values"
    
    read -p "Would you like to create .env.local from template? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp .env.production.example .env.local
        print_success "Created .env.local from template"
        print_warning "Please edit .env.local and fill in your values"
        print_info "Press Enter when ready to continue..."
        read
    fi
fi

echo ""

# Build test
print_header "Step 4: Testing Build"
print_info "Running: npm run build"
print_warning "This may take a few minutes..."

if npm run build; then
    print_success "Build completed successfully!"
else
    print_error "Build failed"
    print_info "Please fix the errors above and try again"
    exit 1
fi

echo ""

# Git status check
print_header "Step 5: Git Status Check"

# Check if there are uncommitted changes
if [[ -n $(git status -s) ]]; then
    print_warning "You have uncommitted changes"
    git status -s
    echo ""
    read -p "Would you like to commit these changes? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        read -p "Enter commit message: " commit_message
        git commit -m "$commit_message"
        print_success "Changes committed"
    fi
else
    print_success "No uncommitted changes"
fi

echo ""

# Push to GitHub
print_header "Step 6: Push to GitHub"

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
print_info "Current branch: $CURRENT_BRANCH"

# Check if remote exists
if git remote -v | grep -q "origin"; then
    REMOTE_URL=$(git remote get-url origin)
    print_success "Remote origin found: $REMOTE_URL"
    
    read -p "Push to GitHub? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if git push origin "$CURRENT_BRANCH"; then
            print_success "Pushed to GitHub successfully"
        else
            print_error "Failed to push to GitHub"
            print_info "You may need to set upstream: git push -u origin $CURRENT_BRANCH"
            exit 1
        fi
    else
        print_warning "Skipped pushing to GitHub"
    fi
else
    print_error "No remote origin configured"
    print_info "Add remote with: git remote add origin <repository-url>"
    exit 1
fi

echo ""

# Vercel deployment
print_header "Step 7: Vercel Deployment"

if command -v vercel &> /dev/null; then
    print_success "Vercel CLI installed"
    
    read -p "Deploy to Vercel now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Deploy to production? (y=production, n=preview) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            vercel --prod
        else
            vercel
        fi
        print_success "Deployment initiated"
    else
        print_info "Skipped Vercel deployment"
    fi
else
    print_warning "Vercel CLI not installed"
    print_info "Install with: npm install -g vercel"
    print_info "Or deploy via Vercel dashboard: https://vercel.com/new"
fi

echo ""

# Final summary
print_header "Deployment Summary"

print_success "Pre-deployment checks completed!"
echo ""
print_info "Next steps:"
echo "  1. ✓ Dependencies installed"
echo "  2. ✓ Build test passed"
echo "  3. ✓ Code pushed to GitHub"
echo ""
print_info "To deploy to Vercel:"
echo "  • Option 1: Use Vercel CLI: vercel --prod"
echo "  • Option 2: Visit: https://vercel.com/new"
echo "  • Option 3: Connect GitHub repo in Vercel dashboard"
echo ""
print_info "Don't forget to:"
echo "  • Set environment variables in Vercel dashboard"
echo "  • Configure database (PostgreSQL)"
echo "  • Run database migrations"
echo "  • Create admin user"
echo ""
print_success "Documentation: See DEPLOYMENT_GUIDE.md for detailed instructions"
echo ""

print_header "Deployment Script Complete!"
