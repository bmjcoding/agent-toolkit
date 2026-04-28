# Common Auth Vulnerability Patterns

## JWT Pitfalls
- `alg: none` accepted (signature bypass)
- Secret key hardcoded or too short
- No expiry (`exp` claim missing)
- Tokens stored in localStorage (XSS accessible) — prefer HttpOnly cookies
- Refresh token rotation not implemented

## Session Management
- Session ID predictable or sequential
- No session invalidation on password change
- Sessions persist after logout (server-side not cleared)
- Missing `Secure`, `HttpOnly`, `SameSite` cookie flags

## OAuth/OIDC
- Redirect URI not strictly validated (open redirect)
- State parameter missing (CSRF on auth flow)
- Token exchange over HTTP
- Insufficient scope validation

## API Key Security
- API keys in query strings (logged in access logs)
- No key rotation mechanism
- Same key for all environments (dev/staging/prod)
- Keys committed to version control
