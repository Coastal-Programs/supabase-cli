# Project Context

The Supabase CLI supports **project context detection**, which automatically identifies your project from a local configuration file. This eliminates the need to repeatedly specify `--project` flags in your commands.

## Quick Start

Link your project to the current directory:

```bash
supabase-cli projects:link abcdefghij1234567890
```

Now you can run commands without the `--project` flag:

```bash
# Before (with flag)
supabase-cli projects:get --project abcdefghij1234567890

# After (auto-detected)
supabase-cli projects:get
```

## How It Works

### Project Resolution Priority

The CLI resolves the project reference in the following order:

1. **Command flags**: `--project` or `--project-ref` flags take highest priority
2. **Project context**: `.supabase/config.json` in current or parent directories
3. **Environment variable**: `SUPABASE_PROJECT_REF` environment variable
4. **Error**: If none of the above are found, the command will fail with a helpful error message

### Configuration File

When you link a project, the CLI creates a `.supabase/config.json` file:

```json
{
  "project_id": "abcdefghij1234567890",
  "project_name": "My Awesome Project",
  "created_at": "2024-10-31T12:00:00.000Z"
}
```

This file is created in the current directory and is searched up the directory tree, similar to how `.git` directories work.

## Commands

### projects:link

Link a project to the current directory:

```bash
supabase-cli projects:link <project-ref>
```

**Aliases**: `project:link`, `link`

**Example**:
```bash
supabase-cli link ygzhmowennlaehudyyey
```

This command will:
1. Verify the project exists
2. Fetch the project name from the API
3. Create `.supabase/config.json` with project details
4. Show a success message

### Using Context in Commands

Once linked, all commands that require a project reference will automatically detect it:

```bash
# All of these work without --project flag
supabase-cli projects:get
supabase-cli db:query "SELECT * FROM users"
supabase-cli functions:list
supabase-cli backup:list
```

## Directory Structure

The `.supabase/` directory is added to `.gitignore` by default for security reasons. However, you may choose to commit it if you want to share project context with your team.

```
my-project/
├── .supabase/
│   └── config.json        # Project context
├── src/
│   └── ...
└── package.json
```

## Parent Directory Search

The CLI walks up the directory tree to find `.supabase/config.json`:

```
/home/user/
└── projects/
    └── my-app/
        ├── .supabase/
        │   └── config.json   # Found here
        ├── frontend/
        │   └── src/
        │       └── components/
        │           └── [You can run commands here!]
        └── backend/
            └── api/
                └── [Or here!]
```

Commands run from any subdirectory will find and use the project context.

## Override Behavior

You can always override the detected project with command-line flags:

```bash
# Use a different project temporarily
supabase-cli projects:get --project xyz789

# The .supabase/config.json is not modified
```

## Security Considerations

### Should You Commit `.supabase/config.json`?

**Pros of committing**:
- Team members automatically use the correct project
- CI/CD pipelines can detect the project
- Reduces configuration steps for new developers

**Cons of committing**:
- Project references are somewhat sensitive
- Different team members might work on different projects/environments

**Recommendation**: For open-source projects, add `.supabase/` to `.gitignore`. For private repositories with a single project, committing is usually safe and convenient.

### Using Environment Variables Instead

For CI/CD or multi-project workflows, use environment variables:

```bash
export SUPABASE_PROJECT_REF=abcdefghij1234567890
supabase-cli projects:get
```

## Monorepo Support

In a monorepo with multiple projects, you can create multiple `.supabase/config.json` files:

```
monorepo/
├── app-1/
│   ├── .supabase/
│   │   └── config.json    # Project A
│   └── src/
├── app-2/
│   ├── .supabase/
│   │   └── config.json    # Project B
│   └── src/
└── shared/
    └── lib/
```

Commands run from `app-1/` will use Project A, while commands from `app-2/` will use Project B.

## Troubleshooting

### Project Not Found

If you see "Project reference required", the CLI couldn't find a project. Check:

1. Are you in the correct directory?
2. Does `.supabase/config.json` exist in this or any parent directory?
3. Is the JSON valid?

```bash
# Check if config exists
cat .supabase/config.json

# Re-link if needed
supabase-cli projects:link <project-ref>
```

### Wrong Project Detected

If the wrong project is being used:

```bash
# Check which project is detected
supabase-cli projects:get

# Check for parent .supabase directories
find . -name ".supabase" -type d

# Re-link to correct project
supabase-cli projects:link <correct-project-ref>
```

### Permission Errors

If you get permission errors creating `.supabase/`:

```bash
# Check directory permissions
ls -la

# Create manually if needed
mkdir .supabase
chmod 755 .supabase
```

## Examples

### Single Project Workflow

```bash
# Initial setup
cd my-project
supabase-cli projects:link abcdefghij1234567890

# Now work normally
supabase-cli projects:get
supabase-cli db:query "SELECT version()"
supabase-cli functions:list
```

### Multi-Environment Workflow

```bash
# Development project
cd ~/projects/my-app
supabase-cli projects:link dev-project-ref

# Use staging project temporarily
supabase-cli backup:list --project staging-project-ref

# Back to dev project (auto-detected)
supabase-cli projects:get
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
jobs:
  deploy:
    steps:
      - uses: actions/checkout@v2

      # Option 1: Use project context (if .supabase is committed)
      - name: Deploy functions
        run: supabase-cli functions:deploy my-function
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_TOKEN }}

      # Option 2: Use environment variable (if .supabase is ignored)
      - name: Deploy functions
        run: supabase-cli functions:deploy my-function
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_TOKEN }}
          SUPABASE_PROJECT_REF: ${{ secrets.SUPABASE_PROJECT_REF }}
```

## Related Documentation

- [Getting Started Guide](getting-started.md)
- [Configuration Guide](../commands/config.md)
- [Project Management](../commands/projects.md)
- [Automation Guide](automation.md)
