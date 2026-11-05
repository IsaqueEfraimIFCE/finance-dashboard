"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const PluggyConnect = dynamic(
  () => import("react-pluggy-connect").then((mod) => mod.PluggyConnect),
  { ssr: false }
);

export default function PluggyConnectButton() {
  const router = useRouter();
  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const startConnect = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pluggy/create-connect-token", { method: "POST" });
      const data = await res.json();
      setConnectToken(data.connectToken ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  const onSuccess = useCallback(
    async (itemData: { item: { id: string } }) => {
      setConnectToken(null);
      setLoading(true);
      try {
        await fetch("/api/pluggy/item-connected", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId: itemData.item.id }),
        });
        await fetch("/api/pluggy/sync", { method: "POST" });
        router.refresh();
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  return (
    <>
      <button
        onClick={startConnect}
        disabled={loading}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {loading ? "Linking..." : "+ Link a bank account"}
      </button>
      {connectToken && (
        <PluggyConnect
          connectToken={connectToken}
          includeSandbox={process.env.NODE_ENV !== "production"}
          onSuccess={onSuccess}
          onClose={() => setConnectToken(null)}
        />
      )}
    </>
  );
}
