# Architecture

This document describes the architecture of the Supabase CLI.

## Overview

The Supabase CLI is built using oclif v2/v3 framework and follows enterprise patterns for reliability, performance, and maintainability.

## Core Components

### 1. Cache Layer

**Location**: `src/cache.ts`

LRU (Least Recently Used) cache with TTL (Time To Live) support. Reduces API calls and improves performance.

**Features**:
- Configurable maximum size
- Per-entry TTL support
- Automatic expiration
- Can be disabled globally or per-request

**Usage**:
```typescript
cache.set('key', data, 300000) // Cache for 5 minutes
const data = cache.get('key')  // Retrieve from cache
```

### 2. Retry Logic

**Location**: `src/retry.ts`

Exponential backoff retry mechanism with circuit breaker pattern.

**Features**:
- Configurable max attempts
- Exponential backoff multiplier
- Maximum delay cap
- Circuit breaker to prevent cascading failures
- Automatic retryable error detection

**Circuit Breaker States**:
- **Closed**: Normal operation, all requests allowed
- **Open**: Too many failures, requests blocked
- **Half-Open**: Testing if service recovered

### 3. Response Envelopes

**Location**: `src/envelope.ts`

Consistent response format for all operations.

**Structure**:
```typescript
{
  success: boolean,
  data?: T,
  error?: {
    message: string,
    code: string,
    statusCode: number,
    details?: unknown
  },
  metadata: {
    timestamp: number,
    duration?: number,
    cached?: boolean,
    ...
  }
}
```

### 4. Error Handling

**Location**: `src/errors.ts`

Hierarchical error system with specific error types.

**Error Types**:
- `SupabaseError` - Base error class
- `AuthenticationError` - Authentication failures
- `ValidationError` - Input validation errors
- `NotFoundError` - Resource not found
- `RateLimitError` - Rate limiting
- `ConfigurationError` - Configuration issues

### 5. Base Command

**Location**: `src/base-command.ts`

Abstract base class that all commands extend. Provides common functionality.

**Features**:
- Output formatting
- Error handling
- User interaction (prompts, confirmations)
- Spinners for long operations
- Consistent flag handling

### 6. Helper Utilities

**Location**: `src/helper.ts`

Output formatting and display utilities.

**Features**:
- Multiple output formats (JSON, Table, List, YAML)
- Colored output
- Date/time formatting
- File size formatting
- Duration formatting

## Data Flow

```
User Command
    ↓
oclif Parser
    ↓
Command.run()
    ↓
Check Cache → [Hit] → Return cached data
    ↓ [Miss]
Retry.execute()
    ↓
API Call
    ↓
Response → Cache → Format → Output
    ↓
Success/Error
```

## Command Structure

All commands follow this pattern:

1. Extend `BaseCommand`
2. Define static properties (description, flags, args)
3. Implement `run()` method
4. Use try/catch for error handling
5. Format and output results

## Configuration

Configuration is loaded from:
1. Environment variables (highest priority)
2. Configuration file (`~/.supabase-cli/credentials.json`)
3. Command-line flags
4. Defaults (lowest priority)

## Testing Strategy

- Unit tests for core infrastructure
- Integration tests for API calls (mocked)
- Command tests using oclif test framework
- Coverage target: >80%

## Performance Optimizations

1. **Caching**: Reduce redundant API calls
2. **Retry Logic**: Handle transient failures gracefully
3. **Circuit Breaker**: Prevent cascading failures
4. **Lazy Loading**: Load modules only when needed
5. **Streaming**: Stream large responses when possible

## Security Considerations

1. Credentials stored in user's home directory
2. Environment variables for sensitive data
3. No logging of sensitive information
4. HTTPS for all API calls
5. Token validation before use

## Future Enhancements

- [ ] Request/response logging (debug mode)
- [ ] Rate limit awareness
- [ ] Batch operations
- [ ] Offline mode with sync
- [ ] Plugin system
- [ ] WebSocket support for real-time
- [ ] GraphQL support
