import { prisma } from "@/lib/db";
import { differenceInCalendarDays, addDays } from "date-fns";

const CADENCES: { name: string; targetDays: number; toleranceDays: number }[] = [
  { name: "weekly", targetDays: 7, toleranceDays: 2 },
  { name: "biweekly", targetDays: 14, toleranceDays: 3 },
  { name: "monthly", targetDays: 30, toleranceDays: 5 },
  { name: "yearly", targetDays: 365, toleranceDays: 10 },
];

function median(nums: number[]) {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

// Groups outgoing transactions by merchant, looks for a consistent gap between
// occurrences that matches a known cadence, and records/updates a RecurringBill.
export async function detectRecurringBills() {
  const transactions = await prisma.transaction.findMany({
    where: { amount: { gt: 0 }, merchantName: { not: null } },
    orderBy: { date: "asc" },
  });

  const byMerchant = new Map<string, typeof transactions>();
  for (const t of transactions) {
    const key = t.merchantName!;
    const list = byMerchant.get(key) ?? [];
    list.push(t);
    byMerchant.set(key, list);
  }

  const seenKeys = new Set<string>();

  for (const [merchant, txs] of byMerchant) {
    if (txs.length < 3) continue;

    const gaps: number[] = [];
    for (let i = 1; i < txs.length; i++) {
      gaps.push(differenceInCalendarDays(txs[i].date, txs[i - 1].date));
    }
    const gapMedian = median(gaps);

    const cadence = CADENCES.find(
      (c) => Math.abs(gapMedian - c.targetDays) <= c.toleranceDays
    );
    if (!cadence) continue;

    const amounts = txs.map((t) => t.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const amountSpread = Math.max(...amounts) - Math.min(...amounts);
    // Skip if amounts vary wildly - not a reliable recurring bill.
    if (amountSpread > avgAmount * 0.5 + 5) continue;

    const lastTx = txs[txs.length - 1];
    const nextDueDate = addDays(lastTx.date, Math.round(gapMedian));
    const key = `${merchant}::${cadence.name}`;
    seenKeys.add(key);

    await prisma.recurringBill.upsert({
      where: { merchantName_cadence: { merchantName: merchant, cadence: cadence.name } },
      create: {
        merchantName: merchant,
        averageAmount: avgAmount,
        cadence: cadence.name,
        lastDate: lastTx.date,
        nextDueDate,
        category: lastTx.category,
        active: true,
      },
      update: {
        averageAmount: avgAmount,
        lastDate: lastTx.date,
        nextDueDate,
        category: lastTx.category,
        active: true,
      },
    });
  }

  // Deactivate bills that no longer have a matching merchant/cadence pattern.
  const allBills = await prisma.recurringBill.findMany();
  for (const bill of allBills) {
    const key = `${bill.merchantName}::${bill.cadence}`;
    if (!seenKeys.has(key) && bill.active) {
      await prisma.recurringBill.update({
        where: { id: bill.id },
        data: { active: false },
      });
    }
  }
}
