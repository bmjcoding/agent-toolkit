# Logging Rules

Tool-agnostic directives for logging across all supported languages.

> Claude Code specialization: `claude-code/rules/logging/logging.md`

## Rules

Never use print/console.log/println/etc. Always use the language's proper logging facility (e.g., Python `logging`, JS/TS structured logger, Go `slog`, Rust `tracing`).
