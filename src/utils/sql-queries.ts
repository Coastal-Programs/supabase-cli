/**
 * Pre-built SQL queries for common operations
 *
 * These queries can be used directly with the db:query command
 * or accessed programmatically via getQueryByName()
 */

export const SQL_QUERIES = {
  // Active connections
  activeConnections: `
    SELECT
      datname AS database,
      count(*) AS connections
    FROM pg_stat_activity
    WHERE datname IS NOT NULL
    GROUP BY datname
    ORDER BY connections DESC;
  `,

  // Database info
  databaseInfo: `
    SELECT
      current_database() AS database,
      version() AS postgres_version,
      pg_size_pretty(pg_database_size(current_database())) AS size;
  `,

  // Extensions - shows available and installed extensions
  listExtensions: `
    SELECT
      pae.name,
      pae.default_version,
      COALESCE(pe.extversion, NULL) as installed_version,
      pae.comment
    FROM pg_available_extensions pae
    LEFT JOIN pg_extension pe ON pe.extname = pae.name
    ORDER BY pae.name;
  `,

  // RLS Policies
  listPolicies: `
    SELECT
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    ORDER BY schemaname, tablename, policyname;
  `,

  // Schemas
  listSchemas: `
    SELECT
      schema_name,
      schema_owner
    FROM information_schema.schemata
    WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
    ORDER BY schema_name;
  `,

  // Tables - detailed information with statistics for listTables function
  // Note: This query returns all tables across all public/relevant schemas
  // Schema filtering is done in the listTables function in supabase.ts
  listTableDetails: `
    SELECT
      t.table_schema AS schema,
      t.table_name AS name,
      COALESCE(pg_total_relation_size(t.table_schema||'.'||t.table_name), 0) AS bytes,
      pg_size_pretty(COALESCE(pg_total_relation_size(t.table_schema||'.'||t.table_name), 0)) AS size,
      COALESCE(s.n_live_tup, 0)::bigint AS live_rows_estimate,
      COALESCE(s.n_dead_tup, 0)::bigint AS dead_rows_estimate,
      EXISTS (
        SELECT 1 FROM pg_policy p
        JOIN pg_class c ON p.polrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE c.relname = t.table_name
          AND n.nspname = t.table_schema
      ) AS rls_enabled,
      CASE
        WHEN r.relreplident = 'f' THEN 'DEFAULT'
        WHEN r.relreplident = 'n' THEN 'NOTHING'
        WHEN r.relreplident = 'i' THEN 'INDEX'
        WHEN r.relreplident = 'p' THEN 'PRIMARY KEY'
        ELSE 'DEFAULT'
      END AS replica_identity,
      false AS rls_forced
    FROM information_schema.tables t
    LEFT JOIN pg_stat_user_tables s ON s.schemaname = t.table_schema AND s.relname = t.table_name
    LEFT JOIN pg_class r ON r.relname = t.table_name AND r.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = t.table_schema)
    WHERE t.table_type = 'BASE TABLE' AND t.table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
    ORDER BY t.table_schema, t.table_name;
  `,

  // Tables
  listTables: `
    SELECT
      table_schema,
      table_name,
      table_type
    FROM information_schema.tables
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY table_schema, table_name;
  `,

  // Table sizes
  tableSizes: `
    SELECT
      schemaname,
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
      pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
    FROM pg_tables
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    ORDER BY size_bytes DESC;
  `,

  // User info
  userInfo: `
    SELECT
      usename AS username,
      usecreatedb AS can_create_db,
      usesuper AS is_superuser,
      valuntil AS password_expires
    FROM pg_user
    ORDER BY usename;
  `,
} as const

/**
 * Get a pre-built query by name
 *
 * @param name - Query name (e.g., 'listExtensions', 'databaseInfo')
 * @returns SQL query string or undefined if not found
 */
export function getQueryByName(name: string): string | undefined {
  return SQL_QUERIES[name as keyof typeof SQL_QUERIES]
}

/**
 * Get all available query names
 *
 * @returns Array of query names
 */
export function getAvailableQueries(): string[] {
  return Object.keys(SQL_QUERIES)
}

/**
 * Check if a query name exists
 *
 * @param name - Query name to check
 * @returns True if query exists
 */
export function hasQuery(name: string): boolean {
  return name in SQL_QUERIES
}
