import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ItemRow = {
  id: string;
  message: string;
  created_at: string;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown database error";
}

function parseId(id: string) {
  const value = Number(id);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const itemId = parseId(id);

    if (!itemId) {
      return NextResponse.json({ ok: false, error: "Invalid item id" }, { status: 400 });
    }

    const body = (await request.json()) as { message?: unknown };
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json({ ok: false, error: "Message is required" }, { status: 400 });
    }

    const result = await getPool().query<ItemRow>(
      `
        update plesk_connection_tests
        set message = $1
        where id = $2
        returning id::text, message, created_at::text
      `,
      [message, itemId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ ok: false, error: "Item not found" }, { status: 404 });
    }

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

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const itemId = parseId(id);

    if (!itemId) {
      return NextResponse.json({ ok: false, error: "Invalid item id" }, { status: 400 });
    }

    const result = await getPool().query<{ id: string }>(
      "delete from plesk_connection_tests where id = $1 returning id::text",
      [itemId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ ok: false, error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      deletedId: result.rows[0].id
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
