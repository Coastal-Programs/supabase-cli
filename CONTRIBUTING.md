# Contributing to Supabase CLI

Thank you for your interest in contributing to the Supabase CLI! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, inclusive, and professional in all interactions.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/supabase-cli.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/my-feature`

## Development Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format
```

## Project Structure

- `src/` - Source code
  - `commands/` - CLI commands
  - `utils/` - Utility functions
  - Core infrastructure files
- `test/` - Test files
- `docs/` - Documentation
- `bin/` - Executable scripts

## Adding a New Command

1. Create a file in `src/commands/[topic]/[name].ts`
2. Extend `BaseCommand`
3. Add tests in `test/commands/[topic]/[name].test.ts`
4. Update README with new command
5. Run `npm run readme` to update command list

Example:

```typescript
import { BaseCommand } from '../../base-command'

export default class MyCommand extends BaseCommand {
  static description = 'My command description'
  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    // Implementation
  }
}
```

## Writing Tests

- Use `describe()` for test suites
- Use `it()` for individual tests
- Use `beforeEach()` and `afterEach()` for setup/cleanup
- Aim for >80% code coverage
- Test both success and error cases

Example:

```typescript
import { expect } from 'chai'
import { MyClass } from '../src/my-class'

describe('MyClass', () => {
  it('should do something', () => {
    const instance = new MyClass()
    expect(instance.method()).to.equal('expected')
  })
})
```

## Code Style

We use ESLint and Prettier for code formatting:

- 2-space indentation
- Single quotes
- No semicolons
- Trailing commas

Run `npm run lint:fix` to automatically fix style issues.

## Commit Messages

Follow the Conventional Commits specification:

- `feat: add new command`
- `fix: resolve bug in cache`
- `docs: update README`
- `test: add tests for retry logic`
- `refactor: simplify error handling`
- `chore: update dependencies`

## Pull Request Process

1. Update documentation if needed
2. Add tests for new functionality
3. Ensure all tests pass: `npm test`
4. Ensure linting passes: `npm run lint`
5. Update CHANGELOG.md with your changes
6. Submit a pull request with:
   - Clear description of changes
   - Reference to related issues
   - Screenshots (if UI changes)

## Pull Request Checklist

- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] No linting errors
- [ ] Commit messages follow conventions

## Testing Your Changes

Before submitting a pull request:

```bash
# Build the project
npm run build

# Run all tests
npm test

# Run linting
npm run lint

# Test the CLI locally
./bin/dev command
```

## Documentation

- Update README.md for user-facing changes
- Update CLAUDE.md for architecture changes
- Add JSDoc comments for public APIs
- Create examples for new features

## Review Process

1. A maintainer will review your PR
2. Address any feedback
3. Once approved, a maintainer will merge

## Need Help?

- Check [CLAUDE.md](CLAUDE.md) for developer guide
- Look at existing code for examples
- Open an issue for discussion
- Ask questions in pull request comments

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in:
- Release notes
- CHANGELOG.md
- GitHub contributors page

Thank you for contributing!
