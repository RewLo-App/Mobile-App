# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

## Merchant dashboard

`artifacts/merchant-dashboard` is a separate React/Vite application for merchant users; it is not part of the Expo fan app.

1. Start the API: `pnpm --filter @workspace/api-server run dev`.
2. In another terminal, start the dashboard: `pnpm --filter @workspace/merchant-dashboard run dev`.
3. Open `http://localhost:5174`.

The foundation calls the existing `/api/v1/auth/me` endpoint and permits only a `Merchant`-role JWT. Until a merchant sign-in flow is implemented, use browser DevTools to set a valid access token as `localStorage.rewlo_access_token`. If the API is hosted elsewhere, set `VITE_API_BASE_URL` to its `/api/v1` URL before starting Vite.
