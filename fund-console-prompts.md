# Fund Console — Claude Code Prompt Pack

> Build sequence for `fund-console.html` — an offline, encrypted personal command center for recovering forgotten funds, credits, rewards, flippable item rewards, and crypto across old accounts.

**Run order:** 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9

*Formatting notes: prompts reordered into execution order (the source doc had 0 and 9 at the end). Prompt 1 had no header in the source, so one was added. Original prompt wording is untouched. Four **AMENDMENT** blocks were added to Prompts 0, 3, 8, and 9 to fix review findings — they are part of the prompt text, so paste each prompt including its amendment.*

## Contents

- [Prompt 0 — Repo initialization, .gitignore & architecture README](#prompt-0) *(run first)*
- [Prompt 1 — Project scaffold, encrypted vault & terminal UI shell](#prompt-1)
- [Prompt 2 — Account data model, single-add form & category grouping](#prompt-2)
- [Prompt 3 — Bulk import, live search, filters & sorting](#prompt-3)
- [Prompt 4 — Expiration tracking, urgency scoring & priority engine](#prompt-4)
- [Prompt 5 — Per-account best-route decision engine](#prompt-5)
- [Prompt 6 — Flip / resale profit engine for reward items](#prompt-6)
- [Prompt 7 — Crypto module: exchange accounts & self-custody wallets](#prompt-7)
- [Prompt 8 — Redemption playbook library, backup/export & commit to main](#prompt-8)
- [Prompt 9 — Live-preview dev loop & VS Code workspace](#prompt-9) *(run last)*

---

<a name="prompt-0"></a>
## PROMPT 0 — Repo initialization, .gitignore & architecture README *(run FIRST)*

Before writing any application code, set up this folder as a proper git repository called fund-console. Initialize git if not already initialized, and ensure the default branch is main. Create a .gitignore suited to a zero-dependency static HTML project: ignore OS cruft (.DS_Store, Thumbs.db), editor folders (.vscode/ except shared tasks, .idea/), any node_modules/ in case tooling gets added later, log files, and — critically — any exported vault backups so I never accidentally commit my encrypted financial data: add *vault_backup*.json, fund_vault_backup.json, and *.enc.

Then write a thorough README.md documenting the whole architecture before it's built, so the repo is self-explanatory. Include: a title and one-line description ("An offline, encrypted personal command center for recovering forgotten funds, credits, rewards, flippable item rewards, and crypto across old accounts"); a prominent security note that all data is AES-GCM encrypted client-side via WebCrypto, stored only in the browser's localStorage, never transmitted anywhere, with the caveat that a lost passphrase means unrecoverable data; a "How to run" section explaining you just open fund-console.html in any browser, fully offline, no build step; a feature list covering the encrypted vault, single + bulk account entry, category grouping, live search/filter/sort, expiration tracking with urgency scoring, the per-account recovery decision engine, the flip/resale profit engine, the crypto module for exchanges and self-custody wallets, and the redemption playbook library; an "Account types" table explaining each type (store-credit, credit-card, payment-app, gift-card, crypto-exchange, crypto-wallet, reward-item, other) and what recovery logic applies; a "Data & privacy" section; and a "Disclaimer" noting this is a personal organizational tool for accounts that belong to me. Structure the README with clear markdown headers, a table of contents, and code blocks for the bulk-import format. Commit only these two files to main with the message chore: initialize repo with gitignore and architecture readme so the first commit is clean scaffolding before the app lands.

**AMENDMENT (fix — .gitignore vs dev-loop conflict):** In the .gitignore, do not blanket-ignore `.vscode/`. Use `.vscode/*` followed by explicit exceptions `!.vscode/settings.json`, `!.vscode/tasks.json`, and `!.vscode/extensions.json`, so the shared workspace files a later prompt creates get committed cleanly instead of silently skipped. Also add `.claude/` to the ignores so local agent config never rides along in commits.

---

<a name="prompt-1"></a>
## PROMPT 1 — Project scaffold, encrypted vault & terminal UI shell
*(header added for consistency — body verbatim)*

Create a new project in this folder called fund-console. I want a single self-contained file fund-console.html with no build step, no npm, no external dependencies or CDNs — everything inline so I can double-click it and it runs fully offline in any modern browser. Structure it as three clearly commented sections: an inline `<style>` block, the `<body>` markup, and an inline `<script>` block at the bottom.

Build the security foundation first. On load, show a full-screen "Vault Locked" gate with a single password field and an Unlock button. Use the WebCrypto API for real encryption: derive a 256-bit AES-GCM key from the master passphrase using PBKDF2 with SHA-256 and 150,000 iterations, with a random 16-byte salt that persists in localStorage (generate once, reuse after). All application data lives in a single DATA object {accounts:[], log:[]} that gets JSON-serialized, AES-GCM encrypted with a fresh random 12-byte IV each save, and stored in localStorage under frc_vault. On unlock, decrypt and parse; if decryption throws, alert "Wrong passphrase or corrupted vault" and stay locked. Pressing Enter in the field triggers unlock. Add a lock() function that reloads the page.

Visual design: dark terminal aesthetic. Background #0a0e14, panels #111823 with #1e2a3a borders and 8px radius, body text #c9d6e5, dim text #6b7d94, teal accent #3fd0c9, and a monospace font stack ("SF Mono", Menlo, Consolas, monospace). Header bar reading "◆ FUND RECOVERY & FLIP CONSOLE" with a lock-state indicator on the right. Add a helper logEvent(msg) that unshifts a timestamped string into DATA.log, capped at 300 entries, and a save() that re-encrypts after every mutation. Include a reusable render() stub I'll expand later. Make the whole thing feel like a polished internal tool, not a prototype.

---

<a name="prompt-2"></a>
## PROMPT 2 — Account data model, single-add form & category grouping

Now build the account system in fund-console.html. Define a mkAccount(obj) factory that returns a normalized account object with these fields: service, type (one of: store-credit, credit-card, payment-app, gift-card, crypto-exchange, crypto-wallet, reward-item, other), balance (float), rewards (float), email, username, password, exp (expiry date string, may be empty), notes, recovered (float, default 0), and a status (pending, verified, recovered, blocked, closed) that auto-sets to "verified" if any value field is filled, else "pending". Also include placeholder fields for crypto and flip data I'll wire up in later prompts: chain, walletAddress, tokens, item, cost, resale, venue, ship — default them sensibly.

Build a single-add panel: a form with a service name, a type dropdown, balance and rewards number inputs, email/username/password fields, an expiry date picker, and a notes field. On submit, validate that service is non-empty (alert if not), push via mkAccount, log the event, clear all inputs, save, and re-render.

Build the accounts display as collapsible category groups so a huge messy list stays manageable. Group accounts by type; each group is a header row showing the category name (uppercase, teal), the count, and the summed dollar value of that group, with a ▾/▸ toggle that expands/collapses (track collapsed state in a module-level collapsed object). Under each header, render each account as a card showing service name, a colored status tag, the email and notes in dim text, and a stat line with balance/rewards/recovered. Give each card action buttons: Recover, Status, Delete — wire Status to a prompt that reassigns status, and Delete to a confirm dialog that splices the account out. Add a totals bar at the bottom showing Outstanding, Rewards, Recovered, and account count. Status tags should be color-coded: pending amber, verified teal, recovered green, blocked red, closed grey.

---

<a name="prompt-3"></a>
## PROMPT 3 — Bulk import, live search, filters & sorting

Extend fund-console.html with a bulk-import panel above the single-add form. It's a large textarea accepting one account per line, fields pipe-separated in this order: service | balance | type | rewards | email | expiry(YYYY-MM-DD) | notes. Only service is required; empty fields between pipes are allowed. Add a "default type if blank" dropdown and an "Import all" button. On import, split by newline, trim, skip blank lines, split each on |, and build accounts via mkAccount. Deduplicate: skip any line whose service+email combo already exists (case-insensitive) via an isDup(service,email) helper. After importing, log a summary ("Bulk: X added, Y skipped"), clear the textarea, save, re-render, and alert the counts. Include placeholder help text showing the exact format with a couple of realistic example lines. Mention the user can paste straight from a spreadsheet by find-replacing tabs with " | ".

Then build a toolbar above the account groups with: a live search box (filters across service, email, notes, and item text as the user types), a category filter dropdown, a status filter dropdown, and a sort dropdown. Wire all four into render() so filtering and sorting recompute live. Sort options for now: highest value, name (A-Z), and status — I'll add expiry and profit sorts in later prompts, so structure the sort function as a switch that's easy to extend. When filters produce no matches, show a dim "No accounts match" message. Make sure the group subtotals and the bottom totals bar always reflect the FULL dataset, not just the filtered view, so I never lose sight of my grand total.

**AMENDMENT (fix — builds a panel a later prompt references):** Also add a small collapsible "Find accounts you forgot" helper panel beside the bulk importer: a list of ready-made email search terms for digging old accounts out of an inbox — e.g. "gift card", "store credit", "your balance", "reward", "statement credit", "refund issued", "e-gift" — each rendered as a click-to-copy chip. Keep the terms in a single module-level array (INBOX_TERMS) so a later prompt can append crypto-related terms to the same list.

---

<a name="prompt-4"></a>
## PROMPT 4 — Expiration tracking, urgency scoring & priority engine

Add expiration intelligence to fund-console.html. Write a daysLeft(dateStr) helper returning the integer days from today to the expiry date (null if no date, negative if past). Write expClass(dateStr) returning a CSS class + label pair based on urgency: expired (grey, "EXPIRED"), ≤14 days (red, "Nd left"), ≤45 days (amber, "Nd left"), otherwise green ("Nd"). Render this as a small colored chip next to the status tag on every account card that has an expiry date.

Add a prominent warning banner at the very top of the app content: scan all accounts for any expiring within 14 days that aren't already recovered or closed, and if any exist, show a red banner listing them by name with days remaining ("⚠ 3 account(s) expiring within 14 days: Saks (9d), ..."), telling me to recover those first. Recompute this banner on every render.

Build a priority(account) scorer: base value = balance + rewards (+ flip profit later), multiplied by an urgency factor — 5× if ≤14 days out, 2.5× if ≤45 days, 1× if no expiry or far off, and 0.1× if already expired (so dead value sinks to the bottom). Add two new sort options to the toolbar dropdown: "priority (expiry+value)" as the new DEFAULT, and "expiring soonest" (nulls sort last). This way the app always surfaces the money most likely to vanish. Add CSS classes for all four expiry chip states matching the color scheme.

---

<a name="prompt-5"></a>
## PROMPT 5 — Per-account best-route decision engine

Add the automated recommendation engine to fund-console.html. Write recommendRoute(account) returning a plain-English string describing the single best way to recover that account's value, based on its type, balance, rewards, and status. Render this on each card in a distinct info-styled box (dark blue background, left border in #60a5fa, prefixed with "▸").

Logic, be thorough and correct:

- If status is recovered → "Done — recovered." If closed → "Closed — nothing to recover."
- credit-card with negative balance AND rewards → explain it's two pots: redeem the rewards as statement credit or a partner transfer, AND separately claim the negative balance (money the bank owes you) as a refund check or ACH; explicitly warn to never convert it via cash advance because the fees destroy the value.
- credit-card negative balance only → negative balance means the bank owes you that amount; request a refund check/ACH or spend it down on the card.
- credit-card rewards only → redeem as statement credit or transfer to a travel partner.
- store-credit with balance → no cash-out possible, so spend it; for Fandango specifically mention buying a ticket and pushing the mobile pass into Apple Wallet.
- payment-app that's blocked → note that even banned accounts usually still allow withdrawing the remaining balance, so cash out to the linked bank/debit immediately before it fully locks.
- payment-app with balance → transfer out to linked bank/debit or Apple Pay.
- gift-card → spend it, or resell on a gift-card exchange for instant cash at roughly a 10–15% haircut.
- Fallbacks for other/unknown types and zero-balance cases prompting me to log in and verify.

Inject this recommendation into the Recover action's confirm/prompt dialog so I see the recommended play right before I act. Keep the wording tight and actionable — these are instructions to myself, not disclaimers.

---

<a name="prompt-6"></a>
## PROMPT 6 — Flip / resale profit engine for reward items

Add a flip-profit engine to fund-console.html for accounts of type reward-item — cases where an account grants a physical item (like a free console or product) that's worth more flipped for cash than kept. Define a venue fee map: {local:0, ebay:0.13, stockx:0.10, mercari:0.13, fb:0.03}. Extend the single-add form so that when type = reward-item, a conditional set of flip fields appears (toggle visibility on the type dropdown's change): item name, acquisition cost (0 if free), estimated resale price, resale venue dropdown (using the fee map), and shipping cost.

Write flipProfit(account) returning net profit = resale × (1 − venueFee) − cost − shipping, or null if not a reward-item or no resale set. Write flipAdvice(account) returning a detailed gold-highlighted string: show the full math breakdown (resale, venue + fee %, minus cost, minus shipping, = NET $X), then automatically compare every venue and if a different venue nets more, recommend it with the exact dollar improvement. If the item name matches hot electronics (regex for xbox|playstation|ps5|switch|console|gpu|iphone|macbook), append timing advice: sell sealed/new-in-box, list around holiday or launch demand for peak margin, unopened moves fastest.

Render the flip advice on reward-item cards in a distinct gold-bordered box (accent #e0b341). Add a "flip net" figure to those cards' stat lines and to the group subtotal math. Add a "Flip profit (potential)" figure to the bottom totals bar summing max(0, flipProfit) across all non-recovered reward-items. Add a "highest flip profit" sort option. Fold flip profit into the priority() scorer and the Recover prompt so a high-value flip with a near expiry ranks at the very top.

---

<a name="prompt-7"></a>
## PROMPT 7 — Crypto module: exchange accounts & self-custody wallets

Add a crypto module to fund-console.html covering both custodial exchange accounts (like Binance, Coinbase) and self-custody wallets (like Phantom on Solana, MetaMask on EVM chains) — same core problem as any other forgotten account: value parked somewhere that's mine.

Support two types already in the model: crypto-exchange and crypto-wallet. When either is selected in the single-add form, reveal crypto-specific fields: chain/network dropdown (Solana, Ethereum, Base, BSC, Bitcoin, Polygon, other), wallet address (for wallets), and a "tokens" textarea where I list holdings one per line as SYMBOL | amount | approx USD value (e.g. SOL | 2.5 | 340). Parse that into a tokens array and sum the USD values into the account's balance automatically so it rolls into all the totals.

Extend recommendRoute() for crypto:

- crypto-exchange, not blocked → consolidate small balances, then withdraw to a wallet I control or sell to fiat and cash out to my linked bank; watch for withdrawal minimums and network-fee thresholds that can trap dust.
- crypto-exchange, blocked/frozen → many exchanges still permit a withdrawal of existing holdings even when trading is restricted; attempt an on-chain withdrawal to my own wallet before doing anything else, and export transaction history first.
- crypto-wallet → note I already hold the keys so nothing can freeze it; the play is to consolidate dust, swap illiquid or worthless tokens to a liquid asset (SOL/ETH/USDC) on a DEX, watch gas so I don't spend more than the tokens are worth, and be alert that a wallet with unexpected unknown tokens may hold airdrops worth claiming — but warn me to never sign a transaction from an unsolicited token or link, since scam airdrops drain wallets.

Add a crypto-specific detail line on those cards listing the parsed tokens and their summed USD value. Give crypto its own category groups in the display like every other type. Add "crypto" relevant terms to the "find accounts you forgot" inbox-search helper panel (e.g. "deposit confirmation", "withdrawal", "your recovery phrase", "verify your wallet", "airdrop").

---

<a name="prompt-8"></a>
## PROMPT 8 — Redemption playbook library, backup/export & commit to main

Final build pass on fund-console.html, then commit everything.

First, add a "Redemption Playbook" panel: a searchable library of step-by-step recovery scripts keyed by service/scenario, stored as a JS array of objects {match, title, steps[]}. Seed it with entries for: pulling a negative balance out of a major credit card (call issuer or use the app's "request refund" flow, choose check or ACH), redeeming card rewards as statement credit, spending down Saks/store credit, pushing a Fandango ticket into Apple Wallet, cashing out a restricted payment app, withdrawing from a crypto exchange to a self-custody wallet, and consolidating/swapping wallet dust on a DEX. When an account card is displayed, if its service or type matches a playbook entry (case-insensitive substring), show a small "📖 Playbook" button that expands the matching step-by-step guide inline beneath the card. Also give the panel its own free-text search so I can look up any guide directly.

Second, harden the data layer: an "Export encrypted backup" button that downloads the raw encrypted frc_vault blob as fund_vault_backup.json, and an "Import backup" file input that reads a previously exported blob back into localStorage and reloads. Add a small "danger zone" with a "Wipe vault" button behind a double-confirm.

Third, polish: make sure every panel is responsive on mobile (stack the multi-column form rows into single columns under 640px), that the app re-renders cleanly after every mutation, and that no console errors fire on load.

Finally, initialize git if it isn't already, stage all files, and commit to the main branch with the message: feat: fund recovery & flip console — encrypted vault, decision + flip + crypto engines, expiry tracking, playbook library. If main doesn't exist, create it and set it as the default branch before committing.

**AMENDMENT (fix — backup must be self-contained):** The exported fund_vault_backup.json must contain everything needed to restore on a brand-new browser. Bundle the PBKDF2 salt together with the encrypted vault blob (e.g. `{salt, vault}`) — the salt lives in its own localStorage key, and without it a backup can never be decrypted even with the correct passphrase. On import, write both values back to their localStorage keys before reloading. Also verify the per-save IV is stored inside the frc_vault blob alongside the ciphertext so the blob decrypts standalone, and reject imports that fail a basic shape check instead of overwriting a working vault with garbage.

---

<a name="prompt-9"></a>
## PROMPT 9 — Live-preview dev loop & VS Code workspace *(run LAST)*

Set up a smooth local development loop for fund-console.html so I can see changes instantly while Claude edits it. Create a .vscode/ folder with three files. First, extensions.json recommending the Live Server extension (ritwickdey.liveserver). Second, settings.json configuring Live Server to serve on port 5501, open fund-console.html by default, and enabling format-on-save. Third, tasks.json with a task labeled "Preview Fund Console" that's easy to trigger from the command palette.

Because Live Server is an extension and can't be launched purely from a task, also add a dependency-free fallback: a tiny serve.mjs Node script (only using built-in http and fs modules, no npm install) that serves the current folder on http://localhost:5501 with correct MIME types and no-cache headers so every refresh shows the latest edit. Wire a second task "Serve (no extension)" that runs node serve.mjs. Add a scripts note to the README explaining both preview options — Live Server for one-click, or node serve.mjs if I don't have the extension.

Also add a minimal auto-reload nicety: inject a tiny inline script into fund-console.html, guarded so it ONLY activates when the page is served from localhost (check location.hostname), that polls the file's last-modified timestamp every second and reloads on change — so even the plain Node server gives me live reload without touching my offline-file experience when I open the HTML directly. Make sure this dev-only code is clearly commented and has zero effect when the file is opened via file://. When done, stage everything and commit to main with the message chore: add live-preview dev loop and vscode workspace.

**AMENDMENT (fix — storage origin split):** `file://` and `http://localhost:5501` are different browser origins with completely separate localStorage, so a vault created one way will never appear the other way. Handle it two ways: (1) display the current storage origin in the header next to the lock indicator (e.g. `origin: file` vs `origin: localhost:5501`) so it's always obvious which vault is open; (2) add a "Storage origins" note to the README's Data & privacy section: keep real data on the `file://` side, treat the dev server as disposable test data, and use the encrypted export/import as the bridge if data ever needs to move between them.
