# Database Migrations API

Endpoints for managing database schema migrations.

---

## Migrations

### List Migrations

**Endpoint:** `GET /v1/projects/{ref}/database/migrations`
**Status:** 🔍 Not Tested (Beta)
**CLI Command:** `migrations:list`

List all applied database migrations.

**Expected Response:**
```json
[
  {
    "version": "20251020100000",
    "name": "create_users_table",
    "status": "applied",
    "applied_at": "2025-10-20T10:00:00Z"
  },
  {
    "version": "20251025150000",
    "name": "add_posts_table",
    "status": "applied",
    "applied_at": "2025-10-25T15:00:00Z"
  }
]
```

**Response Fields:**
- `version` - Migration version (timestamp format: YYYYMMDDHHMMSS)
- `name` - Migration name/description
- `status` - Status (applied, pending, failed)
- `applied_at` - When migration was applied

---

### Apply Migration

**Endpoint:** `POST /v1/projects/{ref}/database/migrations`
**Status:** 🔍 Not Tested (Beta)
**CLI Command:** `migrations:apply`

Apply a new database migration.

**Expected Request:**
```json
{
  "version": "20251029120000",
  "name": "add_comments_table",
  "sql": "CREATE TABLE public.comments (id uuid PRIMARY KEY, content text);"
}
```

**Parameters:**
- `version` (required) - Migration version (timestamp)
- `name` (required) - Migration name
- `sql` (required) - SQL statements to execute

**Response:**
```json
{
  "version": "20251029120000",
  "status": "applied",
  "applied_at": "2025-10-29T12:00:00Z"
}
```

---

### Upsert Migration

**Endpoint:** `PUT /v1/projects/{ref}/database/migrations`
**Status:** 🔍 Not Tested (Beta)
**CLI Command:** Not implemented

Create or update a migration.

---

## SQL-Based Migration Tracking

Since the REST API endpoint may not exist, migrations can be tracked via SQL:

### Check Migration Status (SQL)

```sql
-- List applied migrations from Supabase migrations table
SELECT
  version,
  name,
  applied_at
FROM supabase_migrations.schema_migrations
ORDER BY version;
```

### Record Migration (SQL)

```sql
-- Insert migration record
INSERT INTO supabase_migrations.schema_migrations (version, name, applied_at)
VALUES ('20251029120000', 'add_comments_table', NOW());
```

### Check for Pending Migrations (SQL)

Compare local migration files with applied migrations:

```sql
-- Get latest applied migration
SELECT MAX(version) as latest_version
FROM supabase_migrations.schema_migrations;
```

---

## Migration Files (NOT AVAILABLE)

**Endpoint:** ❌ No REST API for migration files
**CLI Command:** Use Supabase CLI

**Alternative:** Use Supabase CLI for managing migration files:

```bash
# Create new migration
supabase migration new add_comments_table

# List migrations
supabase migration list

# Apply pending migrations
supabase db push

# Reset database
supabase db reset
```

---

## Best Practices

### Migration Naming

Use descriptive, timestamp-based names:
```
20251029120000_create_users_table.sql
20251029120100_add_email_to_users.sql
20251029120200_create_posts_table.sql
```

### Migration Structure

```sql
-- Migration: 20251029120000_create_users_table
-- Description: Create users table with basic fields

-- Create table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  name text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_users_email ON public.users(email);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own data"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Add triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Rollback Strategy

Migrations should be reversible when possible:

**Forward Migration (up):**
```sql
-- 20251029120000_add_status_to_posts.sql
ALTER TABLE public.posts
ADD COLUMN status text DEFAULT 'draft'
CHECK (status IN ('draft', 'published', 'archived'));
```

**Reverse Migration (down):**
```sql
-- 20251029120000_add_status_to_posts_down.sql
ALTER TABLE public.posts
DROP COLUMN status;
```

---

## Migration Workflow

### 1. Local Development

```bash
# Start local Supabase
supabase start

# Create migration
supabase migration new add_comments_table

# Edit migration file
# supabase/migrations/20251029120000_add_comments_table.sql

# Apply migration locally
supabase db reset

# Test migration
psql -h localhost -p 54322 -U postgres
```

### 2. Testing in Branch

```bash
# Create preview branch
supabase-cli branches:create feature/comments

# Apply migration to branch
supabase-cli db:query --branch feature/comments < migration.sql

# Test in branch environment
# ...

# Merge to production when ready
supabase-cli branches:merge feature/comments
```

### 3. Production Deployment

```bash
# Apply migration via API
supabase-cli migrations:apply --file 20251029120000_add_comments_table.sql

# Or via Supabase CLI
supabase db push --project-ref ygzhmowennlaehudyyey
```

---

## Summary

### Not Tested (3)
- 🔍 `GET /v1/projects/{ref}/database/migrations` - List migrations (Beta)
- 🔍 `POST /v1/projects/{ref}/database/migrations` - Apply migration (Beta)
- 🔍 `PUT /v1/projects/{ref}/database/migrations` - Upsert migration (Beta)

### Not Available (1)
- ❌ Migration file management - Use Supabase CLI

### Recommended Implementation

1. 🔍 **Test migration endpoints:**
   - `migrations:list` - List applied migrations
   - `migrations:apply` - Apply new migration

2. ✅ **Use SQL-based tracking:**
   - Query `supabase_migrations.schema_migrations` table
   - Track migrations via database records

3. 📚 **Document CLI workflow:**
   - Use Supabase CLI for local development
   - Use Management API for remote application
   - Use preview branches for testing

4. ➕ **Add SQL-based commands:**
   - `migrations:status` - Check migration status (SQL)
   - `migrations:history` - View migration history (SQL)

### SQL Queries for Migrations

**List Applied Migrations:**
```sql
SELECT
  version,
  name,
  applied_at,
  applied_at::date as applied_date
FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 20;
```

**Check Migration Exists:**
```sql
SELECT EXISTS(
  SELECT 1
  FROM supabase_migrations.schema_migrations
  WHERE version = '20251029120000'
) as migration_applied;
```

**Get Latest Migration:**
```sql
SELECT
  version,
  name,
  applied_at
FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 1;
```

**Count Migrations:**
```sql
SELECT
  COUNT(*) as total_migrations,
  MIN(applied_at) as first_migration,
  MAX(applied_at) as last_migration
FROM supabase_migrations.schema_migrations;
```

---

## Notes

- Migration endpoints are in **Beta**
- Migrations are tracked in `supabase_migrations.schema_migrations` table
- Use Supabase CLI for local development
- Use preview branches for testing migrations
- Migrations should be idempotent (safe to run multiple times)
- Always test migrations before applying to production
- Consider rollback strategy for complex migrations
- Backup database before applying migrations
