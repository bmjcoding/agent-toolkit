---
paths: ["**/*.py", "**/*.js", "**/*.ts", "**/*.tsx", "**/*.jsx", "**/*.go", "**/*.rs", "**/*.java", "**/*.kt", "**/*.rb"]
lifecycle: stable
---
Never use print/console.log/println/etc. Always use the language's proper logging facility (e.g., Python `logging`, JS/TS structured logger, Go `slog`, Rust `tracing`).
