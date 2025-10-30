# Database Operations Guide

This guide covers all database-related commands in the Supabase CLI, from executing queries to analyzing performance and managing security.

## Prerequisites

- Supabase CLI installed and configured (see [Getting Started](getting-started.md))
- Access token set
- At least one Supabase project

## Available Database Commands

The CLI provides 12 database commands:

1. `db:query` - Execute SQL queries
2. `db:extensions` - List installed extensions
3. `db:schema` - List all tables
4. `db:info` - Database version, size, and settings
5. `db:schemas` - List all schemas with owners
6. `db:policies` - List RLS policies
7. `db:connections` - Show active connections
8. `db:table-sizes` - List tables sorted by size
9. `db:user-info` - List database users and permissions
10. `db:config:get` - Get database configuration
11. `db:config:set` - Set database configuration
12. `db:webhooks:list` - List database webhooks

## 1. Executing SQL Queries

### Basic Query

```bash
supabase-cli db:query "SELECT version()" --project ygzhmowennlaehudyyey
```

### Select Data

```bash
supabase-cli db:query "SELECT * FROM users LIMIT 10" --project my-ref
```

### Count Rows

```bash
supabase-cli db:query "SELECT COUNT(*) FROM users" --project my-ref
```

### Complex Query

```bash
supabase-cli db:query "
  SELECT
    u.id,
    u.email,
    COUNT(p.id) as post_count
  FROM users u
  LEFT JOIN posts p ON u.id = p.user_id
  GROUP BY u.id, u.email
  ORDER BY post_count DESC
  LIMIT 10
" --project my-ref
```

### With Different Formats

```bash
# JSON (default)
supabase-cli db:query "SELECT * FROM users" --project my-ref --format json

# Table (human-readable)
supabase-cli db:query "SELECT * FROM users" --project my-ref --format table

# YAML
supabase-cli db:query "SELECT * FROM users" --project my-ref --format yaml
```

### Tips for Queries

1. Always wrap SQL in double quotes
2. Use single quotes inside SQL for strings
3. Multi-line queries work fine
4. Use `--format table` for readable output
5. Use `--format json` for scripting

## 2. Managing Extensions

### List Installed Extensions

```bash
supabase-cli db:extensions --project my-ref
```

Example output:
```
┌──────────────────┬─────────┬───────────────────────────────────┐
│ Name             │ Version │ Description                        │
├──────────────────┼─────────┼───────────────────────────────────┤
│ uuid-ossp        │ 1.1     │ Generate UUIDs                     │
│ pg_stat_statements│ 1.10   │ Track SQL statement statistics     │
│ pgcrypto         │ 1.3     │ Cryptographic functions            │
└──────────────────┴─────────┴───────────────────────────────────┘
```

### Common Extensions

- `uuid-ossp` - UUID generation
- `pg_stat_statements` - Performance tracking
- `pgcrypto` - Encryption
- `postgis` - Geographic data
- `pg_trgm` - Text similarity

## 3. Listing Tables

### All Tables

```bash
supabase-cli db:schema --project my-ref
```

### Specific Schema

```bash
supabase-cli db:query "
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
" --project my-ref
```

## 4. Database Information

### Get Database Stats

```bash
supabase-cli db:info --project my-ref
```

Example output:
```
Database Version: PostgreSQL 17.6.1.029
Database Size: 45.2 MB
Max Connections: 100
Current Connections: 12

Key Settings:
- shared_buffers: 128 MB
- work_mem: 4 MB
- maintenance_work_mem: 64 MB
```

## 5. Schema Management

### List All Schemas

```bash
supabase-cli db:schemas --project my-ref
```

Example output:
```
┌──────────────────┬────────────┬────────────────────────────┐
│ Schema           │ Owner      │ Description                 │
├──────────────────┼────────────┼────────────────────────────┤
│ public           │ postgres   │ Standard public schema      │
│ auth             │ supabase   │ Authentication schema       │
│ storage          │ supabase   │ Storage schema              │
│ extensions       │ postgres   │ Extensions schema           │
└──────────────────┴────────────┴────────────────────────────┘
```

## 6. Row Level Security (RLS) Policies

### List All Policies

```bash
supabase-cli db:policies --project my-ref
```

Example output:
```
┌────────────────┬──────────────────────┬──────────┬──────────┐
│ Table          │ Policy Name          │ Command  │ Enforced │
├────────────────┼──────────────────────┼──────────┼──────────┤
│ users          │ Users can read own   │ SELECT   │ ✓        │
│ users          │ Users can update own │ UPDATE   │ ✓        │
│ posts          │ Public read access   │ SELECT   │ ✓        │
│ posts          │ Author can edit      │ UPDATE   │ ✓        │
└────────────────┴──────────────────────┴──────────┴──────────┘
```

### Understanding Policy Output

- ✓ (green) - Policy is enforced
- ✗ (red) - Policy exists but not enforced
- Command - Which SQL operation the policy applies to

## 7. Active Connections

### View Active Connections

```bash
supabase-cli db:connections --project my-ref
```

Example output:
```
┌──────────┬──────────────┬─────────────┬──────────┐
│ PID      │ User         │ Database    │ State    │
├──────────┼──────────────┼─────────────┼──────────┤
│ 12345    │ postgres     │ postgres    │ active   │
│ 12346    │ anon         │ postgres    │ idle     │
│ 12347    │ service_role │ postgres    │ active   │
└──────────┴──────────────┴─────────────┴──────────┘

Total connections: 3
Max connections: 100
```

### Connection States

- `active` - Currently executing a query
- `idle` - Connected but not executing
- `idle in transaction` - In a transaction but not executing

## 8. Table Sizes

### List Tables by Size

```bash
supabase-cli db:table-sizes --project my-ref
```

Example output:
```
┌────────────────┬─────────────┬──────────────┬───────────────┐
│ Table          │ Size        │ Rows (est)   │ Last Updated  │
├────────────────┼─────────────┼──────────────┼───────────────┤
│ posts          │ 12.5 MB     │ 45,231       │ 2025-10-30    │
│ users          │ 3.2 MB      │ 8,942        │ 2025-10-30    │
│ comments       │ 1.8 MB      │ 23,456       │ 2025-10-29    │
│ sessions       │ 456 KB      │ 1,234        │ 2025-10-30    │
└────────────────┴─────────────┴──────────────┴───────────────┘

Total database size: 45.2 MB
```

### Use Cases

- Identify large tables
- Monitor growth over time
- Plan indexing strategies
- Optimize queries

## 9. User Information

### List Database Users

```bash
supabase-cli db:user-info --project my-ref
```

Example output:
```
┌──────────────────┬────────────────┬────────────────────┐
│ User             │ Superuser      │ Can Create DB      │
├──────────────────┼────────────────┼────────────────────┤
│ postgres         │ Yes            │ Yes                │
│ anon             │ No             │ No                 │
│ authenticated    │ No             │ No                 │
│ service_role     │ No             │ No                 │
└──────────────────┴────────────────┴────────────────────┘
```

## 10. Database Configuration

### Get Configuration

```bash
supabase-cli db:config:get --project my-ref
```

### Set Configuration

```bash
supabase-cli db:config:set --project my-ref \
  --setting max_connections=200 \
  --setting shared_buffers=256MB
```

Note: Some settings require a database restart to take effect.

## 11. Webhooks

### List Database Webhooks

```bash
supabase-cli db:webhooks:list --project my-ref
```

Example output:
```
┌─────────────┬─────────────────┬─────────────┬─────────┐
│ ID          │ Table           │ Events      │ Enabled │
├─────────────┼─────────────────┼─────────────┼─────────┤
│ wh_12345    │ users           │ INSERT      │ ✓       │
│ wh_12346    │ posts           │ INSERT,UPDT │ ✓       │
│ wh_12347    │ comments        │ DELETE      │ ✗       │
└─────────────┴─────────────────┴─────────────┴─────────┘
```

## Common Workflows

### 1. Database Health Check

```bash
# Get database info
supabase-cli db:info --project my-ref

# Check connections
supabase-cli db:connections --project my-ref

# Check table sizes
supabase-cli db:table-sizes --project my-ref
```

### 2. Security Audit

```bash
# List RLS policies
supabase-cli db:policies --project my-ref

# Check user permissions
supabase-cli db:user-info --project my-ref

# Run security audit
supabase-cli security:audit --project my-ref
```

### 3. Performance Analysis

```bash
# Check table sizes
supabase-cli db:table-sizes --project my-ref

# Check active connections
supabase-cli db:connections --project my-ref

# Query slow queries
supabase-cli db:query "
  SELECT
    query,
    calls,
    total_time,
    mean_time
  FROM pg_stat_statements
  ORDER BY total_time DESC
  LIMIT 10
" --project my-ref
```

### 4. Data Migration Check

```bash
# List all tables
supabase-cli db:schema --project my-ref

# Check row counts
supabase-cli db:query "
  SELECT
    schemaname,
    tablename,
    n_live_tup as row_count
  FROM pg_stat_user_tables
  ORDER BY n_live_tup DESC
" --project my-ref
```

## Best Practices

### 1. Use Read-Only Queries

For safety, use `SELECT` queries when exploring data:

```bash
supabase-cli db:query "SELECT * FROM users LIMIT 10" --project my-ref
```

### 2. Format for Readability

Use `--format table` for human reading:

```bash
supabase-cli db:table-sizes --project my-ref --format table
```

### 3. Save Output to Files

```bash
supabase-cli db:info --project my-ref > db-health-$(date +%Y%m%d).txt
```

### 4. Use Transactions for Writes

```bash
supabase-cli db:query "
  BEGIN;
  UPDATE users SET status = 'active' WHERE id = 123;
  COMMIT;
" --project my-ref
```

### 5. Monitor Performance

Regularly check:
- Table sizes
- Active connections
- Slow queries
- RLS policies

## Advanced Tips

### 1. Export Schema

```bash
supabase-cli db:query "
  SELECT
    table_name,
    column_name,
    data_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
  ORDER BY table_name, ordinal_position
" --project my-ref --format json > schema.json
```

### 2. Find Missing Indexes

```bash
supabase-cli db:query "
  SELECT
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
  FROM pg_stats
  WHERE schemaname = 'public'
  AND n_distinct > 100
" --project my-ref
```

### 3. Analyze Query Performance

```bash
supabase-cli db:query "
  EXPLAIN ANALYZE
  SELECT * FROM users WHERE email = 'user@example.com'
" --project my-ref
```

## Troubleshooting

### "Permission denied"

Make sure you're using an access token with database permissions.

### "Relation does not exist"

Check table name and schema:

```bash
supabase-cli db:schema --project my-ref
```

### "Query timeout"

For long queries, consider:
- Adding indexes
- Optimizing the query
- Breaking into smaller chunks

### "Too many connections"

Check current connections:

```bash
supabase-cli db:connections --project my-ref
```

## Next Steps

- [Automation Guide](automation.md) - Use database commands in scripts
- [Troubleshooting Guide](troubleshooting.md) - Fix common issues
- [Getting Started Guide](getting-started.md) - Refresh basics

## Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase Database Guide](https://supabase.com/docs/guides/database)
- [SQL Tutorial](https://www.postgresqltutorial.com/)

---

**Version**: 0.1.0
**Last Updated**: October 30, 2025
**Next Guide**: [Automation Guide](automation.md)
