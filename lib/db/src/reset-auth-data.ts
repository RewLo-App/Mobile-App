import pg from "pg";

const { Pool } = pg;
const schemaName = "public";
const userTableName = "users";

type Table = {
  schema: string;
  name: string;
  oid: string;
};

type ForeignKey = {
  parentOid: string;
  childOid: string;
};

function quoteIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function qualifiedName(table: Pick<Table, "schema" | "name">) {
  return `${quoteIdentifier(table.schema)}.${quoteIdentifier(table.name)}`;
}

function requireDestructiveResetGuards() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to reset database data while NODE_ENV=production.");
  }

  if (process.env.ALLOW_DESTRUCTIVE_DB_RESET !== "true") {
    throw new Error(
      "Refusing destructive reset. Set ALLOW_DESTRUCTIVE_DB_RESET=true explicitly.",
    );
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set before resetting database data.");
  }
}

/**
 * Produces a child-before-parent deletion order for every table that has a
 * foreign-key path to users. A cycle is rejected rather than silently relying
 * on constraint timing that may differ between environments.
 */
function deletionOrder(tables: Table[], foreignKeys: ForeignKey[], rootOid: string) {
  const byOid = new Map(tables.map((table) => [table.oid, table]));
  const childrenByParent = new Map<string, string[]>();
  for (const key of foreignKeys) {
    if (!byOid.has(key.parentOid) || !byOid.has(key.childOid)) continue;
    childrenByParent.set(key.parentOid, [
      ...(childrenByParent.get(key.parentOid) ?? []),
      key.childOid,
    ]);
  }

  const visited = new Set<string>();
  const visiting = new Set<string>();
  const result: Table[] = [];
  const visit = (oid: string) => {
    if (visited.has(oid)) return;
    if (visiting.has(oid)) {
      throw new Error("Cannot safely reset user data: a foreign-key cycle was detected.");
    }
    visiting.add(oid);
    for (const childOid of childrenByParent.get(oid) ?? []) visit(childOid);
    visiting.delete(oid);
    visited.add(oid);
    const table = byOid.get(oid);
    if (table) result.push(table);
  };

  visit(rootOid);
  return result;
}

async function resetAuthData() {
  requireDestructiveResetGuards();
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      // Prevent two reset commands from interleaving while the data is being cleared.
      await client.query("SELECT pg_advisory_xact_lock(hashtext('rewlo:reset-auth-data'))");

      const rootResult = await client.query<Table>(
        `SELECT c.oid::text AS oid, n.nspname AS schema, c.relname AS name
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind IN ('r', 'p')`,
        [schemaName, userTableName],
      );
      const root = rootResult.rows[0];
      if (!root) {
        throw new Error(`Expected ${schemaName}.${userTableName} table was not found.`);
      }

      // UNION (rather than UNION ALL) makes this safe if the schema has more
      // than one FK path from a descendant back to the users tree.
      const tableResult = await client.query<Table>(
        `WITH RECURSIVE related(oid) AS (
           SELECT $1::oid
           UNION
           SELECT fk.conrelid
           FROM pg_constraint fk
           JOIN related parent ON parent.oid = fk.confrelid
           WHERE fk.contype = 'f'
         )
         SELECT c.oid::text AS oid, n.nspname AS schema, c.relname AS name
         FROM related r
         JOIN pg_class c ON c.oid = r.oid
         JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE c.relkind IN ('r', 'p')`,
        [root.oid],
      );
      const tables = tableResult.rows;
      const oids = tables.map((table) => table.oid);
      const foreignKeyResult = await client.query<ForeignKey>(
        `SELECT con.confrelid::text AS "parentOid", con.conrelid::text AS "childOid"
         FROM pg_constraint con
         WHERE con.contype = 'f'
           AND con.confrelid = ANY($1::oid[])
           AND con.conrelid = ANY($1::oid[])`,
        [oids],
      );
      const orderedTables = deletionOrder(tables, foreignKeyResult.rows, root.oid);

      for (const table of orderedTables) {
        await client.query(`DELETE FROM ${qualifiedName(table)}`);
      }

      // Reset only sequences owned by columns in cleared tables; sequences for
      // roles, offers, categories, merchants, and other reference data remain unchanged.
      const sequenceResult = await client.query<{ sequenceName: string }>(
        `SELECT DISTINCT pg_get_serial_sequence(format('%I.%I', n.nspname, c.relname), a.attname) AS "sequenceName"
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
         JOIN pg_attribute a ON a.attrelid = c.oid
         WHERE c.oid = ANY($1::oid[])
           AND a.attnum > 0
           AND NOT a.attisdropped
           AND pg_get_serial_sequence(format('%I.%I', n.nspname, c.relname), a.attname) IS NOT NULL`,
        [oids],
      );
      for (const { sequenceName } of sequenceResult.rows) {
        await client.query("SELECT setval($1::regclass, 1, false)", [sequenceName]);
      }

      await client.query("COMMIT");
      console.log("Cleared user-related tables (child first):");
      for (const table of orderedTables) console.log(`- ${table.schema}.${table.name}`);
      console.log("Preserved reference/master tables: roles, merchants, offer_categories, offers, app_settings, enums, and static configuration.");
      console.log("Reset owned identity sequences for cleared tables.");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

resetAuthData().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
