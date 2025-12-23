---
description: Problem investigation and root cause analysis
---

# Troubleshoot Command

**Purpose**: Systematic problem investigation and debugging

**Auto-Activates**:
- Analyzer persona for investigation
- QA persona for validation
- Sequential for structured debugging

**Usage**: `/troubleshoot [symptoms] [flags]`

**Arguments**:
- `[symptoms]`: Problem description
- `@<path>`: Location of issue
- `--think`: Deep analysis mode
- `--validate`: Test fixes

**Examples**:
- `/troubleshoot "calendar bars overlapping" @src/components/Calendar`
- `/troubleshoot performance issues --think`
- `/troubleshoot @api/auth --validate`

Investigate and resolve: ${ARGUMENTS}
