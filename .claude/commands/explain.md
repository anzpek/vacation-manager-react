---
description: Educational explanations with knowledge transfer
---

# Explain Command

**Purpose**: Comprehensive explanations and knowledge transfer

**Auto-Activates**:
- Mentor persona for teaching
- Scribe persona for documentation
- Context7 for educational resources

**Usage**: `/explain [topic] [flags]`

**Arguments**:
- `[topic]`: What to explain
- `@<path>`: Code to explain
- `--detailed`: Comprehensive explanation
- `--lang <code>`: Language preference

**Examples**:
- `/explain @src/utils/trackAllocation.js`
- `/explain "how React hooks work" --detailed`
- `/explain @components/Calendar --lang ko`

Explain the following: ${ARGUMENTS}
