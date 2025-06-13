# 📚 Documentation Rules

This document establishes the rules and processes for maintaining all project documentation in alignment with our Vibe philosophy.

## 🎯 Core Principles

1. **Simplicity First**
   - Keep documentation clear and concise
   - Use plain language over technical jargon
   - Focus on practical, actionable information

2. **Consistency is Key**
   - Maintain uniform formatting across all documents
   - Use consistent terminology
   - Follow established templates

3. **Living Documentation**
   - Update docs as part of the development process
   - Never leave documentation for "later"
   - Treat documentation as first-class code

4. **User-Centric Approach**
   - Write for the reader, not the writer
   - Focus on practical impact
   - Include real-world examples

## 📝 Document-Specific Rules

### 1. Development Changelog (`development_changelog.md`)

#### Structure
```markdown
# Development Changelog

## Current Development Cycle (vX.Y.Z development)
### Issues Being Investigated
- [ ] Issue 1
- [ ] Issue 2

### Changes Made
1. **Change Title** (STATUS):
   - Problem: Description
   - Solution: Description
   - Files modified: list

## Completed Cycle (vX.Y.Z) - Title ✅
### Summary of Changes
- ✅ Change 1
- ✅ Change 2
```

#### Maintenance Rules
- Update at least daily during active development
- Mark issues as [ ] when identified, [x] when resolved
- Use status indicators: (IN PROGRESS), (COMPLETED), (BLOCKED)
- Include file modifications for each change
- Keep current cycle at top, completed cycles below
- Maximum 5 completed cycles in file

### 2. Release Notes (`release_notes.md`)

#### Structure
```markdown
# 📦 Release Notes

## 🚀 Version X.Y.Z - Title
*Released: Date*

### 🌟 Major Changes
- Change 1
- Change 2

### 🐛 Bug Fixes
- Fix 1
- Fix 2

### 📁 Files Modified
- file1.js - Change type
- file2.js - Change type

### 🎯 Impact
#### For Users
- Impact 1
- Impact 2

#### For Developers
- Impact 1
- Impact 2
```

#### Maintenance Rules
- Create new section for each release
- Include all changes from development changelog
- Focus on user impact and practical benefits
- Use emojis for better readability
- Keep last 5 releases in file

### 3. Lessons Learned (`lessons_learned.md`)

#### Structure
```markdown
# Lessons Learned

## Category
### Lesson Title
- **Context**: What led to this lesson
- **Problem**: What went wrong
- **Solution**: How it was fixed
- **Prevention**: How to prevent in future
```

#### Maintenance Rules
- Document lessons immediately after learning
- Categorize lessons for easy reference
- Include both technical and process lessons
- Focus on actionable insights
- Keep lessons concise and practical

### 4. Backlog (`backlog.md`)

#### Structure
```markdown
# Backlog

## Priority 1
- [ ] Item 1
  - Description
  - Dependencies
  - Estimated effort

## Priority 2
- [ ] Item 2
```

#### Maintenance Rules
- Update weekly
- Prioritize items clearly
- Include dependencies
- Mark completed items
- Archive completed items quarterly

## 🔄 Documentation Workflow

### 1. Daily Development
- Update changelog with new changes
- Document any lessons learned
- Update backlog status

### 2. Release Preparation
1. Review development changelog
2. Create release notes entry
3. Update version numbers
4. Verify all documentation
5. Archive old changelog entries

### 3. Post-Release
1. Truncate development changelog
2. Archive old release notes
3. Update README.md
4. Verify all links and references

## 📋 Documentation Checklist

### Before Each Commit
- [ ] Changelog updated
- [ ] Lessons learned documented
- [ ] Backlog status current

### Before Each Release
- [ ] Release notes prepared
- [ ] Version numbers consistent
- [ ] All documentation current
- [ ] No broken links
- [ ] README.md updated

### After Each Release
- [ ] Changelog truncated
- [ ] Old entries archived
- [ ] Documentation verified
- [ ] Links checked

## 🎨 Style Guide

### Formatting
- Use markdown headers (# ## ###)
- Use bullet points for lists
- Use code blocks for examples
- Use tables for structured data

### Language
- Use active voice
- Be concise and clear
- Avoid technical jargon
- Use consistent terminology

### Emojis
- Use relevant emojis for sections
- Keep emoji usage consistent
- Don't overuse emojis
- Use emojis for status indicators

## 🔍 Quality Checks

### Automated Checks
- Markdown linting
- Link validation
- Version number consistency
- File existence verification

### Manual Reviews
- Content accuracy
- Formatting consistency
- Language clarity
- Completeness check

## 📚 Archiving Process

### When to Archive
- After 5 completed cycles in changelog
- After 5 releases in release notes
- Quarterly for backlog
- Annually for lessons learned

### Archive Structure
```
docs/archive/
  ├── changelog/
  │   └── YYYY-MM-DD-changelog.md
  ├── releases/
  │   └── YYYY-MM-DD-release-notes.md
  ├── backlog/
  │   └── YYYY-QQ-backlog.md
  └── lessons/
      └── YYYY-QQ-lessons.md
```

## 🚨 Emergency Updates

### Critical Fixes
1. Document in changelog immediately
2. Update release notes if needed
3. Add to lessons learned
4. Update README.md if critical

### Security Updates
1. Document in changelog
2. Create security release notes
3. Update deployment docs
4. Document in lessons learned 

## 🔄 Version Management Rules

### When to Increment Version
- **PATCH (Z)**: Documentation updates, process improvements, bug fixes
- **MINOR (Y)**: New features, significant documentation system changes
- **MAJOR (X)**: Breaking changes, major architectural changes

### Version Update Process
1. **Review Changes**
   - Check development_changelog.md
   - Assess impact of changes
   - Determine appropriate version increment

2. **Update Version**
   - Update version.json FIRST
   - Run version-sync script
   - Verify with npm test
   - Update all documentation

3. **Documentation Updates**
   - Update release_notes.md
   - Update README.md version history
   - Clear development_changelog.md
   - Archive old documentation

### Version Verification
- Run version-sync script
- Run test suite
- Check all version references
- Verify service worker cache version
- Check manifest.json version
- Verify package.json version

### Common Version Update Triggers
- Documentation system changes
- Process improvements
- Build system updates
- Deployment procedure changes
- Project structure changes
- Development workflow updates 

## 📅 Date and Timestamp Rules

### Timestamp Format
- **ISO 8601 Format**: Use `YYYY-MM-DDTHH:mm:ss.sssZ` for all timestamps
- **Example**: `2024-03-14T15:30:00.000Z`
- **Time Zone**: Always use UTC (Z suffix)
- **Milliseconds**: Include 3 decimal places for milliseconds

### Date Format
- **Human Readable**: Use `Month DD, YYYY` format
- **Example**: `March 14, 2024`
- **Month Names**: Use full month names, not abbreviations
- **Time Zone**: Include time zone if relevant (e.g., "UTC")

### Date Rules
- **NO FUTURE DATES**: Never use dates beyond the current date
- **Consistent Time**: Use the same timestamp across all files for a release
- **Version Timestamps**: Must match the version.json timestamp
- **Release Dates**: Must be the actual release date, not planned dates

### Timestamp Generation
- **Development**: Use `Date.now()` for local development
- **Production**: Use version.json timestamp for releases
- **Documentation**: Use actual dates, not placeholder dates
- **History**: Keep historical dates accurate, don't modify them

### Date Update Process
1. **Check Current Date**: Verify against system time
2. **Update Version**: Set timestamp in version.json
3. **Sync Dates**: Update all documentation with same date
4. **Verify**: Check no future dates exist
5. **Commit**: Include date updates in version commit 