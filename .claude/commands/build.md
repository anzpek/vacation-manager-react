---
description: Project builder with framework detection and optimization
---

# Build Command

**Purpose**: Build and optimize projects with intelligent framework detection

**Auto-Activates**:
- Frontend/Backend/Architect personas based on context
- Magic MCP for UI builds
- Context7 for framework patterns

**Usage**: `/build [target] [flags]`

**Arguments**:
- `[target]`: Build target (UI, API, service, full)
- `@<path>`: Specific path to build
- `!<command>`: Custom build command
- `--optimize`: Enable build optimization
- `--validate`: Pre-build validation

**Examples**:
- `/build --optimize`
- `/build @frontend --validate`
- `/build !npm run build:prod`

Build project with framework detection: ${ARGUMENTS}
