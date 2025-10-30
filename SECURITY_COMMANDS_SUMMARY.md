# Security Commands - Executive Summary

## Quick Answer

**NO** - Security commands CANNOT be implemented via Management API or SQL queries.

The three security commands return 404 because the Supabase Management API does not expose these endpoints:
- `security:audit` → `/projects/{ref}/security/audit` (doesn't exist)
- `security:restrictions:list` → `/projects/{ref}/network/restrictions` (doesn't exist)
- `security:policies:list` → `/projects/{ref}/security/policies` (doesn't exist)

---

## What We Found

### 1. Management API Review
Reviewed the complete Management API reference (`docs/supabase_management_api_reference.md`, 1873 lines) and found:

**Security endpoints that DO exist:**
- ✅ SSL Enforcement: `GET/PUT /v1/projects/{ref}/ssl-enforcement`

**Security endpoints that DON'T exist:**
- ❌ Network restrictions (IP whitelist)
- ❌ Security policies (general)
- ❌ Security audit

### 2. SQL Query Alternative
Investigated using `POST /v1/projects/{ref}/database/query` to query PostgreSQL system catalogs:

**Partial RLS policy access possible:**
```sql
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

**BUT:**
- Requires Beta API (Partner OAuth apps only)
- Only shows database-level RLS policies
- Doesn't provide platform security info
- May not work with Personal Access Tokens

**Cannot access:**
- Network restrictions (infrastructure-level, not in database)
- pg_hba.conf (requires file system access)
- Platform security settings (auth, API keys, rate limits)

### 3. Why These Endpoints Don't Exist

**Security reasons:**
- Network restrictions managed at cloud infrastructure level
- Exposing security config via API is a security risk
- Requires privileged access to security groups/firewalls

**Platform design:**
- These features are managed through Supabase Dashboard only
- Organization-wide policies vs project-specific
- Compliance and regulatory considerations

---

## Recommended Actions

### Immediate: Remove Non-Functional Commands

**Delete these files:**
```
src/commands/security/audit.ts
src/commands/security/restrictions/list.ts
src/commands/security/restrictions/add.ts
src/commands/security/restrictions/remove.ts
src/commands/security/policies/list.ts
```

**Remove from src/supabase.ts:**
- Type definitions: `NetworkRestriction`, `SecurityPolicy`, `SecurityAudit`, `SecurityFinding`
- API functions: `listNetworkRestrictions()`, `addNetworkRestriction()`, `removeNetworkRestriction()`, `listSecurityPolicies()`, `runSecurityAudit()`

**Update documentation:**
- README.md: Remove security commands, add limitations section
- CLAUDE.md: Update Phase 2B to note security commands are unavailable

**See:** `SECURITY_COMMANDS_REMOVAL_GUIDE.md` for step-by-step instructions

### Optional: Add SSL Enforcement Commands

**Implement working security feature:**
```bash
ssl:get      # Get SSL enforcement status
ssl:enable   # Enable SSL enforcement
ssl:disable  # Disable SSL enforcement
```

**Uses documented API:**
- `GET /v1/projects/{ref}/ssl-enforcement`
- `PUT /v1/projects/{ref}/ssl-enforcement`

**See:** `SECURITY_ALTERNATIVE_IMPLEMENTATION.md` for implementation details

---

## Document Reference

Created three comprehensive documents:

### 1. SECURITY_COMMANDS_RESEARCH.md
**Purpose:** Detailed technical analysis
**Contents:**
- Complete API endpoint research
- SQL query alternative investigation
- PostgreSQL system catalog analysis
- Why endpoints don't exist
- Detailed limitations

**Use this for:** Understanding WHY commands don't work

### 2. SECURITY_COMMANDS_REMOVAL_GUIDE.md
**Purpose:** Step-by-step implementation guide
**Contents:**
- Files to delete
- Code to remove
- Documentation updates
- Testing procedures
- Git commit message

**Use this for:** Removing non-functional commands

### 3. SECURITY_ALTERNATIVE_IMPLEMENTATION.md
**Purpose:** What CAN be implemented
**Contents:**
- SSL enforcement commands (recommended)
- RLS policy listing (limited)
- Database security check (advanced)
- Implementation examples
- API function code

**Use this for:** Adding working security features

---

## Technical Details

### Current Implementation (Broken)

**src/supabase.ts** - Lines 2280-2383:
```typescript
// These functions call non-existent endpoints
export async function listNetworkRestrictions(ref: string) {
  return enhancedFetch(`${API_BASE_URL}/projects/${ref}/network/restrictions`, ...)
  // Returns 404
}

export async function listSecurityPolicies(ref: string) {
  return enhancedFetch(`${API_BASE_URL}/projects/${ref}/security/policies`, ...)
  // Returns 404
}

export async function runSecurityAudit(ref: string) {
  return enhancedFetch(`${API_BASE_URL}/projects/${ref}/security/audit`, ...)
  // Returns 404
}
```

### Available Alternatives

**SSL Enforcement (Working):**
```typescript
export async function getSSLEnforcement(ref: string): Promise<SSLEnforcementConfig> {
  return enhancedFetch(`${API_BASE_URL}/projects/${ref}/ssl-enforcement`, {
    method: 'GET',
  })
  // ✅ Returns 200 with config
}
```

**RLS Policies (Beta, Limited):**
```typescript
export async function listRLSPolicies(ref: string): Promise<RLSPolicy[]> {
  return enhancedFetch(`${API_BASE_URL}/projects/${ref}/database/query`, {
    method: 'POST',
    body: JSON.stringify({
      query: 'SELECT * FROM pg_policies...',
      read_only: true,
    }),
  })
  // ⚠️ May return 403 (Partner OAuth only)
}
```

---

## Impact Analysis

### If We Remove Commands

**Pros:**
- ✅ Cleaner CLI (no broken commands)
- ✅ Honest about capabilities
- ✅ Less maintenance burden
- ✅ Clear user expectations

**Cons:**
- ❌ Less feature coverage
- ❌ Users must use Dashboard for these features
- ❌ Can't script network restriction changes

### If We Keep Commands

**Pros:**
- ✅ Shows intent/future compatibility
- ✅ Provides helpful error messages

**Cons:**
- ❌ "Broken" commands in CLI
- ❌ User confusion
- ❌ Maintenance overhead for non-functional code
- ❌ May look unprofessional

### If We Add SSL Commands

**Pros:**
- ✅ Provides actual security value
- ✅ Uses working, documented API
- ✅ Shows CLI security capabilities
- ✅ Production-relevant feature

**Cons:**
- ❌ Additional development time
- ❌ More code to maintain

---

## User Communication

### Dashboard Link

For features not available in CLI:

```
Network restrictions can only be managed through the Supabase Dashboard:
https://supabase.com/dashboard/project/[your-project-ref]/settings/network

Security policies can be configured in:
https://supabase.com/dashboard/project/[your-project-ref]/settings/security
```

### Error Message Example

If keeping commands with helpful errors:

```
❌ Network restrictions are not available via the Supabase Management API.

This feature can only be managed through the Supabase Dashboard:
https://supabase.com/dashboard/project/abc123/settings/network

The Management API does not expose network restriction endpoints.
See SECURITY_COMMANDS_RESEARCH.md for more details.
```

---

## Testing Evidence

Tried the following endpoints (all return 404):

```bash
GET https://api.supabase.com/v1/projects/{ref}/network/restrictions
GET https://api.supabase.com/v1/projects/{ref}/security/policies
POST https://api.supabase.com/v1/projects/{ref}/security/audit
```

Confirmed working endpoint:

```bash
GET https://api.supabase.com/v1/projects/{ref}/ssl-enforcement
# ✅ Returns 200
```

---

## Future Monitoring

Monitor these resources for new security endpoints:

1. **Supabase Management API Docs**
   - https://supabase.com/docs/reference/api
   - Check for new security endpoints quarterly

2. **Supabase GitHub**
   - https://github.com/supabase/supabase
   - Watch for API additions in releases

3. **Community Discussions**
   - https://github.com/orgs/supabase/discussions
   - Feature requests for security API endpoints

4. **OpenAPI Specification**
   - https://api.supabase.com/api/v1-json
   - Check for new paths under `/security` or `/network`

If endpoints are added:
- Restore command files from git history
- Update API functions in `src/supabase.ts`
- Add comprehensive tests
- Update documentation

---

## Conclusion

**Definitive Answer:** NO - Security commands cannot be implemented because:

1. ❌ Management API endpoints don't exist
2. ❌ SQL query alternative is insufficient (Beta API, limited scope)
3. ❌ Platform security is deliberately not exposed via API

**Recommended Action:**
- Remove non-functional commands (clean up CLI)
- Optionally add SSL enforcement commands (working feature)
- Document limitations clearly
- Direct users to Supabase Dashboard for security features

**Next Steps:**
1. Review and approve removal plan
2. Follow `SECURITY_COMMANDS_REMOVAL_GUIDE.md`
3. Optionally implement SSL commands per `SECURITY_ALTERNATIVE_IMPLEMENTATION.md`
4. Test and commit changes
5. Update documentation

---

## Files to Review

| Document | Purpose | Use Case |
|----------|---------|----------|
| `SECURITY_COMMANDS_RESEARCH.md` | Technical analysis | Understanding the problem |
| `SECURITY_COMMANDS_REMOVAL_GUIDE.md` | Implementation guide | Removing broken commands |
| `SECURITY_ALTERNATIVE_IMPLEMENTATION.md` | Working alternatives | Adding SSL commands |
| `SECURITY_COMMANDS_SUMMARY.md` | Executive overview | Quick reference (this file) |

---

**Research Completed:** October 30, 2025
**Status:** Definitive - Ready for Decision
**Recommendation:** Remove non-functional commands + optionally add SSL enforcement
