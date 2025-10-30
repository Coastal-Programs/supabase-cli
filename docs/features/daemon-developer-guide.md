# Daemon Mode Developer Guide

This guide is for developers who want to understand, modify, or extend the daemon mode implementation.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      CLI Entry Point                         │
│                        (bin/run)                             │
│                                                              │
│  1. Parse command and flags                                  │
│  2. Check SUPABASE_CLI_DAEMON environment variable          │
│  3. Route to daemon or direct execution                      │
└──────────────┬───────────────────────────┬──────────────────┘
               │                           │
      Daemon Mode Enabled          Daemon Mode Disabled
               │                           │
               ▼                           ▼
┌──────────────────────────┐    ┌─────────────────────┐
│    Daemon Client         │    │  Direct Execution   │
│  (daemon/client.ts)      │    │     (oclif)         │
│                          │    └─────────────────────┘
│  1. Check if running     │
│  2. Auto-start if needed │
│  3. Send command via IPC │
│  4. Receive result       │
│  5. Output and exit      │
└────────┬─────────────────┘
         │
         │ IPC (Unix Socket / Named Pipe)
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│                    Daemon Server                              │
│                 (daemon/server.ts)                            │
│                                                               │
│  1. Listen on socket                                          │
│  2. Accept connections                                        │
│  3. Parse commands                                            │
│  4. Execute via oclif.run()                                   │
│  5. Capture output                                            │
│  6. Return response                                           │
│  7. Track activity                                            │
│  8. Auto-shutdown on timeout                                  │
└───────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Daemon Server (`src/daemon/server.ts`)

**Purpose**: Background process that executes commands

**Key Methods**:
- `start()` - Start IPC server
- `handleCommand()` - Execute command and capture output
- `resetInactivityTimer()` - Reset 30-minute shutdown timer
- `shutdown()` - Graceful shutdown

**IPC Protocol**:

Client sends:
```json
{
  "command": "projects:list",
  "args": ["arg1", "arg2"],
  "flags": { "format": "json", "color": true },
  "cwd": "/current/working/directory"
}
```

Server responds:
```json
{
  "success": true,
  "output": "...",
  "error": "...",
  "exitCode": 0,
  "duration": 45
}
```

**Output Capture**:

The server intercepts stdout/stderr to capture command output:

```typescript
// Save original
const originalStdoutWrite = process.stdout.write.bind(process.stdout)

// Capture output
let output = ''
process.stdout.write = ((chunk: any, encoding?: any, callback?: any): boolean => {
  output += chunk.toString()
  return originalStdoutWrite(chunk, encoding, callback)
}) as typeof process.stdout.write

// Execute command
await run(argv)

// Restore
process.stdout.write = originalStdoutWrite

// Return captured output
return { output, ... }
```

### 2. Daemon Client (`src/daemon/client.ts`)

**Purpose**: Communicate with daemon server

**Key Methods**:
- `execute()` - Send command and receive response
- `isRunning()` - Check if daemon is running
- `stop()` - Stop daemon process
- `getStatus()` - Get daemon status

**Connection Handling**:

```typescript
// Connect to socket
const socket = net.connect(socketPath)

// Send command
socket.write(JSON.stringify(command) + '\n')

// Receive response
socket.on('data', (data) => {
  const response = JSON.parse(data.toString())
  // Process response
})

// Handle errors
socket.on('error', (error) => {
  // Fallback to direct execution
})
```

### 3. Lifecycle Manager (`src/daemon/lifecycle.ts`)

**Purpose**: Manage daemon process lifecycle

**Key Methods**:
- `start()` - Start daemon process
- `stop()` - Stop daemon process
- `restart()` - Restart daemon
- `autoStart()` - Auto-start if not running
- `isDaemonModeEnabled()` - Check environment variable

**Process Spawning**:

```typescript
const daemonProcess = spawn(
  process.execPath,
  [binPath, 'daemon:server'],
  {
    detached: true,  // Detach from parent
    stdio: ['ignore', 'ignore', 'ignore']  // Ignore I/O
}
)

daemonProcess.unref()  // Allow parent to exit
```

## File Structure

```
src/
├── daemon/
│   ├── server.ts      # Daemon server (IPC + execution)
│   ├── client.ts      # Daemon client (communication)
│   ├── lifecycle.ts   # Process management
│   └── index.ts       # Module exports
├── commands/
│   └── daemon/
│       ├── start.ts   # Start command
│       ├── stop.ts    # Stop command
│       ├── status.ts  # Status command
│       ├── restart.ts # Restart command
│       └── server.ts  # Server command (hidden)
bin/
└── run                # Entry point with routing

~/.supabase/           # User config directory
├── daemon.pid         # Process ID
├── daemon.sock        # Unix socket (Unix)
└── daemon.log         # Log file
```

## Communication Protocol

### Message Format

All messages are newline-delimited JSON.

**Client → Server (Command)**:
```json
{
  "command": "projects:list",
  "args": [],
  "flags": { "format": "json" },
  "cwd": "/path/to/directory"
}
```

**Server → Client (Response)**:
```json
{
  "success": true,
  "output": "[{...}]",
  "exitCode": 0,
  "duration": 45
}
```

### Error Handling

**Server Errors**:
```json
{
  "success": false,
  "error": "Command failed: ...",
  "exitCode": 1,
  "duration": 123
}
```

**Client Errors**:
- Timeout → Fallback to direct execution
- Connection refused → Auto-start daemon → Retry
- Parse error → Log and fallback

## Platform Differences

### Unix (Linux/macOS)

**Socket Type**: Unix domain socket
**Path**: `~/.supabase/daemon.sock`
**Signals**: SIGTERM, SIGINT
**Permissions**: 0600 (user-only)

```typescript
// Unix socket
server.listen('/path/to/daemon.sock')
```

### Windows

**Socket Type**: Named pipe
**Path**: `\\.\pipe\supabase-cli-daemon`
**Signals**: SIGBREAK
**Permissions**: User-specific

```typescript
// Named pipe
server.listen('\\\\.\\pipe\\supabase-cli-daemon')
```

## Testing

### Unit Tests

```typescript
describe('DaemonServer', () => {
  it('should start successfully', async () => {
    const server = new DaemonServer()
    await server.start()
    expect(server.isRunning()).to.be.true
    await server.shutdown()
  })
})
```

### Integration Tests

```typescript
describe('Daemon Integration', () => {
  it('should execute commands via daemon', async () => {
    const lifecycle = new DaemonLifecycle()
    await lifecycle.start()

    const client = new DaemonClient()
    const response = await client.execute('--version', [])

    expect(response.success).to.be.true
    expect(response.exitCode).to.equal(0)

    await lifecycle.stop()
  })
})
```

### Performance Tests

```typescript
describe('Performance', () => {
  it('should be 10x faster than direct', async () => {
    // Measure direct execution
    const directTime = await measureDirect()

    // Measure daemon execution
    const daemonTime = await measureDaemon()

    const speedup = directTime / daemonTime
    expect(speedup).to.be.greaterThan(10)
  })
})
```

## Debugging

### Enable Debug Logging

```bash
# Set environment variable
DEBUG=true supabase-cli daemon start --foreground

# Or check log file
tail -f ~/.supabase/daemon.log
```

### Foreground Mode

```bash
# Run daemon in foreground to see output
supabase-cli daemon start --foreground
```

### Common Issues

**Stale PID file**:
```bash
rm ~/.supabase/daemon.pid
rm ~/.supabase/daemon.sock  # Unix only
```

**Port conflict**:
```bash
# Check if socket exists
ls -l ~/.supabase/daemon.sock

# Remove and restart
rm ~/.supabase/daemon.sock
supabase-cli daemon start
```

**Permission denied**:
```bash
# Check socket permissions
ls -l ~/.supabase/daemon.sock

# Should be: srwx------ (700)
```

## Extending the Daemon

### Add New Commands

New commands work automatically with daemon mode. No changes needed!

```typescript
// commands/new-command.ts
export default class NewCommand extends BaseCommand {
  async run() {
    // This will execute via daemon if enabled
    this.log('Hello from daemon!')
  }
}
```

### Customize Inactivity Timeout

Edit `src/daemon/server.ts`:

```typescript
constructor(options: DaemonServerOptions = {}) {
  this.inactivityTimeout = options.inactivityTimeout ?? 60 * 60 * 1000 // 60 minutes
}
```

### Add Health Check Endpoint

```typescript
// In DaemonServer
private setupHealthCheck(): void {
  setInterval(() => {
    this.log(`Health check: Memory ${process.memoryUsage().heapUsed / 1024 / 1024} MB`)
  }, 60000) // Every minute
}
```

### Implement Metrics Collection

```typescript
// Add to DaemonServer
private metrics = {
  commandsExecuted: 0,
  totalDuration: 0,
  errors: 0
}

private async handleCommand(command: DaemonCommand): Promise<DaemonResponse> {
  this.metrics.commandsExecuted++
  const response = await this.executeCommand(command)
  this.metrics.totalDuration += response.duration
  if (!response.success) this.metrics.errors++
  return response
}
```

## Performance Optimization

### Current Optimizations

1. **No Process Spawning**: Daemon keeps process warm
2. **Module Caching**: Modules loaded once
3. **Connection Pooling**: IPC connection reused
4. **Output Buffering**: Efficient output capture

### Future Optimizations

1. **Request Queuing**: Queue concurrent requests
2. **Worker Threads**: Use worker threads for isolation
3. **Shared Cache**: Share cache across daemon and direct mode
4. **Lazy Loading**: Load modules only when needed

## Security Considerations

### Socket Permissions

```typescript
// Unix socket permissions
fs.chmodSync(socketPath, 0o600) // User-only

// Windows named pipes
// Automatically user-specific
```

### Input Validation

```typescript
// Validate command before execution
if (!isValidCommand(command.command)) {
  throw new Error('Invalid command')
}

// Sanitize arguments
const sanitizedArgs = command.args.map(arg => sanitize(arg))
```

### Credential Handling

- Daemon inherits environment from parent
- Uses same auth as direct mode
- No credential storage in daemon
- Credentials in environment only

## Troubleshooting Guide

### Daemon Won't Start

**Check**:
1. Is another daemon running? → `supabase-cli daemon status`
2. Is socket file stale? → `rm ~/.supabase/daemon.sock`
3. Are permissions correct? → `ls -l ~/.supabase/`

**Debug**:
```bash
supabase-cli daemon start --foreground --debug
```

### Commands Slow

**Check**:
1. Is daemon running? → `supabase-cli daemon status`
2. Is daemon mode enabled? → `echo $SUPABASE_CLI_DAEMON`
3. Is socket responsive? → Check `~/.supabase/daemon.log`

**Fix**:
```bash
supabase-cli daemon restart
```

### Connection Errors

**Symptoms**: "Connection refused" errors

**Causes**:
- Daemon not running
- Socket file missing
- Permission denied

**Fix**:
```bash
supabase-cli daemon stop
rm ~/.supabase/daemon.{pid,sock}
supabase-cli daemon start
```

## Best Practices

### For Users

1. **Enable globally**: Add to shell profile
2. **Auto-start**: Configure system service
3. **Monitor**: Check status periodically
4. **Update**: Restart after CLI updates

### For Developers

1. **Error handling**: Always handle errors gracefully
2. **Logging**: Log all important events
3. **Testing**: Test both daemon and direct modes
4. **Documentation**: Document changes clearly

### For CI/CD

1. **Start early**: Start daemon in setup step
2. **Stop late**: Stop daemon in cleanup step
3. **Error handling**: Handle daemon failures
4. **Monitoring**: Log daemon status

## Contributing

### Before Submitting Changes

1. Run all tests: `npm test`
2. Run daemon tests: `npm run test:daemon`
3. Run performance tests: `npm run test:performance`
4. Test on all platforms (if possible)
5. Update documentation
6. Add tests for new features

### Code Style

- Follow existing patterns
- Use TypeScript strict mode
- Add JSDoc comments
- Handle errors explicitly

### Testing Requirements

- Unit tests for new functionality
- Integration tests for command flow
- Performance tests for critical paths
- Platform-specific tests when needed

## Resources

- [Full Documentation](./DAEMON_MODE.md)
- [Quick Start Guide](./DAEMON_QUICK_START.md)
- [Implementation Summary](../DAEMON_IMPLEMENTATION_SUMMARY.md)
- [Node.js IPC Documentation](https://nodejs.org/api/net.html)
- [Unix Domain Sockets](https://en.wikipedia.org/wiki/Unix_domain_socket)
- [Windows Named Pipes](https://docs.microsoft.com/en-us/windows/win32/ipc/named-pipes)

## FAQ

**Q: Why not use HTTP instead of IPC?**
A: IPC (sockets/pipes) is faster and doesn't require port management.

**Q: Can I run multiple daemons?**
A: Currently no, but this could be added with different socket paths.

**Q: What happens if daemon crashes?**
A: Commands fall back to direct execution automatically.

**Q: Does daemon work with all commands?**
A: Yes, except `daemon:*` commands which always run directly.

**Q: How do I know if daemon is being used?**
A: Check `~/.supabase/daemon.log` for "Executing command" entries.

**Q: Can I customize the socket path?**
A: Not currently, but this could be added as a configuration option.

## Changelog

### v0.2.0 (2025-10-31)
- Initial daemon mode implementation
- 11x performance improvement
- Cross-platform support
- Comprehensive documentation

## Support

For issues or questions:
1. Check logs: `tail -f ~/.supabase/daemon.log`
2. Run diagnostics: `supabase-cli daemon status --debug`
3. Report issues: [GitHub Issues](https://github.com/coastal-programs/supabase-cli/issues)
