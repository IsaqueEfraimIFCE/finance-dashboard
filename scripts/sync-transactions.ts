// Syncs Plaid transactions for every linked item. Intended to be run on a
// schedule (e.g. cron/Task Scheduler) so the dashboard stays fresh without
// requiring you to open the app.
// Run with: npm run sync:transactions

import "dotenv/config";
import { syncAllItems } from "../src/lib/sync";

async function main() {
  const results = await syncAllItems();
  console.log(JSON.stringify(results, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
