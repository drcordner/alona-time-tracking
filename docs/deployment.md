# 🚀 Deployment Guide - Time Tracker PWA

## 📋 **Current Status**
- **Production**: ✅ Live at `https://alona-time-tracking.netlify.app`
- **Staging**: 🔄 To be configured at `https://staging-alona-time-tracking.netlify.app`
- **Version**: See `version.json` for current version
- **Last Deploy**: Auto-deployment from GitHub

## 🌟 **Deployment Strategy**

### **🎯 Overview**
We use a **dual-environment approach**:
- **Staging**: `main` branch → auto-deploys for testing
- **Production**: `production` branch → manual approval required

### **🔧 Branch Strategy**
- **`main`**: Development and staging deployment
- **`production`**: Stable releases only (manual merge from main)

## 🚀 **Deployment Process**

### **📝 For Development (Automatic)**
```bash
# Work on main branch as usual
git add .
git commit -m "feat: new feature"
git push origin main
# ✅ Auto-deploys to staging site
```

### **🎯 For Production (Manual Approval)**

#### **Option 1: Use Deployment Script (Recommended)**
```bash
# Windows PowerShell
.\scripts\deploy-to-production.ps1

# Linux/Mac Bash
./scripts/deploy-to-production.sh
```

#### **Option 2: Manual Process**
```bash
# 1. Switch to production branch
git checkout production

# 2. Merge approved changes from main
git merge main

# 3. Push to trigger production deployment
git push origin production

# 4. Switch back to main
git checkout main
```

## 🏗️ **Netlify Configuration**

### **Current Setup**
- **Site**: alona-time-tracking.netlify.app
- **Branch**: `main` (will change to `production`)
- **Build Command**: None (static site)
- **Publish Directory**: `/` (root)

### **Required Changes**
1. **Current Site**: Change deploy branch from `main` → `production`
2. **New Staging Site**: Create new site deploying from `main` branch

## 📊 **Validation Checklist**

### **Before Production Deployment**
- [ ] All features tested on staging
- [ ] No console errors
- [ ] Mobile responsiveness verified
- [ ] PWA functionality intact
- [ ] Goals/streak calculations working
- [ ] Performance acceptable
- [ ] User approval obtained

### **After Production Deployment**
- [ ] Production site loads correctly
- [ ] All features functional
- [ ] PWA install/update working
- [ ] No broken links or errors
- [ ] Analytics tracking active

## 🔒 **Security & Rollback**

### **Rollback Process**
```bash
# Emergency rollback to previous version
git checkout production
git reset --hard HEAD~1
git push --force-with-lease origin production
```

### **Hotfix Process**
```bash
# 1. Create hotfix from production
git checkout production
git checkout -b hotfix/critical-fix

# 2. Apply fix and test
# ... make changes ...
git commit -m "hotfix: critical issue"

# 3. Merge to both branches
git checkout production
git merge hotfix/critical-fix
git push origin production

git checkout main
git merge hotfix/critical-fix
git push origin main

# 4. Clean up
git branch -d hotfix/critical-fix
```

## 📈 **Monitoring & Analytics**

### **Deployment Monitoring**
- **Netlify Dashboard**: https://app.netlify.com/sites/alona-time-tracking/deploys
- **Build Logs**: Available in Netlify deploy details
- **Performance**: Lighthouse scores tracked

### **Error Monitoring**
- **Console Errors**: Check browser dev tools
- **Service Worker**: Monitor SW registration/updates
- **PWA Functionality**: Test install/update flow

## 🛠️ **Technical Details**

### **Build Configuration**
- **Framework**: Vanilla JavaScript PWA
- **Build Process**: None (static files)
- **Dependencies**: emoji-picker-element (CDN)
- **Service Worker**: Custom implementation

### **Environment Variables**
- None currently required
- All configuration in static files

### **Performance Optimizations**
- Service Worker caching
- Resource preloading
- Minified assets
- Optimized images

## 📝 **Deployment History**

### **Recent Deployments**
- **v5.1.4+**: Enhanced PWA update mechanism & version consistency
- **v5.1.4**: Enhanced emoji picker with search and categories
- **v5.1.3**: Quick Start enhancement and category editing fixes
- **v5.1.2**: Goals system with streak tracking
- **v5.1.1**: Enhanced reports and analytics
- **v5.1.0**: Initial PWA with core features

### **Next Steps**
1. Configure staging site on Netlify
2. Update production site to deploy from `production` branch
3. Test the new deployment workflow
4. Document any additional configuration needed 