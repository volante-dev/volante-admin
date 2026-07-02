import { createHash, randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Client } = pg;
const connectionString = process.env.DATABASE_URL ?? process.env.DATABASE_URL_UNPOOLED;

if (!connectionString) {
  throw new Error("Set DATABASE_URL or DATABASE_URL_UNPOOLED before marking migrations.");
}

const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
const client = new Client({ connectionString });

const checksum = (value) => createHash("sha256").update(value).digest("hex");

await client.connect();

try {
  await client.query(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" VARCHAR(36) PRIMARY KEY NOT NULL,
      "checksum" VARCHAR(64) NOT NULL,
      "finished_at" TIMESTAMPTZ,
      "migration_name" VARCHAR(255) NOT NULL,
      "logs" TEXT,
      "rolled_back_at" TIMESTAMPTZ,
      "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    )
  `);

  const migrationNames = (await readdir(migrationsDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const migrationName of migrationNames) {
    const sql = await readFile(
      path.join(migrationsDir, migrationName, "migration.sql"),
      "utf8",
    );
    const existing = await client.query(
      'SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = $1 LIMIT 1',
      [migrationName],
    );
    if (existing.rowCount) continue;

    await client.query(
      `
        INSERT INTO "_prisma_migrations"
          ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
        VALUES ($1, $2, now(), $3, NULL, NULL, now(), 1)
      `,
      [randomUUID(), checksum(sql), migrationName],
    );
  }

  console.log(`Marked ${migrationNames.length} historical migrations as applied.`);
} finally {
  await client.end();
}
