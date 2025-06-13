# 📚 Project Documents

This document provides an overview of all project documentation and their purposes.

## 📋 Core Documentation

| Document | Purpose | Location | Last Updated |
|----------|---------|----------|--------------|
| README.md | Project overview, setup, and quick start | Root | v5.3.4 |
| deployment.md | Deployment instructions and procedures | docs/ | v5.3.4 |
| deployment_strategy.md | Deployment strategy and best practices | docs/ | v5.3.4 |
| lessons_learned.md | Development insights and best practices | docs/ | v5.3.4 |
| development_changelog.md | Current development cycle tracking | docs/ | v5.3.4 |
| backlog.md | Feature backlog and planning | docs/ | v5.3.4 |
| release_notes.md | Release history and changes | docs/ | v5.3.4 |
| DOCUMENTATION_RULES.md | Documentation standards and processes | docs/ | v5.3.4 |

## 📝 Single Sources of Truth

The following documents are considered single sources of truth and must be kept up to date:

1. **README.md**
   - Project overview
   - Setup instructions
   - Version history
   - Quick start guide

2. **deployment.md**
   - Deployment procedures
   - Environment setup
   - Configuration details

3. **deployment_strategy.md**
   - Deployment strategy
   - Best practices
   - Rollback procedures

4. **lessons_learned.md**
   - Development insights
   - Best practices
   - Common pitfalls

5. **development_changelog.md**
   - Current development cycle
   - In-progress changes
   - Recent fixes

6. **backlog.md**
   - Feature planning
   - Priority items
   - Technical debt

7. **release_notes.md**
   - Release history
   - Version changes
   - User impact

8. **DOCUMENTATION_RULES.md**
   - Documentation standards
   - Maintenance processes
   - Style guidelines
   - Archiving rules

## 🔄 Update Process

1. **Development Phase**
   - Track changes in `development_changelog.md`
   - Update `backlog.md` as items are completed
   - Document lessons in `lessons_learned.md`
   - Follow rules in `DOCUMENTATION_RULES.md`

2. **Release Phase**
   - Update `version.json`
   - Update `release_notes.md`
   - Update `README.md` version history
   - Verify all documentation is current
   - Archive old documentation as per rules

3. **Deployment Phase**
   - Follow `deployment.md` procedures
   - Apply `deployment_strategy.md` guidelines
   - Document any new lessons learned
   - Update relevant documentation

## 📋 Documentation Checklist

Before each release, verify:

- [ ] All documents are in the correct location
- [ ] No duplicate documentation exists
- [ ] All links and references are correct
- [ ] Version numbers are consistent
- [ ] Release notes are comprehensive
- [ ] Development changelog is current
- [ ] Backlog is up to date
- [ ] Lessons learned are documented
- [ ] Documentation follows rules in DOCUMENTATION_RULES.md
- [ ] Old documentation is properly archived

## 📚 Archive Structure

Historical documentation is maintained in the following structure:

```
docs/archive/
  ├── changelog/    # Archived development changelogs
  ├── releases/     # Archived release notes
  ├── backlog/      # Archived backlog items
  └── lessons/      # Archived lessons learned
```

See `DOCUMENTATION_RULES.md` for detailed archiving procedures and rules. 