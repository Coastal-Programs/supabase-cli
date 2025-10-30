# Command Standardization Mapping

This document tracks all changes made to standardize the 34 command files in the Supabase CLI.

## Standardization Checklist

Each command has been standardized to follow these patterns:

1. **Import Error Messages** - Use centralized error messages from `src/error-messages.ts`
2. **Use ProjectFlags** - Project reference via `--project` flag instead of positional arg
3. **Consistent Examples** - Show `--project` flag in all examples
4. **Confirmation Prompts** - For destructive operations, use ErrorMessages.CONFIRM_*
5. **Success/Error Messages** - Use SuccessMessages, ErrorMessages, InfoMessages, WarningMessages
6. **Empty Results Handling** - Use InfoMessages.NO_RESULTS()
7. **Result Count Display** - Use InfoMessages.RESULTS_COUNT()

## Commands Standardized (Total: 34)

### Category: Projects (6 commands)

| File | Status | Changes Made |
|------|--------|--------------|
| `projects/list.ts` | ✅ DONE | Added InfoMessages for NO_RESULTS and RESULTS_COUNT; improved empty state handling |
| `projects/get.ts` | ✅ DONE | Changed from positional arg to --project flag; added ErrorMessages.PROJECT_REQUIRED |
| `projects/create.ts` | ✅ DONE | Added ConfirmationFlags; use SuccessMessages, WarningMessages; improved feedback |
| `projects/delete.ts` | ✅ DONE | Changed to --project flag; use ErrorMessages.CONFIRM_DELETE; fetch project details first |
| `projects/pause.ts` | ✅ DONE | Changed to --project flag; use ErrorMessages.CONFIRM_PAUSE; fetch project details first |
| `projects/restore.ts` | ✅ DONE | Already standardized with error messages; no changes needed |

### Category: Database (12 commands)

| File | Status | Changes Made |
|------|--------|--------------|
| `db/query.ts` | ✅ DONE | Added ErrorMessages.PROJECT_REQUIRED; use SuccessMessages.QUERY_EXECUTED |
| `db/extensions.ts` | ✅ DONE | Added ErrorMessages.PROJECT_REQUIRED; use InfoMessages for results |
| `db/schema.ts` | ✅ DONE | Added ErrorMessages.PROJECT_REQUIRED; use InfoMessages.NO_RESULTS |
| `db/info.ts` | ✅ DONE | Added ErrorMessages.PROJECT_REQUIRED; consistent structure |
| `db/schemas.ts` | ⏳ TODO | Add ErrorMessages.PROJECT_REQUIRED; use InfoMessages |
| `db/policies.ts` | ⏳ TODO | Add ErrorMessages.PROJECT_REQUIRED; use InfoMessages.NO_RESULTS |
| `db/connections.ts` | ⏳ TODO | Add ErrorMessages.PROJECT_REQUIRED; standardize output |
| `db/table-sizes.ts` | ⏳ TODO | Add ErrorMessages.PROJECT_REQUIRED; use InfoMessages |
| `db/user-info.ts` | ⏳ TODO | Add ErrorMessages.PROJECT_REQUIRED; standardize structure |
| `db/config/get.ts` | ⏳ TODO | Add ErrorMessages.PROJECT_REQUIRED |
| `db/config/set.ts` | ⏳ TODO | Add ErrorMessages.PROJECT_REQUIRED; use SuccessMessages |
| `db/webhooks/list.ts` | ⏳ TODO | Add ErrorMessages.PROJECT_REQUIRED; use InfoMessages |

### Category: Backups (2 commands)

| File | Status | Changes Made |
|------|--------|--------------|
| `backup/list.ts` | ⏳ TODO | Change to --project flag in examples; use InfoMessages.NO_RESULTS |
| `backup/get.ts` | ⏳ TODO | Change to --project flag; add ErrorMessages.BACKUP_NOT_FOUND |

### Category: Functions (3 commands)

| File | Status | Changes Made |
|------|--------|--------------|
| `functions/list.ts` | ⏳ TODO | Add ErrorMessages.PROJECT_REQUIRED; use InfoMessages.NO_RESULTS |
| `functions/invoke.ts` | ⏳ TODO | Already uses PROJECT_REQUIRED via inline string; convert to ErrorMessages |
| `functions/deploy.ts` | ⏳ TODO | Add ErrorMessages.PROJECT_REQUIRED; use SuccessMessages.FUNCTION_DEPLOYED |

### Category: Branches (2 commands)

| File | Status | Changes Made |
|------|--------|--------------|
| `branches/list.ts` | ⏳ TODO | Add ErrorMessages.PROJECT_REQUIRED; use InfoMessages |
| `branches/create.ts` | ⏳ TODO | Add ErrorMessages.PROJECT_REQUIRED; use SuccessMessages |

### Category: Storage (5 commands)

| File | Status | Changes Made |
|------|--------|--------------|
| `storage/buckets/list.ts` | ⏳ TODO | Add ErrorMessages.PROJECT_REQUIRED; use InfoMessages.NO_RESULTS |
| `storage/buckets/get.ts` | ⏳ TODO | Change to --project flag; use ErrorMessages.BUCKET_NOT_FOUND |
| `storage/buckets/create.ts` | ⏳ TODO | Add ErrorMessages.PROJECT_REQUIRED; use SuccessMessages |
| `storage/buckets/delete.ts` | ⏳ TODO | Add confirmation prompt; use ErrorMessages.CONFIRM_DELETE |
| `storage/policies/list.ts` | ⏳ TODO | Add ErrorMessages.PROJECT_REQUIRED; use InfoMessages |
| `storage/policies/set.ts` | ⏳ TODO | Add ErrorMessages.PROJECT_REQUIRED; use SuccessMessages |

### Category: Security (1 command)

| File | Status | Changes Made |
|------|--------|--------------|
| `security/audit.ts` | ⏳ TODO | Add ErrorMessages.PROJECT_REQUIRED; already well-structured |

### Category: Configuration (2 commands)

| File | Status | Changes Made |
|------|--------|--------------|
| `config/init.ts` | ⏳ TODO | Already uses inline error messages; minor improvements only |
| `config/doctor.ts` | ⏳ TODO | Standardize diagnostics output; use WarningMessages |

### Category: Migrations (2 commands)

| File | Status | Changes Made |
|------|--------|--------------|
| `migrations/list.ts` | ⏳ TODO | Add ErrorMessages.PROJECT_REQUIRED; use InfoMessages |
| `migrations/apply.ts` | ⏳ TODO | Add ErrorMessages.PROJECT_REQUIRED; use SuccessMessages |

## Common Changes Applied

### 1. Project Reference Pattern

**Before:**
```typescript
static args = {
  ref: Args.string({
    description: 'Project reference ID',
    required: true,
  }),
}

const projectRef = args.ref
```

**After:**
```typescript
static flags = {
  ...ProjectFlags,
  // ...
}

const projectRef = flags.project || flags['project-ref'] || process.env.SUPABASE_PROJECT_REF

if (!projectRef) {
  this.error(ErrorMessages.PROJECT_REQUIRED(), { exit: 1 })
}
```

### 2. Error Message Standardization

**Before:**
```typescript
this.error(
  'Project reference required. Use --project flag or set SUPABASE_PROJECT_REF environment variable.',
  { exit: 1 },
)
```

**After:**
```typescript
this.error(ErrorMessages.PROJECT_REQUIRED(), { exit: 1 })
```

### 3. Success Message Pattern

**Before:**
```typescript
this.success(`Project ${project.name} created successfully!`)
```

**After:**
```typescript
this.success(SuccessMessages.PROJECT_CREATED(project.name))
```

### 4. Empty Results Handling

**Before:**
```typescript
if (projects.length === 0) {
  this.warning('No projects found')
  process.exit(0)
}
```

**After:**
```typescript
if (projects.length === 0) {
  if (!flags.quiet) {
    this.warning(InfoMessages.NO_RESULTS('projects'))
    this.info('Create a new project with: supabase-cli projects:create')
  }
  this.output([])
  process.exit(0)
}
```

### 5. Result Count Display

**Before:**
```typescript
this.info(`Total: ${projects.length} of ${allProjects.length} projects`)
```

**After:**
```typescript
this.info(InfoMessages.RESULTS_COUNT(projects.length, 'project'))
if (allProjects.length > projects.length) {
  this.info(`Showing ${offset + 1}-${offset + projects.length} of ${allProjects.length} total`)
}
```

### 6. Confirmation Prompts

**Before:**
```typescript
const confirmed = await this.confirm(
  `Are you sure you want to delete project ${args.ref}?`,
  false,
)
```

**After:**
```typescript
const confirmed = await this.confirm(
  ErrorMessages.CONFIRM_DELETE('project', project.name),
  false,
)
```

## Breaking Changes

### For End Users

**⚠️ BREAKING: Project commands now use flags instead of positional args**

Commands affected:
- `projects:get` - was `projects:get <ref>`, now `projects:get --project <ref>`
- `projects:delete` - was `projects:delete <ref>`, now `projects:delete --project <ref>`
- `projects:pause` - was `projects:pause <ref>`, now `projects:pause --project <ref>`

Migration path: Add `--project` or `-p` flag before the project reference.

## Non-Breaking Changes

All other changes are non-breaking improvements:
- Better error messages
- Consistent success feedback
- Improved empty state handling
- Better help text and examples

## Testing Checklist

After standardization, verify:

- [ ] All commands compile with `npm run build`
- [ ] Examples in help text work correctly
- [ ] Error messages are clear and actionable
- [ ] Success messages provide useful feedback
- [ ] Empty results handled gracefully
- [ ] Confirmation prompts work for destructive operations
- [ ] `--yes` flag bypasses confirmations
- [ ] `--quiet` flag suppresses non-essential output
- [ ] All `--project` flags work with env var fallback

## Completed: 10 / 34 files (29.4%)

Last updated: 2025-10-30
