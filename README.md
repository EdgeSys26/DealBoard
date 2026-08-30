# Deal Board

Phone-first PWA for **assignable purchase contracts**. Wholesalers list contracts. Cash buyers run a buy box, see A/B grades, hold, and offer. Title collects the deposit. This is not Zillow, not escrow, not a portfolio tracker.

**Deal Board is a new product.** It has its own auth, database, and environment. Do not import Frontburner. Do not nest this inside Edge.Sys. Shared GitHub or Vercel orgs are fine; end-user accounts must not be shared.

## Demo (no signup)

```bash
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). One-tap demo logins:

| Role | Email | Password |
| --- | --- | --- |
| Buyer | `buyer@dealboard.local` | `demo` |
| Seller | `seller@dealboard.local` | `demo` |
| Admin | `admin@dealboard.local` | `demo` |

Buyer home is seeded with a Noblesville square, 8-mile, $250k, 3+ beds, medium/heavy, A+B buy box.

- **A+** 1847 Pleasant St, 46060 — $189k vs mock AVM $278k, 3/1 1216 sf, 11 days, verified, Silver seller, 2-hour hold
- **B** 622 Cicero Ave, 46060 — $241k vs $300k, 3/2 1408 sf, 6 days, verified
- **No fit (hidden from home)** 401 Harbour Trees Dr, 46062 — $319k vs $328k, 2/2 1104 sf, light work, unverified, Green

After the buyer offers and the seller accepts 1847, the title card is First Title of Hamilton County, file **#26-1184**, **$2,500 to title**, slot **Thu 8/27 10:00a in person, 23 S 9th St**. Wire numbers appear only after accept, and only on the title card.

## Click-through

1. Enter as buyer. Confirm Harbour Trees is absent. Open Pleasant St.
2. See letter + five bars, leftover math, 5 comps, 2-hour hold timer.
3. Place an offer (floor is 10% below asking; no ceiling). First offer attaches vault POF / entity / W-9.
4. Log out, enter as seller. Toggle 622 **On hold**, then reload the buyer home — it is gone. Existing threads freeze.
5. Accept the Pleasant St offer. Buyer deals page shows the title card and wires.
6. Enter as admin for reports, mute-rate, and blacklist (no auto-ban).

## Stack

Next.js App Router, TypeScript, Tailwind, PWA (manifest + service worker), Prisma + SQLite.

Required tables: `User`, `BuyBox`, `Listing`, `CompSnapshot`, `GradeCache`, `Hold`, `Offer`, `TitleFile`, `TitleSlot`, `Favorite`, `Mute`, `Strike`, `Blast`, `Report`. Messaging uses `Thread` / `Message`. After-close “work with again?” uses `WorkAgain`.

## Environment

Copy `.env.example` to `.env` (already done for local demo):

```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="replace-with-a-long-random-string"
RENTCAST_API_KEY=""
REAPI_API_KEY=""
```

No Zillow or county scrapes. If `RENTCAST_API_KEY` or `REAPI_API_KEY` is present, new listings can be tagged as live AVM. Otherwise Noblesville fixtures use a **clearly labeled mock AVM**.

On Vercel the filesystem is read-only except `/tmp`. Preview copies `prisma/demo.template.db` to `/tmp/dealboard.db` on boot and seeds demo users if the file is empty. Local `npm run db:setup` still uses `prisma/dev.db`.

Deal Board does not read Frontburner or Edge.Sys env vars.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Generate Prisma client if needed, then Next.js |
| `npm run db:setup` | `prisma generate`, `db push`, seed |
| `npm run db:seed` | Re-seed demo users and Noblesville fixtures |
| `npm test` | Grade / offer-floor / geo tests |
| `npm run build` | Production build |
| `npm run lint` | ESLint |

## Product rules (implemented)

- Buyers free forever. Sellers ~$199/mo includes 1 Active listing, $49 per extra Active. On hold and pending are free and hidden. Stripe is a stub. No iOS IAP.
- Home and pushes show A range and B range only. C and below stay buried.
- Must-have gate: radius, assignment ≤ max, min beds/sf, work-level, optional max rehab. Fail → No fit.
- Bars: discount vs **platform** AVM 35%, rehab 20%, layout 15%, trust 20%, time 10%. Seller ARV is labeled seller’s and is never treated as truth. A+ ≥ 90. No AVM → no A/A+.
- 2-hour soft hold, one live hold per listing, drops unless offer + POF.
- Offer floor: cannot offer more than 10% below asking. Seller may tighten, not loosen. No ceiling.
- Seller phone hidden until accept. Homeowner never shown. Deposit to title only.
- On hold: invisible to buyers; threads freeze; 7-day cap; auto-expire on contract date or 14-day live max.
- Badges Green / Silver / Gold on funded closes. Blacklist is admin-only.
- After close: owned stub + Export CSV. Not Stessa.

## Out of scope

Holding money, buyer subscriptions, public reviews, seller cell before accept, Zillow scrape, CRM, native store binary, GPS, portfolio P&L, lending, God Mode.
