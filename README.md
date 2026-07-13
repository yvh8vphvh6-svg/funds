# fund-console

> An offline, encrypted personal command center for recovering forgotten funds, credits, rewards, flippable item rewards, and crypto across old accounts.

`fund-console` is a single-file, zero-dependency web app. One HTML file — `fund-console.html` — contains the entire application: markup, styles, and logic. No server, no build step, no network access, no accounts. You open it in a browser, unlock your vault with a passphrase, and work through everything you're owed.

---

## 🔒 Security note — read this first

**All vault data is encrypted client-side with AES-GCM via the browser's WebCrypto API before it is ever written to disk.** The encrypted blob is stored **only in your browser's `localStorage`** and is **never transmitted anywhere** — there is no backend, no sync service, no analytics, no telemetry, and no outbound network request of any kind.

The flip side of real encryption:

> ⚠️ **If you lose your passphrase, your data is unrecoverable.** There is no reset flow, no recovery email, and no backdoor — by design. Choose a passphrase you can reproduce, and export encrypted backups regularly.

---

## Table of contents

- [Security note](#-security-note--read-this-first)
- [How to run](#how-to-run)
- [Features](#features)
- [Account types](#account-types)
- [Bulk import format](#bulk-import-format)
- [Data & privacy](#data--privacy)
- [Disclaimer](#disclaimer)

---

## How to run

There is nothing to install, build, or configure:

1. Get the repo (clone it, or just download `fund-console.html`).
2. Open `fund-console.html` in any modern browser — double-clicking the file works.
3. On first run, set a vault passphrase. This creates your encrypted vault.
4. On every later run, enter the same passphrase to unlock it.

The app works **fully offline**. You can run it from a laptop with Wi-Fi disabled, from a USB stick, or from a folder that never leaves your machine. No `npm install`, no dev server required, no CDN.

> **Tip:** because the vault lives in `localStorage`, it is tied to the browser *and* to how the file is opened (the `file://` path acts as the origin). Always open the file from the same location with the same browser, and use the export feature for backups before moving anything.

### Local development (optional)

Two preview options, both on **http://127.0.0.1:5501**:

1. **Live Server (one-click)** — install the recommended `ritwickdey.liveserver` extension (VS Code will offer it via `.vscode/extensions.json`; port and host are pre-configured in `.vscode/settings.json`). Right-click `fund-console.html` → *Open with Live Server*, or run the **Preview Fund Console** task from the command palette.
2. **No extension** — `serve.mjs` is a zero-dependency dev server (Node 18+, built-in modules only):

   ```bash
   node serve.mjs   # → http://127.0.0.1:5501
   ```

   or run the **Serve (no extension)** task (`Terminal → Run Build Task`, it's the default).

- **Localhost only** — both servers bind `127.0.0.1`, never a LAN interface, so the dev loop can't be reached from another machine.
- **Auto-reload** — `serve.mjs` watches `fund-console.html` and refreshes open tabs on save. The reload client is *injected at serve time*; the file on disk keeps its hardened CSP (`connect-src 'none'`), so the shipped app remains incapable of making any network request when opened via `file://`.
- **Origin indicator** — the header chip shows where the page is running: `file://` (normal use), `127.0.0.1:5501 · dev` (dev server, live reload active), or a loud ⚠ warning for any other origin, which the console is not meant to run from.

## Features

- **🔐 Encrypted vault** — the entire dataset is sealed with AES-GCM (key derived from your passphrase via PBKDF2, WebCrypto throughout) and persisted as a single opaque blob in `localStorage`. Lock/unlock lives in the UI; plaintext exists only in memory while the vault is open.
- **📝 Single + bulk account entry** — add one account at a time through a form, or paste a whole backlog at once using the line-based [bulk import format](#bulk-import-format).
- **🗂 Category grouping** — accounts are grouped by type (store credit, gift cards, crypto, …) so related recovery work happens in one sitting.
- **🔎 Live search / filter / sort** — instant text search across names and notes, filters by type and status, and sorting by value, urgency, expiration date, or name.
- **⏳ Expiration tracking with urgency scoring** — every account with an expiration date gets an urgency score; balances about to silently evaporate float to the top of the console.
- **🧭 Recovery decision engine** — per-account guidance: given the account's type, balance, expiration, and access status, the engine recommends the next concrete step (check balance, redeem now, contact support, re-verify identity, write it off).
- **💱 Flip / resale profit engine** — for flippable reward items: enter estimated resale price, marketplace fees, and shipping, and the engine computes expected net profit and tells you whether flipping beats redeeming.
- **🪙 Crypto module** — dedicated handling for exchange accounts (custodial) and self-custody wallets: access checklists, re-verification steps for dormant exchange accounts, and recovery-material tracking for wallets. Even though the vault is encrypted, prefer recording *where* a seed phrase is kept rather than the phrase itself.
- **📖 Redemption playbook library** — step-by-step playbooks for the common scenarios: dormant gift card, store credit at a merchant you no longer shop at, stranded payment-app balance, locked-out exchange account, half-remembered wallet, and more.

## Account types

Each account gets exactly one type. The type determines which recovery logic, urgency rules, and playbooks apply.

| Type | What it covers | Recovery logic applied |
|---|---|---|
| `store-credit` | Merchant store credit, refund-to-credit balances, merchandise credit | Expiration urgency scoring; dormancy check; playbooks for contacting the merchant and merging loyalty accounts |
| `credit-card` | Card reward points, cashback balances, statement credits | Inactivity/forfeiture risk; redeem-vs-transfer decision support; reminder logic before points devalue or lapse |
| `payment-app` | Stored balances in payment apps (PayPal-style, P2P apps) | Dormancy risk scoring; withdraw-to-bank playbook; flags balances at risk of escheatment or account closure |
| `gift-card` | Physical and digital gift cards | Balance-check prompts; expiration urgency; redeem-vs-flip comparison via the resale engine |
| `crypto-exchange` | Custodial accounts on crypto exchanges | Account reactivation and identity re-verification playbook; withdrawal path planning to get funds off dormant platforms |
| `crypto-wallet` | Self-custody wallets (hardware, software, paper) | Access checklist (recovery material located? passphrase known? derivation path noted?); access-risk scoring — no expiry, but access decays |
| `reward-item` | Physical or digital reward items with resale value | Flip/resale profit engine: resale price − fees − shipping vs. redemption value; claim-by-date urgency |
| `other` | Anything else — deposits, escrow, class-action claims, unclaimed property | Generic expiration/urgency scoring plus free-text recovery notes |

## Bulk import format

The bulk importer takes **one account per line**, pipe-delimited:

```text
name | type | balance | expires | notes
```

| Field | Meaning |
|---|---|
| `name` | Free text — whatever helps you recognize the account |
| `type` | One of the type slugs from the [Account types](#account-types) table |
| `balance` | Estimated value as a plain number (in your currency) |
| `expires` | `YYYY-MM-DD`, or `-` if it never expires / unknown |
| `notes` | Optional free text (last-4 digits, which email it's under, etc.) |

Example paste:

```text
Old Navy merch credit   | store-credit    | 43.50  | 2026-11-30 | from jacket return, card ending 8812
Steam gift card         | gift-card       | 20.00  | -          | code in email from 2023
Chase UR points         | credit-card     | 412.00 | -          | ~41k points, check transfer partners
Venmo balance           | payment-app     | 61.25  | -          | old account, phone number changed
Kraken account          | crypto-exchange | 312.00 | -          | needs identity re-verification
Ledger in desk drawer   | crypto-wallet   | 850.00 | -          | seed phrase location noted in safe
Conference prize GPU    | reward-item     | 300.00 | 2026-09-01 | unclaimed, resale ~$450 minus shipping
State unclaimed property| other           | 128.00 | -          | filed claim 2026-05, waiting on check
```

Lines that fail to parse are reported back with a reason instead of being silently dropped.

## Data & privacy

- **Where data lives:** exclusively in your browser's `localStorage`, as a single AES-GCM-encrypted blob. Nothing is written anywhere else and nothing is sent anywhere, ever.
- **Encryption details:** WebCrypto `AES-GCM` with a 256-bit key derived from your passphrase via `PBKDF2`; a fresh random IV per save; salt and IV stored alongside the ciphertext (they are not secret — the passphrase is).
- **No third parties:** no CDN scripts, no web fonts, no analytics, no error reporting. The page makes zero network requests.
- **Storage origins:** `file://` and `http://127.0.0.1:5501` are different browser origins with completely separate `localStorage` — a vault created one way will never appear the other way. Keep real data on the `file://` side, treat anything in the dev server's vault as disposable test data, and use the encrypted export/import as the bridge if data ever needs to move between them. The header's origin chip always shows which vault is open.
- **Backups:** the export feature produces an *encrypted* backup file. The repo's `.gitignore` deliberately excludes `vault_backup.json`, `fund_vault_backup.json`, and `*.enc` so a backup can never be accidentally committed.
- **Deleting data:** clearing the browser's site data (or `localStorage`) permanently destroys the vault — keep an exported backup first.
- **The hard rule:** lost passphrase = lost data. That is the cost of the app never knowing your secrets.

## Disclaimer

`fund-console` is a **personal organizational tool** for tracking and recovering funds, credits, rewards, and crypto in **accounts that belong to me**. It does not connect to, log into, or automate any third-party service — every recovery step is performed manually by the owner through each service's official channels, subject to that service's terms. Nothing here is financial, tax, or legal advice.
