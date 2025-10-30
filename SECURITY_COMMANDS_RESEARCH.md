# Security Commands Research - Definitive Analysis

## Executive Summary

**RESULT: NO - Security commands CANNOT be implemented via Management API or SQL queries**

The three security commands (`security:audit`, `security:restrictions:list`, `security:policies:list`) return 404 errors because the Supabase Management API does NOT expose these endpoints. After thorough research, here's what we found:

---

## Research Methodology

1. **Reviewed Complete Management API Reference** (`docs/supabase_management_api_reference.md`)
2. **Analyzed Current Implementation** (commands and `src/supabase.ts`)
3. **Investigated Available Endpoints** for security-related functionality
4. **Researched PostgreSQL System Catalog Access** via SQL queries

---

## Findings by Command

### 1. security:restrictions:list

**Current Implementation:**
```typescript
// src/supabase.ts line 2287
GET ${API_BASE_URL}/projects/${ref}/network/restrictions
```

**Management API Status:** ❌ **DOES NOT EXIST**

**What We Found:**
- NO `/network/restrictions` endpoint in Management API reference
- NO network restriction management endpoints documented
- NO IP whitelist/firewall rule endpoints available

**Potential Workarounds Investigated:**
- ❌ **SQL Query Access**: Network restrictions are managed at the infrastructure level (Supabase Cloud platform), NOT in the PostgreSQL database
- ❌ **pg_hba.conf**: Not accessible via SQL queries (requires file system access)
- ❌ **Alternative Endpoints**: None found in Management API

**Why This Can't Work:**
Network restrictions are configured in Supabase's infrastructure layer (likely using cloud provider firewalls/security groups), not stored in the database. This is a platform-level feature that requires dedicated API endpoints.

---

### 2. security:policies:list

**Current Implementation:**
```typescript
// src/supabase.ts line 2359
GET ${API_BASE_URL}/projects/${ref}/security/policies
```

**Management API Status:** ❌ **DOES NOT EXIST**

**What We Found:**
- NO `/security/policies` endpoint in Management API reference
- SSL enforcement endpoint EXISTS: `/v1/projects/{ref}/ssl-enforcement` (lines 342, 369)
- But no general security policies management

**Potential SQL Alternative - Row Level Security (RLS) Policies:**

✅ **PARTIALLY POSSIBLE** - We CAN query RLS policies from PostgreSQL system catalogs:

```sql
-- Query RLS policies from pg_policies system view
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
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, tablename, policyname;
```

**Available via Management API:**
```bash
POST /v1/projects/{ref}/database/query
{
  "query": "SELECT * FROM pg_policies...",
  "read_only": true
}
```

**HOWEVER:** This endpoint is marked as **"Beta (Partner OAuth apps only)"** (line 66), which means:
- May not work with standard Personal Access Tokens
- Limited availability
- Not suitable for general CLI usage

**What RLS Policies Cover:**
- Row Level Security policies defined on tables
- User-defined access control rules
- NOT platform-level security settings

**What RLS Policies DON'T Cover:**
- Network restrictions
- Authentication policies
- Rate limiting rules
- Platform security settings
- Infrastructure security

---

### 3. security:audit

**Current Implementation:**
```typescript
// src/supabase.ts line 2376
POST ${API_BASE_URL}/projects/${ref}/security/audit
```

**Management API Status:** ❌ **DOES NOT EXIST**

**What We Found:**
- NO `/security/audit` endpoint in Management API reference
- NO security audit or scanning endpoints available
- NO compliance checking endpoints

**Potential SQL Alternatives Investigated:**

We COULD query some security-related information via SQL:

```sql
-- Check for tables without RLS enabled
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  AND rowsecurity = false;

-- Check for publicly accessible functions
SELECT routine_schema, routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND security_type = 'DEFINER';

-- Check for weak password policies
SELECT * FROM pg_authid WHERE rolvaliduntil IS NULL;

-- Check SSL connections
SELECT datname, ssl, client_addr
FROM pg_stat_ssl
JOIN pg_stat_activity USING (pid);
```

**HOWEVER:**
- This requires the Beta SQL query endpoint (Partner OAuth only)
- Provides INCOMPLETE security audit (database-level only)
- Missing platform-level security checks:
  - API key rotation policies
  - Network restrictions status
  - Authentication provider configuration
  - Rate limiting settings
  - Backup encryption status
  - Log retention policies

**Why This Can't Work Properly:**
A comprehensive security audit requires access to:
1. Infrastructure configuration (network, firewall)
2. Platform settings (auth, API keys, rate limits)
3. Database configuration (RLS, permissions)
4. Compliance status (backups, encryption)

Only #3 is partially accessible via SQL, and even then, it's limited.

---

## Available Security-Related Endpoints

The Management API DOES provide these security endpoints:

### 1. SSL Enforcement
```bash
GET  /v1/projects/{ref}/ssl-enforcement
PUT  /v1/projects/{ref}/ssl-enforcement
```
**Status:** ✅ Documented and available

### 2. Database Query (Limited)
```bash
POST /v1/projects/{ref}/database/query
```
**Status:** ⚠️ Beta (Partner OAuth apps only)
**Can Query:** RLS policies via `pg_policies`, some security checks
**Cannot Query:** Platform/infrastructure security settings

### 3. Connection Pooler (Indirect Security Info)
```bash
GET /v1/projects/{ref}/config/database/pooler
```
**Status:** ✅ Available
**Provides:** Connection settings (but not security policies)

---

## Recommendation: What Should We Do?

### Option 1: Remove Non-Functional Commands (RECOMMENDED)

**Remove these commands:**
- `security:audit`
- `security:restrictions:list`
- `security:policies:list`

**Reason:** They rely on non-existent API endpoints and will always return 404.

**Implementation:**
```bash
# Delete command files
rm src/commands/security/audit.ts
rm src/commands/security/restrictions/list.ts
rm src/commands/security/policies/list.ts
rm src/commands/security/restrictions/add.ts
rm src/commands/security/restrictions/remove.ts

# Remove from supabase.ts
# Lines 2280-2383 in src/supabase.ts
```

---

### Option 2: Implement Partial RLS Policy Listing (ADVANCED)

**Keep only:** `security:policies:list` with RLS-specific implementation

**Pros:**
- Can query actual RLS policies from database
- Useful for developers managing row-level security
- Uses documented (though Beta) SQL query endpoint

**Cons:**
- Requires Beta API access (Partner OAuth only)
- Only shows RLS policies, not general security settings
- Misleading name ("security policies" vs "RLS policies")

**Implementation approach:**
```typescript
// security:policies:list implementation
export async function listRLSPolicies(ref: string): Promise<RLSPolicy[]> {
  const query = `
    SELECT
      schemaname as schema,
      tablename as table,
      policyname as name,
      permissive as type,
      roles,
      cmd as command,
      qual as using_expression,
      with_check as check_expression
    FROM pg_policies
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    ORDER BY schemaname, tablename, policyname;
  `;

  const headers = await getAuthHeader();
  const response = await enhancedFetch(`${API_BASE_URL}/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      read_only: true,
    }),
  });

  return response; // Parse results
}
```

**Would need to:**
1. Rename command to `db:policies:list` or `rls:policies:list`
2. Update description to clarify it's RLS-specific
3. Document Beta API limitation
4. Add error handling for Partner OAuth requirement

---

### Option 3: Implement SSL Enforcement Command (ALTERNATE)

**Add working security command:**
```bash
security:ssl:get    # GET /v1/projects/{ref}/ssl-enforcement
security:ssl:enable # PUT /v1/projects/{ref}/ssl-enforcement
```

**Pros:**
- Uses documented, working endpoint
- Provides actual security configuration
- Aligned with available API

**Cons:**
- Different scope than originally planned
- More limited functionality

---

## Detailed Limitations Analysis

### Why Management API Doesn't Expose These Endpoints

**Network Restrictions:**
- Managed at infrastructure/cloud provider level
- Requires privileged access to security groups/firewalls
- Platform-specific implementation (AWS, GCP, Azure)
- Security risk to expose via public API

**Security Policies:**
- Complex multi-layered system (auth, rate limits, API keys)
- Some policies are organization-wide, not project-specific
- Compliance and regulatory considerations
- Requires different access controls

**Security Audit:**
- Computationally expensive operation
- Requires scanning multiple systems/services
- May expose sensitive security information
- Better suited for dashboard/console interface

### Why SQL Queries Can't Fully Replace Them

**Limited Scope:**
- PostgreSQL system catalogs only contain database-level info
- No access to platform configuration
- No access to infrastructure settings
- No access to Supabase-specific services (Auth, Storage, etc.)

**Access Restrictions:**
- pg_hba.conf not accessible via SQL
- System files require OS-level access
- Some views require superuser privileges
- Supabase restricts certain queries for security

**Beta API Limitations:**
- Query endpoint restricted to Partner OAuth apps
- May not work with standard Personal Access Tokens
- Undocumented response format
- Subject to change/removal

---

## Conclusion

**NO** - The security commands CANNOT be properly implemented because:

1. **Management API endpoints do not exist** (`/network/restrictions`, `/security/policies`, `/security/audit`)
2. **SQL query alternative is insufficient**:
   - Limited to database-level security
   - Requires Beta API (Partner OAuth only)
   - Cannot access platform/infrastructure settings
3. **Security information is deliberately restricted**:
   - For platform security reasons
   - Managed via Supabase Dashboard only
   - Not exposed in public API

**Recommended Action:**
- **Remove** the three non-functional security commands
- **Document** the limitation clearly
- **Optionally add** SSL enforcement commands (using available endpoints)
- **Optionally implement** RLS policy listing (with clear naming and limitations)

---

## Implementation Files to Update

### Files to DELETE (Option 1):
```
src/commands/security/audit.ts
src/commands/security/restrictions/list.ts
src/commands/security/restrictions/add.ts
src/commands/security/restrictions/remove.ts
src/commands/security/policies/list.ts
```

### Code to REMOVE from src/supabase.ts:
```typescript
// Lines 2280-2383: Network restriction and security policy functions
export async function listNetworkRestrictions(...)
export async function addNetworkRestriction(...)
export async function removeNetworkRestriction(...)
export async function listSecurityPolicies(...)
export async function runSecurityAudit(...)
```

### Documentation to ADD:
```markdown
# Known Limitations

## Security Commands Not Available

The following security features are NOT available via the Management API:

- Network restrictions / IP whitelisting
- Security policy listing
- Security audits

These features are managed exclusively through the Supabase Dashboard:
https://supabase.com/dashboard

The Management API only provides SSL enforcement configuration:
- `GET /v1/projects/{ref}/ssl-enforcement`
- `PUT /v1/projects/{ref}/ssl-enforcement`

For Row Level Security (RLS) policies, use database queries via:
- `POST /v1/projects/{ref}/database/query` (Beta, Partner OAuth only)
```

---

## References

- Management API Reference: `docs/supabase_management_api_reference.md`
- Current implementation: `src/supabase.ts` lines 2280-2383
- Command implementations: `src/commands/security/`
- PostgreSQL System Catalogs: `pg_policies`, `pg_tables`, `pg_authid`, `pg_stat_ssl`

---

**Document Version:** 1.0
**Research Date:** October 30, 2025
**Researcher:** Claude (Anthropic)
**Status:** Complete - Definitive Analysis
