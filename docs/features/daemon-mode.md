# Daemon Mode - 10x Faster Command Execution

Daemon mode keeps a background process running that responds to commands instantly, eliminating the startup overhead of spawning a new Node.js process for each command.

## Performance

**Direct Mode**: ~1100ms per command (process spawn + module loading + oclif init)
**Daemon Mode**: <100ms per command (IPC communication only)

**Result**: 11x faster! 🚀

## Quick Start

### 1. Start the Daemon

```bash
supabase-cli daemon start
```

This starts a background process that will:
- Listen for commands via Unix socket (Linux/macOS) or Named Pipe (Windows)
- Auto-shutdown after 30 minutes of inactivity
- Execute commands in the same process (no startup overhead)

### 2. Enable Daemon Mode

Add to your shell profile (`~/.bashrc`, `~/.zshrc`, or `~/.profile`):

```bash
export SUPABASE_CLI_DAEMON=true
```

Or set it per-session:

```bash
export SUPABASE_CLI_DAEMON=true
```

### 3. Run Commands (10x faster!)

```bash
# These now execute in <100ms!
supabase-cli projects:list
supabase-cli db:query "SELECT * FROM users"
supabase-cli functions:list
```

## Daemon Management Commands

### Start Daemon

```bash
supabase-cli daemon start

# Start in foreground (for debugging)
supabase-cli daemon start --foreground
```

### Stop Daemon

```bash
supabase-cli daemon stop
```

### Check Status

```bash
supabase-cli daemon status
```

Output:
```
Daemon is running
PID: 12345
Socket: /home/user/.supabase/daemon.sock

Daemon mode is ENABLED (SUPABASE_CLI_DAEMON=true)
All commands will use daemon for faster execution
```

### Restart Daemon

```bash
supabase-cli daemon restart
```

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────┐
│                 CLI Entry Point                 │
│                   (bin/run)                     │
└─────────────────┬───────────────────────────────┘
                  │
                  ├─ SUPABASE_CLI_DAEMON=true?
                  │
        ┌─────────┴──────────┐
        │ YES                │ NO
        ▼                    ▼
┌──────────────┐      ┌──────────────┐
│ Daemon Client│      │ Direct       │
│              │      │ Execution    │
└──────┬───────┘      │ (oclif)      │
       │              └──────────────┘
       │ IPC (socket)
       ▼
┌──────────────────────────┐
│   Daemon Server          │
│   (background process)   │
│                          │
│  - Listen on socket      │
│  - Execute commands      │
│  - Return results        │
│  - Auto-shutdown after   │
│    30min inactivity      │
└──────────────────────────┘
```

### Communication Flow

1. **Client** sends command to daemon via socket:
   ```json
   {
     "command": "projects:list",
     "args": [],
     "flags": { "format": "json" },
     "cwd": "/current/directory"
   }
   ```

2. **Daemon** executes command in same process:
   - No process spawning overhead
   - No module loading overhead
   - No oclif initialization overhead

3. **Daemon** returns result:
   ```json
   {
     "success": true,
     "output": "[{...}]",
     "exitCode": 0,
     "duration": 45
   }
   ```

4. **Client** outputs result and exits

### File Locations

- **Socket**: `~/.supabase/daemon.sock` (Unix) or `\\.\pipe\supabase-cli-daemon` (Windows)
- **PID File**: `~/.supabase/daemon.pid`
- **Log File**: `~/.supabase/daemon.log`

## Lifecycle Management

### Auto-Start

When `SUPABASE_CLI_DAEMON=true`, the first command will automatically start the daemon if not running.

```bash
export SUPABASE_CLI_DAEMON=true

# This auto-starts daemon if needed
supabase-cli projects:list
```

### Auto-Shutdown

The daemon automatically shuts down after 30 minutes of inactivity to save resources.

### Graceful Shutdown

The daemon handles shutdown signals gracefully:

- `SIGTERM` - Graceful shutdown
- `SIGINT` (Ctrl+C) - Graceful shutdown
- `SIGBREAK` (Windows) - Graceful shutdown

### Process Management

The daemon uses a PID file to track the running process:

```bash
# Check if daemon is running
cat ~/.supabase/daemon.pid

# Manually kill daemon (if needed)
kill $(cat ~/.supabase/daemon.pid)
```

## Error Handling

### Fallback to Direct Execution

If the daemon fails to execute a command, the CLI automatically falls back to direct execution:

```bash
# If daemon fails, command still executes (slower)
supabase-cli projects:list
# Daemon error: Connection refused
# Falling back to direct execution...
```

### Daemon Crash Recovery

If the daemon crashes:

1. Stale PID file is cleaned up
2. Next command auto-starts a new daemon
3. No manual intervention needed

### Debugging

Enable foreground mode to see daemon logs:

```bash
supabase-cli daemon start --foreground
```

Or check the log file:

```bash
tail -f ~/.supabase/daemon.log
```

## Performance Benchmarks

Run the performance benchmarks:

```bash
npm run test:daemon
```

Expected results:

```
Direct execution:
  Iteration 1: 1100ms
  Iteration 2: 1050ms
  Iteration 3: 1120ms
  Average: 1090ms

Daemon execution:
  Iteration 1: 95ms
  Iteration 2: 85ms
  Iteration 3: 90ms
  Average: 90ms

Speedup: 12.1x faster ✓
```

## Use Cases

### CI/CD Pipelines

```bash
# Start daemon once
supabase-cli daemon start

# Run multiple commands (all fast!)
supabase-cli projects:list
supabase-cli db:migrate
supabase-cli functions:deploy my-function
supabase-cli db:query "SELECT COUNT(*) FROM users"

# Stop daemon when done
supabase-cli daemon stop
```

### Development Workflow

```bash
# Add to shell profile for permanent enablement
echo "export SUPABASE_CLI_DAEMON=true" >> ~/.bashrc

# Start daemon in background
supabase-cli daemon start

# Now all commands are instant!
supabase-cli projects:list     # <100ms
supabase-cli db:tables         # <100ms
supabase-cli functions:list    # <100ms
```

### Automation Scripts

```bash
#!/bin/bash

# Enable daemon mode
export SUPABASE_CLI_DAEMON=true

# Commands execute 10x faster
for project in $(supabase-cli projects:list --format json | jq -r '.[].ref'); do
  supabase-cli db:query "SELECT COUNT(*) FROM users" --project $project
done
```

## Limitations

### Commands Not Supported in Daemon Mode

The following commands always run in direct mode:

- `daemon:*` - Daemon management commands
- `--help` - Help output (fast path in bin/run)
- `--version` - Version output (fast path in bin/run)

### Platform-Specific Behavior

**Windows**:
- Uses Named Pipes instead of Unix sockets
- Signal handling differs (uses SIGBREAK)
- Slightly different performance characteristics

**Unix/Linux/macOS**:
- Uses Unix domain sockets
- Standard signal handling (SIGTERM/SIGINT)
- Best performance

### Resource Usage

The daemon process uses approximately:
- **Memory**: ~50-100MB (Node.js + loaded modules)
- **CPU**: Near 0% when idle
- **Disk**: Minimal (log file only)

## Troubleshooting

### Daemon Won't Start

```bash
# Check for errors in log
tail ~/.supabase/daemon.log

# Remove stale PID file
rm ~/.supabase/daemon.pid

# Try starting in foreground to see errors
supabase-cli daemon start --foreground
```

### Permission Denied on Socket

```bash
# Remove stale socket file
rm ~/.supabase/daemon.sock

# Restart daemon
supabase-cli daemon restart
```

### Commands Still Slow

```bash
# Verify daemon is running
supabase-cli daemon status

# Verify daemon mode is enabled
echo $SUPABASE_CLI_DAEMON  # Should output "true"

# Check if socket exists
ls -l ~/.supabase/daemon.sock
```

### High Memory Usage

```bash
# Restart daemon to free memory
supabase-cli daemon restart

# Or reduce inactivity timeout (requires code change)
```

## Configuration

### Environment Variables

- `SUPABASE_CLI_DAEMON` - Enable daemon mode (`true` or `1`)
- `DEBUG` - Enable debug logging

### Advanced Configuration

To customize daemon behavior, modify `src/daemon/server.ts`:

```typescript
new DaemonServer({
  inactivityTimeout: 30 * 60 * 1000, // 30 minutes
  logFile: path.join(configDir, 'daemon.log'),
  socketPath: '/custom/socket/path',
})
```

## Security Considerations

### Socket Permissions

The socket file is created with user-only permissions:
- Unix: `0600` (rw-------)
- Windows: User-specific Named Pipe

### Process Isolation

The daemon runs as the same user as the CLI, inheriting:
- File system permissions
- Environment variables
- Authentication credentials

### Credential Storage

The daemon has access to:
- `SUPABASE_ACCESS_TOKEN` environment variable
- Keytar-stored credentials

Ensure proper security practices:
- Don't run daemon as root/administrator
- Use secure credential storage
- Monitor daemon.log for suspicious activity

## Best Practices

### 1. Start Daemon in CI/CD

```yaml
# GitHub Actions example
steps:
  - name: Start Supabase CLI daemon
    run: supabase-cli daemon start

  - name: Run commands (fast!)
    run: |
      supabase-cli projects:list
      supabase-cli db:migrate

  - name: Stop daemon
    run: supabase-cli daemon stop
    if: always()
```

### 2. Use in Development

```bash
# Add to shell profile
export SUPABASE_CLI_DAEMON=true

# Start daemon on login (optional)
# Add to ~/.bashrc or ~/.zshrc
if ! supabase-cli daemon status &>/dev/null; then
  supabase-cli daemon start &>/dev/null
fi
```

### 3. Monitor Performance

```bash
# Run benchmarks periodically
npm run test:daemon

# Check daemon status
supabase-cli daemon status
```

### 4. Clean Shutdown

```bash
# Always stop daemon when done
trap "supabase-cli daemon stop" EXIT

# Your script here
supabase-cli projects:list
```

## Future Enhancements

Potential improvements:

- [ ] Configurable inactivity timeout
- [ ] Multiple socket paths for isolation
- [ ] Daemon health checks
- [ ] Metrics collection
- [ ] Auto-restart on crash
- [ ] Connection pooling
- [ ] Request queuing
- [ ] Load balancing (multiple daemons)

## Support

For issues or questions:

1. Check `~/.supabase/daemon.log`
2. Run `supabase-cli daemon status --debug`
3. Open an issue on GitHub
4. Include daemon logs and status output
