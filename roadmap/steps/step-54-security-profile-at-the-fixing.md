# Step 54 · DES at the BVMAC fixing, the descriptions (screen 2) (L): done

Step 54 of the [roadmap](../../ROADMAP.md#order), for the
[fifth version of the spec](../fifth-version.md).

CMarket.Api's phase 42 (ADR-068).

- **Built**:
  - DES of an equity, as the redrawn mockup: the header (the type, the exchange, the country, the
    sector, the currency and "fixing auction" for a BVMAC security; the last fixing at 26 px with
    "Fixing of dd/mm/yyyy" under it, "Close of" for a European or US security; the previous price,
    the volume, the value traded, the market cap, the P/E and the yield, or the session's open,
    high and low off BVMAC); "Closing price (fixing)", a line of the closes with MA20, MA50 and the
    volume, from 1M to 5Y, 6M first; the description under it; "Prices of recent sessions" in
    place of the order book and the latest trades (the session, the price, the change and the
    change in %, the volume, the value in millions; 10, 20 or 60, 20 first; XLSX and CSV; the note
    that names the latest session without trades and a link to GP); the key data with "Sessions
    with trades (3 months)" as "62 of 65" in place of the beta; the dividends and the documents
    and news as before. A fixing's `QuoteUpdated` reads the sessions again; a layout saved before
    finds the new panels at their default places.
  - GP of a BVMAC security: the line of the closes, without 1D, 5D, candles or bars
    (`tradesAtFixing` in `entities/security`, decision 38); a European or US security keeps them.
  - The description panel (`widgets/security-description-panel`), the same on DES and EQS and
    ready for the index profile: the text in the screen's language, else the other one marked,
    FR · EN when both are written, "Source: … · written by CMarket · updated dd/mm/yyyy" under it,
    or "Description in English, source EODHD"; "Edit" for `descriptions:write`, which opens
    CORR's form in a dialog (`features/describe-security`, `DescriptionDialog`).
  - CORR's form: each language's text, 1,500 characters, and its source; a language changed is a
    new version (one PUT a language), the earlier versions listed with their author, their date,
    their source and the file they came from; EODHD's English folded below.
  - IMP: the `DESCRIPTIONS` file (code, language, text, source, date), its template, its checks and
    its rollback; AUDT: "Index description" and the target "Index".
  - The permission `market:orderbook` is `market:intraday` (the matrix's "Intraday Europe and US
    (EODHD licence)"); `descriptions:write` is new ("Write the descriptions of securities and
    indices").
  - Slices: `widgets/recent-sessions-panel` (new); `widgets/order-book-panel` and
    `widgets/latest-trades-panel` gone; `entities/security` (`useSecuritySessions`,
    `useDescription`, `useDescriptionVersions`, `useDescribe`, `tradesAtFixing`); the contracts
    in `securities.ts`, `dataImport.ts`, `me.ts` and `admin.ts`; the routes of `securities.ts`,
    `market.ts`, `dataAdmin.ts` and `devTools.ts` (`POST /_prototype/market/fixing`).
- **CMarket.Api** (phase 42, ADR-068):
  - The demo market at the fixing (decision 38): at each session's close (14:00 in Douala), the
    session starts, every home-market quote unchanged, then each security that trades gets one
    price, its open, high and low; a less liquid equity misses some sessions (SEMC about one in
    twelve), in the seeded history too, and a session without trades keeps no daily bar. The
    seeded history is a fixing a session; no BVMAC intraday bar, trade or book is seeded or
    written. `POST /_prototype/market/fixing` fixes the latest session at once, for the flows.
  - `/securities/{id}/quote` gives the value traded, the session and the fixing's date;
    `/securities/{id}/sessions?last=` (1 to 250, 20 by default) the sessions with trades and the
    latest without; the profile the sessions with trades over three months and those held, and no
    description any more; `/orderbook` and `/trades` are gone, with `mkt.OrderBookSnapshot` and
    `mkt.Trades`.
  - `ref.Descriptions` (security or index, its id, the language, CMarket or EODHD, the version,
    the text or none, the source, who wrote it and when, the file), filled from
    `ref.SecurityDescriptions`, which goes (migration `FixingAndDescriptions`);
    `GET /securities/{id}/description?lang=` and `/indices/{code}/description?lang=` (the latest,
    else the other language, else 404), `GET` and `PUT /admin/descriptions/{type}/{id}`
    (`descriptions:write`: the Data admin, and an Analyst of CMarket's organisation, who also
    gets every module as CMarket's staff, decision 40); EODHD's English a version when it changes;
    the commodities' texts the same versions. The demo's R. Biyiti (r.biyiti@cmarket.example) is
    CMarket's analyst, added at the end of the seed to any database, Azure's included, outside the
    accounts the population draws around; SEMC's description is the mockup's, each with its
    source.
  - What a session without trades changed elsewhere: the one-year change reads the last close up to
    a month before the date (a week before); a CMarket index keeps a member's last close on a
    session it did not trade, at a zero change (spec section 9, screen 31), where the member
    dropped out of that session's change; a model portfolio buys a line at its last close; a
    chart's indicator reads enough sessions before the first bar to start on it; today's session
    counts in a chart only once it traded.
- **Checked**: web typecheck, lint, 509 unit tests; the routes against CMarket.Api's OpenAPI;
  Playwright on a fresh database: the four flows of `security-profile.spec.ts` (DES at the
  fixing, 10/20/60 and the CSV, GP without candles; R. Biyiti's edit and back; IMP's
  `DESCRIPTIONS` published and rolled back), and the flows the step changed (smoke, EQS's and
  CORR's descriptions, GP's drawings, the Journalist's chart); axe clean on DES, GP, EQS, DES's
  Edit dialog and CORR, in English and in French. CMarket.Api: the domain, application,
  integration and architecture suites (the new French sentences in the catalogue); the SQL Server
  suite waits for Docker (Colima was off): its new `FixingAndDescriptionsMigrationTests` checks
  the copy of the texts, the dropped tables, the renamed key and the way back.
- **Left**: the price line keeps the chart's blue where the mockup draws the fixing price amber,
  MA20 blue and MA50 purple. The Download button comes with step 57.
