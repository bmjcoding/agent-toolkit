---
description: "Logging standards: always use the language's proper logging facility, never raw print/console.log statements."
applyTo: "**/*.{py,ts,tsx,js,jsx,go,rb,java}"
---
Never use print/console.log/println/etc. Always use the language's proper logging facility (e.g., Python `logging`, JS/TS structured logger, Go `slog`, Rust `tracing`).
