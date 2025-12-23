---
description: Multi-dimensional code and system analysis with evidence-based insights
---

# Analyze Command

**Purpose**: Comprehensive code and system analysis with systematic investigation

**Auto-Activates**:
- Analyzer persona for root cause investigation
- Sequential MCP for structured analysis
- Context7 for pattern verification

**Usage**: `/analyze [target] [flags]`

**Arguments**:
- `[target]`: File, directory, or system component to analyze
- `@<path>`: Specific path to analyze
- `--focus <domain>`: Focus area (performance, security, quality, architecture)
- `--scope <level>`: Analysis scope (file, module, project, system)
- `--think`: Enable deep analysis mode
- `--uc`: Use compressed output

**Examples**:
- `/analyze @src/components --focus performance`
- `/analyze --scope system --think`
- `/analyze @backend/api --focus security`

Perform systematic, evidence-based analysis of ${ARGUMENTS}
