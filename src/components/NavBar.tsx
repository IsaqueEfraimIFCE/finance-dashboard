"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/transactions", label: "Transactions" },
  { href: "/bills", label: "Bills" },
  { href: "/accounts", label: "Accounts" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <span className="text-lg font-semibold text-emerald-400">Finance Dashboard</span>
        <div className="flex items-center gap-6">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm transition ${
                pathname === l.href
                  ? "text-emerald-400"
                  : "text-neutral-400 hover:text-neutral-100"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={logout}
            className="text-sm text-neutral-400 transition hover:text-red-400"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
