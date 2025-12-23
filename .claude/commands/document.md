---
description: Professional documentation generation with localization support
---

# Document Command

**Purpose**: Create professional documentation with cultural adaptation

**Auto-Activates**:
- Scribe persona for writing
- Mentor persona for educational content
- Context7 for documentation patterns

**Usage**: `/document [target] [flags]`

**Arguments**:
- `[target]`: What to document
- `@<path>`: Specific file/directory
- `--lang <code>`: Language (en, ko, ja, etc.)
- `--type <type>`: readme, api, guide, wiki

**Examples**:
- `/document @src/api --type api`
- `/document --lang ko --type readme`
- `/document @components/Calendar`

Generate documentation: ${ARGUMENTS}
