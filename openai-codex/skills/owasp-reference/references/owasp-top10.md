# OWASP Top 10 (2021) — Review Checklist

## A01: Broken Access Control
- Missing auth checks on endpoints/routes
- IDOR: user can access other users' resources by changing IDs
- Missing function-level access control (admin endpoints accessible to regular users)
- CORS misconfiguration allowing unauthorized origins
- **Remediation**: Auth middleware on every protected route. Validate resource ownership server-side.

## A02: Cryptographic Failures
- Sensitive data transmitted over HTTP (not HTTPS)
- Weak hashing (MD5, SHA1 for passwords)
- Hardcoded encryption keys or IVs
- PII/credentials in logs or error responses
- **Remediation**: TLS everywhere. bcrypt/scrypt/argon2 for passwords. Secrets from env vars.

## A03: Injection
- SQL: string concatenation in queries instead of parameterized
- NoSQL: unsanitized user input in MongoDB queries
- Command: user input passed to `exec()`, `child_process`, `os.system()`
- SSTI: user input rendered in server-side templates without escaping
- **Remediation**: Parameterized queries. Input validation at system boundaries. Never pass user input to shell commands.

## A04: Insecure Design
- No rate limiting on auth endpoints
- No account lockout after failed attempts
- Business logic bypasses (e.g., skipping payment step)
- **Remediation**: Threat model during design. Rate limit sensitive endpoints.

## A05: Security Misconfiguration
- Default credentials left in place
- Verbose error messages exposing stack traces in production
- Unnecessary services/ports exposed
- Missing security headers (CSP, X-Frame-Options, HSTS)
- **Remediation**: Harden defaults. Strip debug info in production. Add security headers.

## A06: Vulnerable and Outdated Components
- Known CVEs in dependencies (`npm audit`, `pip audit`)
- Unmaintained packages (no updates in 12+ months)
- **Remediation**: Run `npm audit`/`pip audit`. Update or replace vulnerable deps.

## A07: Identification and Authentication Failures
- Weak password policies (no minimum length/complexity)
- Session tokens in URLs
- Sessions not invalidated on logout
- Missing MFA on sensitive operations
- **Remediation**: Strong password policy. HttpOnly/Secure session cookies. Invalidate on logout.

## A08: Software and Data Integrity Failures
- Deserialization of untrusted data
- Missing integrity checks on CI/CD pipelines
- Auto-update without signature verification
- **Remediation**: Validate serialized data. Sign CI/CD artifacts.

## A09: Security Logging and Monitoring Failures
- Failed auth attempts not logged
- No alerting on suspicious patterns
- Logs missing timestamps, user IDs, or IP addresses
- **Remediation**: Log auth events. Include correlation IDs. Alert on anomalies.

## A10: Server-Side Request Forgery (SSRF)
- User-controlled URLs fetched server-side without validation
- Internal service endpoints accessible via SSRF
- **Remediation**: Allowlist permitted domains. Block internal IP ranges in outbound requests.
