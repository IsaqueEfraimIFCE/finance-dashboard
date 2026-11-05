import { prisma } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";
import NavBar from "@/components/NavBar";

export const dynamic = "force-dynamic";

export default async function BillsPage() {
  const bills = await prisma.recurringBill.findMany({
    where: { active: true },
    orderBy: { nextDueDate: "asc" },
  });

  const monthlyTotal = bills.reduce((sum, b) => {
    const multiplier =
      b.cadence === "weekly" ? 4.33 : b.cadence === "biweekly" ? 2.17 : b.cadence === "yearly" ? 1 / 12 : 1;
    return sum + b.averageAmount * multiplier;
  }, 0);

  return (
    <>
      <NavBar />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Bills</h1>
          <div className="text-right">
            <p className="text-sm text-neutral-500">Estimated monthly total</p>
            <p className="text-xl font-semibold">{formatCurrency(monthlyTotal)}</p>
          </div>
        </div>

        {bills.length === 0 ? (
          <p className="text-neutral-400">
            No recurring bills detected yet. Bills are automatically detected from your
            transaction history after a sync — link an account and give it a few billing
            cycles.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-800 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Merchant</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Cadence</th>
                  <th className="px-4 py-3 font-medium">Next due</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {bills.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3 font-medium">{b.merchantName}</td>
                    <td className="px-4 py-3 text-neutral-400">{b.category ?? "—"}</td>
                    <td className="px-4 py-3 text-neutral-400 capitalize">{b.cadence}</td>
                    <td className="px-4 py-3 text-neutral-400">{formatDate(b.nextDueDate)}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(b.averageAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
