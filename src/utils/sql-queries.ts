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

  // Extensions
  listExtensions: `
    SELECT
      extname AS name,
      extversion AS version,
      nspname AS schema
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    ORDER BY extname;
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
