# Contributing to Supabase CLI

Thank you for your interest in contributing to the Supabase CLI! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Assume good faith and positive intent
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- **Node.js** version 22.0.0 or higher
- **npm** (comes with Node.js)
- **Git** for version control
- A **Supabase account** for testing
- At least one **Supabase project** for integration testing

### Development Setup

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/supabase-cli.git
cd supabase-cli
```

3. Install dependencies:

```bash
npm install
```

4. Build the project:

```bash
npm run build
```

5. Run tests:

```bash
npm test
```

6. Set up environment variables:

```bash
cp .env.example .env
# Edit .env and add your SUPABASE_ACCESS_TOKEN
```

### Project Structure

```
supabase-cli/
├── src/                    # Source code
│   ├── commands/          # CLI commands (organized by category)
│   │   ├── projects/
│   │   ├── db/
│   │   ├── config/
│   │   └── ...
│   ├── utils/             # Utility functions
│   │   ├── sql-queries.ts
│   │   ├── formatters.ts
│   │   └── ...
│   ├── base-command.ts    # Base command class
│   ├── base-flags.ts      # Reusable flags
│   ├── supabase.ts        # API client
│   ├── cache.ts           # Cache layer
│   ├── retry.ts           # Retry logic
│   └── errors.ts          # Error definitions
├── test/                  # Test files (mirrors src/)
├── docs/                  # Documentation
│   ├── guides/           # User guides
│   └── api/              # API documentation
├── bin/                   # Executable scripts
└── dist/                  # Compiled output (generated)
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/my-feature
# or
git checkout -b fix/my-bugfix
```

Branch naming conventions:
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `test/description` - Test additions/fixes
- `refactor/description` - Code refactoring
- `chore/description` - Maintenance tasks

### 2. Make Changes

Follow the coding standards (see below) and make your changes.

### 3. Write/Update Tests

Every new feature or bug fix should include tests:

```bash
# Create test file
touch test/commands/category/command.test.ts

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### 4. Lint and Format

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### 5. Build and Test Locally

```bash
# Build
npm run build

# Test the CLI locally
./bin/dev projects:list
./bin/dev db:query "SELECT 1" --project your-ref
```

### 6. Commit Your Changes

Follow the Conventional Commits specification:

```bash
# Feature
git commit -m "feat: add support for new database command"

# Bug fix
git commit -m "fix: resolve authentication timeout issue"

# Documentation
git commit -m "docs: update getting started guide"

# Tests
git commit -m "test: add tests for retry logic"

# Refactoring
git commit -m "refactor: simplify error handling"

# Maintenance
git commit -m "chore: update dependencies"
```

### 7. Push and Create Pull Request

```bash
git push origin feature/my-feature
```

Then create a pull request on GitHub.

## Adding a New Command

### Step 1: Create Command File

Create a file in the appropriate category:

```bash
touch src/commands/category/command-name.ts
```

### Step 2: Implement Command

```typescript
import { Flags } from '@oclif/core'
import { BaseCommand } from '../../base-command'
import { OutputFormatFlags, AutomationFlags } from '../../base-flags'

export default class MyCommand extends BaseCommand {
  static description = 'Description of what this command does'

  static examples = [
    '<%= config.bin %> <%= command.id %> --project my-ref',
    '<%= config.bin %> <%= command.id %> --project my-ref --format table',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    ...OutputFormatFlags,
    ...AutomationFlags,
    // Add custom flags here
    myFlag: Flags.string({
      description: 'My custom flag',
      required: false,
    }),
  }

  static args = [
    {
      name: 'arg1',
      description: 'First argument',
      required: false,
    },
  ]

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MyCommand)

    try {
      this.header('My Command')

      // Your implementation here
      const data = await this.fetchData()

      // Output result
      this.output(data)
      this.success('Command completed successfully')

      process.exit(0)
    } catch (error) {
      this.handleError(error)
    }
  }

  private async fetchData() {
    // Implementation
    return {}
  }
}
```

### Step 3: Add Tests

Create test file:

```bash
touch test/commands/category/command-name.test.ts
```

Write tests:

```typescript
import { expect } from 'chai'
import MyCommand from '../../../src/commands/category/command-name'

describe('category:command-name', () => {
  it('should run successfully', async () => {
    // Test implementation
  })

  it('should handle errors', async () => {
    // Test error handling
  })

  it('should format output correctly', async () => {
    // Test output formatting
  })
})
```

### Step 4: Update Documentation

1. Add command to README.md
2. Run `npm run readme` to update command list
3. Update relevant guides in `docs/guides/`

### Step 5: Test Thoroughly

```bash
# Run tests
npm test

# Test command locally
./bin/dev category:command-name --help
./bin/dev category:command-name --project your-ref

# Test different output formats
./bin/dev category:command-name --format json
./bin/dev category:command-name --format table
./bin/dev category:command-name --format yaml
```

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Provide explicit return types for functions
- Use interfaces for object types
- Avoid `any` type (use `unknown` if necessary)

### Code Style

- **Indentation**: 2 spaces
- **Quotes**: Single quotes
- **Semicolons**: No semicolons
- **Trailing commas**: Use trailing commas
- **Line length**: Max 100 characters (flexible)
- **Naming**:
  - `camelCase` for variables and functions
  - `PascalCase` for classes and interfaces
  - `UPPER_CASE` for constants
  - Prefix private members with underscore

### Example

```typescript
interface UserData {
  id: string
  email: string
  name: string
}

class UserService {
  private _apiClient: ApiClient

  constructor(apiClient: ApiClient) {
    this._apiClient = apiClient
  }

  async getUser(userId: string): Promise<UserData> {
    const response = await this._apiClient.get(`/users/${userId}`)
    return response.data
  }
}
```

### Documentation

- Add JSDoc comments for public APIs
- Include parameter descriptions
- Include return type descriptions
- Add examples where helpful

```typescript
/**
 * Fetches user data from the API
 * @param userId - The unique identifier for the user
 * @returns Promise resolving to user data
 * @throws {SupabaseError} When user is not found or API fails
 * @example
 * const user = await fetchUser('user-123')
 * console.log(user.email)
 */
async function fetchUser(userId: string): Promise<UserData> {
  // Implementation
}
```

## Writing Tests

### Test Structure

```typescript
import { expect } from 'chai'
import { describe, it, beforeEach, afterEach } from 'mocha'

describe('MyClass', () => {
  let instance: MyClass

  beforeEach(() => {
    // Setup before each test
    instance = new MyClass()
  })

  afterEach(() => {
    // Cleanup after each test
  })

  describe('myMethod', () => {
    it('should return expected value', () => {
      const result = instance.myMethod()
      expect(result).to.equal('expected')
    })

    it('should handle errors', () => {
      expect(() => instance.myMethod()).to.throw()
    })
  })
})
```

### Test Coverage

- Aim for >80% code coverage
- Test happy paths
- Test error scenarios
- Test edge cases
- Test flag variations
- Test output formats

### Running Tests

```bash
# All tests
npm test

# Specific test file
npm test test/commands/projects/list.test.ts

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage

# Performance tests
npm run test:performance
```

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] All tests pass (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] Documentation updated
- [ ] CHANGELOG.md updated (for significant changes)
- [ ] Commit messages follow conventions

### PR Title Format

Use conventional commit format:

- `feat: add new database command`
- `fix: resolve cache invalidation issue`
- `docs: update contributing guide`
- `test: add integration tests`

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested the changes

## Checklist
- [ ] Tests pass
- [ ] Linting passes
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
```

### Review Process

1. A maintainer will review your PR
2. Address any feedback or requested changes
3. Once approved, a maintainer will merge your PR
4. Your contribution will be included in the next release

## Performance Guidelines

### Startup Time

- Keep startup time <2s
- Lazy load modules when possible
- Minimize dependencies

### Command Execution

- Target <2s for most commands
- Use caching for repeated operations
- Implement request deduplication

### Memory Usage

- Keep peak memory <200MB
- Clean up resources properly
- Use streaming for large datasets

## Security Guidelines

### Input Validation

- Validate all user input
- Sanitize SQL queries
- Validate CIDR blocks
- Check file paths

### Error Messages

- Don't expose sensitive information
- Mask API keys and tokens
- Sanitize error messages

### Dependencies

- Keep dependencies up to date
- Audit dependencies regularly
- Minimize dependency count

## Documentation

### User-Facing Documentation

Update when adding/changing features:

- README.md - Command list and examples
- docs/guides/ - User guides
- Command help text (`--help`)

### Developer Documentation

Update when changing architecture:

- CLAUDE.md - Developer guide
- Architecture diagrams
- API documentation

### Examples

Provide working examples for:
- New commands
- New features
- Complex workflows

## Getting Help

### Resources

- [CLAUDE.md](CLAUDE.md) - Developer guide
- [README.md](README.md) - Project overview
- [docs/guides/](docs/guides/) - User guides
- Existing code - Look at similar implementations

### Asking Questions

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - Questions and discussions
- **Pull Request Comments** - Code-specific questions

## Release Process

(For maintainers)

1. Update version in package.json
2. Update CHANGELOG.md
3. Run `npm run build`
4. Run `npm test`
5. Commit changes
6. Create git tag: `git tag v0.x.x`
7. Push: `git push && git push --tags`
8. Publish: `npm publish`
9. Create GitHub release

## Recognition

Contributors are recognized in:

- CHANGELOG.md (for each release)
- GitHub contributors page
- Release notes

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Supabase CLI! Your efforts help make this tool better for everyone.

For questions or help, please:
- Open an issue: https://github.com/coastal-programs/supabase-cli/issues
- Start a discussion: https://github.com/coastal-programs/supabase-cli/discussions
- Check the docs: [docs/](docs/)
