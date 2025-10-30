# Supabase CLI - Complete Data Model Reference

**Source File**: src/supabase.ts (Lines 1-2372)
**Analysis Date**: 2025-10-28
**Total Exported Functions**: 76
**Total Type Interfaces**: 25+

## ORGANIZATIONAL HIERARCHY

Level 1 (Root): Personal Access Token (sbp_*)
- User-level authentication
- Scope: All organizations + projects
- Storage: ~/.supabase-cli/credentials.json

Level 2: Organization
- Fields: id, name, billing_email, subscription
- Relationship: Contains multiple projects
- CLI Status: Implicit (no org selection command)

Level 3 (PRIMARY): Project
- Primary Identifier: ref (not id)
- Fields: ref, id, name, organization_id, region, status, database
- Relationship: Contains branches, functions, storage, auth, backups, monitoring, security

Level 4: Branch
- Identifier: id
- Fields: id, name, project_ref, status, persistent, git_branch
- Status: ACTIVE|CREATING|DELETING|ERROR|MERGING|UPGRADING
- Operations: list, create, delete, merge, reset, rebase

Level 5: Sub-Resources (Project-owned)
- Database: Table, Extension, Migration, DatabaseReplica, DatabaseConfig
- Functions: EdgeFunction, Secret, FunctionLog
- Storage: StorageBucket, StoragePolicy
- Auth: SSOProvider, JWTKey, AuthProvider, AuthServiceConfig
- Webhooks: Webhook, Integration
- Backups: Backup, BackupSchedule, RestoreStatus
- Monitoring: ErrorLog, APILog, Metrics, HealthCheck, Advisor
- Security: NetworkRestriction, SecurityPolicy, SecurityAudit

## API FUNCTIONS BY CATEGORY (76 Total)

Project Management (6): listProjects, getProject, createProject, deleteProject, pauseProject, restoreProject
Database (7): listTables, getTableSchema, queryDatabase, dumpDatabase, listExtensions, listMigrations, applyMigration
Branches (6): listBranches, createBranch, deleteBranch, mergeBranch, resetBranch, rebaseBranch
Functions (5): listFunctions, getFunction, deployFunction, deleteFunction, invokeFunction
Secrets (3): listSecrets, createSecret, deleteSecret
Storage (6): getStorageBuckets, getStorageBucket, createStorageBucket, deleteStorageBucket, getStoragePolicies, setStoragePolicies
Auth (9): getSSOProviders, enableSSOProvider, disableSSOProvider, getJWTKey, rotateJWTKey, getAuthProviders, setAuthProviderConfig, getAuthServiceConfig, setAuthServiceConfig
Webhooks/Integrations (5): getWebhooks, createWebhook, deleteWebhook, getAvailableIntegrations, setupIntegration
Monitoring (11): getLogs, getFunctionLogs, getFunctionLog, getErrorLogs, getErrorLog, getAPILogs, getAPILog, getMetrics, getHealthCheck, getAdvisors, getProjectStats
Backups (8): listBackups, getBackup, createBackup, deleteBackup, restoreFromBackup, listBackupSchedules, createBackupSchedule, restoreToPointInTime
Database Replicas (4): listDatabaseReplicas, createDatabaseReplica, deleteDatabaseReplica, setDatabaseConfig
Security/Network (5): listNetworkRestrictions, addNetworkRestriction, removeNetworkRestriction, listSecurityPolicies, runSecurityAudit

## AUTHENTICATION SCOPE

Token Type: Personal Access Token (PAT)
Format: sbp_[32+ alphanumeric characters]
Scope: USER-LEVEL (not org-specific, not project-specific)
Coverage: All organizations and projects user can access
No Org Switching: Single token implicitly covers all orgs
Validation: GET /v1/organizations returns 200 (even if empty)

## CACHE CONFIGURATION

TTLs (milliseconds):
  AUTH: 600_000 (10 min)
  BACKUP: 300_000 (5 min)
  BRANCH: 180_000 (3 min) - shortest!
  EXTENSION: 600_000 (10 min)
  FUNCTION: 300_000 (5 min)
  LOG: 120_000 (2 min)
  PROJECT: 600_000 (10 min, configurable via SUPABASE_CLI_CACHE_PROJECT_TTL)

## REFERENCE MAPPINGS

Project Resources Pattern:
  Token -> /v1/projects/{ref}/...

Branch Resources Pattern:
  Token -> /v1/projects/{ref}/branches
  Returns: Branch {id, project_ref}
  Token -> /branches/{branchId}/...

Sub-Resource Pattern:
  Token -> /v1/projects/{ref}/functions/{slug}
  Token -> /v1/projects/{ref}/storage/buckets/{bucketId}
  Token -> /v1/projects/{ref}/auth/sso/providers/{providerId}

