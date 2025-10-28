# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of our CLI seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please send an email to security@coastal-programs.com with:

- A description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if any)

You should receive a response within 48 hours. If the issue is confirmed, we will:

1. Acknowledge receipt of your vulnerability report
2. Provide an estimated timeline for a fix
3. Notify you when the vulnerability is fixed
4. Credit you in the release notes (unless you prefer to remain anonymous)

## Security Best Practices

When using this CLI:

1. **Never commit credentials** to version control
2. **Use environment variables** for sensitive data
3. **Keep the CLI updated** to the latest version
4. **Use strong access tokens** with minimal required permissions
5. **Review command output** before executing destructive operations
6. **Enable 2FA** on your Supabase account
7. **Rotate access tokens** regularly
8. **Use profiles** to separate development/production credentials

## Credential Storage

The CLI stores credentials in:
- **Linux/macOS**: `~/.supabase-cli/credentials.json`
- **Windows**: `%USERPROFILE%\.supabase-cli\credentials.json`

This file contains sensitive information and should:
- Have restrictive permissions (600 on Unix-like systems)
- Not be shared or committed to version control
- Be excluded from backups (or encrypted if included)

## Environment Variables

The following environment variables may contain sensitive data:
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_ANON_KEY`

Never log these values or include them in error reports.

## Dependencies

We regularly update dependencies to patch security vulnerabilities. Run:

```bash
npm audit
```

To check for known vulnerabilities in dependencies.

## Disclosure Policy

When we receive a security bug report, we will:

1. Confirm the problem and determine affected versions
2. Audit code to find any similar problems
3. Prepare fixes for all supported versions
4. Release new versions as soon as possible

## Comments on this Policy

If you have suggestions on how this process could be improved, please submit a pull request.
