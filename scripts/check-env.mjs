import { existsSync, readFileSync } from "node:fs";

function loadDotEnv() {
  if (!existsSync(".env")) {
    return;
  }

  const lines = readFileSync(".env", "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");

    process.env[key.trim()] ??= value;
  }
}

loadDotEnv();

const requiredGroups = [
  ["DATABASE_URL"],
  ["PGHOST", "PGDATABASE", "PGUSER", "PGPASSWORD"]
];

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const hasPgParts = requiredGroups[1].every((key) => Boolean(process.env[key]));

if (!hasDatabaseUrl && !hasPgParts) {
  console.error("Missing PostgreSQL connection settings.");
  console.error("Set DATABASE_URL or set PGHOST, PGDATABASE, PGUSER, and PGPASSWORD.");
  process.exit(1);
}

console.log("PostgreSQL environment looks ready.");
console.log(`Using ${hasDatabaseUrl ? "DATABASE_URL" : "PG* variables"}.`);
