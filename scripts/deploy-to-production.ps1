# 🚀 Deploy to Production Script (PowerShell)
# This script safely merges main branch changes to production

Write-Host "🚀 Time Tracker - Deploy to Production" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "manifest.json")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Check for uncommitted changes
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "❌ Error: You have uncommitted changes. Please commit or stash them first." -ForegroundColor Red
    git status --short
    exit 1
}

# Fetch latest changes
Write-Host "📡 Fetching latest changes..." -ForegroundColor Yellow
git fetch origin

# Switch to main and pull latest
Write-Host "🔄 Switching to main branch..." -ForegroundColor Yellow
git checkout main
git pull origin main

# Show what will be deployed
Write-Host ""
Write-Host "📋 Changes to be deployed to production:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
git log production..main --oneline --no-merges

Write-Host ""
$confirmation = Read-Host "🤔 Do you want to deploy these changes to production? (y/N)"

if ($confirmation -ne "y" -and $confirmation -ne "Y") {
    Write-Host "❌ Deployment cancelled." -ForegroundColor Red
    exit 0
}

# Switch to production branch
Write-Host "🔄 Switching to production branch..." -ForegroundColor Yellow
git checkout production

# Merge main into production
Write-Host "🔀 Merging main into production..." -ForegroundColor Yellow
$mergeResult = git merge main --no-ff -m "Deploy: Merge main to production"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Merge successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Merge failed! Please resolve conflicts manually." -ForegroundColor Red
    exit 1
}

# Push to trigger deployment
Write-Host "🚀 Pushing to production (this will trigger deployment)..." -ForegroundColor Yellow
$pushResult = git push origin production
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 SUCCESS! Production deployment initiated!" -ForegroundColor Green
    Write-Host "🌐 Check: https://alona-time-tracking.netlify.app" -ForegroundColor Cyan
    Write-Host "📊 Monitor: https://app.netlify.com/sites/alona-time-tracking/deploys" -ForegroundColor Cyan
} else {
    Write-Host "❌ Push failed! Please check your connection and try again." -ForegroundColor Red
    exit 1
}

# Switch back to main
Write-Host "🔄 Switching back to main branch for continued development..." -ForegroundColor Yellow
git checkout main

Write-Host ""
Write-Host "✅ Deployment complete! You're back on the main branch." -ForegroundColor Green
Write-Host "🔍 Please verify the production site is working correctly." -ForegroundColor Yellow 