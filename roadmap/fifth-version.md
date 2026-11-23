# Fifth version of the spec

Planned as steps 52 to 58: see the [order of the roadmap](../ROADMAP.md#order) and the files of
[`steps/`](steps).

The version of 21 November 2026 (146 pages, against 132), compared sentence by sentence and image by
image with the fourth. Sections 1, 3 to 6, 11, 13 and 15 to 17 are unchanged, and so are the
formulas of 14.2 to 14.6; sections 2, 7, 8, 9, 10, 12 and 14.1 change. Of the mockups, screen 2's
and screen 16's are redrawn, screen 16 with a second image (its single-yield and entered-rates
examples), screens 30 and 31 are new, and screens 28 and 29 now share one image (screen 29's text
says so: its bottom half); the others are the same images. The client's note that came with it
names the same four screens, 31, 2, 30 and 16, with menus "not working, like Message, News":
[step 52](steps/step-52-msg-and-n-on-the-live-site.md).

- **BVMAC at the fixing** (sections 2, 7, 9, 10 and 12): BVMAC equities trade at a fixing, one
  price a session, without a published order book or intraday trades. Section 2's BVMAC row reads
  "fixing closing price, list of recent sessions" where it read "order book (if available), session
  history"; section 7 keeps `PriceDaily` (BVMAC fixing prices and EODHD closes) and `PriceIntraday`
  for Europe and the US only, without `OrderBookSnapshot` and `Trades`; section 10 has
  `/securities/{id}/sessions?last=` in place of `/securities/{id}/orderbook`; section 12's Trader
  follows "the BVMAC fixing as soon as it is published", and the matrix's row "Order book, intraday"
  becomes "Intraday Europe and US (depending on the EODHD licence)", with the same rights.
- **Screen 2, the security profile**, rewritten. The header: code, name, type and a "fixing
  auction" label, the last fixing price at 26 px with its date, the change from the previous
  fixing, then the previous price, the volume, the value traded, the market cap, the P/E and the
  yield. The tabs DES, GP, FA, DVD, N, DOC, HDS and a "Download" button (screen 30); ANA is no
  longer listed, while screen 8 still places its list "in the ANA tab of the security profile".
  The chart: a line of closing prices, one point per session with trades, the 20- and 50-session
  moving averages, the volume traded at the fixing below, no candlesticks (a European or US
  security may show the session's open, high and low). "Prices of recent sessions" replaces the
  order book and the latest trades: the session, the price, the change in value and in %, the
  volume and the value traded; 12 shown, a choice of 10, 20 or 60; XLSX or CSV; a session without
  trades has no price and is not listed, which the panel says. The key data: ISIN, sector, shares
  outstanding, free float, 52-week high and low, the sessions with trades over 3 months (the
  liquidity), the last dividend and the next event. The dividends (year, net per share, payment,
  yield) and one panel of documents and news.
- **Descriptions** (screens 2 and 31): a panel under the chart, the issuer and the security in up
  to 1,500 characters, in French and English (FR · EN in its header), with the source, the author
  and the update date below the text. Written by the Data admin or a CMarket analyst from the
  issuer's documents, with an "Edit" link visible to them only; every version is kept; the
  `DESCRIPTIONS` file of screen 6 (code, language, text, source, date) loads them in bulk. A
  European or US security shows EODHD's English (`General.Description`) by default, "Description in
  English, source EODHD" until a French one is written. The same panel on the index profile, as
  on the ETF, bond and commodity profiles. `GET /securities/{id}/description?lang=fr|en` and
  `PUT /admin/descriptions/{type}/{id}`, the table `ref.Descriptions` (the object's type and id,
  the language, the text, the source, the author, the date, the version).
- **Screen 16, bond pricing**: block B of the inputs, "Discount rates", chooses how the cash flows
  are discounted. A single yield (YTM), pre-filled with the last computed one, the cash-flow
  dates greyed with that rate on every row and a link to enter the clean price instead; a yield
  curve, a CMarket zero-coupon curve of a country on a date (built from the uploaded CEMAC yields)
  or a saved custom curve, each cash flow at the curve's rate for its date by linear
  interpolation; or rates entered by maturity, one row per remaining cash-flow date (from the next
  coupon to the redemption, amortisations included), or rates of the standard tenors (3 and 6
  months, 1, 2, 3, 5, 7 and 10 years) interpolated to the dates. A curve's rates stay editable:
  one changed switches to rates entered, which can be saved as a custom curve (the user's: a name,
  a date, the tenors and rates, reusable on any bond, shareable within the organisation). From a
  curve, the results are the dirty price, the accrued interest and the clean price, the equivalent
  yield with the durations and DV01 at it, the bond's market price and its Z-spread to the curve,
  the settlement amount; the schedule gets a "Zero rate" column; the right-hand panel draws the
  curve with the bond's cash-flow dates (the price-yield relationship in single-yield mode); the
  sensitivity shifts the whole curve, a custom curve also by tenor. `GET /curves?country=&date=`,
  `GET /curves/{id}/points`, `POST /bonds/{id}/calculate` with a `discount` (a yield, a curve and
  its date, rates by date, or rates by tenor), `GET`, `POST` and `DELETE /me/curves`.
- **Formulas** (section 14.1): pricing from a curve (the zero rate at each date by linear
  interpolation, the first node's rate before it and the last's after it; the equivalent yield;
  the Z-spread against the market dirty price; the parallel shock) and two test cases on test case
  A's bond: B from a curve (4.600%, 5.100%, 5.550%, 5.850%: dirty 107.3143%, clean 101.1499%,
  equivalent yield 5.8221%, modified duration 2.5299, Z-spread −9.2 bp, 98.4857% after +100 bp)
  and C from rates entered (4.800%, 5.300%, 5.700%, 6.000%: dirty 106.9054%, clean 100.7410%,
  5.9731%, 2.5253, −24.3 bp, 98.0916%). Recomputed on 22 November 2026: both hold to the last
  digit, the present values and the mockup's discount factors too. Their letters collide with the
  table's "Case B: 20% amortization" of the same section.
- **Screen 30, data download** (DL): every download on one screen, from the DL code and the user
  menu; a Download button (⬇, top right of the panel) on each relevant screen opens the same
  window with its settings filled in. Eight datasets: historical prices of equities and ETFs
  (screens 2, 3, 15, 19), bonds (16, 17, 20), yield curves (4, 25), portfolios (5, 29), FX (26),
  commodities (21), RFQ trades (22, 23, 27) and indices (1). The datasets allowed on the left;
  the settings (the selection, the period, the frequency, the fields, CSV, XLSX or JSON, one sheet
  per security or a single table, the decimal separator, the time zone, the rows estimated;
  Download, Schedule), the first 10 rows below; the user's files of the last 7 days (in progress,
  ready, expired) and their limits on the right. Up to 50,000 rows the file comes at once; above,
  it is prepared in the background, with a notification and an e-mail. Scheduled exports daily,
  weekly or monthly, e-mailed if asked. Each file states the source, the extraction date and the
  terms of use. A user downloads only their own portfolios (or those shared with them) and the RFQ
  agreements their organisation is party to, an SVT those that name its bank, and a request
  anonymous until its agreement stays so. Limits by profile (the datasets, the history, a number a
  day, the rows a file), which the Admin may change; every download is logged for the licences
  (`GET /admin/exports/log`, screen 9). A point to confirm before launch: downloading EODHD's data
  is redistributing it, which its commercial licence must cover. `/exports/catalog`,
  `/exports/preview`, `/exports` (the file below 50,000 rows, 202 with an `exportId` above),
  `/exports/{id}` and its file, `/exports/schedules`; the event `ExportReady`; the tables
  `usr.Exports` and `usr.ExportSchedules`.
- **Screen 31, the index profile** (DES on an index): the security profile's layout for the BVMAC
  Equity Index and the indices CMarket computes (Banks, Agribusiness, Cameroon, Gabon, Bonds),
  from `BVMAC-A DES` or a double click on an index of screen 1. The header (the type, price or
  total return, the weighting, the constituents, the currency; the closing value with its date and
  change, the previous value, YTD, 1 year, the 52-week high and low, the constituents' market
  cap); the tabs DES, GP, MEMB, PERF and DOC and the Download button; the index value from 1 month
  to 5 years, based 100, compared with another index or a security; the description (the
  methodology in short); the values of recent sessions (value, change in points and %, market
  cap); the constituents (sector, weight, price, the day's change, the contribution to the index
  change; a double click opens the security); performance and risk (1 and 3 months, YTD, 1 year,
  3 years annualised, the 1-year volatility and maximum drawdown, the dividend yield); the
  methodology and notices (reviews, adjustments after corporate actions, the monthly factsheet,
  the constituents' history). The BVMAC index's value comes from the index file, CMarket's after
  the fixing; a contribution is the weight at the previous close times the day's change, and the
  contributions add up to the index change; BVMAC's weights are those it publishes, CMarket's the
  capitalisations; each review is dated and a date shows the composition then in force; a
  constituent without a trade keeps its last price, at a zero change. `/indices/{code}` with its
  history, sessions, constituents, performance, documents and description;
  `ref.IndexConstituents` (the index, the security, the weight, the entry and exit dates).
- **Codes** (section 8): DL, and DES on an index (`BVMAC-A DES`); thirty-one screens. Section 9:
  an INDEX code opens the index profile, through DES or a double click on an index of screen 1.

## The client's answer of 22 November

Asked what fails in "Message, News", the client answered "Sure" with a summary of the four
screens, 2, 16, 30 and 31, as the fifth version describes them, and no word on MSG or N: the menus
"not working" are the fifth version's screens, which the live site does not have yet
([step 52](steps/step-52-msg-and-n-on-the-live-site.md)). The summary follows the spec, but for
screen 16, where it adds an entry panel the spec does not have (decision 46):

- Columns: the reference curve's rate, the cell where the rate is entered, and the spread in bp,
  updated at each keystroke.
- Helpers: start from a curve, shift all rows, paste from Excel, clear.
- It names `POST /bonds/{id}/calculate` with the `discount` of the four modes, as section 9 does,
  and the sensitivity as a parallel shift of the curve (the spec adds the shock by tenor of a
  custom curve, which stays).

On screen 30 it reads "their own portfolios" where the spec adds "or those shared with them"
(decision 43 keeps the spec), and repeats that EODHD's datasets stay on the screens without being
downloadable until its licence covers it (decision 41).

## Decisions taken

The decisions of the third and fourth versions stand (1 to 37). Where the fifth is silent or
contradicts itself, steps 54 to 58 follow these; each is also an
[open question](open-questions.md#fifth-version) for the spec author.

38. **BVMAC at the fixing**: a BVMAC security has one price a session, its fixing, published at
    the session's close (14:00 in Douala, the exchange's hours in CMarket.Api); until then the
    screens show the last fixing. CMarket.Api's demo market no longer moves BVMAC's prices through
    the session: it publishes each security's fixing once, at the close, through the quote
    service (QuoteUpdated, IndexUpdated, the alerts), also with `Market:AlwaysOpen`, and leaves a
    less liquid security without a trade on some sessions, which then have no price. The European
    and US securities keep EODHD's prices as before (their closes; intraday only under a licence
    that covers it). The order book and the latest trades go: their panels,
    `/securities/{id}/orderbook` and `/trades`, and the books CMarket.Api keeps. GP draws a BVMAC
    security as a line of closes, without 1D, candles or bars; a security whose source gives the
    session's open, high and low keeps them.
39. **The ANA tab** stays, after HDS, as screen 8 still has it, though screen 2 no longer lists it.
40. **Who writes a description**: the Data admin, who has no client screen, in CORR and by the
    `DESCRIPTIONS` file; on DES and the index profile, "Edit" shows to an Analyst of CMarket's own
    organisation (the spec's "CMarket analyst"), the demo getting one. CMarket.Api gives them
    `descriptions:write`, and every module as CMarket's staff: the organisation has no plan. Each
    save is a new dated version (its author, its source, its date); the panel shows the latest,
    CORR the versions. A text holds 1,500 characters, the spec's (2,000 since step 35: a longer
    one stays until edited). The spec's routes take the place of step 35's
    `/data/securities/{id}/description`.
41. **What may be downloaded**: ADMCFG says, for each source (the BVMAC and BEAC files, CMarket's
    computations, EODHD), whether its data may be downloaded, EODHD's off by default until its
    licence is confirmed (on in the demo): a dataset or a field of a source turned off stays on the
    screens and leaves DL, whose catalogue says why. ADMCFG also holds the limits of each profile.
42. **Index constituents**: `ref.IndexConstituents` keeps each member with its entry and exit
    dates. BVMAC-A's members and weights come from a new IMP file, `INDEX_CONSTITUENTS` (the date,
    the index, the security's code, the weight), as BVMAC publishes them; until one is published,
    its filter's members (every listed equity) weighted by capitalisation. A CMarket index's
    members follow its filter, as CMarket.Api computes them now, a security that enters or leaves
    it dated at the next fixing; the weights are each member's capitalisation over the total at
    the previous close, as the spec says.
43. **DL's readers**: every account type, from the command bar and the user menu, not the left
    menu, which is long enough (decision 15). The table of limits leaves out three types: the News
    provider gets the Journalist's row; the Data admin the Admin's, both in the back-office. The
    CEO downloads the RFQ agreements of its organisation, which screen 23 lets it read and export
    (decision 26), where the table's row keeps the RFQ from it. A portfolio is downloaded only by
    those who read it on PORT: the Admin's "all" holds no client's portfolio.
44. **The index profile**: `/indices/{code}/{fn}`, opened by `BVMAC-A DES` (or GP, MEMB, PERF,
    DOC), a search result, a double click on MKT's Indices panel or an index of the ticker. MCAP,
    MKT's market capitalisation, is no index and has no profile; BVMAC-A TR, which the mockup's
    description names, is not built. An index's methodology, notices and factsheets are documents
    the Data admin publishes in NEWS with the index as their subject, as an issuer's.
45. **BP's curves**: the CMarket curves of `GET /curves` are YCRV's, a country's curve on a date
    (decision 20), its yields read as zero-coupon rates as the spec names them. A custom curve is
    the user's: a name, a date and points (a time in years and a rate), from the standard tenors or
    from a bond's cash-flow dates, reusable on any bond with the same interpolation; its owner may
    share it with the organisation, which reads it without changing it. The Z-spread is against
    the bond's last market price, its clean price of the day's calculation; a bond entered by hand
    has none. The code cites section 14.1's new cases as "curve case B" and "curve case C".
46. **BP's entry panel** (the client's answer of 22 November, beyond the spec): with a curve or
    rates entered, each row of block B (a cash-flow date, or a tenor) shows the reference rate,
    the rate used (editable) and the spread between them in bp to one decimal, green above and
    red below, updated at each keystroke. The reference is the curve chosen in curve mode, the
    curve the rates started from, else the CMarket curve of the bond's country at the settlement
    date. Above the table: "Start from a curve" (a curve of the list fills every row and becomes
    the reference), "Shift all rows" (a number of bp added to every rate), "Paste from Excel" (a
    column of rates, or a date and a rate a line, tabs or semicolons, French or English decimals:
    from the row in focus down, or by date when the lines carry dates), "Clear" (every row
    emptied, Calculate waits for them). `POST /bonds/{id}/calculate` takes the `discount` of
    `/bonds/price` and answers the same discount, comparison and zero rates, as section 9 and the
    client name it.
47. **The weight at the previous close** (step 56): section 14 adds up the contributions to the
    index change with "the weight at the previous close". Under a review BVMAC published, that is
    the review's weight moved by the member's price since the close before the review, the weights
    scaled back to 100, as a cap-weighted index's weights drift between reviews; without one, the
    member's capitalisation over the total, as decision 42 says. The demo's reviews weigh BVMAC-A's
    members by their capitalisations at the close before each review, as its level is computed, so
    that its contributions add up to its change; the mockup's weights (24.5 %, 18.2 %...) are not
    the demo's. A review published on the date of another replaces it; a rollback brings it back.
48. **DL's files** (step 57): a download up to 50,000 rows answers 201 with the file ready, which
    the screen saves at once; above, 202 and a job, then a notification, an e-mail and
    `ExportReady`. "My downloads" lists the files of 7 days and, as expired, those of the 7 before;
    a file deleted leaves the list, its row the log. CSV writes a semicolon with a decimal comma
    and a comma with a decimal point; XLSX one sheet per item or one table, dates as dates; every
    file opens with its source, its extraction time in the zone chosen and the terms of use, in the
    reader's language. Adjusted prices are adjusted backwards for dividends and splits; the price in
    XAF uses the peg or the ECB's rate of the day. The portfolios come as three tables, their daily
    performance, their transactions and their positions valued now; the RFQ trades are the
    agreements RFQ AGR reads, the requests and answers staying on RFQ. A scheduled export runs at
    06:00 in Douala (each day, each Monday, the first of the month) over a period of the same
    length ending that day; it is logged but outside the day's count; a Student keeps 1, a
    Journalist, a News provider and a CEO 5, the others 10, the Admin and the Data admin without
    limit. EODHD's items are the prices of the markets other than BVMAC, GBOND and Euribor, the
    ECB's rates and its commodity series; with its source off, FX leaves DL and its items are
    refused elsewhere. DL is `/dl` for the clients and `/admin/dl` for the Data admin and the
    Admin; a panel's Download button shows only when the profile downloads its dataset.
