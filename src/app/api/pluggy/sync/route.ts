import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { syncAllItems } from "@/lib/sync";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const results = await syncAllItems();
  return NextResponse.json({ ok: true, results });
}
