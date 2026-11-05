import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/format";
import NavBar from "@/components/NavBar";
import SyncButton from "@/components/SyncButton";
import SpendByCategoryChart from "@/components/SpendByCategoryChart";
import Link from "next/link";
import { startOfMonth } from "date-fns";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const session = await getSession();
  const userId = session!.userId;

  const accounts = await prisma.account.findMany({
    where: { item: { userId } },
  });

  const monthStart = startOfMonth(new Date());

  const monthTransactions = await prisma.transaction.findMany({
    where: {
      account: { item: { userId } },
      date: { gte: monthStart },
      pending: false,
    },
  });

  const totalBalance = accounts.reduce((sum, a) => sum + (a.currentBalance ?? 0), 0);
  const spendThisMonth = monthTransactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const incomeThisMonth = monthTransactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + -t.amount, 0);

  const byCategory = new Map<string, number>();
  for (const t of monthTransactions) {
    if (t.amount <= 0) continue;
    const key = t.category ?? "Uncategorized";
    byCategory.set(key, (byCategory.get(key) ?? 0) + t.amount);
  }
  const categoryData = [...byCategory.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  const upcomingBills = await prisma.recurringBill.findMany({
    where: { active: true },
    orderBy: { nextDueDate: "asc" },
    take: 5,
  });

  const recentTransactions = await prisma.transaction.findMany({
    where: { account: { item: { userId } } },
    orderBy: { date: "desc" },
    take: 8,
  });

  return (
    <>
      <NavBar />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Overview</h1>
          <SyncButton />
        </div>

        {accounts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-700 p-10 text-center">
            <p className="mb-4 text-neutral-400">
              No accounts linked yet. Link a bank account to start tracking your spending.
            </p>
            <Link
              href="/accounts"
              className="inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Go to Accounts
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <SummaryCard label="Total balance" value={formatCurrency(totalBalance)} />
              <SummaryCard
                label="Spent this month"
                value={formatCurrency(spendThisMonth)}
                accent="text-red-400"
              />
              <SummaryCard
                label="Income this month"
                value={formatCurrency(incomeThisMonth)}
                accent="text-emerald-400"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                <h2 className="mb-4 text-lg font-medium">Spend by category</h2>
                <SpendByCategoryChart data={categoryData} />
              </section>

              <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-medium">Upcoming bills</h2>
                  <Link href="/bills" className="text-sm text-emerald-400 hover:underline">
                    View all
                  </Link>
                </div>
                {upcomingBills.length === 0 ? (
                  <p className="text-sm text-neutral-500">
                    No recurring bills detected yet. Sync a few months of transactions and
                    they&apos;ll show up here automatically.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {upcomingBills.map((bill) => (
                      <li
                        key={bill.id}
                        className="flex items-center justify-between border-b border-neutral-800 pb-2 last:border-0"
                      >
                        <div>
                          <p className="font-medium">{bill.merchantName}</p>
                          <p className="text-xs text-neutral-500">
                            Due {formatDate(bill.nextDueDate)} &middot; {bill.cadence}
                          </p>
                        </div>
                        <span className="font-medium text-neutral-200">
                          {formatCurrency(bill.averageAmount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium">Recent transactions</h2>
                <Link href="/transactions" className="text-sm text-emerald-400 hover:underline">
                  View all
                </Link>
              </div>
              <ul className="divide-y divide-neutral-800">
                {recentTransactions.map((t) => (
                  <li key={t.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">{t.merchantName ?? t.name}</p>
                      <p className="text-xs text-neutral-500">
                        {formatDate(t.date)} &middot; {t.category ?? "Uncategorized"}
                      </p>
                    </div>
                    <span className={t.amount > 0 ? "text-neutral-200" : "text-emerald-400"}>
                      {t.amount > 0 ? "-" : "+"}
                      {formatCurrency(Math.abs(t.amount))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>
    </>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${accent ?? ""}`}>{value}</p>
    </div>
  );
}
