import { pluggyClient } from "@/lib/pluggy";
import { prisma } from "@/lib/db";
import { detectRecurringBills } from "@/lib/recurring";

// Triggers a fresh update on the Item, waits for it to finish, then pulls
// every account + transaction and upserts them locally.
async function syncItem(item: { id: string; pluggyItemId: string }) {
  let added = 0;
  let modified = 0;

  await pluggyClient.updateItem(item.pluggyItemId).catch(() => null);

  let pluggyItem = await pluggyClient.fetchItem(item.pluggyItemId);
  for (let attempt = 0; attempt < 15; attempt++) {
    if (pluggyItem.status !== "UPDATING") break;
    await new Promise((r) => setTimeout(r, 2000));
    pluggyItem = await pluggyClient.fetchItem(item.pluggyItemId);
  }

  if (pluggyItem.status === "LOGIN_ERROR") {
    await prisma.item.update({ where: { id: item.id }, data: { status: "reauth_required" } });
    return { added, modified };
  }

  const accountsResp = await pluggyClient.fetchAccounts(item.pluggyItemId);

  for (const a of accountsResp.results) {
    const account = await prisma.account.upsert({
      where: { pluggyAccountId: a.id },
      create: {
        itemId: item.id,
        pluggyAccountId: a.id,
        name: a.name,
        officialName: a.marketingName ?? null,
        mask: a.number ? a.number.slice(-4) : null,
        type: a.type,
        subtype: a.subtype,
        currentBalance: a.balance ?? null,
        availableBalance: a.bankData?.closingBalance ?? null,
        isoCurrencyCode: a.currencyCode ?? "BRL",
      },
      update: {
        currentBalance: a.balance ?? null,
        availableBalance: a.bankData?.closingBalance ?? null,
      },
    });

    const transactions = await pluggyClient.fetchAllTransactions(a.id);

    for (const t of transactions) {
      // Internal convention: positive = money out, negative = money in.
      const amount = t.type === "DEBIT" ? Math.abs(t.amount) : -Math.abs(t.amount);

      const existing = await prisma.transaction.findUnique({
        where: { pluggyTransactionId: t.id },
      });

      await prisma.transaction.upsert({
        where: { pluggyTransactionId: t.id },
        create: {
          accountId: account.id,
          pluggyTransactionId: t.id,
          amount,
          isoCurrencyCode: t.currencyCode ?? "BRL",
          date: new Date(t.date),
          name: t.description,
          merchantName: t.merchant?.name ?? t.description,
          category: t.category ?? null,
          pending: t.status === "PENDING",
        },
        update: {
          amount,
          date: new Date(t.date),
          name: t.description,
          merchantName: t.merchant?.name ?? t.description,
          category: t.category ?? null,
          pending: t.status === "PENDING",
        },
      });

      if (existing) modified++;
      else added++;
    }
  }

  await prisma.item.update({
    where: { id: item.id },
    data: { status: "active" },
  });

  return { added, modified };
}

export async function syncAllItems() {
  const items = await prisma.item.findMany();
  const results = [];

  for (const item of items) {
    try {
      const result = await syncItem(item);
      results.push({ itemId: item.id, ...result });
    } catch (err) {
      console.error(`Sync failed for item ${item.id}`, err);
      await prisma.item.update({
        where: { id: item.id },
        data: { status: "error" },
      });
      results.push({ itemId: item.id, error: true });
    }
  }

  await detectRecurringBills();

  return results;
}
