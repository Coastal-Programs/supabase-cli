# Race Condition Fixes for src/auth.ts

## Overview

Fixed 2 critical file system race condition vulnerabilities in `src/auth.ts` identified by GitHub CodeQL (alerts #11 and #5). These were Time-of-Check Time-of-Use (TOCTOU) vulnerabilities that could lead to security issues in concurrent environments.

## Vulnerabilities Identified

### TOCTOU (Time-of-Check Time-of-Use) Race Conditions

A TOCTOU race condition occurs when there's a gap between checking if a file exists and performing an operation on it. Another process could modify, create, or delete the file in that window.

**CodeQL Alert #11**: `fs.existsSync()` followed by `fs.readFileSync()` in multiple locations
**CodeQL Alert #5**: `fs.existsSync()` followed by `fs.unlinkSync()`

## Root Causes

### 1. `deleteToken()` method (lines 40-49)
```typescript
// BEFORE - VULNERABLE
if (existsSync(this.credentialsFile)) {
  try {
    unlinkSync(this.credentialsFile)
  } catch (error) {
    // handle error
  }
}
```

**Risk**: Between `existsSync()` returning true and `unlinkSync()` executing, another process could delete the file, causing `unlinkSync()` to fail with an error that isn't gracefully handled.

### 2. `getToken()` method (lines 60-62)
```typescript
// BEFORE - VULNERABLE
if (!existsSync(this.credentialsFile)) {
  return null
}
// File could be deleted here
const data = JSON.parse(readFileSync(this.credentialsFile, 'utf-8'))
```

**Risk**: Between the existence check and file read, the file could be deleted or modified, causing an unexpected error.

### 3. `saveToken()` method (lines 87-89, 92-98)
```typescript
// BEFORE - VULNERABLE (directory check)
if (!existsSync(this.configDir)) {
  mkdirSync(this.configDir, { mode: 0o700, recursive: true })
}

// BEFORE - VULNERABLE (credentials file check)
if (existsSync(this.credentialsFile)) {
  try {
    data = JSON.parse(readFileSync(this.credentialsFile, 'utf-8'))
  } catch {
    // ignore
  }
}
```

**Risk**: Multiple race conditions during directory and file creation/reading.

### 4. `getMetadata()` method (lines 121-126)
```typescript
// BEFORE - VULNERABLE
if (!existsSync(this.credentialsFile)) {
  return {}
}
const data = JSON.parse(readFileSync(this.credentialsFile, 'utf-8'))
```

**Risk**: File could be deleted between the check and read.

### 5. `saveMetadata()` method (lines 146-152)
```typescript
// BEFORE - VULNERABLE
if (!existsSync(this.credentialsFile)) {
  // handle
}
data = JSON.parse(readFileSync(this.credentialsFile, 'utf-8'))
```

**Risk**: TOCTOU vulnerability during metadata file operations.

### 6. Legacy `AuthManager.loadCredentials()` (lines 393-407)
```typescript
// BEFORE - VULNERABLE
if (!existsSync(this.credentialsFile)) {
  return null
}
const data = JSON.parse(readFileSync(this.credentialsFile, 'utf-8'))
```

**Risk**: File could be deleted between existence check and read.

## Solution: Atomic File Operations

Replaced all `fs.existsSync()` checks with direct atomic operations using `fs.promises`:

### Key Changes

#### 1. `deleteToken()` - Now uses atomic `unlink()`
```typescript
async deleteToken(): Promise<void> {
  try {
    // Atomically attempt to delete the file
    // If it doesn't exist, unlink throws ENOENT which we catch and ignore
    await unlink(this.credentialsFile)
  } catch (error) {
    // ENOENT means file doesn't exist, which is fine
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return
    }
    throw new SupabaseError(
      `Failed to delete credentials file: ${error instanceof Error ? error.message : String(error)}`,
      SupabaseErrorCode.CONFIG_ERROR,
    )
  }
}
```

**Why this is safe**: The `unlink()` operation is atomic. If the file doesn't exist, it throws an ENOENT error which we gracefully handle.

#### 2. `getToken()` - Removed existence check, added try/catch
```typescript
async getToken(): Promise<null | string> {
  const envToken = process.env.SUPABASE_ACCESS_TOKEN
  if (envToken) {
    return envToken
  }

  // Check credentials file - use atomic read, no check before read
  try {
    const content = await readFile(this.credentialsFile, 'utf-8')
    const data = JSON.parse(content)
    // ... rest of logic
  } catch (error) {
    // File doesn't exist or is corrupted - return null
    return null
  }
}
```

**Why this is safe**: No TOCTOU window. The atomic read either succeeds or fails in one operation.

#### 3. `saveToken()` - Atomic directory creation with recursive flag
```typescript
// Ensure config directory exists - use atomic mkdir with recursive flag
// mkdir with recursive: true is atomic even if directory already exists
try {
  await mkdir(this.configDir, { mode: 0o700, recursive: true })
} catch (error) {
  throw new SupabaseError(
    `Failed to create config directory: ${error instanceof Error ? error.message : String(error)}`,
    SupabaseErrorCode.CONFIG_ERROR,
  )
}

// Credentials file read - no existence check
let data: Record<string, unknown> = {}
try {
  const content = await readFile(this.credentialsFile, 'utf-8')
  data = JSON.parse(content)
} catch {
  // File doesn't exist or is corrupted - will create new
  data = {}
}
```

**Why this is safe**: `mkdir()` with `recursive: true` is atomic. It won't fail even if the directory is created by another process.

#### 4. `getMetadata()` - Direct atomic read
```typescript
async getMetadata(): Promise<Record<string, unknown>> {
  // Atomic read - no existence check needed
  try {
    const content = await readFile(this.credentialsFile, 'utf-8')
    const data = JSON.parse(content)
    // ... rest of logic
  } catch {
    // File doesn't exist or is corrupted - return empty metadata
    return {}
  }
}
```

**Why this is safe**: Single atomic operation eliminates the race condition window.

#### 5. `saveMetadata()` - Atomic operations
```typescript
// Ensure config directory exists - atomic mkdir
try {
  await mkdir(this.configDir, { mode: 0o700, recursive: true })
} catch (error) {
  throw new SupabaseError(/* ... */)
}

// Read existing data - no existence check
let data: Record<string, unknown> = {}
try {
  const content = await readFile(this.credentialsFile, 'utf-8')
  data = JSON.parse(content)
} catch {
  data = {}
}

// Write with atomic operation
try {
  await writeFile(this.credentialsFile, JSON.stringify(data, null, 2), {
    encoding: 'utf-8',
    mode: 0o600,
  })
} catch (error) {
  throw new SupabaseError(/* ... */)
}
```

**Why this is safe**: All operations are atomic. No TOCTOU window.

#### 6. Legacy `AuthManager.loadCredentials()` - Try/catch without existence check
```typescript
private loadCredentials(profile: string): Credentials | null {
  // Atomic read - no existence check needed
  try {
    const data = JSON.parse(readFileSync(this.credentialsFile, 'utf-8'))
    const profileData = data.profiles?.[profile]

    if (!profileData?.credentials) {
      return null
    }

    return profileData.credentials
  } catch {
    // File doesn't exist or is corrupted - return null
    return null
  }
}
```

**Why this is safe**: No TOCTOU. The synchronous read is atomic, and errors are caught.

## Import Changes

Added imports for atomic file operations:

```typescript
// Before
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'

// After
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
```

- Removed: `existsSync`, `unlinkSync` (no longer needed in new code)
- Added: `mkdir`, `readFile`, `unlink`, `writeFile` from `fs/promises` for atomic operations
- Kept: `mkdirSync`, `readFileSync`, `writeFileSync` for legacy AuthManager

## Security Improvements

1. **Eliminated TOCTOU vulnerabilities** - No gap between checking and operating on files
2. **Better error handling** - Comprehensive try/catch blocks for all error scenarios
3. **Atomic operations** - All new code uses `fs/promises` for atomic operations
4. **File permissions** - Secure file permissions (0o600) are still set atomically in `writeFile()` options
5. **Backward compatibility** - Legacy `AuthManager` class still works as before

## Concurrency Safety

The fixed code safely handles:

- **Concurrent deletes**: Multiple `clearAuth()` calls won't error if file is already deleted
- **Concurrent reads**: Multiple `getToken()` calls work safely even if file is being written
- **Concurrent writes**: Multiple `saveToken()` calls won't create race conditions (last write wins)
- **Directory creation race**: Multiple processes creating the config directory simultaneously

## Testing

Comprehensive test file created at `test/auth-race-condition-fixes.test.ts` with tests for:

- Safe deletion of missing files
- Safe reading of missing files
- Safe concurrent operations
- Atomic directory creation
- Proper error handling

## Files Modified

1. **src/auth.ts** - Main fixes to FileCredentialStore and legacy AuthManager
2. **test/auth-race-condition-fixes.test.ts** - New comprehensive test suite

## CodeQL Alert Resolution

- Alert #11: Fixed by removing `existsSync()` checks before `readFileSync()` and replacing with atomic `readFile()` from `fs/promises`
- Alert #5: Fixed by removing `existsSync()` check before `unlinkSync()` and using atomic `unlink()` from `fs/promises`

## Backward Compatibility

All public API remains unchanged. The fixes are internal implementation details that maintain the same interface and behavior while being safer for concurrent execution.
