# Daemon Mode Quick Start

Get 10x faster command execution in under 2 minutes!

## 1. Start the Daemon

```bash
supabase-cli daemon start
```

Output:
```
Supabase CLI Daemon
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⠹ Starting daemon...
✓ Daemon started successfully

PID: 12345
Socket: /home/user/.supabase/daemon.sock
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Daemon is now running in the background
Commands will now execute 10x faster!

To enable daemon mode globally, add this to your shell profile:
  export SUPABASE_CLI_DAEMON=true

To stop the daemon:
  supabase-cli daemon stop
```

## 2. Enable Daemon Mode

Add to your shell profile:

### Bash (`~/.bashrc`)
```bash
echo 'export SUPABASE_CLI_DAEMON=true' >> ~/.bashrc
source ~/.bashrc
```

###  Zsh (`~/.zshrc`)
```bash
echo 'export SUPABASE_CLI_DAEMON=true' >> ~/.zshrc
source ~/.zshrc
```

### Fish (`~/.config/fish/config.fish`)
```fish
echo 'set -gx SUPABASE_CLI_DAEMON true' >> ~/.config/fish/config.fish
source ~/.config/fish/config.fish
```

### Windows PowerShell
```powershell
[Environment]::SetEnvironmentVariable('SUPABASE_CLI_DAEMON', 'true', 'User')
```

### Windows CMD
```cmd
setx SUPABASE_CLI_DAEMON true
```

## 3. Verify It's Working

```bash
supabase-cli daemon status
```

Output:
```
Supabase CLI Daemon Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Daemon is running
PID: 12345
Socket: /home/user/.supabase/daemon.sock
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Daemon mode is ENABLED (SUPABASE_CLI_DAEMON=true)
All commands will use daemon for faster execution
```

## 4. Enjoy 10x Faster Commands!

```bash
# Before: ~1100ms
# After: <100ms
supabase-cli projects:list
supabase-cli db:query "SELECT * FROM users"
supabase-cli functions:list
```

## Management Commands

### Check Status
```bash
supabase-cli daemon status
# or
supabase-cli ds  # short alias
```

### Stop Daemon
```bash
supabase-cli daemon stop
# or
supabase-cli d:stop  # short alias
```

### Restart Daemon
```bash
supabase-cli daemon restart
# or
supabase-cli d:restart  # short alias
```

## Troubleshooting

### Daemon Won't Start

1. Check for port conflicts:
```bash
# Unix/Linux/macOS
ls -l ~/.supabase/daemon.sock
rm ~/.supabase/daemon.sock  # if stale

# Windows
# Named pipes are automatically cleaned up
```

2. Check logs:
```bash
tail -f ~/.supabase/daemon.log
```

3. Try foreground mode to see errors:
```bash
supabase-cli daemon start --foreground
```

### Commands Still Slow

1. Verify daemon is running:
```bash
supabase-cli daemon status
```

2. Verify environment variable:
```bash
echo $SUPABASE_CLI_DAEMON  # Should output "true"
```

3. Restart daemon:
```bash
supabase-cli daemon restart
```

### Permission Denied

```bash
# Remove stale files
rm ~/.supabase/daemon.pid
rm ~/.supabase/daemon.sock  # Unix only

# Restart daemon
supabase-cli daemon start
```

## Performance Comparison

| Mode | Average Time | Speedup |
|------|-------------|---------|
| Direct Execution | ~1100ms | 1x |
| Daemon Mode | <100ms | **11x faster** |

## Auto-Start on Login (Optional)

### Bash/Zsh
```bash
# Add to ~/.bashrc or ~/.zshrc
if ! supabase-cli daemon status &>/dev/null; then
  supabase-cli daemon start &>/dev/null
fi
```

### Systemd (Linux)
Create `~/.config/systemd/user/supabase-daemon.service`:

```ini
[Unit]
Description=Supabase CLI Daemon
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/supabase-cli daemon start --foreground
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=default.target
```

Enable and start:
```bash
systemctl --user enable supabase-daemon
systemctl --user start supabase-daemon
```

### macOS launchd
Create `~/Library/LaunchAgents/com.coastal-programs.supabase-daemon.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.coastal-programs.supabase-daemon</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/supabase-cli</string>
        <string>daemon</string>
        <string>start</string>
        <string>--foreground</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

Load:
```bash
launchctl load ~/Library/LaunchAgents/com.coastal-programs.supabase-daemon.plist
```

### Windows Task Scheduler
```powershell
$action = New-ScheduledTaskAction -Execute "supabase-cli" -Argument "daemon start --foreground"
$trigger = New-ScheduledTaskTrigger -AtLogon
Register-ScheduledTask -TaskName "Supabase CLI Daemon" -Action $action -Trigger $trigger
```

## CI/CD Integration

### GitHub Actions
```yaml
steps:
  - name: Start Supabase daemon
    run: supabase-cli daemon start

  - name: Run commands (10x faster!)
    env:
      SUPABASE_CLI_DAEMON: true
    run: |
      supabase-cli projects:list
      supabase-cli db:migrate
      supabase-cli functions:deploy my-function

  - name: Stop daemon
    if: always()
    run: supabase-cli daemon stop
```

### GitLab CI
```yaml
before_script:
  - supabase-cli daemon start
  - export SUPABASE_CLI_DAEMON=true

script:
  - supabase-cli projects:list
  - supabase-cli db:migrate

after_script:
  - supabase-cli daemon stop
```

### Jenkins
```groovy
pipeline {
    stages {
        stage('Setup') {
            steps {
                sh 'supabase-cli daemon start'
            }
        }
        stage('Deploy') {
            environment {
                SUPABASE_CLI_DAEMON = 'true'
            }
            steps {
                sh 'supabase-cli projects:list'
                sh 'supabase-cli db:migrate'
            }
        }
    }
    post {
        always {
            sh 'supabase-cli daemon stop'
        }
    }
}
```

## Next Steps

- Read [Full Documentation](./DAEMON_MODE.md)
- Run [Performance Benchmarks](#performance-benchmarks)
- Configure [Auto-Start](#auto-start-on-login-optional)

## Performance Benchmarks

Run the built-in benchmarks:

```bash
npm run test:daemon
```

Expected output:
```
  Daemon Performance Benchmark
    Benchmarking direct execution...
    Direct execution 1: 1100ms
    Direct execution 2: 1050ms
    Direct execution 3: 1120ms
    Average direct execution time: 1090ms

    Benchmarking daemon execution...
    Daemon execution 1: 95ms
    Daemon execution 2: 85ms
    Daemon execution 3: 90ms
    Average daemon execution time: 90ms

    Speedup: 12.1x faster
    ✓ Performance target achieved: 10x faster!
```

## Need Help?

- Check logs: `tail -f ~/.supabase/daemon.log`
- Report issues: [GitHub Issues](https://github.com/coastal-programs/supabase-cli/issues)
- Read docs: [Full Daemon Mode Documentation](./DAEMON_MODE.md)
