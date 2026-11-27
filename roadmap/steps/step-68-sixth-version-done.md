# Step 68 · Sixth version done: README, accessibility, every flow (M): under way

Step 68 of the [roadmap](../../ROADMAP.md#order), for the
[sixth version of the spec](../sixth-version.md). CMarket.Api's operations (phase 12) for what
phases 46 to 51 added.

- The README's status and structure for steps 61 to 67; the screens of
  [Client screens](../client-screens.md) and [Back-office screens](../back-office-screens.md).
- Every flow on a fresh database, the `@fresh-db` specs included; the page sweep of step 50 on the
  screens the sixth version changed or added (RFQ, BP, CAL, AUC, BEAC, DEBT, NET, SVT, IMP, CORR,
  ADMCFG, the Admin's RFQ), each account type, both languages; axe on each; a keyboard walk of RFQ
  by criteria, BP's entry panel and CAL.
- CMarket.Api's suites, SQL Server included; a load test of the board with the ratios.
- After the release, a read-only check of the live site.

## Checked (27 November 2026)

- **Every flow**: the whole Playwright run on a fresh database (166: 165 passed, the CAL keyboard
  walk once fixed, then three times in a row), then the `@fresh-db` flows of the sixteen specs that
  have some, each spec on a database of its own: all pass once those below were fixed. Typecheck,
  lint, Vitest (581), Prettier, no file over 700 lines.
- **The page sweep** (`npm run sweep -- --only …`): RFQ and its agreements, SVT, BP, CAL, AUC, AUC
  NEXT, APE, BEAC, DEBT, NET, IMP, CORR, ADMCFG, the Admin's RFQ and RFQ CPL; eleven accounts, both
  languages, 1600 and 390 px, the first account of each page at 1280 and 320 px too, axe on each:
  988 visits, then 425 again on CAL, AUC, APE, BEAC, DEBT and CORR once fixed, with no finding; the
  English on French pages left is step 50's (the Admin's specialties, "Trading"). The sweep now
  knows the sixth version's six new screens (54 in all) and DEBT CMR, AUC by state and CAL's week
  and month.
- **The keyboard** (`e2e/keyboard.spec.ts`, three new walks): RFQ by criteria (the type by the
  arrows, the criteria typed, a state toggled by Enter and Space, Publish reached); BP's rate entry
  (the method by the arrows, a rate per cash-flow date, Calculate by Enter, the entry status); CAL
  (a type by Space, the view by the arrows, the bell's form giving the focus back on Escape, an
  event picked by Enter and opened by Enter again on AUC).
- **CMarket.Api**: Domain 741, Application 868, integration 322, architecture 21; SQL Server: 47
  (Docker). The board under k6 (`tests/load/rfq-board.js`, 40 users, seven of the demo's
  participants): on SQLite 7,798 checks, none failed, no request failed; p95 8 ms for the board with
  its ratios, 4 ms for the requests, the blotter and a completion detail. On SQL Server 2022
  (Docker, the x64 image emulated on the Mac): 7,741 checks, none failed, no request failed; p95 58
  ms for the board, 31 ms for the requests, 35 ms for the blotter, 49 ms for a completion detail.
- **Operations** (CMarket.Api's runbooks): `eodhd-economic-events` in the EODHD outage, and the
  calendar alerts, keyed per event so that a replay notifies no one twice.
- The README's status and structure, the client and back-office screens: up to date for 61 to 67.

### Found and fixed

- A table of 60 rows or more, which draws its rows only once its box is measured, measured its
  columns before: AUC's 114 results cut their dates and securities at every width. The columns are
  measured again once the rows show.
- An empty table, which scrolls nothing sideways since step 61, cut its headers at 390 px (CORR's
  log, a commodity's stored sessions): its columns now share the panel's width.
- AUC's, BEAC's and DEBT's indicators cut a long figure ("7.00% / 4.50%" at 390 px): it wraps.
- CAL asked an SVT's account for its alerts (403): without `alerts:write` it shows no bell, no
  "Create an alert", and its alerts panel says why.
- The `@fresh-db` flow of RFQ AGR counted the agreements before step 61's two by criteria (the
  Trader's 11, the CEO's 6, the SVT's and the Admin's 13).
- CAL's flows took the first "BTA 26 weeks" of the agenda for an auction: after 10:00 it is the
  day's result. They name the auction's row.
- The keyboard walk of CAL pressed the arrow back before the page drew the month (the address
  changes first): the radio still checked, the arrow did nothing. It waits for the month, and for
  the type unchecked before Space checks it again.

### Left

- The CEMAC sovereign yields flow of `back-office.spec.ts` fails before the BVMAC session (IMP
  proposes today's session, the stored point is the day before), passes after it: as before this
  version.
- After the release, the read-only check of the live site: CAL, AUC, BEAC, DEBT, RFQ by criteria
  and the completion ratio.
