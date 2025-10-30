# Testing Instructions for Database Query Fix

## Prerequisites
1. Set your Supabase access token:
   ```bash
   # Windows PowerShell
   $env:SUPABASE_ACCESS_TOKEN="your-token-here"

   # Windows CMD
   set SUPABASE_ACCESS_TOKEN=your-token-here

   # Linux/Mac
   export SUPABASE_ACCESS_TOKEN="your-token-here"
   ```

2. Or store it permanently:
   ```bash
   ./bin/run config:init
   ```

## Test Cases

### 1. Simple Query Test
```bash
./bin/run db:query "SELECT 1 as test" --project ygzhmowennlaehudyyey
```

**Expected Output:**
```json
[
  {
    "test": 1
  }
]
```

### 2. Database Version
```bash
./bin/run db:query "SELECT version()" --project ygzhmowennlaehudyyey
```

**Expected Output:**
```json
[
  {
    "version": "PostgreSQL 17.6 on aarch64-unknown-linux-gnu, compiled by gcc (GCC) 13.2.0, 64-bit"
  }
]
```

### 3. Current Database
```bash
./bin/run db:query "SELECT current_database()" --project ygzhmowennlaehudyyey
```

**Expected Output:**
```json
[
  {
    "current_database": "postgres"
  }
]
```

### 4. Multiple Rows
```bash
./bin/run db:query "SELECT generate_series(1, 5) as num" --project ygzhmowennlaehudyyey
```

**Expected Output:**
```json
[
  {"num": 1},
  {"num": 2},
  {"num": 3},
  {"num": 4},
  {"num": 5}
]
```

### 5. Multiple Columns
```bash
./bin/run db:query "SELECT 'test' as col1, 123 as col2, true as col3" --project ygzhmowennlaehudyyey
```

**Expected Output:**
```json
[
  {
    "col1": "test",
    "col2": 123,
    "col3": true
  }
]
```

### 6. Empty Result
```bash
./bin/run db:query "SELECT 1 WHERE false" --project ygzhmowennlaehudyyey
```

**Expected Output:**
```json
[]
```

### 7. List Extensions (uses queryDatabase internally)
```bash
./bin/run db:extensions --project ygzhmowennlaehudyyey
```

**Expected Output:**
Table or JSON with extensions like:
- plpgsql
- pg_stat_statements
- pgcrypto
- uuid-ossp
- etc.

## Format Options

### JSON (default)
```bash
./bin/run db:query "SELECT 1 as test" --project ygzhmowennlaehudyyey
```

### Table
```bash
./bin/run db:query "SELECT 1 as test" --project ygzhmowennlaehudyyey --format table
```

### YAML
```bash
./bin/run db:query "SELECT 1 as test" --project ygzhmowennlaehudyyey --format yaml
```

## Debugging

### Enable Debug Mode
```bash
DEBUG=true ./bin/run db:query "SELECT 1" --project ygzhmowennlaehudyyey
```

This will show:
- API request timing
- Cache hits/misses
- Retry attempts

### Quiet Mode (CI/CD)
```bash
./bin/run db:query "SELECT 1" --project ygzhmowennlaehudyyey --quiet
```

## Error Cases

### No Authentication
```bash
unset SUPABASE_ACCESS_TOKEN  # or Remove-Item Env:\SUPABASE_ACCESS_TOKEN in PowerShell
./bin/run db:query "SELECT 1" --project ygzhmowennlaehudyyey
```

**Expected Error:**
```
ERROR: No authentication token found. Run "supabase-cli init" to set up authentication.
```

### Invalid Project
```bash
./bin/run db:query "SELECT 1" --project invalid-project-ref
```

**Expected Error:**
```
ERROR: Project not found
```

### Syntax Error
```bash
./bin/run db:query "INVALID SQL" --project ygzhmowennlaehudyyey
```

**Expected Error:**
```
ERROR: syntax error at or near "INVALID"
```

## Performance Testing

### Measure Query Time
```bash
time ./bin/run db:query "SELECT pg_sleep(1)" --project ygzhmowennlaehudyyey
```

### Concurrent Queries (stress test)
```bash
# Run 5 queries in parallel
for i in {1..5}; do
  ./bin/run db:query "SELECT $i as num" --project ygzhmowennlaehudyyey &
done
wait
```

## Cache Testing

### First Run (cache miss)
```bash
DEBUG=true ./bin/run db:extensions --project ygzhmowennlaehudyyey
```
Should see: `[SUPABASE] Cache miss: extensions:ygzhmowennlaehudyyey`

### Second Run (cache hit)
```bash
DEBUG=true ./bin/run db:extensions --project ygzhmowennlaehudyyey
```
Should see: `[SUPABASE] Cache hit: extensions:ygzhmowennlaehudyyey`

## Verifying the Fix

Before the fix, ALL queries would return `[]` (empty array).

After the fix, queries return actual results from the database.

### Quick Verification
```bash
# This should return [{"test": 1}] not []
./bin/run db:query "SELECT 1 as test" --project ygzhmowennlaehudyyey
```

If you get `[]`, the fix is not working.
If you get `[{"test": 1}]`, the fix is working correctly!

---

**Note**: Replace `ygzhmowennlaehudyyey` with your actual project reference ID if testing with a different project.
