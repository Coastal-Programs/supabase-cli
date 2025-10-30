# Architecture Documentation

Technical architecture and design patterns used in the Supabase CLI.

## Overview

The Supabase CLI is built using enterprise-grade patterns and modern architectural principles to ensure reliability, performance, and maintainability.

## Architecture Documents

### [System Overview](overview.md)
High-level system architecture including:
- Command structure and organization
- Core components and their interactions
- Design principles and patterns
- Technology stack

### [GoTrue API Integration](gotrue-integration.md)
Integration with Supabase's GoTrue authentication API:
- Authentication flow
- Token management
- Session handling
- API endpoints and usage

## Key Architectural Patterns

### Base Command Pattern
All commands extend `BaseCommand` for:
- Consistent CLI interface
- Shared utility methods
- Standardized error handling
- Common output formatting

### Response Envelopes
Standardized response format:
```typescript
{
  success: boolean,
  data?: T,
  error?: { message, code, statusCode },
  metadata: { timestamp, duration, cached }
}
```

### Cache Layer
LRU cache with TTL support:
- Configurable cache size and TTL
- Automatic expiration
- Cache invalidation on writes
- Enable/disable via environment

### Retry Logic
Exponential backoff with circuit breaker:
- Configurable max attempts
- Exponential delay multiplier
- Circuit breaker prevents cascading failures
- Automatic retry for transient errors

### Error Hierarchy
Comprehensive error system:
- Base `SupabaseError` class
- Specialized error types (Auth, Validation, NotFound, RateLimit)
- 32+ error codes
- Retryability detection

### Resource Management
Centralized resource tracking:
- Resource registry
- Project context resolution
- Resource navigation
- Dependency tracking

## Component Interaction

```
┌─────────────────┐
│  CLI Commands   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Base Command   │
└────────┬────────┘
         │
         ├──────────────┬──────────────┬──────────────┐
         ▼              ▼              ▼              ▼
    ┌────────┐    ┌─────────┐    ┌─────────┐    ┌────────┐
    │ Cache  │    │  Retry  │    │ Errors  │    │  API   │
    └────────┘    └─────────┘    └─────────┘    └────────┘
```

## Design Principles

1. **Consistency**: All commands follow the same patterns
2. **Reliability**: Comprehensive error handling and retry logic
3. **Performance**: Caching and request deduplication
4. **Maintainability**: Clear separation of concerns
5. **Extensibility**: Easy to add new commands and features

## Technology Stack

- **Framework**: oclif v2/v3
- **Language**: TypeScript (strict mode)
- **Node**: >=22.0.0
- **Testing**: Mocha + Chai
- **API**: Supabase Management API v1

## Related Documentation

- [Development Guides](../development/) - Developer documentation
- [User Guides](../guides/) - User-facing documentation
- [API Reference](../api/) - API documentation

---

**Last Updated**: October 30, 2025
