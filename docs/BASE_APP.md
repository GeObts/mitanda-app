# Getting MiTanda live in the Base App

This is the complete, one-and-done runbook. It explains what changed in the
code, and the exact steps **you** need to do (deploy, register, verify) to get
MiTanda live and functioning inside the Base App.

> **The big picture (read this first).** As of **April 9, 2026** the Base App no
> longer uses the old "Farcaster mini-app / MiniKit / Frame" model. Every app is
> now a **standard web app**: wagmi + viem for the wallet, SIWE where you need
> auth, registered on **base.dev**, with onchain volume attributed via a
> **Builder Code**. MiTanda was already a standard Next.js + wagmi app, so this
> was an integration, not a rewrite. Ignore any tutorial that tells you to add
> `farcaster.json` "frames", MiniKit, or OnchainKit wrappers — that path is
> deprecated.

---

## 1. How it works now (architecture)

MiTanda ships as **two builds from one codebase**, selected at build time by the
`NEXT_PUBLIC_ACTIVE_CHAIN` env var (see `lib/app-mode.ts`):

| Build | `NEXT_PUBLIC_ACTIVE_CHAIN` | Chain | Wallet/auth | Worker |
|-------|---------------------------|-------|-------------|--------|
| **Web app** (unchanged, default) | unset / `arbitrum` | Arbitrum One | Privy login | `mitanda` |
| **Base App** | `base` | Base mainnet | Base Account (auto-connect in-app) | `mitanda-base` |
| Base rehearsal | `baseSepolia` | Base Sepolia | Base Account | (your choice) |

The whole app reads its chain + contract addresses from one module
(`lib/contracts/addresses.ts`), so this single flag repoints everything — no
per-file changes. Your live Arbitrum web app is **completely unchanged** by
default.

**What changed in code (already done):**

- `lib/app-mode.ts` — the build-mode switch + Builder Code + app URL constants.
- `lib/contracts/addresses.ts` — added the **Base mainnet (8453)** address block;
  `activeChain` now resolves from the build flag.
- `app/providers.tsx` — Base App build mounts a Base Account / wagmi provider
  (connectors: `baseAccount` + `injected`) with **silent auto-connect inside the
  Base App**, and **no Privy**. The web build keeps Privy exactly as before. A
  new `useAuthMode()` context (`"privy" | "base" | "none"`) drives the UI.
- `components/mt/connect-button.tsx` + `components/dashboard.tsx` — gate on
  `useAuthMode()`; in the Base App the wagmi connection is the auth signal.
- All 8 onchain write sites (`lib/hooks/*`) append the **Builder Code**
  `dataSuffix` (safe no-op when unset).
- `app/layout.tsx` — Open Graph / Twitter / `fc:miniapp` + `fc:frame` embed tags
  so the URL renders as a launchable card when shared.
- `app/.well-known/farcaster.json/route.ts` — optional Farcaster manifest
  (cross-posting bonus; not required by the Base App).
- `lib/server/base-notifications.ts` + `app/api/notify/route.ts` — Base App
  notifications via the Base Dashboard REST API.
- `wrangler.base.jsonc` + `scripts/deploy-base.mjs` + `.env.base.example` — the
  second Cloudflare Worker for the Base build.

---

## 2. ⛳ What you must provide (the only real blockers)

### 2a. Base mainnet contract addresses — REQUIRED
You said the Base mainnet contracts are deployed, but their addresses aren't in
this repo (only Base **Sepolia** was). Put the five addresses from
`mitanda-contracts/deployments/base-mainnet.md` into `.env.base` (see step 4),
**or** paste them to me and I'll hardcode them in `addresses.ts`:

```
NEXT_PUBLIC_BASE_MANAGER_ADDRESS=0x…
NEXT_PUBLIC_BASE_TANDA_IMPL_ADDRESS=0x…
NEXT_PUBLIC_BASE_PASS_NFT_ADDRESS=0x…
NEXT_PUBLIC_BASE_RECEIPT_NFT_ADDRESS=0x…
NEXT_PUBLIC_BASE_COMPLETION_NFT_ADDRESS=0x…
```
USDC on Base mainnet is already defaulted to Circle's
`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`. (MXNB isn't native to Base, so
Base tandas should use USDC unless you bridge it.)

> Until these are set, the Base build compiles and loads but reads/writes hit the
> zero address (no data, no transactions).

### 2b. Builder Code — recommended (for Base Rewards + analytics)
1. Go to **base.dev → Settings → Builder Code**, register, and copy your code
   (e.g. `bc_xxxxxxxx`).
2. Get the **ERC-8021 data suffix** for it (a hex string). Easiest options:
   - base.dev surfaces the attribution suffix for your code, **or**
   - compute it once in a scratch Node project:
     ```js
     // npm i ox  (a version with the erc8021 module)
     import { Attribution } from "ox/erc8021";
     console.log(Attribution.toDataSuffix({ codes: ["bc_xxxxxxxx"] }));
     ```
3. Put the resulting `0x…` value in `.env.base` as
   `NEXT_PUBLIC_BUILDER_DATA_SUFFIX=`. That's it — every MiTanda transaction on
   Base is then attributed to you. (We use a precomputed suffix on purpose so the
   build doesn't depend on a specific `ox` version.)

---

## 3. Register on base.dev

This is how the Base App discovers and lists MiTanda (it replaces the old
manifest registration).

1. Sign in at **https://base.dev** and create a project.
2. Add a **Base builder address** to verify ownership (this is also where
   Builder Rewards are paid).
3. Fill in **all** metadata — Base uses these in the app store/discovery surfaces:
   - **Name:** Mi Tanda
   - **Primary URL:** your Base build URL (e.g. `https://base.mitanda.online`) —
     must match `NEXT_PUBLIC_APP_URL`.
   - **Icon:** 512×512 (use `public/mitanda-logo.png` or a dedicated icon).
   - **Tagline / subtitle, Description** (Spanish + English both read well).
   - **Screenshots** (dashboard, a tanda room, create flow).
   - **Category:** Finance.
   - **Builder Code** (from step 2b).
4. Submit for verification.

---

## 4. Configure & deploy the Base build (Cloudflare)

The Base build deploys to its **own** Worker (`mitanda-base`) so it never
touches your live web app.

1. Create the env file and fill it in (addresses from 2a, suffix from 2b):
   ```powershell
   Copy-Item .env.base.example .env.base
   # then edit .env.base
   ```
2. Set the Base build's **server secrets** on the Worker (not in any file):
   ```powershell
   wrangler secret put BASE_NOTIFICATIONS_API_KEY -c wrangler.base.jsonc   # from base.dev (optional, for notifications)
   wrangler secret put NOTIFY_ADMIN_SECRET        -c wrangler.base.jsonc   # any long random string you choose
   # Optional Farcaster manifest verification:
   wrangler secret put FARCASTER_HEADER    -c wrangler.base.jsonc
   wrangler secret put FARCASTER_PAYLOAD   -c wrangler.base.jsonc
   wrangler secret put FARCASTER_SIGNATURE -c wrangler.base.jsonc
   ```
3. Build + deploy:
   ```powershell
   npm install            # picks up @base-org/account + @farcaster/miniapp-sdk
   npm run cf:deploy:base
   ```
4. Point your domain (e.g. `base.mitanda.online`) at the `mitanda-base` Worker in
   the Cloudflare dashboard (Workers → Custom Domains), matching
   `NEXT_PUBLIC_APP_URL`.

Your existing web app keeps deploying exactly as before with `npm run cf:deploy`.

---

## 5. Verify it works (do this before announcing)

- [ ] `https://<base-url>/.well-known/farcaster.json` returns JSON with your URL.
- [ ] Open the Base URL in a **normal browser**: the "Sign in with Base" button
      appears, connects a Base Account, and the dashboard loads against **Base
      mainnet** (check a tanda reads correctly).
- [ ] Open the URL **inside the Base App** (paste it in a cast / use the Base App
      developer tools): the wallet **auto-connects** and you land straight on the
      dashboard — no Privy modal.
- [ ] Do one real low-value action on Base (create or join a tiny tanda) and
      confirm it confirms on **basescan.org**.
- [ ] Paste the suffix from a confirmed tx into the
      [Builder Code checker](https://builder-code-checker.vercel.app/) — it
      should show your code attributed. Also check counts on base.dev.
- [ ] (If using notifications) test a send:
      ```bash
      curl -X POST https://<base-url>/api/notify \
        -H "x-admin-secret: <NOTIFY_ADMIN_SECRET>" \
        -H "content-type: application/json" \
        -d '{"title":"Test","message":"Hello from Mi Tanda","targetPath":"/dashboard"}'
      ```

---

## 6. Notifications (optional, after launch)

`POST /api/notify` (admin-only, guarded by the `x-admin-secret` header) sends
Base App notifications to users who pinned MiTanda and opted in. Body:
`{ title (≤30), message (≤200), targetPath?, walletAddresses? }`. Omit
`walletAddresses` to send to **all** opted-in users (auto-paginated, chunked at
1000/req). Wire it to your cron/ops for "payment due", "your turn to receive",
"someone joined" prompts. Only reaches users inside the Base App.

---

## 7. Notes, gotchas, decisions

- **Why two builds, not runtime detection?** The whole app reads one static
  `activeChain`. A build flag repoints it with zero risk to the live web app and
  no chain-threading refactor across 27 files. The Base URL you register simply
  points at the Base build.
- **Why `baseAccount`, not the Farcaster mini-app connector?** Base's 2026
  standard-web-app model makes Base Account the first-party connector both inside
  the Base App and in a browser. The Farcaster connector also peers on wagmi 2
  and conflicts with this repo's wagmi 3.
- **Privy is untouched** on the web app. The Base build doesn't mount Privy at
  all; your avatar/join-request signature APIs already verify both EOAs and smart
  accounts (ERC-6492), so Base Account signatures validate unchanged.
- **MXNB:** not native to Base. Base tandas default to USDC. Bridge MXNB and set
  `NEXT_PUBLIC_BASE_MXNB_ADDRESS` only if you actually want it there.
- **Better share image:** `app/layout.tsx` currently uses the square logo for
  embeds. For a sharper preview card, add a 1200×630 `public/og.png` and switch
  `OG_IMAGE`/`SPLASH_IMAGE` there.
