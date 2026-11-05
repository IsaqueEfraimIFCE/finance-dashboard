# Finance Dashboard

A self-hosted personal finance dashboard: link your bank accounts via Pluggy
(Brazilian Open Finance), automatically sync transactions, and see spending,
balances, and upcoming recurring bills in one place.

- **Data**: pulled from Pluggy (Brazilian banks, Pix, credit cards), stored locally in SQLite
- **Auth**: single-user email/password login, session cookie (JWT)
- **Background sync**: the server re-syncs every 6 hours on its own
  (`src/instrumentation.ts`); there's also a manual "Sync now" button

## 1. Get Pluggy API keys

1. Sign up at https://my.pluggy.ai (free sandbox tier, no approval needed)
2. Grab your `Client ID` and `Client Secret` from the dashboard
3. In sandbox, you can link fake test banks — no real bank credentials needed
   to try it out
4. When ready to connect your real Brazilian bank accounts, Pluggy's
   production access uses the same keys (subject to your plan's connector
   coverage)

## 2. Local development

```bash
npm install
cp .env.example .env.local
# fill in AUTH_SECRET (random 32+ char string), PLUGGY_CLIENT_ID, PLUGGY_CLIENT_SECRET
npx prisma migrate dev
SEED_EMAIL=you@example.com SEED_PASSWORD=your-password npm run seed:user
npm run dev
```

Visit http://localhost:3000, sign in, then go to **Accounts** to link a bank.

## 3. Self-hosting with Docker

```bash
cp .env.example .env
# fill in AUTH_SECRET, SEED_EMAIL, SEED_PASSWORD, PLUGGY_CLIENT_ID, PLUGGY_CLIENT_SECRET
docker compose up -d --build
```

This builds the app, runs migrations on startup, seeds your user from
`SEED_EMAIL`/`SEED_PASSWORD`, and persists the SQLite database in the
`finance-data` Docker volume. The app listens on port 3000 — put it behind a
reverse proxy (Caddy, nginx, Traefik) with HTTPS if exposing it beyond your
LAN, since it holds financial data.

To trigger a manual sync from the host:

```bash
docker compose exec app npm run sync:transactions
```

## Project structure

- `src/app` — pages (Overview, Transactions, Bills, Accounts, Login) and API routes
- `src/lib/pluggy.ts` — Pluggy client
- `src/lib/sync.ts` — triggers an item update, pulls accounts/transactions, upserts locally
- `src/lib/recurring.ts` — heuristic that detects recurring bills from transaction history
- `src/lib/auth.ts` — session cookie helpers
- `prisma/schema.prisma` — data model (User, Item, Account, Transaction, RecurringBill)
- `scripts/seed-user.ts` — creates/updates the single dashboard user
- `scripts/sync-transactions.ts` — CLI entrypoint for a manual/cron sync

## Notes

- This is built for a single user. Multi-user support isn't implemented
  (schema allows for it, but the UI/session model doesn't distinguish users
  beyond the one email/password pair).
- Recurring bill detection is a heuristic (median gap between transactions
  from the same merchant, matched against weekly/biweekly/monthly/yearly
  cadences with a tolerance window). It needs a few billing cycles of history
  to pick anything up — it won't show bills on day one.
