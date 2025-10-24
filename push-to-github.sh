#!/bin/bash

echo "=========================================="
echo "GitHub Push Helper Script"
echo "=========================================="
echo ""

# Check current branch and commits
echo "Current branch status:"
git log --oneline -2
echo ""

# Show files to be pushed
echo "Changes ready to push:"
echo "- 2 commits ahead of origin/main"
echo "- React 19 upgrade complete"
echo "- 34 files changed"
echo ""

echo "=========================================="
echo "Authentication Required"
echo "=========================================="
echo ""
echo "The GitHub Personal Access Token (PAT) in the remote URL has expired."
echo ""
echo "You have three options:"
echo ""
echo "1. Generate a new GitHub PAT:"
echo "   - Visit: https://github.com/settings/tokens"
echo "   - Click 'Generate new token (classic)'"
echo "   - Select scope: 'repo' (full control)"
echo "   - Copy the token"
echo ""
echo "2. Then update the remote URL:"
echo "   git remote set-url origin https://YOUR_NEW_TOKEN@github.com/sandysunny99/appcompatcheck.git"
echo "   git push origin main"
echo ""
echo "3. OR use SSH instead:"
echo "   git remote set-url origin git@github.com:sandysunny99/appcompatcheck.git"
echo "   git push origin main"
echo ""
echo "=========================================="
echo ""

# Ask if user wants to try with a new token
read -p "Do you have a new GitHub PAT to use? (y/n): " has_token

if [ "$has_token" = "y" ] || [ "$has_token" = "Y" ]; then
    read -p "Enter your GitHub Personal Access Token: " token
    
    if [ -n "$token" ]; then
        echo ""
        echo "Updating remote URL with new token..."
        git remote set-url origin "https://${token}@github.com/sandysunny99/appcompatcheck.git"
        
        echo "Attempting to push..."
        git push origin main
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Successfully pushed to GitHub!"
            echo ""
            echo "View your commits at:"
            echo "https://github.com/sandysunny99/appcompatcheck/commits/main"
        else
            echo ""
            echo "❌ Push failed. Please check your token and try again."
        fi
    else
        echo "No token provided. Exiting."
    fi
else
    echo ""
    echo "No problem! Your changes are safely committed locally."
    echo "You can push them later by:"
    echo "1. Getting a new GitHub PAT"
    echo "2. Running: git remote set-url origin https://YOUR_TOKEN@github.com/sandysunny99/appcompatcheck.git"
    echo "3. Running: git push origin main"
    echo ""
    echo "Or push from your local machine:"
    echo "  git pull origin main"
    echo "  git push origin main"
fi

echo ""
echo "=========================================="
echo "For more help, see: GIT_PUSH_INSTRUCTIONS.md"
echo "=========================================="
