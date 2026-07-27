---
name: Drizzle push constraint-name mismatches
description: Why drizzle-kit push hangs on interactive prompts in this repo and how to resolve.
---

Rule: when `pnpm --filter @workspace/db run push` fails with "Interactive prompts require a TTY" while offering to truncate a table, it is asking to recreate a unique constraint whose DB name doesn't match Drizzle's expected `<table>_<col>_unique` naming (DB has legacy `_key` names or plain unique indexes).

**Why:** the DB predates the current schema files; `--force` does not bypass the truncate-choice prompt, and the shell is non-TTY, so push can never be answered interactively.

**How to apply:** don't truncate. Rename the constraint in SQL (`ALTER TABLE t RENAME CONSTRAINT x_key TO x_unique`), or if it exists as a plain unique index, `DROP INDEX` then `ADD CONSTRAINT` with the expected name, then re-run push until "Changes applied".
