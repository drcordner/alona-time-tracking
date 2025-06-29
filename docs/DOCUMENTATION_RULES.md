# DOCUMENTATION_RULES.md

## 📚 Documentation System Principles
- All documentation must be clear, concise, and aligned with the Vibe philosophy.
- Every significant change (code, process, or documentation) must be reflected in the documentation system.
- Documentation must be versioned and updated in sync with releases.

## 📝 Documentation Structure
- All documentation files are stored in the `docs/` directory.
- Key files include:
  - `development_changelog.md`
  - `release_notes.md`
  - `PROJECT_DOCUMENTS.md`
  - `DOCUMENTATION_RULES.md`
  - `lessons_learned.md`

## 🔄 Rule System Maintenance

### **Dual Rule System**
This project uses two complementary rule systems that must be kept in sync:

1. **`.cursorrules`** - High-level project constraints for Cursor IDE
2. **`.cursor/rules/*.mdc`** - Detailed technical guidance for AI assistants

### **Rule Maintenance Process**
- **ALWAYS update both rule systems** when changes affect both
- **Version changes** require updates to both `.cursorrules` and `version-consistency.mdc`
- **Documentation process changes** require updates to both `.cursorrules` and `documentation-context.mdc`
- **Architecture changes** require updates to both `.cursorrules` and relevant `.mdc` files
- **Run `npm test`** after rule updates to verify consistency

### **Rule Update Checklist**
- [ ] Identify which rule system(s) need updates
- [ ] Make changes to primary rule system
- [ ] Update cross-references in other rule system
- [ ] Ensure no contradictions between systems
- [ ] Run `npm test` to verify rule compliance
- [ ] Check that all referenced files exist

### **Critical Rule Files**
- `.cursorrules` - Project constraints and processes
- `.cursor/rules/core-context.mdc` - Current project status and technical standards
- `.cursor/rules/version-consistency.mdc` - Detailed version management procedures
- `.cursor/rules/documentation-context.mdc` - Documentation maintenance guidelines
- `.cursor/rules/rule-maintenance.mdc` - Rule system maintenance procedures
- `.cursor/rules/server-integration.mdc` - Server configuration guidelines

## 🛠️ Documentation Update Process
1. Make changes to documentation files as needed.
2. Update the changelog and release notes to reflect all changes.
3. Increment the version if documentation or process changes are significant (see Version Management Rules).
4. Run `npm run version-sync` to propagate version changes.
5. Run `npm test` to verify documentation and version consistency.
6. Commit and push all changes before merging to production.

## 🔄 Version Management Rules
- **When to Increment Version:**
  - PATCH: Any documentation, process, or non-breaking change.
  - MINOR: New features, enhancements, or significant process changes.
  - MAJOR: Breaking changes or major overhauls.
- **Version Update Process:**
  1. Review all changes since the last release.
  2. Update `version.json` with the new version, date, and summary.
  3. Run `npm run version-sync` to propagate the version.
  4. Update documentation and changelogs as needed.
  5. Commit and push all changes before merging to production.
- **Verification:**
  - Run `npm test` to verify version consistency across all files.
  - Check that all version references match `version.json`.

## 📅 Date and Timestamp Rules
- **Timestamp Format:**
  - Use ISO 8601 format for all timestamps (e.g., `2025-06-14T15:30:00.000Z`).
  - Always include time zone (UTC, indicated by `Z`).
  - Include milliseconds for precision.
- **Date Format:**
  - Use human-readable format for documentation (e.g., `June 14, 2025`).
  - Always use full month names and include time zone if relevant.
- **Date Rules:**
  - No future dates are allowed in documentation or version files.
  - All timestamps must reflect the actual date/time of the change or release.
  - All documentation dates must be consistent and match the version in `version.json`.
- **Timestamp Generation:**
  - For development, use the actual date/time of the change.
  - For production, ensure the release date matches the deployment date.
- **Date Update Process:**
  1. Check the current date/time before updating documentation.
  2. Update all relevant timestamps and dates in documentation and version files.
  3. Run `npm run version-sync` to propagate changes.
  4. Run `npm test` to verify no future dates exist and all dates are consistent.
  5. Commit and push all changes.

## 🛡️ Critical File Protection Rules

### Protected Directories
- `.vscode/`: IDE Configuration
- `.github/workflows/`: CI/CD Configuration
- `.cursor/rules/`: AI Assistant Rules

### Protection Rules
1. **Backup Requirements**
   - All critical files must be backed up before any branch operations
   - Backups must be stored in `docs/backups/` with appropriate subdirectories
   - Backup timestamps must be included in filenames

2. **Git Operations**
   - Critical directories must be in `.gitignore`
   - Git operations must not delete these directories
   - Force pushes are prohibited
   - Branch protection rules must be enabled 