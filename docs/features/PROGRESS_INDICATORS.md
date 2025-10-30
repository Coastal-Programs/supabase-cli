# Progress Indicators Guide

This guide explains when and how to use progress indicators (spinners vs progress bars) in Supabase CLI commands.

## Overview

The Supabase CLI provides two types of progress indicators:

1. **Spinners** - For indeterminate operations (unknown duration)
2. **Progress Bars** - For operations with measurable progress (known steps)

## When to Use Each

### Use Spinners When:

- Making a single API call
- Unknown operation duration
- Indeterminate progress
- Quick operations (< 5 seconds)
- Simple fetch operations

**Examples:**
```typescript
// Fetching a single resource
const project = await this.spinner(
  'Fetching project...',
  async () => getProject(projectRef),
  'Project fetched successfully'
)

// Single deployment
const result = await this.spinner(
  'Deploying function...',
  async () => deployFunction(projectRef, config)
)
```

### Use Progress Bars When:

- Processing multiple items/files
- Known total number of steps
- Multi-step operations
- Batch processing
- Operations where you can measure progress

**Examples:**
```typescript
// Batch migrations
const results = await this.withProgressBar(
  migrations.length,
  async (update) => {
    const results = []
    for (let i = 0; i < migrations.length; i++) {
      update(i, { task: `Applying ${migrations[i].name}...` })
      const result = await applyMigration(migrations[i])
      results.push(result)
    }
    return results
  }
)

// Multiple file uploads
const progressBar = this.createProgressBar(files.length)
for (let i = 0; i < files.length; i++) {
  progressBar.update(i, { task: `Uploading ${files[i].name}...` })
  await uploadFile(files[i])
}
progressBar.stop()
```

## Implementation Patterns

### Pattern 1: Simple Progress Bar with `withProgressBar`

Best for: Simple iteration with known steps

```typescript
const results = await this.withProgressBar(
  items.length,
  async (update) => {
    const results = []
    for (let i = 0; i < items.length; i++) {
      update(i, { task: `Processing ${items[i].name}...` })
      const result = await processItem(items[i])
      results.push(result)
      update(i + 1, { task: `Completed ${items[i].name}` })
    }
    return results
  }
)
```

### Pattern 2: Manual Progress Bar Control

Best for: Complex operations needing fine-grained control

```typescript
const progressBar = this.createProgressBar(total, 0)

try {
  for (let i = 0; i < items.length; i++) {
    progressBar.update(i, { task: `Step ${i + 1}/${total}` })
    await doWork(items[i])
  }
  progressBar.update(total, { task: 'Complete!' })
} finally {
  progressBar.stop()
}
```

### Pattern 3: Multi-Progress Bar (Parallel Operations)

Best for: Concurrent operations on multiple items

```typescript
const multiBar = this.createMultiBar()
const promises = files.map((file, index) => {
  const bar = multiBar.create(100, 0, { filename: file.name })

  return uploadFileWithProgress(file, (progress) => {
    bar.update(progress)
  })
})

await Promise.all(promises)
multiBar.stop()
```

### Pattern 4: Custom Format String

Best for: Operations with specific status information

```typescript
const progressBar = this.createProgressBar(
  total,
  0,
  '{bar} {percentage}% | {current}/{total} | Status: {status}'
)

for (let i = 0; i < migrations.length; i++) {
  progressBar.update(i + 1, {
    current: i + 1,
    status: `Applying ${migrations[i].name}`,
  })
  await applyMigration(migrations[i])
}

progressBar.stop()
```

## Quiet Mode Handling

All progress indicators automatically respect the `--quiet` flag:

```typescript
// Progress bars are automatically disabled in quiet mode
const results = await this.withProgressBar(
  items.length,
  async (update) => {
    // This works seamlessly - update() is a no-op in quiet mode
    for (let i = 0; i < items.length; i++) {
      update(i, { task: `Processing ${items[i].name}` })
      await process(items[i])
    }
  }
)

// Spinners are also disabled in quiet mode (handled by ora)
const result = await this.spinner('Loading...', async () => {
  return await fetchData()
})
```

## Error Handling

### With `withProgressBar`

Errors are automatically handled and the progress bar is stopped:

```typescript
try {
  const results = await this.withProgressBar(
    items.length,
    async (update) => {
      for (let i = 0; i < items.length; i++) {
        update(i, { task: `Processing ${items[i].name}` })
        await processItem(items[i]) // If this throws, bar auto-stops
      }
    }
  )
} catch (error) {
  this.handleError(error) // Progress bar already stopped
}
```

### With Manual Progress Bar

Always use try-finally to ensure cleanup:

```typescript
const progressBar = this.createProgressBar(total)

try {
  for (let i = 0; i < items.length; i++) {
    progressBar.update(i, { task: `Processing item ${i}` })
    await processItem(items[i])
  }
} catch (error) {
  // Handle error
  throw error
} finally {
  progressBar.stop() // Always stop the bar
}
```

## Format String Variables

Progress bars support these built-in variables:

- `{bar}` - The visual progress bar
- `{percentage}` - Progress percentage (0-100)
- `{value}` - Current value
- `{total}` - Total value
- Custom variables via payload object

### Default Formats

**Single Bar:**
```
{bar} {percentage}% | {value}/{total} | {task}
```

**Multi Bar:**
```
{bar} {percentage}% | {filename}
```

### Custom Format Examples

```typescript
// Migration progress
const bar = this.createProgressBar(
  migrations.length,
  0,
  'Migration: {bar} {current}/{total} - {name}'
)

// File upload
const bar = this.createProgressBar(
  100,
  0,
  'Upload: {bar} {percentage}% - {filename} ({size})'
)

// Time-based progress
const bar = this.createProgressBar(
  steps,
  0,
  '{bar} Step {value}/{total} - ETA: {eta}s'
)
```

## Performance Considerations

### Update Frequency

Don't update progress bars too frequently (causes flicker):

```typescript
// Bad: Updates on every byte
stream.on('data', (chunk) => {
  progressBar.update(currentBytes)
})

// Good: Throttle updates
let lastUpdate = 0
stream.on('data', (chunk) => {
  const now = Date.now()
  if (now - lastUpdate > 100) { // Update max 10x/second
    progressBar.update(currentBytes)
    lastUpdate = now
  }
})
```

### Terminal Width

Progress bars automatically adapt to terminal width, but be mindful of long custom messages:

```typescript
// Bad: Very long task names
progressBar.update(i, {
  task: 'This is a very long task description that will overflow the terminal width'
})

// Good: Truncate long names
progressBar.update(i, {
  task: longName.length > 50 ? longName.slice(0, 47) + '...' : longName
})
```

## Testing Progress Indicators

### Unit Tests

Mock the progress bar in tests:

```typescript
import { expect } from 'chai'
import sinon from 'sinon'

it('should show progress during batch operation', async () => {
  const updateStub = sinon.stub()

  await command.withProgressBar(
    items.length,
    async (update) => {
      for (let i = 0; i < items.length; i++) {
        update(i, { task: 'Processing' })
      }
    }
  )

  // In quiet mode, update is a no-op
  // Test logic, not UI
})
```

### Integration Tests

Test with `--quiet` flag to skip UI:

```bash
supabase-cli migrations:apply:batch --quiet --yes
```

## Complete Example: Batch Migration Command

```typescript
import { Flags } from '@oclif/core'
import { BaseCommand } from '../../base-command'
import { applyMigration, listMigrations } from '../../supabase'

export default class MigrationsApplyBatch extends BaseCommand {
  static description = 'Apply multiple pending migrations'

  static flags = {
    ...BaseCommand.baseFlags,
    limit: Flags.integer({
      description: 'Max number of migrations to apply',
      default: 10,
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(MigrationsApplyBatch)

    try {
      const projectRef = flags.project || process.env.SUPABASE_PROJECT_REF

      if (!projectRef) {
        this.error('Project reference required')
      }

      // Fetch pending migrations
      const allMigrations = await this.spinner(
        'Fetching migrations...',
        async () => listMigrations(projectRef)
      )

      const pending = allMigrations
        .filter(m => !m.applied_at)
        .slice(0, flags.limit)

      if (pending.length === 0) {
        this.info('No pending migrations')
        return
      }

      if (!flags.quiet) {
        this.header('Apply Migrations')
        this.info(`Found ${pending.length} pending migration(s)`)
      }

      // Apply migrations with progress bar
      const results = await this.withProgressBar(
        pending.length,
        async (update) => {
          const results = []
          for (let i = 0; i < pending.length; i++) {
            update(i, { task: `Applying ${pending[i].name}...` })
            const result = await applyMigration(
              projectRef,
              pending[i].name,
              pending[i].sql
            )
            results.push(result)
            update(i + 1, { task: `Applied ${pending[i].name}` })
          }
          return results
        }
      )

      if (!flags.quiet) {
        this.divider()
        this.success(`Applied ${results.length} migration(s)`)
      }

      this.output(results)
      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }
}
```

## Best Practices Summary

1. **Choose the right indicator**: Spinner for unknown, progress bar for known operations
2. **Respect quiet mode**: All indicators should work with `--quiet` flag
3. **Handle errors properly**: Always stop progress bars in error cases
4. **Update frequency**: Don't update too often (100-200ms minimum)
5. **Clear messages**: Use descriptive task messages
6. **Test both modes**: Test with and without progress indicators
7. **Graceful degradation**: Work in non-TTY environments (CI/CD)
8. **Format appropriately**: Keep format strings concise and readable

## See Also

- [Base Command API](../src/base-command.ts)
- [Helper Utilities](../src/helper.ts)
- [cli-progress Documentation](https://www.npmjs.com/package/cli-progress)
