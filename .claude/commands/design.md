---
description: Design orchestration for architecture and UI/UX
---

# Design Command

**Purpose**: Comprehensive design planning and implementation

**Auto-Activates**:
- Architect persona for system design
- Frontend persona for UI design
- Magic MCP for UI components
- Sequential for design planning

**Usage**: `/design [domain] [flags]`

**Arguments**:
- `[domain]`: system, component, api, database
- `@<path>`: Design location
- `--scope <level>`: file, module, project, system
- `--validate`: Validate design decisions

**Examples**:
- `/design system @architecture`
- `/design component "vacation calendar"`
- `/design api @backend/routes`

Design and plan: ${ARGUMENTS}
