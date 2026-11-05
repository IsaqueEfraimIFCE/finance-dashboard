import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import NavBar from "@/components/NavBar";
import PluggyConnectButton from "@/components/PluggyConnectButton";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const session = await getSession();
  const userId = session!.userId;

  const items = await prisma.item.findMany({
    where: { userId },
    include: { accounts: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <NavBar />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Accounts</h1>
          <PluggyConnectButton />
        </div>

        {items.length === 0 ? (
          <p className="text-neutral-400">No accounts linked yet.</p>
        ) : (
          <div className="space-y-6">
            {items.map((item) => (
              <section
                key={item.id}
                className="rounded-xl border border-neutral-800 bg-neutral-900 p-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-medium">
                    {item.institutionName ?? "Bank connection"}
                  </h2>
                  <span
                    className={`text-xs rounded-full px-2 py-1 ${
                      item.status === "active"
                        ? "bg-emerald-900/50 text-emerald-400"
                        : "bg-red-900/50 text-red-400"
                    }`}
                  >
                    {item.status === "active" ? "Connected" : "Needs attention"}
                  </span>
                </div>
                <ul className="divide-y divide-neutral-800">
                  {item.accounts.map((a) => (
                    <li key={a.id} className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium">{a.name}</p>
                        <p className="text-xs text-neutral-500">
                          {a.type}
                          {a.subtype ? ` · ${a.subtype}` : ""}
                          {a.mask ? ` · ****${a.mask}` : ""}
                        </p>
                      </div>
                      <span className="font-medium">
                        {a.currentBalance != null ? formatCurrency(a.currentBalance) : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
