# Interactive Mode - Manual Testing Guide

This guide provides step-by-step instructions for manually testing the interactive REPL mode.

## Prerequisites

1. Build the CLI:
   ```bash
   npm run build
   ```

2. Ensure you have authentication set up:
   ```bash
   supabase-cli auth:setup
   # or
   export SUPABASE_ACCESS_TOKEN=sbp_your_token_here
   ```

3. Have at least one Supabase project to test with

## Test Suite

### 1. Basic REPL Startup

**Test**: Start interactive mode without project context

```bash
supabase-cli interactive
```

**Expected Output**:
```
╔══════════════════════════════════════╗
║   Supabase CLI Interactive Mode      ║
╚══════════════════════════════════════╝

Type commands without 'supabase-cli' prefix
Special commands: help, clear, exit, history, .commands

>
```

**Verify**:
- [ ] Welcome banner displays
- [ ] Prompt shows `>`
- [ ] Cursor is ready for input

---

### 2. Basic Command Execution

**Test**: Run simple commands

```bash
> projects:list
```

**Expected**:
- [ ] Projects list displays in JSON format (default)
- [ ] Prompt returns after output
- [ ] No errors displayed

**Test**: Run with flags

```bash
> projects:list --format table
```

**Expected**:
- [ ] Projects display in table format
- [ ] Table has proper alignment
- [ ] Prompt returns

---

### 3. Special Commands

**Test**: Help command

```bash
> help
```

**Expected**:
- [ ] Help message displays
- [ ] Shows all special commands
- [ ] Shows keyboard shortcuts
- [ ] Shows examples
- [ ] Prompt returns

**Test**: List commands

```bash
> .commands
```

**Expected**:
- [ ] Commands grouped by topic
- [ ] Topics are color-coded
- [ ] Commands are sorted alphabetically within topics
- [ ] Prompt returns

**Test**: Clear screen

```bash
> clear
```

**Expected**:
- [ ] Screen clears
- [ ] Welcome banner redisplays
- [ ] Prompt returns

**Test**: Show stats

```bash
> .stats
```

**Expected**:
- [ ] Shows commands executed count
- [ ] Shows session uptime
- [ ] Shows history size
- [ ] Prompt returns

---

### 4. Command History

**Test**: Navigate history with arrow keys

```bash
> projects:list
> db:extensions
> functions:list
# Press UP arrow 3 times
```

**Expected**:
- [ ] UP shows previous commands in reverse order
- [ ] Commands show exactly as typed
- [ ] Can press ENTER to re-execute
- [ ] DOWN arrow goes forward in history

**Test**: View history

```bash
> history
```

**Expected**:
- [ ] Shows numbered list of recent commands
- [ ] Most recent at bottom
- [ ] Line numbers increment correctly
- [ ] Shows last 20 commands (or total if fewer)

---

### 5. Context Management

**Test**: Set project context

```bash
> use ygzhmowennlaehudyyey
```

**Expected**:
- [ ] Shows "Switched to project: ..." message
- [ ] Prompt changes to `[project-name] >`
- [ ] Project name shows in prompt (or first 8 chars of ref)

**Test**: Use context in commands

```bash
[my-project] > db:info
```

**Expected**:
- [ ] Command executes without `--project` flag
- [ ] Uses project from context
- [ ] Database info displays
- [ ] Prompt stays with project context

**Test**: Show context

```bash
[my-project] > .context
```

**Expected**:
- [ ] Shows current project ref and name
- [ ] Shows last command executed
- [ ] Prompt returns

**Test**: Clear context

```bash
[my-project] > unuse
```

**Expected**:
- [ ] Shows "Cleared project context" message
- [ ] Prompt changes back to `>`
- [ ] Subsequent commands require `--project` flag

---

### 6. Autocomplete (TAB)

**Test**: Command autocomplete

```bash
> proj<TAB>
```

**Expected**:
- [ ] Shows completions: `projects:list`, `projects:get`, etc.
- [ ] Or completes to common prefix if unique

**Test**: Double TAB for all commands

```bash
> <TAB><TAB>
```

**Expected**:
- [ ] Shows all available commands
- [ ] Includes special commands
- [ ] Properly formatted list

---

### 7. Error Handling

**Test**: Invalid command

```bash
> invalid:command
```

**Expected**:
- [ ] Shows error message
- [ ] REPL stays running
- [ ] Prompt returns
- [ ] Can continue typing commands

**Test**: Command execution error

```bash
> projects:get
```

**Expected**:
- [ ] Shows error: "Project reference required"
- [ ] REPL stays running
- [ ] Error is red/highlighted
- [ ] Prompt returns

**Test**: Fix and retry

```bash
> projects:get --project ygzhmowennlaehudyyey
```

**Expected**:
- [ ] Command executes successfully
- [ ] Shows project details
- [ ] No lingering error state

---

### 8. Exit Methods

**Test**: Exit command

```bash
> exit
```

**Expected**:
- [ ] Shows "Goodbye!" message
- [ ] REPL exits cleanly
- [ ] Returns to shell prompt

**Restart and test**: Quit command

```bash
> quit
```

**Expected**:
- [ ] Shows "Goodbye!" message
- [ ] REPL exits

**Restart and test**: Short quit

```bash
> q
```

**Expected**:
- [ ] Shows "Goodbye!" message
- [ ] REPL exits

**Restart and test**: Ctrl+D

```bash
# Press Ctrl+D
```

**Expected**:
- [ ] REPL exits gracefully
- [ ] No error messages

**Restart and test**: Ctrl+C handling

```bash
# Press Ctrl+C
```

**Expected**:
- [ ] Shows message: "Press Ctrl+D or type 'exit' to quit"
- [ ] REPL stays running
- [ ] Prompt returns

---

### 9. Starting with Project Context

**Test**: Start with --project flag

```bash
supabase-cli interactive --project ygzhmowennlaehudyyey
```

**Expected**:
- [ ] Welcome banner shows
- [ ] Shows "Current project: ..." message
- [ ] Prompt starts with `[project-name] >`
- [ ] Commands use context automatically

**Test**: Use context immediately

```bash
[my-project] > db:info
```

**Expected**:
- [ ] Command executes without `--project` flag
- [ ] Database info displays correctly

---

### 10. Long-Running Commands

**Test**: Execute query

```bash
> db:query "SELECT pg_sleep(2), version()" --project ygzhmowennlaehudyyey
```

**Expected**:
- [ ] Command executes (takes ~2 seconds)
- [ ] Shows output after completion
- [ ] Prompt returns
- [ ] Can continue using REPL

---

### 11. Multiple Commands in Session

**Test**: Execute variety of commands

```bash
> projects:list --format table
> use ygzhmowennlaehudyyey
[my-project] > db:info
[my-project] > db:extensions
[my-project] > functions:list
[my-project] > .stats
[my-project] > history
```

**Expected**:
- [ ] All commands execute successfully
- [ ] Stats show correct command count
- [ ] History shows all commands
- [ ] No memory leaks or slowdowns

---

### 12. History Persistence

**Test**: Exit and restart REPL

```bash
> projects:list
> db:info --project ygzhmowennlaehudyyey
> exit

# Restart
supabase-cli interactive

> history
```

**Expected**:
- [ ] History includes commands from previous session
- [ ] History file saved to `~/.supabase-cli/repl-history`
- [ ] Can use UP arrow to access old commands
- [ ] No duplicate entries for identical commands

---

### 13. Output Formatting

**Test**: Different output formats

```bash
> projects:list --format json
> projects:list --format table
> projects:list --format yaml
> projects:list --format list
```

**Expected**:
- [ ] Each format displays correctly
- [ ] JSON is pretty-printed by default
- [ ] Table has proper alignment
- [ ] YAML is valid syntax
- [ ] List format is readable

---

### 14. Quiet and Verbose Modes

**Test**: Quiet mode

```bash
> projects:list --quiet
```

**Expected**:
- [ ] Minimal output
- [ ] No extra messages
- [ ] Only data output

**Test**: Verbose mode

```bash
> projects:list --verbose
```

**Expected**:
- [ ] Additional debug information
- [ ] Shows request details (if applicable)
- [ ] More detailed output

---

## Performance Testing

### 15. Startup Time

**Test**: Measure startup

```bash
time supabase-cli interactive
# Then type: exit
```

**Expected**:
- [ ] Starts in < 5 seconds
- [ ] No visible lag
- [ ] Responsive immediately

### 16. Command Execution Speed

**Test**: Rapid commands

```bash
> projects:list
> projects:list
> projects:list
```

**Expected**:
- [ ] Each command returns quickly
- [ ] No noticeable slowdown
- [ ] Cache may speed up subsequent calls

---

## Edge Cases

### 17. Empty Input

**Test**: Press ENTER without typing

```bash
> <ENTER>
```

**Expected**:
- [ ] Prompt returns immediately
- [ ] No error message
- [ ] No entry in history

### 18. Very Long Command

**Test**: Type long query

```bash
> db:query "SELECT * FROM (VALUES (1,2,3), (4,5,6), (7,8,9)) AS t(a,b,c) WHERE a > 2 AND b < 8" --project ygzhmowennlaehudyyey
```

**Expected**:
- [ ] Long command accepted
- [ ] Executes correctly
- [ ] Shows in history
- [ ] Can recall with UP arrow

### 19. Special Characters

**Test**: Query with special characters

```bash
> db:query "SELECT 'Hello, World! 🎉' AS message" --project ygzhmowennlaehudyyey
```

**Expected**:
- [ ] Special characters handled correctly
- [ ] Unicode displays properly (if terminal supports)
- [ ] No encoding errors

---

## Bug Report Template

If you find issues during testing, report with this template:

```markdown
## Issue: [Brief description]

**Test Section**: [Section number and name]

**Steps to Reproduce**:
1.
2.
3.

**Expected Behavior**:
-

**Actual Behavior**:
-

**Environment**:
- OS: [macOS/Windows/Linux]
- Node Version: [output of `node --version`]
- CLI Version: [output of `supabase-cli --version`]
- Shell: [bash/zsh/fish]

**Screenshots/Logs** (if applicable):
```

---

## Checklist Summary

Copy this checklist for quick testing:

- [ ] Basic REPL startup
- [ ] Basic command execution
- [ ] Help command works
- [ ] .commands works
- [ ] Clear screen works
- [ ] Stats display works
- [ ] History navigation (UP/DOWN)
- [ ] View history command
- [ ] Set project context (use)
- [ ] Use context in commands
- [ ] Show context (.context)
- [ ] Clear context (unuse)
- [ ] TAB autocomplete
- [ ] Invalid command handling
- [ ] Error recovery
- [ ] Exit command
- [ ] Quit command
- [ ] Ctrl+D exit
- [ ] Ctrl+C handling
- [ ] Start with --project
- [ ] Long-running commands
- [ ] Multiple commands work
- [ ] History persists across sessions
- [ ] Different output formats
- [ ] Quiet mode
- [ ] Verbose mode
- [ ] Startup performance
- [ ] Command execution speed
- [ ] Empty input handling
- [ ] Long commands
- [ ] Special characters

---

## Notes

- Test on different operating systems if possible (macOS, Windows, Linux)
- Test with different shells (bash, zsh, fish)
- Test with different terminal emulators
- Test with different project configurations
- Report any crashes, hangs, or unexpected behavior

## Resources

- Full Documentation: [docs/INTERACTIVE_MODE.md](INTERACTIVE_MODE.md)
- User Guide: [README.md](../README.md)
- Issue Tracker: [GitHub Issues](https://github.com/coastal-programs/supabase-cli/issues)
