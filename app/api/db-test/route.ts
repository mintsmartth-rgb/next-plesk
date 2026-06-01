import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown database error";
}

export async function GET() {
  const startedAt = Date.now();

  try {
    const result = await getPool().query<{
      now: string;
      database_name: string;
      user_name: string;
      server_address: string | null;
      server_port: number | null;
      postgres_version: string;
    }>(`
      select
        now()::text as now,
        current_database() as database_name,
        current_user as user_name,
        inet_server_addr()::text as server_address,
        inet_server_port() as server_port,
        version() as postgres_version
    `);

    return NextResponse.json({
      ok: true,
      latencyMs: Date.now() - startedAt,
      connection: result.rows[0]
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        latencyMs: Date.now() - startedAt,
        error: getErrorMessage(error)
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  const startedAt = Date.now();
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("begin");
    await client.query(`
      create table if not exists plesk_connection_tests (
        id bigserial primary key,
        message text not null,
        created_at timestamptz not null default now()
      )
    `);

    const insertResult = await client.query<{
      id: string;
      message: string;
      created_at: string;
    }>(
      "insert into plesk_connection_tests (message) values ($1) returning id, message, created_at::text",
      [`Next.js write test from ${new Date().toISOString()}`]
    );

    const countResult = await client.query<{ total: string }>("select count(*)::text as total from plesk_connection_tests");

    await client.query("commit");

    return NextResponse.json({
      ok: true,
      latencyMs: Date.now() - startedAt,
      inserted: insertResult.rows[0],
      totalRows: Number(countResult.rows[0].total)
    });
  } catch (error) {
    await client.query("rollback");

    return NextResponse.json(
      {
        ok: false,
        latencyMs: Date.now() - startedAt,
        error: getErrorMessage(error)
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
