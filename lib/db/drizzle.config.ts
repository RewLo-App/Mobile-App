import { defineConfig } from "drizzle-kit";

export default defineConfig({
  // Keep this as a relative glob: drizzle-kit does not reliably discover an
  // absolute Windows path produced by path.join().
  schema: "./src/schema/*.ts",
  dialect: "postgresql",
  dbCredentials: {
    // `generate` is schema-only and must work without a database connection.
    // Drizzle validates this value when a connection-requiring command runs.
    url: process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
});
