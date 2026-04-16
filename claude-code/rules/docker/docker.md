---
paths: ["**/Dockerfile*", "**/docker-compose*.yml", "**/docker-compose*.yaml", "**/.dockerignore"]
lifecycle: stable
---
- Frontend and backend are always separate containers.
- Multi-layer builds, slim/alpine base images.
