# Step 48 · Fourth version done (M): done

Step 48 of the [roadmap](../../ROADMAP.md#order), for the
[fourth version of the spec](../fourth-version.md).

Lane 1 of the [lanes](../lanes.md), the last step, once steps 45, 46 and 47 were on `main`;
CMarket.Api's phase 39 (its ADR-065).

- axe at 1600, 390 and 320 px and the keyboard on every new screen, for each of the ten account
  types; every flow on a fresh database; the README and this roadmap; the new jobs (the rates, the
  exchange rates, the macro indicators, the commodities, the BEAC's report) on Azure.
- **Left by step 45**: the SVT's messages with the traders linked to its bank (decision 16, MSG in
  its menu, `messages:write` without a professional profile); "concluded agreements above XAF 250
  million can feed the CMarket curve (Admin option)", once the open question is answered.

## What was built

- **The SVT's messages** (decision 16; CMarket.Api's phase 39): MSG in the SVT's menu, between
  AGR and N. An SVT and the traders a confirmed link joins to its bank write to each other at
  once, both ways, whatever the trader's profile says; nobody else. A conversation is one to one:
  no group takes an SVT. MSG's "+ NEW" offers the people a link joins the user to first
  (`GET /conversations/contacts`), whom the directory does not list: for an SVT, its bank's linked
  traders, the only people it may choose, one at a time; for a trader, the SVT accounts of its
  links, beside the directory's cards. A new conversation shows the person from that list (an
  SVT's card gives its bank); "View profile" shows only where there is a profile the reader may
  open. TRD's linked trader gets "Write to …". A trader may block an SVT; the SVT, without the
  directory, reports a conversation. A conversation stays open once the link ends, as any other
  once the rules change. Slices: `entities/conversation` (`useMessagingContacts`),
  `features/start-conversation` (the people offered, one to one for an SVT: `lib/candidates`),
  `widgets/messaging-panels` (`model/useRecipient`, the person a new conversation starts with),
  `widgets/trader-links-panel` (Write to), `entities/profile` (`useDirectory` off for an SVT);
  the contract's `MessagingContactDto`; strings in `messaging` and `rfq`.
- **CMarket.Api** (phase 39, ADR-065): the SVT's role holds `messages:write`, and the migration
  `SvtMessaging` gives it once to a database seeded before; the contact policy reads the link when
  an SVT is one of the two; `GET /conversations/contacts`; a group with an SVT refused; a client
  may block an SVT; an SVT's card gives its bank.
- **Tables that cut no figure** (`shared/ui/DataTable`): a column is at least as wide as its header
  and its widest figure (a number, an amount, a date, a time), measured on the rows shown when the
  data, the columns or the language change; the table then scrolls sideways in its panel, as
  WCAG 1.4.10 lets a data table do, rather than cut one. A text may still end in an ellipsis, a
  name or a headline whose whole is in the detail beside it. The sweep found figures or headers cut
  on most tables at 390 and 320 px (since the first steps: a share of the width could fall to 56
  px), and at 1600 px on RFQ AGR (prices, dates, the counterparty's SVT), RFQ's French header and
  three headers of the Admin's screens: none is cut now.
- **CFG of the SVT**: no subscription nor invoices (it pays no plan, decision 16), its bank's
  members beside the profile; it asked for a plan it cannot have ("No plan covers this account:
  choose one below", an empty list).

## Checked

On `main` as it stood on 15 November 2026 with steps 41 to 47 (web 6b67929, API 56b3b09).

- Type check, lint, the 448 unit tests (new: the people "+ NEW" offers and the SVT one to one,
  the SVT's menu with MSG, an account type's plan, a column fitted to what it holds and what a
  figure is); no file over 700 lines.
- CMarket.Api: 1,788 tests, all passing: 1,750 in the usual run and the SQL Server suite's 38
  (the migration `SvtMessaging`: given once, its idempotent script, down; a new database's role
  table left to the seeder).
- Every Playwright flow on CMarket.Api from a fresh database: 159, all passing (136 in the usual
  run, the 23 `@fresh-db` ones on a fresh database per spec). New: B. Sima writes to T.
  Bekale from TRD, who reads it at once and answers; B. Sima's "+ NEW" offers Bank E's four linked
  traders, one at a time; T. Bekale's "+ NEW" finds B. Sima, out of the directory, and opens their
  conversation; B. Sima's CFG without subscription nor invoices. Changed: B. Sima's menu with MSG.
  `svt-approval` three times in a row on one database. `rfq.spec.ts`'s fresh-database flows
  failed once in the run of every flow, and passed the seven runs after; the next runs replaced
  that failure's record, so its cause is not known. The API answered no 5xx.
- axe-core (WCAG 2.2 AA) at 1600, 390 and 320 px on every screen of the menu of each of the ten
  account types (S. Mvondo, K. Atangana, P. Owona, T. Bekale, R. Tamba, E. Fouda, L. Mballa,
  B. Sima, A. Mbarga, L. Mvogo), of a client waiting for approval (F. Biyong) and of the visitor
  (the home page, the login, the sign-up, the password reset), with the screens the fourth
  version opens from the command bar or a tab (RFQ AGR for the traders and the CEO, RFQ REP for
  the Admin; MKT, CMDTY, ECO, FX and a commodity's DES for the SVT; OPT RES after a run): 289
  pages, 867 audits, 537 in English and 330 in French, run again once the tables were fitted.
  In French too on the fourth version's screens for every account, and on every screen for the
  SVT and the Admin. axe finds nothing, no page scrolls sideways, no translation key or
  placeholder shows, no table cuts a figure or a header, the API answers no 5xx and the console
  has no error. A text cell may end in an ellipsis (a name, a security's label, a headline),
  whole in the detail beside it.
- From the keyboard, Tab from the top of the page to its end on the fourth version's screens: RFQ
  and RFQ AGR (at 390 px too), CMDTY, ECO, FX, OPT, BS and MKT as T. Bekale; SVT and TRD (at 390 px
  too), AGR and MSG as B. Sima; the RFQ entry, RFQ REP, ADMCFG and USER as L. Mvogo; IMP and CORR
  as A. Mbarga; a commodity's DES and OPT RES as K. Atangana: 24 walks. Tab reaches every
  control, the focus shows at each stop and never sticks (a time field keeps it for its hours
  and minutes: ADMCFG goes round in 497 presses). Nine dialogs (Add an SVT, Remove an SVT, Resend
  ticket, Cancel agreement, the SVT's Reject, Confirm a link and Remove a link, RFQ REP's send, OPT
  RES's Create a portfolio), opened with Enter, take the focus, keep it on Tab and Shift+Tab (past
  the last control a native modal dialog lets the browser's own take it, the page behind inert),
  close on Escape and give it back to their button.

## Fixed on the way

- `e2e/svt-approval.spec.ts` (step 45) failed once in three runs on lane 2's databases: B. Sima's
  "rejected" toast missing. The decision's hub event read the agreement's detail again before the
  decision's own answer came; the actions left the screen with the dialog, and with them the
  callbacks `mutate` was given, the toast's. The toast now hangs on the request's promise, which
  the dialog's going does not cancel, and CMarket.Api reads the decision's answer before its
  event goes out. The 401 lane 2 saw was a read the page had given up (a newer one replaced it)
  while its session was checked: CMarket.Api answers such a request 499, as the others a page
  gives up, rather than a 401 that read as a session ended. The flow passed three runs in a row
  on one database, then every run.
- MSG's "+ NEW" says why an SVT cannot join a group as soon as one is chosen or offered.

## On Azure

Read only, on Sunday 15 November 2026 at 16:42 UTC: steps 37 to 47 are live (the site's build of
14:23 UTC, the API's migration `RfqAgreements`), on three Hangfire servers started at 14:27 UTC.
Nothing was written there.

- **Jobs**: 23 recurring jobs, the fourth version's eight among them; 33,434 runs in three days,
  none failed.
  - `eodhd-rates` (06:30 Douala) ran that morning: the money rates loaded at 06:30; the sovereign
    yields stand at Friday 13 November, the last session; the CEMAC states' points come by file.
  - `eodhd-commodities` (06:00 and 18:00) ran that morning: 85,932 values, EODHD's latest of 11
    November.
  - `eodhd-fx` (17:15 Frankfurt time, weekdays): its start-up load of 13 November gave the ECB's
    rates to that day; registered after that day's 17:15, it runs first on Monday 16 November.
  - `eodhd-macro` (the 1st of each month, 04:30): its start-up load of 13 November (15,973
    figures, to 2025); its first monthly run on 1 December.
  - `rfq-daily-report` (every minute) runs and succeeds; the reports there are still the demo's,
    twenty business days to Friday 13 November (a nil report sent at 18:00): its first own report
    comes on Monday 16 November at 18:00. `rfq-approval-expiry`, `rfq-request-close` and
    `rfq-link-expiry` run. The RFQ is on there, as the demo sets it (decision 24).

## Open points

- "Concluded agreements above XAF 250 million can feed the CMarket curve (Admin option)" (screen
  22's rules) waits for the spec author: which curve, in place of or beside the auctions and the
  `.CMKT` series, and for how long ([open questions](../open-questions.md#fourth-version)).
