---
name: API base path v1
description: Server mounts routes at /api/v1; client codegen base URL must match.
---
The Express backend mounts its router only at `/api/v1` (no `/api` alias). The OpenAPI-generated mobile client gets its prefix from the Orval `baseUrl` option in `lib/api-spec/orval.config.ts`, not from the spec's `servers:` entry.

**Why:** A teammate's merge versioned the API to /api/v1 while codegen still emitted /api/... paths, so every auth call 404'd and sign-up failed with a generic error.

**How to apply:** If API route prefixes change, update Orval's `baseUrl` and rerun codegen; verify with a curl to the live route through the proxy (localhost:80).
