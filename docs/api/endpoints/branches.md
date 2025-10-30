# Preview Branches API

Endpoints for managing database preview branches (Beta feature).

**Note:** Preview branches are in **Beta** and may have limited availability.

---

## Overview

Preview branches allow you to create isolated database environments for testing schema changes before applying them to production.

**Key Features:**
- Isolated database instances
- Branch from production or another branch
- Test migrations safely
- Merge changes back to main branch
- Automatic branch lifecycle management

---

## Branches

### List Branches

**Endpoint:** `GET /v1/projects/{ref}/branches`
**Status:** ✅ Works (200 OK)
**CLI Command:** `branches:list`

List all preview branches for a project.

**Request:**
```bash
curl -X GET 'https://api.supabase.com/v1/projects/ygzhmowennlaehudyyey/branches' \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
```

**Response (Empty):**
```json
[]
```

**Response (With Branches):**
```json
[
  {
    "id": "branch-123",
    "name": "feature/new-schema",
    "project_ref": "ygzhmowennlaehudyyey",
    "parent_branch_id": null,
    "status": "ACTIVE",
    "created_at": "2025-10-25T10:00:00Z",
    "updated_at": "2025-10-29T15:30:00Z",
    "database": {
      "host": "db.branch-123.supabase.co",
      "version": "17.6.1.029"
    }
  }
]
```

**Response Fields:**
- `id` - Branch ID
- `name` - Branch name
- `project_ref` - Parent project reference
- `parent_branch_id` - Parent branch (null for main branch)
- `status` - Branch status (ACTIVE, INACTIVE, etc.)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- `database.host` - Branch database host
- `database.version` - Postgres version

---

### Create Branch

**Endpoint:** `POST /v1/projects/{ref}/branches`
**Status:** 🔍 Not Tested
**CLI Command:** `branches:create`

Create a new preview branch.

**Expected Request:**
```json
{
  "name": "feature/new-schema",
  "parent_branch_id": null
}
```

**Parameters:**
- `name` (required) - Branch name
- `parent_branch_id` (optional) - Parent branch ID (null = from production)

**Note:** Branch creation may take several minutes as it copies the database.

---

### Get Branch

**Endpoint:** `GET /v1/branches/{branch_id_or_ref}`
**Status:** 🔍 Not Tested
**CLI Command:** `branches:get`

Get details of a specific branch.

---

### Update Branch

**Endpoint:** `PATCH /v1/branches/{branch_id_or_ref}`
**Status:** 🔍 Not Tested
**CLI Command:** `branches:update`

Update branch configuration.

**Expected Request:**
```json
{
  "name": "feature/new-schema-v2"
}
```

---

### Delete Branch

**Endpoint:** `DELETE /v1/branches/{branch_id_or_ref}`
**Status:** 🔍 Not Tested
**CLI Command:** `branches:delete`

Delete a preview branch.

**Warning:** This will permanently delete the branch and all its data.

---

### Disable Preview Branching

**Endpoint:** `DELETE /v1/projects/{ref}/branches`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Disable preview branching feature for the project.

---

## Branch Operations

### Diff Branch

**Endpoint:** `GET /v1/branches/{branch_id_or_ref}/diff`
**Status:** 🔍 Not Tested (Beta)
**CLI Command:** `branches:diff`

Get schema differences between branch and its parent.

**Expected Response:**
```json
{
  "additions": [
    "CREATE TABLE public.new_table (id uuid PRIMARY KEY);",
    "ALTER TABLE public.users ADD COLUMN email_verified boolean DEFAULT false;"
  ],
  "deletions": [],
  "modifications": [
    "ALTER TABLE public.posts ALTER COLUMN content TYPE text;"
  ]
}
```

---

### Merge Branch

**Endpoint:** `POST /v1/branches/{branch_id_or_ref}/merge`
**Status:** 🔍 Not Tested
**CLI Command:** `branches:merge`

Merge branch changes back to parent branch.

**Expected Request:**
```json
{
  "target_branch_id": "main"
}
```

**Warning:** This is a destructive operation that applies schema changes to the target branch.

---

### Push Branch

**Endpoint:** `POST /v1/branches/{branch_id_or_ref}/push`
**Status:** 🔍 Not Tested
**CLI Command:** `branches:push`

Push local changes to a branch.

**Expected Request:**
```json
{
  "migrations": [
    {
      "version": "20251029120000",
      "sql": "CREATE TABLE public.new_table (id uuid PRIMARY KEY);"
    }
  ]
}
```

---

### Reset Branch

**Endpoint:** `POST /v1/branches/{branch_id_or_ref}/reset`
**Status:** 🔍 Not Tested
**CLI Command:** `branches:reset`

Reset branch to match its parent.

**Warning:** This will discard all changes made in the branch.

---

## Get Branch Config (Alternative Endpoint)

**Endpoint:** `GET /v1/projects/{ref}/branches/{name}`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Get branch configuration (alternative endpoint format).

---

## Action Runs

Branch operations create action runs that can be monitored:

### List Action Runs

**Endpoint:** `GET /v1/projects/{ref}/actions`
**Status:** 🔍 Not Tested
**CLI Command:** `actions:list`

List all action runs (branch merges, migrations, etc.).

---

### Count Action Runs

**Endpoint:** `HEAD /v1/projects/{ref}/actions`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Get count of action runs without retrieving full list.

---

### Get Action Status

**Endpoint:** `GET /v1/projects/{ref}/actions/{run_id}`
**Status:** 🔍 Not Tested
**CLI Command:** `actions:get`

Get status of a specific action run.

**Expected Response:**
```json
{
  "id": "action-123",
  "type": "branch_merge",
  "status": "completed",
  "started_at": "2025-10-29T10:00:00Z",
  "completed_at": "2025-10-29T10:05:00Z",
  "error": null
}
```

---

### Get Action Logs

**Endpoint:** `GET /v1/projects/{ref}/actions/{run_id}/logs`
**Status:** 🔍 Not Tested
**CLI Command:** `actions:logs`

Get logs for an action run.

---

### Update Action Status

**Endpoint:** `PATCH /v1/projects/{ref}/actions/{run_id}/status`
**Status:** 🔍 Not Tested
**CLI Command:** Not implemented

Update status of an action run (internal use).

---

## Summary

### Working Endpoints (1)
- ✅ `GET /v1/projects/{ref}/branches` - List branches

### Not Tested (14)
- 🔍 `POST /v1/projects/{ref}/branches` - Create branch
- 🔍 `DELETE /v1/projects/{ref}/branches` - Disable branching
- 🔍 `GET /v1/projects/{ref}/branches/{name}` - Get branch (alternative)
- 🔍 `GET /v1/branches/{id}` - Get branch
- 🔍 `PATCH /v1/branches/{id}` - Update branch
- 🔍 `DELETE /v1/branches/{id}` - Delete branch
- 🔍 `GET /v1/branches/{id}/diff` - Diff branch (Beta)
- 🔍 `POST /v1/branches/{id}/merge` - Merge branch
- 🔍 `POST /v1/branches/{id}/push` - Push to branch
- 🔍 `POST /v1/branches/{id}/reset` - Reset branch
- 🔍 `GET /v1/projects/{ref}/actions` - List action runs
- 🔍 `GET /v1/projects/{ref}/actions/{id}` - Get action status
- 🔍 `GET /v1/projects/{ref}/actions/{id}/logs` - Get action logs
- 🔍 `PATCH /v1/projects/{ref}/actions/{id}/status` - Update action status

### Recommended Implementation

1. ✅ **Keep existing:**
   - `branches:list` (working)

2. 🔍 **Test and implement:**
   - `branches:create` - Create new branch
   - `branches:get` - Get branch details
   - `branches:delete` - Delete branch
   - `branches:diff` - Show schema differences
   - `branches:merge` - Merge to parent
   - `branches:reset` - Reset to parent

3. 🔍 **Implement action monitoring:**
   - `actions:list` - List all action runs
   - `actions:get` - Get action status
   - `actions:logs` - View action logs

4. 📚 **Document workflows:**
   - Branch creation workflow
   - Schema migration testing
   - Merge process
   - Conflict resolution

### Example Workflow

**1. Create Branch:**
```bash
$ supabase-cli branches:create feature/add-comments
Creating branch 'feature/add-comments'...
Branch created: branch-xyz
Database: db.branch-xyz.supabase.co
```

**2. Make Schema Changes:**
```bash
# Connect to branch database
$ psql "postgresql://postgres:[PASSWORD]@db.branch-xyz.supabase.co:5432/postgres"

# Apply migrations
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id uuid REFERENCES public.posts(id),
  user_id uuid REFERENCES auth.users(id),
  content text NOT NULL,
  created_at timestamp DEFAULT now()
);
```

**3. View Differences:**
```bash
$ supabase-cli branches:diff feature/add-comments
Schema Differences:
+ CREATE TABLE public.comments (...)
+ CREATE INDEX idx_comments_post_id ON public.comments(post_id)
```

**4. Merge to Production:**
```bash
$ supabase-cli branches:merge feature/add-comments
⚠️  This will apply schema changes to production
Continue? (y/N) y

Merging branch 'feature/add-comments'...
Action run ID: action-123
Status: in_progress

# Monitor progress
$ supabase-cli actions:get action-123
Status: completed
Duration: 45 seconds
```

**5. Delete Branch:**
```bash
$ supabase-cli branches:delete feature/add-comments --yes
Branch deleted successfully
```

### Use Cases

**Testing Schema Migrations:**
- Create branch from production
- Apply migrations to branch
- Test application against branch
- Merge when ready

**Feature Development:**
- Create branch for feature work
- Develop and test in isolation
- Merge when feature is complete

**Schema Experiments:**
- Try out different schema designs
- Compare performance
- Discard if not working

**Safe Rollbacks:**
- Create branch before risky changes
- Test changes in branch first
- Keep production branch as fallback

### Notes

- Preview branches are in **Beta**
- Branch creation copies entire database
- May have cost implications (additional compute)
- Branches automatically scaled similar to main project
- Each branch has its own database URL
- RLS policies and auth config are copied
- Storage buckets may or may not be copied (check docs)

### Limitations

- Number of concurrent branches may be limited by plan
- Branch creation time depends on database size
- Merging is schema-only (data is not merged)
- Some features may not be available in branches
- Check plan tier for branch availability
