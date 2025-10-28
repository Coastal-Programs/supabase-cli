# 🏗️ AGENT BRIEF: Backend Architect
## Implementation Lead for Sprint 4

**Timeline**: 5 days (parallel execution)
**Deliverables**: 5 commands (~600 lines of code)
**Agent Type**: `backend-architect`
**Coordinator**: Claude Code (Chen)

---

## YOUR MISSION

Implement the final 5 advanced commands for Supabase CLI MVP completion. You've already proven this pattern works (projects + database commands). This is "more of the same excellence."

---

## COMMANDS TO IMPLEMENT

### 1. `src/commands/functions/deploy.ts` (150-180 lines)

**Purpose**: Deploy or update an Edge Function

**Signature**:
```bash
supabase functions deploy <function-name> [<source-file-or-zip>]
  --project <ref>
  --runtime <node|deno|go>
  --dry-run
  --force
  --yes
```

**Implementation Requirements**:

1. **Input Validation**:
   - Function name: kebab-case, 1-64 chars
   - Source file: Must be .ts/.js or .zip
   - Runtime: node, deno, or go (validate against supported)
   - Project ref: Required, from flag or env

2. **Core Logic**:
   ```typescript
   // Read source file or zip
   // If file is .ts/.js, compile to zip
   // Call API: deployFunction(projectRef, name, runtime, codeZip)
   // Invalidate functions cache
   ```

3. **Special Features**:
   - Dry-run mode: Show what would happen, don't deploy
   - Progress indicator: Show upload progress
   - Confirmation prompt unless --force or --yes
   - Display deployment status & URL

4. **Error Handling**:
   - File not found → INVALID_REQUEST
   - Invalid runtime → INVALID_REQUEST
   - Invalid name format → INVALID_REQUEST
   - Deploy failure → wrapped error

5. **Output**:
   ```typescript
   {
     name: string,
     runtime: string,
     created_at: string,
     updated_at: string,
     status: 'ACTIVE' | 'DEPLOYING' | 'ERROR',
     url?: string,
     version: number
   }
   ```

**Reference Implementation**: Similar to `projects/create.ts` but with file handling
**API Method Required**: `deployFunction(projectRef, name, runtime, code)` in supabase.ts

---

### 2. `src/commands/functions/invoke.ts` (120-150 lines)

**Purpose**: Invoke an Edge Function with arguments

**Signature**:
```bash
supabase functions invoke <function-name>
  --project <ref>
  --arguments <json-string>
  --method <GET|POST|PUT|DELETE>
  --timeout <milliseconds>
```

**Implementation Requirements**:

1. **Input Validation**:
   - Function name: Required, kebab-case
   - Arguments: Optional, must be valid JSON if provided
   - Method: GET|POST|PUT|DELETE (default: POST)
   - Timeout: 0-300000ms (default: 30000)

2. **Core Logic**:
   ```typescript
   // Parse arguments from flag
   // Call API: invokeFunction(projectRef, name, args, method)
   // Measure response time
   // Parse response (JSON or text)
   ```

3. **Special Features**:
   - Display execution time
   - Show response status code
   - Pretty-print JSON responses
   - Timeout handling with clear error

4. **Error Handling**:
   - Function not found → NOT_FOUND
   - Invalid JSON → INVALID_REQUEST
   - Timeout → error with suggestion to increase timeout
   - Execution error → show error details

5. **Output**:
   ```typescript
   {
     result: any,
     executionTime: number,
     statusCode: number,
     headers: Record<string, string>
   }
   ```

**Reference Implementation**: Similar to `db/query.ts` but HTTP-based
**API Method Required**: `invokeFunction(projectRef, name, args)` in supabase.ts

---

### 3. `src/commands/branches/list.ts` (85-100 lines)

**Purpose**: List development branches for a project

**Signature**:
```bash
supabase branches list
  --project <ref>
  --status <CREATING|ACTIVE|ERROR>
  --parent <branch-name>
  --format <json|table|csv|yaml>
```

**Implementation Requirements**:

1. **Input Validation**:
   - Project ref: Required
   - Status: Optional filter (CREATING, ACTIVE, ERROR)
   - Parent: Optional filter

2. **Core Logic**:
   ```typescript
   // Call API: listBranches(projectRef)
   // Filter by status if provided
   // Filter by parent if provided
   // Apply pagination
   ```

3. **Special Features**:
   - Show status with indicators (🔵 ACTIVE, 🟡 CREATING, 🔴 ERROR)
   - Display parent branch
   - Show creation timestamp
   - Display current project status

4. **Error Handling**:
   - Project not found → NOT_FOUND
   - Invalid filter → INVALID_REQUEST

5. **Output**:
   ```typescript
   {
     name: string,
     parent: string,
     status: 'CREATING' | 'ACTIVE' | 'ERROR',
     created_at: string,
     project_ref: string
   }[]
   ```

**Reference Implementation**: Copy pattern from `projects/list.ts`
**API Method Required**: `listBranches(projectRef)` in supabase.ts

---

### 4. `src/commands/config/init.ts` - COMPLETE (Add ~100 lines)

**Current State**: Skeleton exists with TODOs
**Purpose**: Initialize CLI configuration and store credentials

**Implementation Requirements**:

1. **Input Validation**:
   - Profile name: alphanumeric + underscore (default: "default")
   - Token format: supabase_<random>

2. **Core Logic**:
   ```typescript
   // 1. Check if SUPABASE_ACCESS_TOKEN is set
   // 2. If not, prompt user (BUT NOTE: This is non-interactive CLI!)
   //    → Instead, show clear error message with setup instructions
   // 3. Validate token via API call: getToken() or whoami()
   // 4. Store config in ~/.supabase/config.json
   // 5. Set env var for session
   ```

3. **Special Features**:
   - Test API connectivity
   - Display organization & projects accessible
   - Create default profile
   - Show setup completion summary

4. **Error Handling**:
   - No token → Clear error with setup instructions
   - Invalid token → UNAUTHORIZED
   - API error → wrapped error

5. **Output**:
   ```typescript
   {
     profile: string,
     token: string,  // First 10 chars only (masked)
     organization: string,
     projects: number,
     config_path: string,
     status: 'INITIALIZED' | 'READY'
   }
   ```

**Reference Implementation**: Copy pattern from `projects/list.ts` but add validation
**API Method Required**: None new (use existing auth validation)

---

### 5. API Methods in `src/supabase.ts` (add if missing)

Ensure these methods exist and work correctly:

```typescript
// Edge Functions
export const deployFunction = async (
  projectRef: string,
  name: string,
  runtime: string,
  code: Buffer
): Promise<any> => {
  // Implementation using cachedFetch with multipart upload
}

export const invokeFunction = async (
  projectRef: string,
  name: string,
  args?: Record<string, any>
): Promise<any> => {
  // Implementation using enhancedFetchWithRetry
}

// Branches
export const listBranches = async (
  projectRef: string
): Promise<any[]> => {
  // Implementation using cachedFetch with caching
}
```

---

## IMPLEMENTATION CHECKLIST

### Code Quality
- [ ] Extend BaseCommand
- [ ] Follow established patterns from projects/db/migrations commands
- [ ] TypeScript strict mode (no `any`, explicit types)
- [ ] JSDoc comments on public methods
- [ ] Proper error handling with semantic codes

### Functionality
- [ ] All arguments validated
- [ ] All flags respected
- [ ] Output formatting working (JSON, table, etc.)
- [ ] Exit codes correct (0 success, 1 error)
- [ ] Cache invalidation on writes

### Testing
- [ ] Ready for 10-15 tests per command
- [ ] Happy path testable
- [ ] Error cases testable
- [ ] Edge cases identifiable

---

## PATTERNS TO FOLLOW

### Command Structure
```typescript
import { BaseCommand } from '../../base-command'
import { AutomationFlags, OutputFormatFlags } from '../../base-flags'
import { Flags, Args } from '@oclif/core'

export default class MyCommand extends BaseCommand {
  static description = '...'
  static aliases = [...]
  static examples = [...]
  static flags = { ...BaseCommand.baseFlags, ...OutputFormatFlags, ... }
  static args = { ... }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MyCommand)
    try {
      // Logic here
      this.output(result)
      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
```

### API Integration
```typescript
// Always use cachedFetch for reads
const result = await cachedFetch(
  `${API_URL}/v1/...`,
  { method: 'GET' },
  { context: 'myOperation' }
)

// For writes, use enhancedFetchWithRetry + invalidate
const result = await enhancedFetchWithRetry(
  () => fetch(...).then(r => r.json()),
  { context: 'myWrite' }
)
cacheManager.invalidate('resources')
```

### Error Handling
```typescript
try {
  // work
} catch (error) {
  const wrapped = wrapSupabaseError(error)
  const envelope = createEnvelope(false, null, wrapped)
  this.log(JSON.stringify(envelope, null, 2))
  process.exit(1)
}
```

---

## RESOURCES

**Existing Code to Reference**:
- `src/commands/projects/list.ts` (list pattern)
- `src/commands/projects/create.ts` (create pattern)
- `src/commands/db/query.ts` (special execution pattern)
- `src/base-command.ts` (available methods)
- `src/supabase.ts` (API wrapper patterns)

**Documentation**:
- `CLAUDE.md` (architecture & patterns)
- `supabase-cli-CLAUDE.md` (detailed guide)
- `API_REFERENCE.md` (Supabase API reference)

**Tests to Reference**:
- `test/commands-projects.test.ts` (command tests pattern)
- `test/supabase.test.ts` (API tests pattern)

---

## SUCCESS CRITERIA

- ✅ 5 commands implemented (~600 lines)
- ✅ All compile without TypeScript errors
- ✅ Follow established patterns
- ✅ Proper error handling & exit codes
- ✅ Output formatting working
- ✅ Cache invalidation verified
- ✅ Ready for comprehensive testing

---

## HANDOFF CHECKLIST

Before handing off to `test-writer-fixer`:
- [ ] All 5 commands compile
- [ ] No TypeScript errors
- [ ] All flags working
- [ ] Arguments validated
- [ ] Error messages clear
- [ ] Output looks good
- [ ] Code follows patterns

---

## QUESTIONS? BLOCKERS?

If you encounter issues:
1. Check existing patterns in projects/db/migrations commands
2. Review CLAUDE.md architecture section
3. Look at supabase.ts for similar API operations
4. Check test files for usage patterns

**You've got this!** 🚀

---

**Estimated Time**: 18-20 hours (can be done in parallel with test-writer-fixer)
**Deadline**: End of Day 4
**Coordination**: Chen will monitor progress daily
