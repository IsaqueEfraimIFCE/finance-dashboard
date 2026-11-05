import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const items = await prisma.item.findMany({
    where: { userId: session.userId },
    include: { accounts: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    items: items.map((i) => ({
      id: i.id,
      institutionName: i.institutionName,
      status: i.status,
      accounts: i.accounts.map((a) => ({
        id: a.id,
        name: a.name,
        mask: a.mask,
        type: a.type,
        subtype: a.subtype,
        currentBalance: a.currentBalance,
      })),
    })),
  });
}
