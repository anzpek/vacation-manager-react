---
description: Project cleanup and technical debt reduction
---

# Cleanup Command

**Purpose**: Systematic cleanup and technical debt management

**Auto-Activates**:
- Refactorer persona
- Sequential for analysis
- Context7 for cleanup patterns

**Usage**: `/cleanup [target] [flags]`

**Arguments**:
- `[target]`: What to clean up
- `@<path>`: Specific location
- `--debt`: Focus on technical debt
- `--validate`: Validate after cleanup

**Examples**:
- `/cleanup @src --debt`
- `/cleanup unused imports`
- `/cleanup --validate`

Clean up and reduce technical debt: ${ARGUMENTS}
