---
name: Express router mount order & unscoped middleware
description: Why an unscoped router.use() in one sub-router can 403 every route mounted after it
---
Rule: In this API, sub-routers are mounted on the v1 router without path prefixes, so `router.use(middleware)` inside any sub-router runs for EVERY request that passes through it — including requests destined for routers mounted later.

**Why:** The merged merchant dashboard added `router.use(requireAuth, requireRole("Merchant"), ...)` unscoped, which 403-blocked all Fan wallet/commerce routes mounted after it.

**How to apply:** Any role-gating middleware in a sub-router must be scoped to its path prefix, e.g. `router.use("/merchant", ...)`. Also: `lib/*` packages use `tsc -b` project references — after schema/type additions, run `npx tsc -b lib/db lib/api-zod` or typecheck reports missing exports from stale `dist/*.d.ts`.
