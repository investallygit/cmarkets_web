# Step 58 · Fifth version done: README, accessibility, every flow (M): under way

Step 58 of the [roadmap](../../ROADMAP.md#order), for the
[fifth version of the spec](../fifth-version.md).

No CMarket.Api phase of its own: the operations' part of phase 12 for what phases 42 to 45 added.

- The README's status and structure for steps 54 to 57; the screens of
  [Client screens](../client-screens.md) and [Back-office screens](../back-office-screens.md).
- Every flow on a fresh database, the `@fresh-db` specs included; the page sweep of step 50 again
  on the screens the fifth version changed, at 1600, 1280, 390 and 320 px, each account type, both
  languages; axe on each; a keyboard walk of DES, BP, DL and the index profile.
- CMarket.Api's suites, SQL Server included (four migrations); the load test of `POST /exports`.
- After the release, a read-only check of the live site: DES at the fixing, BP's curves, the
  index profile from MKT, a download, and MSG and N as
  [step 52](step-52-msg-and-n-on-the-live-site.md) checked them.

## Checked (23 November 2026)

- **Every flow**: 153 of 153 on a fresh database in 4 minutes, then the `@fresh-db` flows of the
  eleven specs that have some, each spec on a database of its own.
- **The page sweep** (`npm run sweep`, with a new `--only <regex>`): the screens the fifth version
  changed (MKT, DES and the profiles, BP, YCRV, the index profile, DL, IMP, CORR, USER, ADMCFG),
  eleven accounts, both languages, 1600, 1280, 390 and 320 px: 1,457 visits, no panel in error, no
  overflow, nothing from axe. The sweep knows the index profile's and DL's addresses.
- **The keyboard**: DES (a share, a bond), BP, DL and the index profile walked by Tab; DL's
  dataset, field and schedule window by key, the focus back on its button.
- **CMarket.Api**: Domain 713, Application 837, integration 315, architecture 21; `POST /exports`
  under k6 (`tests/load/exports.js`, 20 users, on SQLite): 2,812 checks, none failed, p95 10 ms for
  a file, 7 ms for a preview, 8 ms for the catalogue; past 50 files a day, 429.
- **SQL Server**: the suite's 41 tests pass in the CI (79d15c8), `DataDownloadsMigrationTests` among
  them, once its setup had the country and the user the constraints ask for.
- The README's status and structure, the client and back-office screens: up to date for 54 to 57.

### Found and fixed

- DL named the RFQ's and the portfolios' columns by their codes ("status", "averageCost"): the
  list of fields the screen names had only the first part's. A test now compares it to the strings.
- The index profile's flow failed after others: CORR's left SEMC at 99,000, which it now corrects
  back, and IMP's price file moves the prices without BVMAC's level, so that the sum of the
  contributions is checked by a `@fresh-db` flow.
- NET lists 1,178 profiles and 97 Analysts since R. Biyiti (step 54); its flow expected 1,177.

### Left

- The load test on SQL Server: run on SQLite only.
- After the release, the read-only check of the live site found no fault on any screen
  ([step 59](step-59-tabs-open-across-a-release.md)); building a file from DL, which writes, was
  not tried there.
- In French, an index keeps its one name ("BVMAC Equities"), and the RFQ's statuses their codes in
  DL's preview, as in the file.
