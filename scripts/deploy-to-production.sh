#!/bin/bash

# 🚀 Deploy to Production Script
# This script safely merges main branch changes to production

echo "🚀 Time Tracker - Deploy to Production"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "manifest.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Error: You have uncommitted changes. Please commit or stash them first."
    git status --short
    exit 1
fi

# Fetch latest changes
echo "📡 Fetching latest changes..."
git fetch origin

# Switch to main and pull latest
echo "🔄 Switching to main branch..."
git checkout main
git pull origin main

# Show what will be deployed
echo ""
echo "📋 Changes to be deployed to production:"
echo "========================================"
git log production..main --oneline --no-merges

echo ""
read -p "🤔 Do you want to deploy these changes to production? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled."
    exit 0
fi

# Switch to production branch
echo "🔄 Switching to production branch..."
git checkout production

# Merge main into production
echo "🔀 Merging main into production..."
if git merge main --no-ff -m "Deploy: Merge main to production"; then
    echo "✅ Merge successful!"
else
    echo "❌ Merge failed! Please resolve conflicts manually."
    exit 1
fi

# Push to trigger deployment
echo "🚀 Pushing to production (this will trigger deployment)..."
if git push origin production; then
    echo ""
    echo "🎉 SUCCESS! Production deployment initiated!"
    echo "🌐 Check: https://alona-time-tracking.netlify.app"
    echo "📊 Monitor: https://app.netlify.com/sites/alona-time-tracking/deploys"
else
    echo "❌ Push failed! Please check your connection and try again."
    exit 1
fi

# Switch back to main
echo "🔄 Switching back to main branch for continued development..."
git checkout main

echo ""
echo "✅ Deployment complete! You're back on the main branch."
echo "🔍 Please verify the production site is working correctly." 