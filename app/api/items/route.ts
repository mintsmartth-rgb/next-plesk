import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ItemRow = {
  id: string;
  message: string;
  created_at: string;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown database error";
}

async function ensureItemsTable() {
  await getPool().query(`
    create table if not exists plesk_connection_tests (
      id bigserial primary key,
      message text not null,
      created_at timestamptz not null default now()
    )
  `);
}

export async function GET() {
  try {
    await ensureItemsTable();

    const result = await getPool().query<ItemRow>(`
      select id::text, message, created_at::text
      from plesk_connection_tests
      order by id desc
      limit 50
    `);

    return NextResponse.json({
      ok: true,
      items: result.rows
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: getErrorMessage(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { message?: unknown };
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json(
        {
          ok: false,
          error: "Message is required"
        },
        { status: 400 }
      );
    }

    await ensureItemsTable();

    const result = await getPool().query<ItemRow>(
      `
        insert into plesk_connection_tests (message)
        values ($1)
        returning id::text, message, created_at::text
      `,
      [message]
    );

    return NextResponse.json({
      ok: true,
      item: result.rows[0]
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: getErrorMessage(error)
      },
      { status: 500 }
    );
  }
}
