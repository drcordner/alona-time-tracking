# Deployment Guide

## Site URLs
- **Production**: https://alonastimetracking.netlify.app/
- **Staging**: https://staging-alona-time-tracking.netlify.app/

## Branch Structure
- `main` branch → Auto-deploys to **staging**
- `production` branch → Auto-deploys to **production**

## Deployment Process

### Method 1: Using Deployment Scripts
```bash
# For PowerShell
./scripts/deploy-to-production.ps1

# For Bash
./scripts/deploy-to-production.sh
```

### Method 2: Manual Git Deployment
```bash
# 1. Ensure main branch is up to date
git checkout main
git pull origin main

# 2. Switch to production branch
git checkout production

# 3. Merge main into production
git merge main --no-ff -m "Deploy: Merge main to production"

# 4. Push to trigger deployment
git push origin production
```

## Netlify Configuration
The `netlify.toml` file configures:
- Static file deployment (no build process)
- Security headers
- Service worker caching rules
- SPA redirects

## Emergency Rollback
If production breaks:
```bash
# 1. Identify last good commit
git log --oneline

# 2. Reset production branch
git checkout production
git reset --hard [COMMIT_HASH]

# 3. Force push (DANGEROUS - only in emergencies)
git push origin production --force
```

## Monitoring
- **Netlify Dashboard**: Check deployment status and logs
- **Site Health**: Verify both staging and production after deployments
- **Version Check**: Confirm version.json updates are reflected

## Pre-Deployment Checklist
- [ ] Version updated in `version.json`
- [ ] Release notes updated in `RELEASE_NOTES.md`
- [ ] Changes tested locally
- [ ] Changes tested on staging
- [ ] No console errors
- [ ] Mobile responsiveness verified 