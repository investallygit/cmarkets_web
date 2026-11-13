# Step 36 · Third version done (M): done

Step 36 of the [roadmap](../../ROADMAP.md#order), for the
[third version of the spec](../third-version.md).

- **Checked**:
  - axe-core (WCAG 2.2 AA) at 1600, 390 and 320 px on every screen of the menu of each of the
    nine account types (S. Mvondo, K. Atangana, P. Owona, T. Bekale, R. Tamba, E. Fouda,
    L. Mballa, A. Mbarga, L. Mvogo), of a client waiting for approval (F. Biyong) and of the
    visitor (the home page, the sign-up as a News provider, the login, the password reset). For
    each client also an equity's profile, a bond's (DES, CF) and an ETF's (DES, HLD), an ARTICLE
    in N, BP on a bond, YCRV's calculator, CAL, NET ME and the screens it may not open (NEWS NEW,
    PORT, PUB NEW, SUBS); ETFS and SUBS for the Data admin, ETFS and IMP for the Admin. In French
    too for K. Atangana, L. Mballa, A. Mbarga, L. Mvogo and the visitor: 885 audits, 660 in
    English and 225 in French. axe finds nothing, no page scrolls sideways, no translation key or
    placeholder shows, no panel fails, the API answers no 5xx and no column of a table cuts what
    it holds (the narrowest, HLD's rank, PUB's outcome icon and ADMCFG's "CEO", 30 to 38 px, hold
    it). The console's only lines are the browser's notes of the 404 by which `GET /subscription`
    says that no plan covers a client awaiting approval, which CFG reads as no plan.
  - From the keyboard, Tab from the top of the page to its end on every screen the third version
    adds or changes: MKT, N and an ARTICLE, EQS, ETFS, BS, BP, YCRV's calculator, the bond
    profile's DES, BP, CF and RAT, the ETF profile's DES, HLD, PERF and DIST, NET ME, CFG and PUB
    NEW as K. Atangana (ETFS, BS, BP, EQS, PUB NEW and both profiles at 390 px too); NEWS NEW as
    L. Mballa; NEWS's three tabs, CORR, IMP and EODH as A. Mbarga; USER, SUBS, MPAY, SRC, ANLY,
    MOD, ADMCFG and AUDT as L. Mvogo: 48 walks. Tab reaches every control, the focus shows at each
    stop (the control or its frame looks different focused and not) and never sticks. Eleven
    dialogs (BS's and ETFS's Save, N's Report, the studio's Preview and Withdraw, NEWS's Take
    down, SUBS's Change plan, Extend and Suspend, MPAY's global settings, SRC's new client), opened
    with Enter, take the focus, keep it on Tab and Shift+Tab, close on Escape and give it back to
    their button.
  - Every Playwright flow on CMarket.Api from a fresh database: 113, all passing, the new one
    included. Each spec of `@fresh-db` flows on its own fresh database: 17 flows in 8 specs, all
    passing, those of EQS and FA among them. The API answered no 5xx.
  - Type check, lint, the 367 unit tests; no file over 700 lines.
- **Fixed**:
  - The text of an ARTICLE in NEWS NEW and of a publication in PUB NEW showed its focus by the
    caret alone, TipTap's outline being off: while the text has the focus, the editor's frame
    takes the amber border and ring of a field (WCAG 2.4.7).
  - The two `@fresh-db` flows of EQS and FA expected the mock's table of sector averages
    (Beverages at 6.3%, a P/E of 12.1x) and had failed since the mock went (step 21). CMarket.Api
    averages the equities it covers in the sector, and SEMC is the only Beverages one: its
    sector's average is its own ratio and follows its price. The flows check that.
  - This roadmap: MPAY's section still read "to do", and "Done for every screen" named the mock.
- **Added**: a Playwright flow from the keyboard alone: BS from the command bar, a bond reached
  with the arrows, "Open in BP" with Enter, a yield typed and Calculate; then ETFS, where Enter
  opens the ETF reached, as a double click does; the titles of BS, BP, ETFS and the ETF profile.
- **Documentation**: the README (the introduction, what CMarket.Api keeps and computes) and this
  roadmap (the third version done).
- **On Azure**, read only, on 12 November 2026 at 20:10 UTC: steps 23 to 35 are live (the site's
  build of step 35, the API's migration `SecurityDescriptions`).
  - **Jobs**: Hangfire runs fifteen recurring jobs on three servers, six of them the third
    version's: `news-scheduled` (every minute), `news-statements` (every 15 minutes),
    `news-click-anomalies` (01:00), `billing-cycle` (06:00), `bond-analytics` (18:30 on
    weekdays) and `etf-performance` (23:00 on weekdays), times of Douala. The last run of each
    succeeded, but for `etf-performance`, registered that day, whose first run comes at 23:00;
    no job has failed since 9 November (the messages' keys). EODHD's jobs, its news every 15
    minutes among them, wait for its key (decision 8).
  - **Ingestion**: `/ingest/*` answers 401 without a signature ("Signature required") and for an
    unknown key ("Unknown key"); no client exists yet. The App Service runs in the Development
    environment, whose settings file, in the repository, holds a development
    `Ingestion:SecretKey`: the clients' secrets would be sealed with it. `Ingestion__SecretKey`
    belongs in the deployment's secrets, as the other keys, before an Admin creates a client in
    SRC.
  - **Demo data**: the shared database got the descriptions but only part of the ETFs: 20 ETFs
    without a price, NAV, portfolio or benchmark, so that ETFS and the ETF profile have nothing
    to show there. BS lists 4 of the 6 bonds: BDEAC and COMPANY X joined the market's fixtures
    after that database was seeded. The demo is seeded at start-up, before the API answers: the
    ETFs' 20 years of prices, written across the Atlantic, likely outlasted the App Service's
    start-up limit, and the next start skipped the ETFs already there. Filling them in writes to
    a database people use, which is the owner's call.
