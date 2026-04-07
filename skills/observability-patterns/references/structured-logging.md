# Structured Logging Standards

## Required Fields
Every log entry should include:
- `timestamp` — ISO 8601
- `level` — `debug`, `info`, `warn`, `error`, `fatal`
- `message` — human-readable description
- `service` — service name
- `correlationId` / `requestId` — trace across services

## Level Usage
- `debug`: Internal state useful during development. Disabled in production.
- `info`: Request lifecycle events (received, completed), business events (user created, payment processed).
- `warn`: Recoverable issues (retry succeeded, fallback used, deprecated API called).
- `error`: Unrecoverable request-level failures (unhandled exception, external service down after retries).
- `fatal`: Process-level failures requiring restart.

## Anti-patterns
- `console.log` / `print` instead of structured logger
- Logging PII (emails, passwords, tokens, SSNs)
- Logging full request/response bodies (use summary fields)
- Missing correlation ID on async operations
- Catch-and-log without re-throwing or returning error
