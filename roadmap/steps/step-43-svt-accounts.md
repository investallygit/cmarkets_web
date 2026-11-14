# Step 43 · SVT accounts and trader links (L): done

Step 43 of the [roadmap](../../ROADMAP.md#order), for the
[fourth version of the spec](../fourth-version.md).

CMarket.Api's phase 34 (its ADR-060). Lane 1 of the [lanes](../lanes.md), its first step.

- **Type**: `svt`, the tenth account type, created by an Admin from USER for a bank of the
  licensed SVTs (decision 16), with a code at every login and no profile in the directory; ten
  counters on USER; its menu SVT, TRD, AGR, MSG, N, CFG.
- **Licensed SVTs** (ADMCFG): the banks, their back-office address, the minimum trading amount and
  the validity of a link (`/admin/rfq/svt`); the RFQ's switch (decision 24).
- **Links**: a Trader or a Manager asks an SVT of the list for a link from "My SVTs" (`/me/svt`),
  the right panel of screen 22, alone on the RFQ screen until step 44. The bank's SVT accounts are
  told by e-mail and on TRD, where they confirm the link with a daily limit, decline it, change
  the limit or remove the link (`/svt/links`); a request without an answer expires after 7 days, a
  link after a year.
- **Real time**: the `/hubs/rfq` hub, with `LinkRequested`, `LinkChanged`, `SvtLinkChanged` and
  `ServerTime`.

## What was built

- **Contract** (`rfq.ts`): `SvtLinkStatus` (pending, confirmed, declined, expired, withdrawn),
  `SvtLinkDto` (a trader's link to an SVT: its dates, who ended it, the daily limit),
  `MySvtsDto` (the links and the SVTs of the list), `TraderLinkDto` and `SvtLinksDto` (a bank's
  requests and linked traders), `DailyLimitInput`, `RfqAdminSettingsDto` with its
  `AdminLicensedSvtDto` (the back office, on the list or not, its SVT accounts and links in force)
  and `RfqAdminSettingsInput`; the account type `svt` and the permissions `rfq:trade` and
  `svt:approve` in `me.ts`; the audit's four fields; the routes in `endpoints/rfq.ts` and
  `/admin/rfq/svt` in `endpoints/admin.ts`.
- **Real time** (`shared/realtime`): the `RfqClient` on `/hubs/rfq` (`VITE_RFQ_HUB_URL`) beside the
  market and chat clients, its events typed (`RfqEventMap`), `useRfqConnection` and
  `useRfqEvent`; `entities/svt-link`'s `useRfqRealtimeSync`, mounted by the app shell while the
  user holds a key of the RFQ: a trader's links read again when one changes, a bank's requests and
  linked traders when a trader asks (with a toast) or a colleague decides, the server's clock kept
  for step 44's countdowns.
- **RFQ** (`pages/rfq`, `widgets/my-svts-panel`, `features/manage-svt-links`): screen 22's "My
  SVTs", alone until step 44: each SVT the trader asked, its status coloured as the mockup and its
  line ("Confirmed on 12/09/2026 · 1 Bn / day", "Request sent 13/11 · expires 20/11", "Link
  withdrawn by the SVT on 15/10"); "Add an SVT (confirmation e-mail)" offers the SVTs of the list
  with no link in force; a link in force removed after a confirmation. RFQ in the menu after BS
  (decision 15), for a Trader or a Manager while the RFQ is open.
- **TRD** (`pages/svt-traders`, `widgets/trader-links-panel`, `features/decide-trader-link`): the
  SVT's screen and home, screen 27's "Trader links" of its bank: the requests, oldest first, each
  confirmed with a daily limit (or none) or declined; the linked traders with their limit and
  date in a sortable, exportable table, the one picked getting its two buttons under it (its
  limit changed, its link removed). The SVT's own menu (decision 16): TRD, N and CFG
  now, AGR and MSG when their steps add them; the market screens open from the command bar.
- **ADMCFG**: the "RFQ" panel: the switch ("The RFQ is open"), the minimum trading amount, how long
  a link's confirmation holds, the licensed SVTs with their back office's address, ticked on or
  off the list, a bank added by its name; saved together, audited in four fields.
- **USER**: the SVT counter (ten in a row from 1280 px), the type in the filter, "Create account"
  for an SVT asking for a bank of the list, with its note; two-factor mandatory, as an employee's.
- **Slices**: `entities/svt-link` (new: the queries, the hub's sync, the server's clock, a link's
  tone and daily limit), `entities/session` (`isInMenuOf`, the SVT's home),
  `entities/platform-settings` (the RFQ's settings), `features/edit-platform-settings`
  (`RfqSettingsForm`), `features/create-account`, `widgets/account-counters`, `entities/audit`,
  `shared/ui/form/InputFrame` (`aria-disabled`), `shared/config` (the permissions' group, the
  type's colour `--type-svt`); the strings in `rfq` (new), `core` and `admin`.

## CMarket.Api (phase 34, ADR-060)

- `AccountType.Svt` between the News provider and the Data admin, neither a client (no sign-up, no
  directory, no plan) nor an employee; an Admin's change of type keeps it an SVT. The permissions
  `rfq:trade` (Trader, Manager) and `svt:approve` (SVT), taken away while the RFQ is off, and
  `rfq:trade` from a trader in no organisation.
- The `rfq` schema: `RfqSettings` (the switch, XAF 10 million, 12 months), `Svts` (the licensed
  banks), `TraderSvtLinks` (one link in force per trader and SVT, a row version); the job
  `rfq-link-expiry` every 15 minutes; the request's e-mail to the bank's SVT accounts, which sends
  them to TRD (no link to click, as every CMarket e-mail).
- `/hubs/rfq` (`RfqHub`): a trader's group and its bank's; the switch closes the connections
  that lost their key.
- The demo (`DemoRfq`): Bank D to Bank H on the list, their SVT accounts B. Sima (Bank E, the
  type's demo login), A. Okala (Bank D) and M. Ondoa (Bank G), the mockups' links on the demo's
  traders and managers; no trader added, so USER's other counters stay the mockup's.

## Checked

The figures are those of the last run, on top of step 41 (lane 2's, on `main` first): its
migration came before this step's, which was made again after it.

- Type check, lint, the 399 unit tests (new: the SVT's menu and home, RFQ after BS for the
  holder of its key, a link's tone and daily limit, the RFQ hub's address; the routes refreshed
  from CMarket.Api, its ten new ones).
- CMarket.Api: 1,643 tests, all passing: 1,613 in the usual run and the SQL Server suite's 30.
  New: the links' rules in the domain; the demo's links, a request told by e-mail and
  on the hub, the decisions, the removal, the expiries, the switch and the keys, the Admin's list
  audited, an SVT account for a bank of the list; the contract's names and the keys over HTTP,
  `/hubs/rfq`'s token in the query string, its clock and a request reaching the bank's SVT; the
  migration on SQL Server (the account types' order, the `rfq` tables' constraints, as an
  idempotent script, and down).
- Every Playwright flow on CMarket.Api from a fresh database: 144, all passing (125 in the usual
  run, the 19 `@fresh-db` ones on a fresh database per spec). Two new: a trader's SVTs as the
  mockup, Bank F asked then removed, the SVT confirming a request with a limit and declining the
  other on TRD, a limit changed and a link removed, the manager reading its link confirmed;
  ADMCFG's list and switch (a bank added, one unticked, RFQ leaving a trader's menu while off),
  USER creating an SVT for a bank of the list. USER's flow counts the SVTs too. The API answered
  no 5xx; its log holds two errors of a transaction cut short by a request the browser
  cancelled (a publication's page left during a switch of account, 499), not of this step.
- The first run on the API found `/hubs/rfq` refusing the browser's WebSocket (a 500 from the
  challenge): the hub was missing from the hubs whose token comes in the query string. Fixed in
  CMarket.Api with one list of the hubs, for the token and for the traces' redaction.
- axe (WCAG 2.2 AA) at 1600, 390 and 320 px, in English and French: RFQ's "My SVTs" and its two
  dialogs as the Trader; TRD, TRD with a trader picked, and its three dialogs as the SVT; ADMCFG's
  RFQ panel and USER's account form for an SVT as the Admin: 60 audits, nothing found once two
  things were fixed. TRD's icon buttons in 22 px rows sat too close to the next row's (WCAG
  2.5.8): a trader picked in the table now gets its two buttons under it, and Enter changes its
  limit. A disabled amount's unit, dimmed with its field, failed the contrast: the field's frame
  now says it is inactive (`aria-disabled`), as WCAG 1.4.3 exempts. ADMCFG's RFQ panel had a
  section of the same name: it became "Opening and amounts".
