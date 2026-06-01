import { Pool, type PoolConfig } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var postgresPool: Pool | undefined;
}

function shouldUseSsl() {
  return process.env.PGSSLMODE === "require" || process.env.DATABASE_URL?.includes("sslmode=require");
}

function getPoolConfig(): PoolConfig {
  const ssl = shouldUseSsl() ? { rejectUnauthorized: false } : undefined;

  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000
    };
  }

  return {
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000
  };
}

export function getPool() {
  if (!globalThis.postgresPool) {
    globalThis.postgresPool = new Pool(getPoolConfig());
  }

  return globalThis.postgresPool;
}
