---
description: Evidence-based code enhancement and optimization
---

# Improve Command

**Purpose**: Systematic code improvement with quality metrics

**Auto-Activates**:
- Refactorer/Performance/Architect personas
- Sequential for analysis
- Context7 for improvement patterns

**Usage**: `/improve [target] [flags]`

**Arguments**:
- `[target]`: Code to improve
- `@<path>`: Specific path
- `--focus <domain>`: performance, security, quality, architecture
- `--loop`: Enable iterative improvement
- `--iterations <n>`: Number of improvement cycles

**Examples**:
- `/improve @src/utils --focus performance`
- `/improve --loop --iterations 3`
- `/improve @components --focus quality`

Improve code systematically: ${ARGUMENTS}
