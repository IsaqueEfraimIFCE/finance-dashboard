import { NextResponse } from "next/server";
import { pluggyClient } from "@/lib/pluggy";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const { accessToken } = await pluggyClient.createConnectToken(undefined, {
      clientUserId: session.userId,
    });

    return NextResponse.json({ connectToken: accessToken });
  } catch (err) {
    console.error("Failed to create connect token", err);
    return NextResponse.json({ error: "Failed to create connect token" }, { status: 500 });
  }
}
