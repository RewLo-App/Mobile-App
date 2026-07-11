---
name: Mobile typecheck baseline
description: Known pre-existing typecheck failure in the Expo mobile app that is NOT a regression.
---

`pnpm --filter @workspace/mobile run typecheck` fails with two errors in `app/(tabs)/_layout.tsx` (line 16) about the `"wallet"` / `"wallet.fill"` SF Symbol not being assignable to `SFSymbols7_0`.

**Why:** The scaffold's native-tabs `Icon sf={...}` uses a symbol name the installed `expo-symbols` types don't recognize. It only affects native iOS builds, not the Expo web preview, and predates the Smart Pay work.

**How to apply:** When typechecking the mobile app, treat these two `_layout.tsx(16,...)` errors as the known baseline. Your own changes are clean only if these are the *only* errors. Don't try to "fix" it as part of unrelated feature work unless the user asks.
