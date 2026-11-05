// Runs once when the server starts. Kicks off a background interval that
// periodically pulls new transactions from Pluggy so the dashboard stays
// fresh without requiring the user to manually hit "Sync now" or set up
// external cron. Only runs in the Node.js runtime (not edge/proxy).
const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { syncAllItems } = await import("@/lib/sync");

  const runSync = async () => {
    try {
      await syncAllItems();
    } catch (err) {
      console.error("Background transaction sync failed", err);
    }
  };

  setInterval(runSync, SYNC_INTERVAL_MS);
  void runSync();
}
