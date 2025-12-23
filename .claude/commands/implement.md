---
description: Feature and code implementation with intelligent persona activation
---

# Implement Command

**Purpose**: Implement features and code with context-aware persona activation

**Auto-Activates**:
- Frontend/Backend/Security personas based on feature type
- Magic MCP for UI components
- Sequential for complex logic

**Usage**: `/implement [feature] [flags]`

**Arguments**:
- `[feature]`: Feature description to implement
- `--type <type>`: component, api, service, feature
- `--framework <name>`: Specify framework
- `@<path>`: Implementation location

**Examples**:
- `/implement user authentication --type api`
- `/implement dashboard component --type component`
- `/implement payment service @backend/services`

Implement the following feature: ${ARGUMENTS}
