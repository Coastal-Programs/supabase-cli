# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of our CLI seriously. If you believe you have found a security vulnerability, please report it to us using one of the following methods:

### Preferred: GitHub Security Advisories

1. Navigate to the [Security tab](https://github.com/coastal-programs/supabase-cli/security/advisories)
2. Click "Report a vulnerability"
3. Fill out the advisory form with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Suggested fix (if any)

### Alternative: Email

Send an email to security@coastal-programs.com with the same information.

**Please do not report security vulnerabilities through public GitHub issues.**

## Response Timeline

You can expect the following response timeline:

| Timeframe | Action |
|-----------|--------|
| 24-48 hours | Acknowledgment of report |
| 3-5 days | Initial assessment and severity classification |
| 7-14 days | Fix development and testing (for High/Critical) |
| 14-30 days | Fix development and testing (for Medium/Low) |
| Same day as fix | Public disclosure via GitHub Security Advisory |

## Severity Levels

We classify vulnerabilities using the following severity levels:

### Critical
- Remote code execution
- Authentication bypass
- Credential theft or exposure
- Data loss in production environments

**Response**: Immediate patching within 24-48 hours

### High
- Privilege escalation
- Unauthorized data access
- Denial of service
- Insecure credential storage

**Response**: Patch within 7 days

### Medium
- Information disclosure
- Missing encryption
- Insufficient input validation
- Weak cryptographic algorithms

**Response**: Patch within 14 days

### Low
- Security best practice violations
- Non-critical information leaks
- Documentation gaps

**Response**: Patch in next scheduled release

## Security Best Practices for Users

### Credential Management

**OS Keychain Storage (Default)**:
- **macOS**: Credentials stored in macOS Keychain (Keychain Access app)
- **Windows**: Credentials stored in Windows Credential Manager
- **Linux**: Credentials stored in libsecret (requires `libsecret-1-dev` or `gnome-keyring`)

**Encrypted File Fallback**:
If OS keychain is unavailable, credentials are stored in an encrypted file:
- Location: `~/.supabase/credentials.enc`
- Encryption: AES-256-GCM with PBKDF2 key derivation (100,000 iterations)
- Permissions: 0600 (owner read/write only)
- **Note**: Requires user consent before first use

**Environment Variables (CI/CD)**:
For automated environments, use:
```bash
export SUPABASE_ACCESS_TOKEN="your_token_here"
```

### Security Checklist

When using this CLI:

1. **Never commit credentials** to version control
2. **Keep the CLI updated** to the latest version (`npm update -g @coastal-programs/supabase-cli`)
3. **Use strong access tokens** with minimal required permissions
4. **Review command output** before executing destructive operations
5. **Enable 2FA** on your Supabase account
6. **Rotate access tokens** regularly (every 90 days recommended)
7. **Use project-specific service role keys** (not account-wide tokens)
8. **Monitor access logs** in Supabase dashboard
9. **Delete credentials** when uninstalling: `rm -rf ~/.supabase`

### Destructive Operations

The following commands can cause data loss and require confirmation:

- `backup:delete` - Permanently deletes backups
- `backup:restore` - Overwrites current database
- `backup:pitr:restore` - Point-in-time recovery (overwrites data)
- `projects:delete` - Permanently deletes project
- `db:replicas:delete` - Deletes read replica
- `security:restrictions:remove` - Removes network security rules

Always review the command output and confirmation prompts carefully. Use the `--yes` flag only in automated scripts where you understand the consequences.

### Service Role Keys

Service role keys bypass Row Level Security (RLS) and have full database access:

- **Never commit** service role keys to version control
- **Store securely** in OS keychain (CLI handles this automatically)
- **Limit usage** to administrative tasks only
- **Rotate regularly** in Supabase dashboard
- **Monitor usage** via database logs
- **Consider alternatives** like using lower-privilege API keys when possible

### CI/CD Usage

For automated deployments:

1. **Use environment variables**:
   ```bash
   export SUPABASE_ACCESS_TOKEN="token"
   export SUPABASE_CLI_ACCEPT_ENCRYPTED_FALLBACK="true"
   ```

2. **Use GitHub Secrets** or equivalent for sensitive data

3. **Use `--yes` flag** to bypass confirmation prompts:
   ```bash
   supabase-cli backup:create --yes
   ```

4. **Limit CI/CD token permissions** to only required operations

5. **Rotate CI/CD tokens** more frequently (every 30 days recommended)

## Security Best Practices for Developers

### Contributing Security Fixes

1. **Do not disclose** vulnerability details in pull requests
2. **Contact maintainers first** via security@coastal-programs.com
3. **Use private branches** for security fixes
4. **Include tests** that verify the fix
5. **Update CHANGELOG** with "Security" section

### Code Security Guidelines

When contributing code:

1. **Never log credentials** or sensitive data
2. **Validate all inputs** before processing
3. **Use parameterized queries** to prevent injection
4. **Handle errors gracefully** without exposing internals
5. **Follow least privilege principle** for API calls
6. **Use secure random** for cryptographic operations (`crypto.randomBytes`)
7. **Avoid race conditions** in file operations
8. **Set restrictive file permissions** (0600 for sensitive files)
9. **Use timing-safe comparisons** for secrets
10. **Keep dependencies updated** (`npm audit`)

### Dependency Management

- **Regular audits**: Run `npm audit` before each release
- **Automatic updates**: Dependabot enabled for security patches
- **Version pinning**: Use exact versions for security-critical packages
- **Review changes**: Check changelogs before updating dependencies
- **Test thoroughly**: Run full test suite after dependency updates

### Secure Coding Patterns

```typescript
// ✅ Good: Use SecureStorage for credentials
import { secureStorage } from './utils/secure-storage'
await secureStorage.store('token', value)

// ❌ Bad: Never write credentials to plaintext files
fs.writeFileSync('credentials.json', JSON.stringify({ token }))

// ✅ Good: Use crypto.randomBytes for secure random
import { randomBytes } from 'crypto'
const token = randomBytes(32).toString('hex')

// ❌ Bad: Never use Math.random() for security
const token = Math.random().toString(36)

// ✅ Good: Set restrictive file permissions
fs.writeFileSync(file, data, { mode: 0o600 })

// ❌ Bad: World-readable sensitive files
fs.writeFileSync(file, data) // Uses default 0o666
```

## Known Security Considerations

### Credential Storage

- **OS Keychain**: Most secure option, uses platform-native encryption
- **Encrypted File**: Uses AES-256-GCM with machine-specific key derivation
- **Environment Variables**: Least secure, use only in controlled environments

### Machine-Specific Encryption

The encrypted file fallback uses machine-specific key derivation based on hostname and username. This means:
- ✅ Credentials cannot be decrypted on a different machine
- ✅ Protects against credential file theft
- ⚠️ Credentials lost if hostname/username changes
- ⚠️ Not suitable for shared/multi-user systems

### Service Role Key Storage

Service role keys are stored with user consent:
- Stored in OS keychain by default
- Requires explicit consent for encrypted file fallback
- Can be revoked at any time via `supabase-cli auth:logout`

### API Rate Limiting

The Supabase Management API has rate limits:
- Excessive requests may be throttled
- CLI implements exponential backoff and retry logic
- Use caching (`CACHE_ENABLED=true`) to reduce API calls

## Out of Scope

The following are not considered security vulnerabilities:

1. **Brute force attacks** on weak access tokens (use strong tokens)
2. **Stolen credentials** from user's machine (secure your machine)
3. **Social engineering** attacks (user education required)
4. **Denial of service** via API rate limiting (intended behavior)
5. **Dependencies with vulnerabilities** already reported to upstream projects
6. **Issues with official Supabase platform** (report to Supabase directly)
7. **Non-security bugs** (use GitHub Issues instead)

## Security Roadmap

Future security enhancements under consideration:

- [ ] Hardware security key support (YubiKey, etc.)
- [ ] Token refresh mechanism
- [ ] Role-based access control (RBAC) for CLI commands
- [ ] Audit logging for all CLI operations
- [ ] Integration with secrets managers (HashiCorp Vault, AWS Secrets Manager)
- [ ] Security compliance automation (SOC 2, ISO 27001)

## Disclosure Policy

We follow Coordinated Vulnerability Disclosure (CVD):

1. **Receive report** via GitHub Security Advisory or email
2. **Acknowledge** within 24-48 hours
3. **Investigate and assess** severity (3-5 days)
4. **Develop fix** in private branch (7-30 days based on severity)
5. **Test thoroughly** including regression testing
6. **Notify reporter** of fix timeline
7. **Release patch** via npm
8. **Publish advisory** on GitHub Security tab
9. **Credit reporter** (unless anonymous requested)
10. **Update CHANGELOG** with security section

We request a 90-day disclosure window for Critical/High vulnerabilities to allow users time to update.

## Security Contacts

- **GitHub Security**: https://github.com/coastal-programs/supabase-cli/security/advisories
- **Email**: security@coastal-programs.com
- **PGP Key**: Available on request for sensitive reports

## Compliance

This CLI follows security standards and best practices from:

- **OWASP**: Secure credential storage, input validation, error handling
- **NIST SP 800-63B**: Digital identity guidelines
- **CWE Top 25**: Common Weakness Enumeration mitigation
- **PCI DSS**: Strong encryption at rest (AES-256-GCM)

## Comments on this Policy

If you have suggestions on how this process could be improved, please submit a pull request or contact security@coastal-programs.com.

---

**Last Updated**: October 30, 2025
**Version**: 2.0
