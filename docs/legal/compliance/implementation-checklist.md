# Legal Compliance Implementation Checklist
## Pre-Launch Critical Fixes for Supabase CLI

**Start Date**: _____________
**Target Launch**: _____________
**Lead**: _____________

---

## Critical Path (P0 - MUST Complete Before Launch)

### 🚨 Task 1: Package Rename (2-3 hours)

**Objective**: Rename package to comply with Supabase trademark policy

**Steps**:
- [ ] **Choose new name** (30 min)
  - [ ] Review options: `supa-cli`, `sb-cli`, `supabase-mgmt-cli`
  - [ ] Check npm availability: `npm search [name]`
  - [ ] Check GitHub availability
  - [ ] Decision: ________________

- [ ] **Update package.json** (30 min)
  - [ ] Change `"name": "@coastal-programs/[NEW_NAME]"`
  - [ ] Change `"bin": { "[NEW_NAME]": "./bin/run" }`
  - [ ] Update description to include "Unofficial"
  - [ ] Increment version if needed

- [ ] **Update documentation** (1 hour)
  - [ ] README.md (all references)
  - [ ] CLAUDE.md (developer guide)
  - [ ] CONTRIBUTING.md
  - [ ] All docs/ files
  - [ ] Test examples in docs/

- [ ] **Update code references** (15 min)
  - [ ] Search codebase: `grep -r "supabase-cli"`
  - [ ] Update any hardcoded references
  - [ ] Update test files

- [ ] **Test installation** (15 min)
  - [ ] `npm run build`
  - [ ] `npm link`
  - [ ] Test binary: `[NEW_NAME] --version`
  - [ ] Test a few commands

- [ ] **Publish** (15 min)
  - [ ] `npm unpublish @coastal-programs/supabase-cli` (if already published)
  - [ ] `npm publish`
  - [ ] Verify on npm: https://npmjs.com/package/@coastal-programs/[NEW_NAME]

- [ ] **GitHub updates** (15 min)
  - [ ] (Optional) Rename repository in Settings
  - [ ] Update README badge links
  - [ ] Create GitHub Release with rename announcement

**Time Estimate**: 2-3 hours
**Priority**: P0
**Owner**: _____________
**Status**: ☐ Not Started | ☐ In Progress | ☐ Complete

---

### 🚨 Task 2: Secure Credential Storage (10-15 hours)

**Objective**: Implement OS keychain storage with encrypted fallback

**Steps**:

#### Phase A: Setup (1-2 hours)
- [ ] **Install dependencies** (15 min)
  - [ ] `npm install keytar`
  - [ ] `npm install --save-dev @types/keytar`
  - [ ] Test keytar works on dev machine

- [ ] **Create SecureStorage class** (45 min)
  - [ ] Create `src/utils/secure-storage.ts`
  - [ ] Implement interface:
    - `async store(key: string, value: string): Promise<void>`
    - `async retrieve(key: string): Promise<string | null>`
    - `async delete(key: string): Promise<void>`
  - [ ] Add JSDoc documentation

#### Phase B: OS Keychain Implementation (3-4 hours)
- [ ] **Primary storage: OS Keychain** (2 hours)
  - [ ] Implement `storeInKeychain()` using keytar
  - [ ] Implement `retrieveFromKeychain()`
  - [ ] Implement `deleteFromKeychain()`
  - [ ] Handle keytar exceptions gracefully
  - [ ] Add service name constant: `supa-cli`

- [ ] **Platform testing** (1-2 hours)
  - [ ] Test on macOS (Keychain Access)
  - [ ] Test on Windows (Credential Manager)
  - [ ] Test on Linux (libsecret)
  - [ ] Document platform-specific setup in README

#### Phase C: Encrypted File Fallback (3-4 hours)
- [ ] **Fallback storage: AES-256-GCM** (2 hours)
  - [ ] Implement `storeEncrypted()` method
  - [ ] Use crypto.createCipheriv('aes-256-gcm', ...)
  - [ ] Implement PBKDF2 key derivation (100K iterations)
  - [ ] Store in `~/.supa-cli/credentials.enc`
  - [ ] File permissions: 0o600

- [ ] **User consent flow** (1 hour)
  - [ ] Implement `confirmFallback()` prompt
  - [ ] Show warning about reduced security
  - [ ] Allow environment variable bypass: `SUPA_CLI_ACCEPT_ENCRYPTED_FALLBACK`
  - [ ] Create `.fallback-consent` marker file

- [ ] **Retrieval and deletion** (1 hour)
  - [ ] Implement `retrieveEncrypted()`
  - [ ] Implement `deleteEncrypted()`
  - [ ] Handle decryption errors gracefully

#### Phase D: Migration (2-3 hours)
- [ ] **Migrate existing users** (1.5 hours)
  - [ ] Create `src/utils/migrate-credentials.ts`
  - [ ] Detect old `~/.supabase-cli/credentials.json`
  - [ ] Prompt user for migration consent
  - [ ] Move credentials to OS keychain
  - [ ] Backup old file: `credentials.json.backup`
  - [ ] Delete old plaintext file

- [ ] **Handle migration errors** (30 min)
  - [ ] If keychain fails, offer encrypted file
  - [ ] If user declines, keep env var alternative
  - [ ] Log migration events (no credentials logged)

- [ ] **Test migration path** (30 min)
  - [ ] Create dummy plaintext credentials
  - [ ] Run migration
  - [ ] Verify keychain storage
  - [ ] Verify old file deleted

#### Phase E: Integration (1-2 hours)
- [ ] **Update auth module** (1 hour)
  - [ ] Replace `src/auth.ts` file operations
  - [ ] Use SecureStorage for PAT
  - [ ] Update `getAuthToken()` to use keychain
  - [ ] Update `setAuthToken()` to use keychain
  - [ ] Update `clearAuth()` to delete from keychain

- [ ] **Add service_role support** (30 min)
  - [ ] Implement consent prompt for service_role keys
  - [ ] Use namespace: `service_role:{projectRef}`
  - [ ] Add TTL caching (1 hour default, 24 hour max)

- [ ] **Update tests** (30 min)
  - [ ] Mock keytar in tests
  - [ ] Test storage/retrieval flows
  - [ ] Test fallback scenarios
  - [ ] Test migration logic

#### Phase F: Documentation (1 hour)
- [ ] **Update README** (45 min)
  - [ ] Document credential storage location (OS-specific)
  - [ ] Add security section
  - [ ] Document deletion procedures
  - [ ] Document environment variable alternative

- [ ] **Add error messages** (15 min)
  - [ ] Clear instructions if keychain unavailable
  - [ ] Link to setup guide for libsecret (Linux)
  - [ ] Helpful error messages with next steps

**Time Estimate**: 10-15 hours
**Priority**: P0
**Owner**: _____________
**Status**: ☐ Not Started | ☐ In Progress | ☐ Complete

---

### 🚨 Task 3: Create SECURITY.md (2-3 hours)

**Objective**: Establish vulnerability reporting process

**Steps**:

- [ ] **Create SECURITY.md file** (1.5 hours)
  - [ ] Use template from DOCUMENTATION_REQUIREMENTS.md
  - [ ] Section 1: Supported Versions table
  - [ ] Section 2: Reporting Process (GitHub Security Advisories)
  - [ ] Section 3: Response Timeline
  - [ ] Section 4: Disclosure Policy (CVD)
  - [ ] Section 5: Security Best Practices for Users
  - [ ] Section 6: Security Best Practices for Developers
  - [ ] Section 7: Known Security Considerations
  - [ ] Section 8: Out of Scope items

- [ ] **Enable GitHub Security Features** (30 min)
  - [ ] Settings → Security → Private vulnerability reporting → Enable
  - [ ] Settings → Security → Dependabot alerts → Enable
  - [ ] Settings → Security → Dependabot security updates → Enable
  - [ ] Verify "Report a vulnerability" button appears

- [ ] **Create security contact** (15 min)
  - [ ] Set up `security@coastal-programs.com` (or equivalent)
  - [ ] Add to SECURITY.md
  - [ ] Test email receives messages
  - [ ] OR use GitHub Security tab only (no email needed)

- [ ] **Update README** (15 min)
  - [ ] Add link to SECURITY.md in table of contents
  - [ ] Add security badge:
    ```markdown
    [![Security Policy](https://img.shields.io/badge/security-policy-blue)](SECURITY.md)
    ```
  - [ ] Add "Security" section referencing SECURITY.md

- [ ] **Create CHANGELOG template** (15 min)
  - [ ] Add `### Security` section to template
  - [ ] Document how to format CVE entries
  - [ ] Add example security fix entry

**Time Estimate**: 2-3 hours
**Priority**: P0
**Owner**: _____________
**Status**: ☐ Not Started | ☐ In Progress | ☐ Complete

---

## High Priority (P1 - SHOULD Complete Before Launch)

### ⚠️ Task 4: Security Warnings in README (1-2 hours)

**Objective**: Inform users of security implications before installation

**Steps**:

- [ ] **Add Security Considerations section** (45 min)
  - [ ] Place after "Installation" section
  - [ ] Subsection: Credential Storage
  - [ ] Subsection: Destructive Operations
  - [ ] Subsection: Service Role Keys
  - [ ] Subsection: CI/CD Usage
  - [ ] Link to SECURITY.md

- [ ] **Add "Unofficial" disclaimer** (30 min)
  - [ ] Place immediately after title/badges
  - [ ] Clear "NOT affiliated with Supabase" message
  - [ ] Link to official Supabase CLI
  - [ ] Link to Supabase support

- [ ] **Update Quick Start** (15 min)
  - [ ] Add note about credential security
  - [ ] Mention OS keychain storage
  - [ ] Link to security section

**Time Estimate**: 1-2 hours
**Priority**: P1
**Owner**: _____________
**Status**: ☐ Not Started | ☐ In Progress | ☐ Complete

---

### ⚠️ Task 5: Credential Storage Documentation (30 minutes)

**Objective**: Document where credentials are stored and how to delete

**Steps**:

- [ ] **Add to Configuration section** (20 min)
  - [ ] Document storage locations (macOS/Windows/Linux)
  - [ ] Explain fallback encrypted file
  - [ ] Show file permissions
  - [ ] Document deletion procedures
  - [ ] Show environment variable alternative

- [ ] **Add troubleshooting guide** (10 min)
  - [ ] "Keychain not available" error
  - [ ] Linux libsecret setup instructions
  - [ ] Manual credential deletion steps

**Time Estimate**: 30 minutes
**Priority**: P1
**Owner**: _____________
**Status**: ☐ Not Started | ☐ In Progress | ☐ Complete

---

## Medium Priority (P2 - CAN Complete After Launch)

### 📋 Task 6: Privacy Notice (1 hour)

**Objective**: Add privacy transparency section to README

**Steps**:

- [ ] **Add Privacy section to README** (45 min)
  - [ ] "What We DON'T Collect" (everything)
  - [ ] "What Happens Locally" (storage)
  - [ ] "Third-Party Communication" (Supabase API)
  - [ ] "Your Data Rights" (user controls all)

- [ ] **Update Contributing guide** (15 min)
  - [ ] Note: No telemetry/analytics allowed
  - [ ] Privacy-first design principle

**Time Estimate**: 1 hour
**Priority**: P2
**Owner**: _____________
**Status**: ☐ Not Started | ☐ In Progress | ☐ Complete

---

### 📋 Task 7: Enhanced Command Warnings (2-3 hours)

**Objective**: Add "DESTRUCTIVE OPERATION" headers to high-risk commands

**Steps**:

- [ ] **Identify destructive commands** (15 min)
  - [ ] List: `backup:delete`, `projects:delete`, `backup:pitr:restore`, etc.
  - [ ] Review all commands with `--yes` flag

- [ ] **Update each command** (15-20 min per command)
  - [ ] Add warning header before confirmation
  - [ ] Update help text to note destructiveness
  - [ ] Add backup reminder
  - [ ] Test confirmation flow

- [ ] **Commands to update** (2+ hours)
  - [ ] backup:delete
  - [ ] backup:restore
  - [ ] backup:pitr:restore
  - [ ] projects:delete
  - [ ] db:replicas:delete
  - [ ] security:restrictions:remove
  - [ ] (any others identified)

**Time Estimate**: 2-3 hours
**Priority**: P2
**Owner**: _____________
**Status**: ☐ Not Started | ☐ In Progress | ☐ Complete

---

## Low Priority (P3 - Optional Enhancements)

### 💡 Task 8: OpenSSF Best Practices Badge (0.5-2 hours)

**Objective**: Obtain OpenSSF Best Practices certification

**Steps**:

- [ ] **Verify requirements met** (15 min)
  - [ ] Open source license: ✅ MIT
  - [ ] Public repository: ✅
  - [ ] SECURITY.md: ✅ (after Task 3)
  - [ ] Tests: ✅ 98% coverage
  - [ ] CONTRIBUTING.md: ✅
  - [ ] Dependabot enabled: ☐

- [ ] **Apply for badge** (15 min)
  - [ ] Visit https://www.bestpractices.dev/
  - [ ] Create account
  - [ ] Submit project
  - [ ] Complete questionnaire

- [ ] **Wait for approval** (variable)
  - [ ] Respond to any reviewer questions
  - [ ] Make requested changes

- [ ] **Add badge to README** (5 min)
  - [ ] Once approved, add badge
  - [ ] Update documentation

**Time Estimate**: 0.5-2 hours (mostly waiting)
**Priority**: P3
**Owner**: _____________
**Status**: ☐ Not Started | ☐ In Progress | ☐ Complete

---

## Final Pre-Launch Review

### Compliance Checklist

- [ ] **Trademark Compliance**
  - [ ] Package renamed (not "supabase-cli")
  - [ ] "Unofficial" disclaimer added
  - [ ] No confusion with official Supabase tools

- [ ] **Security Standards**
  - [ ] Credentials stored in OS keychain
  - [ ] Fallback encryption implemented
  - [ ] No plaintext credential storage
  - [ ] OWASP, NIST, PCI DSS compliant

- [ ] **Documentation**
  - [ ] SECURITY.md exists with CVD process
  - [ ] README has security warnings
  - [ ] Credential storage location documented
  - [ ] Deletion procedures documented

- [ ] **Privacy**
  - [ ] Confirmed: No data collection
  - [ ] Privacy notice in README (optional but recommended)
  - [ ] GDPR/CCPA not applicable (documented)

- [ ] **Legal Protection**
  - [ ] MIT license in place
  - [ ] LICENSE file exists
  - [ ] Copyright notices correct
  - [ ] No additional ToS needed

- [ ] **Testing**
  - [ ] All tests passing
  - [ ] Security features tested
  - [ ] Platform compatibility verified (macOS/Windows/Linux)
  - [ ] Migration path tested

- [ ] **Communication**
  - [ ] GitHub Security enabled
  - [ ] Security contact established (email or GitHub)
  - [ ] CHANGELOG template updated

### Final Sign-Off

- [ ] **Project Lead Approval**: _____________ (Date: ______)
- [ ] **Legal Review** (if applicable): _____________ (Date: ______)
- [ ] **Security Review**: _____________ (Date: ______)

### Launch Readiness

**Status**: ☐ NOT READY | ☐ READY TO LAUNCH | ☐ LAUNCHED

**Launch Date**: _____________
**Version**: _____________
**Notes**: _____________________________________________________________

---

## Post-Launch Monitoring (First 30 Days)

### Week 1
- [ ] Monitor GitHub issues for security concerns
- [ ] Monitor npm downloads
- [ ] Check for trademark complaints
- [ ] Verify credential storage working across platforms

### Week 2
- [ ] Review any security vulnerability reports
- [ ] Check Dependabot alerts
- [ ] User feedback on credential migration

### Week 3
- [ ] Review error logs (if any)
- [ ] Check for common user issues
- [ ] Plan medium priority enhancements

### Week 4
- [ ] Complete post-launch retrospective
- [ ] Update compliance documentation
- [ ] Plan next quarter security review

---

## Resources & Templates

**Master Report**: [LEGAL_COMPLIANCE_MASTER_REPORT.md](LEGAL_COMPLIANCE_MASTER_REPORT.md)
**Executive Briefing**: [COMPLIANCE_EXECUTIVE_BRIEFING.md](COMPLIANCE_EXECUTIVE_BRIEFING.md)
**Documentation Requirements**: [DOCUMENTATION_REQUIREMENTS.md](DOCUMENTATION_REQUIREMENTS.md)
**Credential Security**: [CREDENTIAL_SECURITY_LEGAL_COMPLIANCE.md](CREDENTIAL_SECURITY_LEGAL_COMPLIANCE.md)

**Code Templates**: See Master Report Appendix B
**SECURITY.md Template**: See DOCUMENTATION_REQUIREMENTS.md Section 1

---

## Support & Questions

**Technical Questions**: [GitHub Discussions](https://github.com/coastal-programs/supabase-cli/discussions)
**Security Concerns**: security@coastal-programs.com (or GitHub Security)
**Legal Questions**: Consult with qualified attorney

---

**Last Updated**: 2025-10-30
**Checklist Version**: 1.0
**Prepared By**: AI Legal Compliance Team
