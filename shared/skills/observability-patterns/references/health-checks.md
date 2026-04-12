# Health Check Conventions

## Endpoint
`GET /health` or `GET /healthz` — unauthenticated, returns 200 on healthy, 503 on degraded.

## Meaningful vs Trivial
Bad: `return 200 OK` (always passes, useless)
Good: Check actual dependencies:
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "up", "latency_ms": 12 },
    "cache": { "status": "up", "latency_ms": 2 },
    "external_api": { "status": "degraded", "latency_ms": 1500 }
  }
}
```

## Liveness vs Readiness
- **Liveness** (`/health/live`): Is the process running? Restarts on failure.
- **Readiness** (`/health/ready`): Can it serve traffic? Removes from load balancer on failure.

## Timeouts
Health check should complete in <5s. Use shorter timeouts for dependency checks than for normal requests.
