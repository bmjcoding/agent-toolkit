# STRIDE Threat Modeling Reference

For each new feature/endpoint, assess all 6 threat categories:

## S — Spoofing (Identity)
Can an attacker pretend to be someone else?
- Missing authentication on endpoints
- Weak token validation (no expiry, no signature check)
- Session fixation

## T — Tampering (Data Integrity)
Can an attacker modify data they shouldn't?
- Missing input validation
- Client-side-only validation (no server-side check)
- Unsigned/unencrypted data in transit

## R — Repudiation (Accountability)
Can an attacker deny their actions?
- Missing audit logs for sensitive operations
- No correlation between user identity and logged actions
- Mutable logs

## I — Information Disclosure
Can an attacker access data they shouldn't see?
- Verbose error messages with stack traces
- PII in logs or API responses
- Directory listing enabled
- Sensitive data in URL parameters

## D — Denial of Service
Can an attacker degrade availability?
- No rate limiting
- Unbounded queries (missing pagination limits)
- Resource-intensive operations without throttling
- Missing timeouts on external calls

## E — Elevation of Privilege
Can an attacker gain higher access?
- Missing role checks on admin endpoints
- Privilege escalation via parameter manipulation
- JWT claims not validated server-side
