# AI Resources Directory

This directory contains machine-readable resources optimized for AI agents using the Supabase CLI.

## Quick Start for AI Agents

1. **First time here?** Read [`../AI_QUICKSTART.md`](../AI_QUICKSTART.md)
2. **Looking for a command?** Check [`command-catalog.json`](./command-catalog.json)
3. **Need a pattern?** See [`patterns.json`](./patterns.json) - 19 command patterns
4. **Need a workflow?** See [`workflows.json`](./workflows.json) - 25 complete workflows
5. **Got an error?** Check [`error-solutions.json`](./error-solutions.json) - 38 error solutions
6. **Want examples?** Browse [`examples/`](./examples/) - 14 executable scripts
7. **Need guidance?** Read [`../docs/ai-guides/`](../docs/ai-guides/) - 5 comprehensive guides

## File Guide

### command-catalog.json ✅ COMPLETE
**Purpose**: Complete database of all 67 CLI commands
**Format**: Structured JSON with metadata, flags, examples, AI hints
**Use when**: Need to know command structure, flags, or examples
**Size**: ~150KB
**Status**: Ready to use

### patterns.json ✅ COMPLETE
**Purpose**: Common command composition patterns
**Format**: Array of pattern objects with examples
**Use when**: Combining multiple commands
**Size**: ~150KB
**Status**: 19 patterns ready to use

### workflows.json ✅ COMPLETE
**Purpose**: Task-based step-by-step workflows
**Format**: Structured workflows with prerequisites and steps
**Use when**: Accomplishing specific tasks
**Size**: ~200KB
**Status**: 25 workflows ready to use

### error-solutions.json ✅ COMPLETE
**Purpose**: Error code to solution mapping
**Format**: Array of error objects with solutions
**Use when**: Handling errors and troubleshooting
**Size**: ~100KB
**Status**: 38 error codes documented

### performance-profiles.json ✅ COMPLETE
**Purpose**: Expected execution times for commands
**Format**: Performance data per command
**Use when**: Setting expectations or optimizing
**Size**: ~180KB
**Status**: All 67 commands profiled

### examples/ ✅ COMPLETE
**Purpose**: Executable shell script examples
**Format**: Bash scripts with comments
**Use when**: Need working code to copy/modify
**Size**: ~35KB (14 files)
**Status**: 14 executable scripts including common.sh utilities

## AI Guides (Sprint 3) ✅ COMPLETE

Located in [`../docs/ai-guides/`](../docs/ai-guides/), these human-readable guides complement the machine-readable resources:

### quick-reference.md
**Purpose**: Single-page cheatsheet
**Content**: Top 20 commands, common flags, error codes, patterns
**Use when**: Need quick lookup without reading full resources

### decision-trees.md
**Purpose**: If-then-else flowcharts for decision-making
**Content**: 7 major decision trees with Mermaid diagrams
**Use when**: Unsure which approach or command to use

### common-tasks.md
**Purpose**: 25 most common operations by frequency
**Content**: Daily, weekly, monthly, setup, and as-needed tasks
**Use when**: Need to accomplish typical operations

### error-handling.md
**Purpose**: Comprehensive error handling guide
**Content**: All 38 error codes, debugging workflows, prevention tips
**Use when**: Troubleshooting or implementing error handling

### best-practices.md
**Purpose**: Optimization and security guidance
**Content**: AI optimization, security, performance, anti-patterns
**Use when**: Optimizing implementation or following best practices

## Current Status

**Sprint 1 Complete**: Foundation established ✅
- ✅ AI_QUICKSTART.md created
- ✅ command-catalog.json complete (67 commands)
- ✅ Directory structure created

**Sprint 2A Complete**: Content created ✅
- ✅ patterns.json (19 patterns)
- ✅ workflows.json (25 workflows)
- ✅ error-solutions.json (38 errors)
- ✅ performance-profiles.json (67 commands)

**Sprint 2B Complete**: Examples created ✅
- ✅ examples/ directory (14 executable scripts)
- ✅ common.sh utilities (19 functions)
- ✅ test-examples.sh validation

**Sprint 3 Complete**: AI guides created ✅
- ✅ 5 comprehensive AI guides in docs/ai-guides/
- ✅ JSON schemas for all resources
- ✅ IDE integration (VS Code autocomplete)

**Sprint 4 In Progress**: Final polish and integration 🔄

## How to Use

### 1️⃣ First Time Setup
```bash
# Start here for complete overview
1. Read ../AI_QUICKSTART.md (< 2 minutes)
2. Skim docs/ai-guides/quick-reference.md (30 seconds)
3. Check command-catalog.json for specific commands
```

### 2️⃣ For Specific Tasks
```bash
# Use workflows for step-by-step guidance
1. Check workflows.json for your task
2. Reference patterns.json for command patterns
3. Use examples/ for executable code
```

### 3️⃣ For Error Handling
```bash
# Comprehensive error support
1. Check error-solutions.json for error codes
2. Read docs/ai-guides/error-handling.md for strategies
3. Use troubleshooting examples in examples/troubleshooting.sh
```

### 4️⃣ For Optimization
```bash
# Performance and best practices
1. Check performance-profiles.json for timing data
2. Read docs/ai-guides/best-practices.md
3. Use automation examples in examples/automation.sh
```

## Maintenance

### Auto-Generated Files
- `command-catalog.json` - Can be regenerated from `src/commands/`

### Manually Curated Files
- `patterns.json` - ✅ Curated (19 patterns)
- `workflows.json` - ✅ Curated (25 workflows)
- `error-solutions.json` - ✅ Curated (38 error codes)
- `performance-profiles.json` - ✅ Curated (67 commands)
- `examples/` - ✅ Curated (14 scripts)

## File Sizes

| File | Size | Items | Status |
|------|------|-------|--------|
| command-catalog.json | ~150KB | 67 commands | ✅ Complete |
| patterns.json | ~150KB | 19 patterns | ✅ Complete |
| workflows.json | ~200KB | 25 workflows | ✅ Complete |
| error-solutions.json | ~100KB | 38 errors | ✅ Complete |
| performance-profiles.json | ~180KB | 67 profiles | ✅ Complete |
| examples/ | ~35KB | 14 scripts | ✅ Complete |

**Total**: ~815KB of AI-optimized resources

## Validation

All resources are validated automatically:

```bash
# Validate JSON structure
npm run validate:ai

# Validate against schemas
npm run validate:schemas

# Validate example scripts
npm run test:examples
```

All validations pass with 100% success rate.

---

**For more information**, see:
- [AI Quick Start](../AI_QUICKSTART.md) - Start here!
- [Full Documentation](../docs/README.md)
- [Orchestration Plan](../docs/AI_OPTIMIZATION_ORCHESTRATION.md)
