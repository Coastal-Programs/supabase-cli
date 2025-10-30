# Watch Mode

Watch mode is a powerful feature that allows you to continuously monitor your Supabase resources by auto-refreshing command output at specified intervals.

## Overview

Watch mode provides real-time monitoring capabilities for your Supabase infrastructure. Instead of manually re-running commands to check for updates, watch mode automatically refreshes the output, making it ideal for:

- Monitoring active database connections
- Tracking database size changes
- Observing project status updates
- Real-time system monitoring during deployments or load testing

## Features

- **Automatic Refresh**: Commands refresh at a configurable interval (default: 5 seconds)
- **Clean Display**: Screen clears between refreshes for easy reading
- **Error Resilience**: Continues watching even if individual requests fail
- **Timestamp Display**: Shows last update time and iteration count
- **Cross-Platform**: Works on Windows, macOS, and Linux

## Usage

### Basic Usage

Add the `--watch` (or `-w`) flag to any supported command:

```bash
supabase-cli db:connections --project my-project --watch
```

### Custom Interval

Specify a custom refresh interval (in seconds) with `--interval`:

```bash
# Refresh every 10 seconds
supabase-cli db:connections --project my-project --watch --interval 10

# Refresh every 30 seconds
supabase-cli db:info --project my-project --watch --interval 30
```

### Stop Watching

Press `Ctrl+C` to exit watch mode at any time.

## Supported Commands

Watch mode is currently supported on the following commands:

### Database Commands

#### `db:connections`
Monitor active database connections in real-time. Useful for:
- Tracking connection pool usage during load tests
- Identifying connection leaks
- Monitoring database activity

```bash
# Watch connections every 5 seconds (default)
supabase-cli db:connections --project my-project --watch

# Watch with custom interval
supabase-cli db:connections --project my-project --watch --interval 3
```

#### `db:info`
Watch database statistics like version and size. Useful for:
- Monitoring database size growth
- Verifying database version after upgrades
- Tracking database metadata changes

```bash
# Watch database info with 30 second refresh
supabase-cli db:info --project my-project --watch --interval 30
```

### Project Commands

#### `projects:list`
Monitor all your Supabase projects. Useful for:
- Tracking project status changes
- Monitoring new project creation
- Watching for project health updates

```bash
# Watch projects list
supabase-cli projects:list --watch --interval 30
```

## Output Format

When watch mode is enabled, the display shows:

1. **Watch Header**: Refresh interval and stop instruction
2. **Status Line**: Last update timestamp and iteration count
3. **Command Output**: Normal command output (tables, JSON, etc.)
4. **Blank Line**: Separator before next refresh

Example display:
```
Watch mode: refreshing every 5s (Press Ctrl+C to stop)
Last update: 2:30:45 PM | Iteration: 12

Active Database Connections
┌──────────┬────────────────────┐
│ Database │ Active Connections │
├──────────┼────────────────────┤
│ postgres │ 8                  │
└──────────┴────────────────────┘
─────────────────────────────────
Total: 8 active connection(s) across 1 database(s)
```

## Combining with Other Flags

Watch mode works seamlessly with other flags:

### With Format Options

```bash
# Watch with table format
supabase-cli db:connections --project my-project --watch --format table

# Watch with JSON format
supabase-cli db:connections --project my-project --watch --format json
```

### With Quiet Mode

```bash
# Watch with minimal output (no headers/messages)
supabase-cli db:connections --project my-project --watch --quiet
```

### With Debug Mode

```bash
# Watch with debug logging
supabase-cli db:connections --project my-project --watch --debug
```

## Performance Considerations

### API Rate Limits

Be mindful of Supabase API rate limits when using watch mode:
- Default rate limit: 60 requests per minute
- With default 5-second interval: 12 requests per minute
- Recommended minimum interval: 5 seconds

### Recommended Intervals by Command

| Command | Recommended Interval | Reason |
|---------|---------------------|--------|
| `db:connections` | 3-5 seconds | Connection counts change frequently |
| `db:info` | 30-60 seconds | Database stats change slowly |
| `projects:list` | 30-60 seconds | Project list rarely changes |

### Resource Usage

Watch mode uses minimal system resources:
- Network: One API request per interval
- CPU: Negligible (only during refresh)
- Memory: Constant (no data accumulation)

## Error Handling

Watch mode is designed to be resilient:

### Network Errors
If a request fails, watch mode will:
1. Display the error message
2. Continue watching
3. Retry on the next interval

Example:
```
Watch mode: refreshing every 5s (Press Ctrl+C to stop)
Last update: 2:30:45 PM | Iteration: 12

Error: Failed to connect to Supabase API
(Will retry in 5 seconds...)
```

### Authentication Errors
If authentication fails, watch mode will continue attempting requests. You'll need to press `Ctrl+C` and fix your credentials.

### Rate Limiting
If you hit rate limits, increase your interval:
```bash
# Increase to 10 seconds to avoid rate limits
supabase-cli db:connections --project my-project --watch --interval 10
```

## Use Cases

### 1. Load Testing Monitoring
Monitor database connections during load tests:
```bash
# Terminal 1: Run load test
npm run load-test

# Terminal 2: Watch connections
supabase-cli db:connections --project my-project --watch --interval 2
```

### 2. Deployment Monitoring
Watch project status during deployments:
```bash
supabase-cli projects:list --watch --interval 10 --format table
```

### 3. Database Growth Tracking
Monitor database size over time:
```bash
supabase-cli db:info --project my-project --watch --interval 60
```

### 4. Connection Leak Detection
Identify connection leaks by watching for growing connection counts:
```bash
supabase-cli db:connections --project my-project --watch --interval 5
```

## Best Practices

1. **Choose Appropriate Intervals**
   - Fast-changing data (connections): 3-5 seconds
   - Slow-changing data (stats): 30-60 seconds

2. **Use Table Format for Readability**
   ```bash
   --format table
   ```

3. **Respect Rate Limits**
   - Keep intervals >= 5 seconds
   - Monitor API usage

4. **Use Quiet Mode for Scripts**
   ```bash
   --watch --quiet
   ```

5. **Combine with Other Monitoring Tools**
   - Use alongside your APM tools
   - Correlate with logs and metrics

## Troubleshooting

### Watch mode not updating
- Check your internet connection
- Verify API credentials are valid
- Ensure project reference is correct

### Screen flickering
- This is normal during refresh
- Try increasing the interval

### Rate limit errors
- Increase the refresh interval
- Wait a few minutes before retrying

### High API usage
- Use longer intervals (30+ seconds)
- Only watch when actively monitoring

## Future Enhancements

Planned features for watch mode:
- [ ] Diff highlighting (show changes between refreshes)
- [ ] Alert triggers (notify on thresholds)
- [ ] Export watch history to file
- [ ] Multi-command watch (monitor multiple resources)
- [ ] Custom refresh schedules (cron-like)

## Technical Details

### Implementation
Watch mode is implemented in `BaseCommand.runWithWatch()`:
- Uses `console.clear()` for cross-platform screen clearing
- Wraps command logic in infinite loop
- Uses `setTimeout()` for precise interval timing
- Handles errors gracefully to continue watching

### Spinner Suppression
In watch mode, spinners are automatically disabled to prevent visual artifacts during refreshes.

### Process Termination
Watch mode handles `Ctrl+C` (SIGINT) gracefully:
- Cleans up resources
- Exits immediately
- No orphaned processes

## See Also

- [Base Flags Documentation](../src/base-flags.ts)
- [Base Command Documentation](../src/base-command.ts)
- [Database Commands](../README.md#database-commands)
- [Project Commands](../README.md#project-commands)
