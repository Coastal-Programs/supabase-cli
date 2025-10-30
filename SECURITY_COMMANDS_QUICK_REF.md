# Security Commands - Quick Reference Card

## TL;DR

**Question:** Can security commands be implemented via Management API or SQL?

**Answer:** **NO**

**Why:** API endpoints don't exist, SQL alternative insufficient

**Action:** Remove non-functional commands, optionally add SSL enforcement

---

## 30-Second Overview

```
BROKEN COMMANDS (5):
❌ security:audit
❌ security:restrictions:list
❌ security:restrictions:add
❌ security:restrictions:remove
❌ security:policies:list

REASON:
Management API endpoints don't exist (404 errors)

SQL ALTERNATIVE:
⚠️ Partial (RLS policies only, Beta API, limited)

SOLUTION:
1. Remove broken commands
2. Optionally add SSL enforcement commands (working API)
3. Document limitations
```

---

## What to Read

| If you want to... | Read this document |
|-------------------|-------------------|
| Understand WHY it doesn't work | `SECURITY_COMMANDS_RESEARCH.md` |
| Remove the broken commands | `SECURITY_COMMANDS_REMOVAL_GUIDE.md` |
| Add working security features | `SECURITY_ALTERNATIVE_IMPLEMENTATION.md` |
| Get executive summary | `SECURITY_COMMANDS_SUMMARY.md` |
| Quick status check | `SECURITY_COMMANDS_STATUS.txt` |
| This quick reference | You're reading it |

---

## Commands Status Matrix

| Command | Endpoint | API Exists? | SQL Alternative? | Action |
|---------|----------|-------------|------------------|--------|
| security:audit | POST /security/audit | ❌ No | ⚠️ Partial | Remove |
| security:restrictions:list | GET /network/restrictions | ❌ No | ❌ No | Remove |
| security:restrictions:add | POST /network/restrictions | ❌ No | ❌ No | Remove |
| security:restrictions:remove | DELETE /network/restrictions/{id} | ❌ No | ❌ No | Remove |
| security:policies:list | GET /security/policies | ❌ No | ⚠️ Partial | Remove |
| ssl:get (new) | GET /ssl-enforcement | ✅ Yes | N/A | Add (optional) |
| ssl:enable (new) | PUT /ssl-enforcement | ✅ Yes | N/A | Add (optional) |
| ssl:disable (new) | PUT /ssl-enforcement | ✅ Yes | N/A | Add (optional) |

---

## Files to Delete

```
src/commands/security/audit.ts
src/commands/security/restrictions/list.ts
src/commands/security/restrictions/add.ts
src/commands/security/restrictions/remove.ts
src/commands/security/policies/list.ts
```

---

## Code to Remove

**From src/supabase.ts (lines ~2280-2383):**

```typescript
// Remove these type definitions
export interface NetworkRestriction { ... }
export interface SecurityPolicy { ... }
export interface SecurityAudit { ... }
export interface SecurityFinding { ... }

// Remove these functions
export async function listNetworkRestrictions(...) { ... }
export async function addNetworkRestriction(...) { ... }
export async function removeNetworkRestriction(...) { ... }
export async function listSecurityPolicies(...) { ... }
export async function runSecurityAudit(...) { ... }
```

---

## One-Line Explanation by Command

- **security:audit**: API endpoint doesn't exist, comprehensive audit requires platform access
- **security:restrictions:list**: Network restrictions managed at infrastructure level, not in API
- **security:restrictions:add**: Same as list, plus security risk to expose via API
- **security:restrictions:remove**: Same as above
- **security:policies:list**: Complex multi-layer system, not exposed in public API

---

## SQL Alternative Limitations

**Can query (pg_policies):**
- Row Level Security policies only
- Database-level security
- Requires Beta API (Partner OAuth)

**Cannot query:**
- Network restrictions (infrastructure-level)
- Platform security settings
- pg_hba.conf (file system)
- Auth/rate limit policies

---

## Why No API?

**Infrastructure-level**: Network restrictions use cloud provider security groups (AWS/GCP/Azure)

**Security risk**: Exposing security config via public API is dangerous

**Complexity**: Multi-layered system (auth, rate limits, policies, compliance)

**By design**: Managed through Dashboard for better security control

---

## Where Users Should Go

For features not in CLI, direct users to:

```
Network Restrictions:
https://supabase.com/dashboard/project/[ref]/settings/network

Security Policies:
https://supabase.com/dashboard/project/[ref]/settings/security

SSL Enforcement:
https://supabase.com/dashboard/project/[ref]/settings/database
```

---

## Implementation Timeline

**Option 1: Remove Only** (2-3 hours)
- Delete 5 command files
- Remove ~100 lines from supabase.ts
- Update documentation
- Test

**Option 2: Remove + Add SSL** (5-6 hours)
- Everything from Option 1
- Create 3 new SSL commands
- Add API functions
- Write tests
- Update docs

---

## Testing Commands

```bash
# After removal
npm run build          # Should compile
npm test               # Should pass
npm run lint           # Should pass
./bin/run --help       # Security commands gone

# Verify no imports remain
grep -r "listNetworkRestrictions" src/
grep -r "listSecurityPolicies" src/
grep -r "runSecurityAudit" src/
```

---

## Git Commit Message

```
refactor: remove non-functional security commands

Remove security commands that relied on non-existent Management API endpoints:
- security:audit
- security:restrictions:list
- security:restrictions:add
- security:restrictions:remove
- security:policies:list

These features are not exposed by the Supabase Management API (404 errors)
and must be managed through the Supabase Dashboard.

Removed:
- 5 command files from src/commands/security/
- Type definitions and API functions from src/supabase.ts
- Security command references from documentation

See SECURITY_COMMANDS_RESEARCH.md for detailed analysis.

Breaking change: Security commands no longer available.
Users must use Supabase Dashboard for network restrictions,
security policies, and security audits.
```

---

## Decision Tree

```
Do security commands return 404?
├── YES → Are API endpoints documented?
│         ├── NO → Can we use SQL queries?
│         │       ├── PARTIAL → Is Beta API reliable?
│         │       │              ├── NO → REMOVE COMMANDS
│         │       │              └── Maybe → Document limitations
│         │       └── NO → REMOVE COMMANDS
│         └── YES → Use API
└── NO → Keep commands
```

**Result:** REMOVE COMMANDS

---

## Key Insights

1. **Management API is limited** - Not all Dashboard features are in API
2. **Security by design** - Some features deliberately not exposed
3. **Infrastructure vs Database** - Network restrictions are infrastructure-level
4. **Beta API limitations** - SQL query endpoint not reliable for production
5. **Dashboard is authoritative** - Some features CLI can't replicate

---

## What CAN Be Done

**Available via API:**
- ✅ SSL Enforcement (GET/PUT endpoints exist)
- ✅ Database configuration
- ✅ Project management
- ✅ Backup management
- ✅ Read replicas

**Not available:**
- ❌ Network restrictions
- ❌ General security policies
- ❌ Security audits
- ❌ Organization-wide settings

---

## Monitoring for Future Changes

Check quarterly:
- https://supabase.com/docs/reference/api
- https://api.supabase.com/api/v1-json
- https://github.com/supabase/supabase/releases

If `/security` or `/network` endpoints are added:
1. Update this research
2. Restore commands from git history
3. Implement and test
4. Update documentation

---

## Summary

| Aspect | Result |
|--------|--------|
| Can implement via API? | ❌ No |
| Can implement via SQL? | ⚠️ Partial (insufficient) |
| Recommended action | Remove commands |
| Alternative | Add SSL enforcement |
| Impact | Breaking change, document limitation |
| Effort | 2-3 hours (removal) or 5-6 hours (+ SSL) |
| Priority | High (broken commands hurt UX) |

---

**Research Date:** October 30, 2025
**Status:** Complete
**Confidence:** 100% - Definitive analysis based on official API docs
