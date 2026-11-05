import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/format";
import NavBar from "@/components/NavBar";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const session = await getSession();
  const userId = session!.userId;

  const transactions = await prisma.transaction.findMany({
    where: { account: { item: { userId } } },
    orderBy: { date: "desc" },
    take: 200,
    include: { account: true },
  });

  return (
    <>
      <NavBar />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-6 py-8">
        <h1 className="text-2xl font-semibold">Transactions</h1>

        <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-800 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {transactions.map((t) => (
                <tr key={t.id} className={t.pending ? "opacity-50" : ""}>
                  <td className="px-4 py-3 whitespace-nowrap text-neutral-400">
                    {formatDate(t.date)}
                  </td>
                  <td className="px-4 py-3">{t.merchantName ?? t.name}</td>
                  <td className="px-4 py-3 text-neutral-400">{t.account.name}</td>
                  <td className="px-4 py-3 text-neutral-400">{t.category ?? "—"}</td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${
                      t.amount > 0 ? "text-neutral-200" : "text-emerald-400"
                    }`}
                  >
                    {t.amount > 0 ? "-" : "+"}
                    {formatCurrency(Math.abs(t.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <p className="p-6 text-center text-neutral-500">No transactions yet.</p>
          )}
        </div>
      </main>
    </>
  );
}
