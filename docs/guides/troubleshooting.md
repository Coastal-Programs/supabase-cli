# Troubleshooting Guide

This guide helps you diagnose and fix common issues with the Supabase CLI.

## Quick Diagnostics

Run this command first to check your setup:

```bash
supabase-cli config:doctor
```

Expected output:
```
✓ Configuration file exists
✓ Access token is set
✓ Can connect to Supabase API
✓ CLI version is current
```

## Common Issues

### Authentication Issues

#### "Authentication failed" or "401 Unauthorized"

**Cause**: Access token is missing, invalid, or expired.

**Solutions**:

1. Check if token is set:
```bash
echo ${SUPABASE_ACCESS_TOKEN:0:10}...
```

2. Set the token:
```bash
export SUPABASE_ACCESS_TOKEN=sbp_your_token_here
```

3. Get a new token:
   - Go to https://supabase.com/dashboard/account/tokens
   - Generate a new token
   - Update your environment

4. Verify token format:
   - Should start with `sbp_`
   - Should be ~40 characters long

#### "Access token not found"

**Cause**: Environment variable not set.

**Solutions**:

1. Set for current session:
```bash
export SUPABASE_ACCESS_TOKEN=sbp_your_token_here
```

2. Add to shell config (`~/.bashrc`, `~/.zshrc`):
```bash
echo 'export SUPABASE_ACCESS_TOKEN=sbp_your_token_here' >> ~/.bashrc
source ~/.bashrc
```

3. Use a `.env` file:
```bash
echo 'SUPABASE_ACCESS_TOKEN=sbp_your_token_here' > .env
source .env
```

### Project Issues

#### "Project not found" or "404 Not Found"

**Cause**: Invalid project reference or insufficient permissions.

**Solutions**:

1. List all projects:
```bash
supabase-cli projects:list
```

2. Verify project reference format:
   - Should be 20 characters
   - Only lowercase letters and numbers
   - Example: `ygzhmowennlaehudyyey`

3. Check project status:
```bash
supabase-cli projects:get your-project-ref
```

4. Verify permissions:
   - Make sure your token has access to the project
   - Check organization membership

#### "Project is paused"

**Cause**: Project has been paused.

**Solution**:

```bash
supabase-cli projects:restore your-project-ref
```

### Command Issues

#### "Command not found: supabase-cli"

**Cause**: CLI not installed or not in PATH.

**Solutions**:

1. Check if installed:
```bash
npm list -g @coastal-programs/supabase-cli
```

2. Install globally:
```bash
npm install -g @coastal-programs/supabase-cli
```

3. Or use npx:
```bash
npx @coastal-programs/supabase-cli --version
```

4. Check PATH:
```bash
echo $PATH
npm config get prefix
```

#### "Permission denied"

**Cause**: Insufficient permissions for operation or file system.

**Solutions**:

1. For installation:
```bash
sudo npm install -g @coastal-programs/supabase-cli
```

2. For configuration:
```bash
chmod 755 ~/.supabase-cli
```

3. For API operations:
   - Check token permissions
   - Verify project access

### Database Issues

#### "Relation does not exist"

**Cause**: Table or view doesn't exist.

**Solutions**:

1. List all tables:
```bash
supabase-cli db:schema --project your-ref
```

2. Check schema:
```bash
supabase-cli db:query "
  SELECT schemaname, tablename
  FROM pg_tables
  WHERE tablename = 'your_table'
" --project your-ref
```

3. Verify table name spelling and case

#### "Query timeout"

**Cause**: Query taking too long to execute.

**Solutions**:

1. Optimize query:
   - Add indexes
   - Reduce row count with LIMIT
   - Simplify joins

2. Increase timeout (in scripts):
```bash
timeout 60s supabase-cli db:query "..." --project your-ref
```

3. Break into smaller queries

#### "Too many connections"

**Cause**: Database connection limit reached.

**Solutions**:

1. Check current connections:
```bash
supabase-cli db:connections --project your-ref
```

2. Close idle connections:
```bash
supabase-cli db:query "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE state = 'idle'
  AND state_change < NOW() - INTERVAL '5 minutes'
" --project your-ref
```

3. Upgrade database plan for more connections

### Performance Issues

#### Slow startup time

**Cause**: ts-node overhead or slow network.

**Solutions**:

1. Use built version:
```bash
npm run build
supabase-cli --version  # Should be faster
```

2. Disable debug mode:
```bash
unset DEBUG
```

3. Check network:
```bash
ping api.supabase.com
```

#### Slow command execution

**Cause**: Network latency, cache disabled, or large response.

**Solutions**:

1. Enable cache:
```bash
export CACHE_ENABLED=true
export CACHE_TTL=300000  # 5 minutes
```

2. Use quiet mode:
```bash
supabase-cli projects:list --quiet --format json
```

3. Limit results:
```bash
supabase-cli db:query "SELECT * FROM users LIMIT 10" --project your-ref
```

#### "Out of memory" errors

**Cause**: Large dataset or memory leak.

**Solutions**:

1. Limit query results:
```bash
supabase-cli db:query "SELECT * FROM large_table LIMIT 1000" --project your-ref
```

2. Use pagination
3. Increase Node.js memory:
```bash
NODE_OPTIONS="--max-old-space-size=4096" supabase-cli db:query "..." --project your-ref
```

### Configuration Issues

#### "Configuration file not found"

**Cause**: Configuration not initialized.

**Solution**:

```bash
supabase-cli config:init
```

#### "Invalid configuration format"

**Cause**: Corrupted configuration file.

**Solutions**:

1. Backup current config:
```bash
cp ~/.supabase-cli/credentials.json ~/.supabase-cli/credentials.json.bak
```

2. Reinitialize:
```bash
rm ~/.supabase-cli/credentials.json
supabase-cli config:init
```

3. Manually edit config:
```bash
nano ~/.supabase-cli/credentials.json
```

### Network Issues

#### "Connection timeout" or "ECONNREFUSED"

**Cause**: Network connectivity issues.

**Solutions**:

1. Check internet connection:
```bash
ping api.supabase.com
```

2. Check firewall rules
3. Try with proxy:
```bash
export HTTP_PROXY=http://proxy.example.com:8080
export HTTPS_PROXY=http://proxy.example.com:8080
```

4. Disable retry temporarily:
```bash
export RETRY_ENABLED=false
```

#### "SSL certificate error"

**Cause**: SSL/TLS issues.

**Solutions**:

1. Update Node.js
2. Update npm:
```bash
npm install -g npm@latest
```

3. Check system time is correct

### Output Issues

#### "Invalid JSON output"

**Cause**: Mixed output with warnings/errors.

**Solutions**:

1. Use quiet mode:
```bash
supabase-cli projects:list --quiet --format json
```

2. Redirect stderr:
```bash
supabase-cli projects:list --format json 2>/dev/null
```

#### "Cannot parse output"

**Cause**: Unexpected format or encoding.

**Solutions**:

1. Specify format explicitly:
```bash
supabase-cli projects:list --format json
```

2. Check for errors:
```bash
supabase-cli projects:list 2>&1 | tee output.log
```

### Cache Issues

#### "Stale data returned"

**Cause**: Cache not invalidated.

**Solutions**:

1. Disable cache temporarily:
```bash
CACHE_ENABLED=false supabase-cli projects:list
```

2. Clear cache (if implemented):
```bash
rm -rf ~/.supabase-cli/cache
```

3. Reduce TTL:
```bash
export CACHE_TTL=60000  # 1 minute
```

## Debugging

### Enable Debug Mode

```bash
DEBUG=true supabase-cli projects:list
```

Output will include:
- API requests
- Response times
- Cache hits/misses
- Retry attempts

### Verbose Output

```bash
supabase-cli projects:list --verbose
```

### Save Full Output

```bash
supabase-cli projects:list > output.log 2>&1
```

### Check Version

```bash
supabase-cli --version
node --version
npm --version
```

## Error Messages Reference

### Common Error Codes

#### 400 Bad Request
**Meaning**: Invalid parameters
**Fix**: Check command syntax and parameters

#### 401 Unauthorized
**Meaning**: Authentication failed
**Fix**: Check access token

#### 403 Forbidden
**Meaning**: Insufficient permissions
**Fix**: Check token permissions or project access

#### 404 Not Found
**Meaning**: Resource doesn't exist
**Fix**: Verify project reference or resource ID

#### 429 Too Many Requests
**Meaning**: Rate limit exceeded
**Fix**: Wait and retry, or add delays between requests

#### 500 Internal Server Error
**Meaning**: Server-side error
**Fix**: Retry later or contact support

#### 503 Service Unavailable
**Meaning**: Service temporarily unavailable
**Fix**: Wait and retry

### CLI-Specific Errors

#### "ENOTFOUND api.supabase.com"
**Meaning**: DNS resolution failed
**Fix**: Check internet connection and DNS settings

#### "ETIMEDOUT"
**Meaning**: Request timeout
**Fix**: Check network or increase timeout

#### "ECONNRESET"
**Meaning**: Connection reset
**Fix**: Retry or check network stability

## Getting More Help

### 1. Check Documentation

- [Getting Started Guide](getting-started.md)
- [Database Operations Guide](database-operations.md)
- [Automation Guide](automation.md)
- [README.md](../../README.md)

### 2. Run Diagnostics

```bash
# Check configuration
supabase-cli config:doctor

# Verify connectivity
supabase-cli projects:list --quiet

# Test database access
supabase-cli db:query "SELECT 1" --project your-ref
```

### 3. Search Issues

Check if others have reported similar issues:
- https://github.com/coastal-programs/supabase-cli/issues

### 4. Ask for Help

If you can't find a solution:

1. **GitHub Issues**: https://github.com/coastal-programs/supabase-cli/issues
   - Include CLI version
   - Include error message
   - Include steps to reproduce

2. **GitHub Discussions**: https://github.com/coastal-programs/supabase-cli/discussions
   - Ask questions
   - Share solutions

3. **Supabase Discord**: https://discord.supabase.com
   - Community support
   - Real-time help

### 5. Report Bugs

When reporting bugs, include:

```bash
# CLI version
supabase-cli --version

# Node version
node --version

# Operating system
uname -a  # Linux/macOS
ver       # Windows

# Full error output
DEBUG=true supabase-cli <command> 2>&1

# Configuration status
supabase-cli config:doctor
```

## Best Practices to Avoid Issues

### 1. Always Set Environment Variables

```bash
export SUPABASE_ACCESS_TOKEN=sbp_your_token_here
```

### 2. Use Quiet Mode in Scripts

```bash
supabase-cli projects:list --quiet --format json
```

### 3. Handle Errors Gracefully

```bash
if ! supabase-cli config:doctor --quiet; then
  echo "Configuration error"
  exit 1
fi
```

### 4. Keep CLI Updated

```bash
npm update -g @coastal-programs/supabase-cli
```

### 5. Use Specific Versions in CI/CD

```bash
npm install -g @coastal-programs/supabase-cli@0.1.0
```

### 6. Monitor API Rate Limits

Add delays between requests:
```bash
supabase-cli projects:list
sleep 1
supabase-cli db:info --project your-ref
```

### 7. Validate Input

```bash
if [[ -z "$PROJECT_REF" ]]; then
  echo "Error: PROJECT_REF not set"
  exit 1
fi
```

## FAQ

### Q: Why is the CLI slow to start?

**A**: The CLI uses ts-node for development. Build the project for faster startup:
```bash
npm run build
```

### Q: Can I use multiple projects simultaneously?

**A**: Yes, specify `--project` flag for each command:
```bash
supabase-cli db:info --project project-a
supabase-cli db:info --project project-b
```

### Q: How do I update the CLI?

**A**:
```bash
npm update -g @coastal-programs/supabase-cli
```

### Q: Where are logs stored?

**A**: The CLI doesn't persist logs by default. Use output redirection:
```bash
supabase-cli projects:list 2>&1 | tee cli.log
```

### Q: Can I use the CLI offline?

**A**: No, the CLI requires internet connectivity to access the Supabase API.

### Q: How do I uninstall?

**A**:
```bash
npm uninstall -g @coastal-programs/supabase-cli
```

---

**Version**: 0.1.0
**Last Updated**: October 30, 2025
**Related**: [Getting Started](getting-started.md) | [Database Operations](database-operations.md) | [Automation](automation.md)
