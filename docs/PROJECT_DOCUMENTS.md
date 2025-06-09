# Project Documents Inventory

This file tracks all key project documents to prevent duplication and ensure consistency.

## Development Documentation

| Document | Location | Purpose | Status |
|----------|----------|---------|---------|
| **Lessons Learned** | `docs/development/LESSONS_LEARNED.md` | **SINGLE SOURCE** - All development and deployment lessons, patterns, and solutions | ✅ Active |
| **Development Changelog** | `docs/development/DEVELOPMENT_CHANGELOG.md` | Track changes during current development cycle before consolidation | ✅ Active |
| **Cursor Rules** | `.cursorrules` | Development rules, workflow, and consistency requirements | ✅ Active |

## Project Management

| Document | Location | Purpose | Status |
|----------|----------|---------|---------|
| **Release Notes** | `docs/project-management/RELEASE_NOTES.md` | Comprehensive changelog for all versions | ✅ Active |
| **Version Info** | `version.json` | Single source of truth for current version and features | ✅ Active |

## Testing & Quality

| Document | Location | Purpose | Status |
|----------|----------|---------|---------|
| **Test Runner** | `test-runner.js` | Automated testing for version consistency and file structure | ✅ Active |
| **Package Info** | `package.json` | NPM package configuration and test scripts | ✅ Active |

## Rules for Document Management

### ✅ **Before Creating ANY Document**
1. **Search this inventory** to see if document type already exists
2. **Use file_search tool** to verify no duplicates exist
3. **Check all docs/ subdirectories** thoroughly
4. **Update this inventory** when adding new documents

### ✅ **When Finding Duplicates**
1. **Merge content** into the existing document
2. **Delete the duplicate** file
3. **Update all references** in other files
4. **Update this inventory** to reflect changes

### ✅ **Single Sources of Truth**
- **Version Information**: `version.json` (not hardcoded anywhere else)
- **Lessons Learned**: `docs/development/LESSONS_LEARNED.md` (only one)
- **Current Changes**: `docs/development/DEVELOPMENT_CHANGELOG.md` 
- **Release History**: `docs/project-management/RELEASE_NOTES.md`

### ❌ **Never Create These**
- Multiple lessons learned files
- Multiple changelog files  
- Duplicate documentation on same topic
- Version information outside version.json

## Document Change Log

| Date | Action | Details |
|------|--------|---------|
| 2024-12-20 | **Consolidated** | Merged `docs/deployment/LESSONS_LEARNED.md` into `docs/development/LESSONS_LEARNED.md` |
| 2024-12-20 | **Created** | Added this document inventory to prevent future duplication | 