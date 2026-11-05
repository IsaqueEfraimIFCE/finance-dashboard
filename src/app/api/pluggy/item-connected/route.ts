import { NextRequest, NextResponse } from "next/server";
import { pluggyClient } from "@/lib/pluggy";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const pluggyItemId = body?.itemId;
  if (typeof pluggyItemId !== "string") {
    return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
  }

  try {
    const existing = await prisma.item.findUnique({ where: { pluggyItemId } });
    if (existing) {
      return NextResponse.json({ ok: true, itemId: existing.id });
    }

    const pluggyItem = await pluggyClient.fetchItem(pluggyItemId);
    const accountsResp = await pluggyClient.fetchAccounts(pluggyItemId);

    const item = await prisma.item.create({
      data: {
        userId: session.userId,
        pluggyItemId,
        institutionName: pluggyItem.connector?.name ?? null,
        accounts: {
          create: accountsResp.results.map((a) => ({
            pluggyAccountId: a.id,
            name: a.name,
            officialName: a.marketingName ?? null,
            mask: a.number ? a.number.slice(-4) : null,
            type: a.type,
            subtype: a.subtype,
            currentBalance: a.balance ?? null,
            availableBalance: a.bankData?.closingBalance ?? null,
            isoCurrencyCode: a.currencyCode ?? "BRL",
          })),
        },
      },
    });

    return NextResponse.json({ ok: true, itemId: item.id });
  } catch (err) {
    console.error("Failed to save connected item", err);
    return NextResponse.json({ error: "Failed to link account" }, { status: 500 });
  }
}
