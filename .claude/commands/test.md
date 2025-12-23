---
description: Testing workflows with comprehensive coverage
---

# Test Command

**Purpose**: Testing strategy and implementation

**Auto-Activates**:
- QA persona for testing
- Playwright for E2E tests
- Sequential for test planning

**Usage**: `/test [type] [flags]`

**Arguments**:
- `[type]`: unit, integration, e2e, performance
- `@<path>`: Test target
- `--coverage`: Generate coverage report
- `--validate`: Validate test quality

**Examples**:
- `/test e2e @src/components`
- `/test unit --coverage`
- `/test performance @api`

Execute testing workflow: ${ARGUMENTS}
