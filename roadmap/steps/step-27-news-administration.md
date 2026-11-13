# Step 27 · News administration, AI ingestion, international news (L): done

Step 27 of the [roadmap](../../ROADMAP.md#order), for the
[third version of the spec](../third-version.md).

CMarket.Api's phase 20.

- **Contract** (`contracts/newsAdmin.ts`, `endpoints/admin.ts`, the API's `Controllers/Admin` and
  `Controllers/Ingest`):
  - An item may wait for a moderator: `status` `pending`, with `holdReason`
    (`sourceModeration`, `aiApproval`, `lowConfidence`), `submittedAt` and the AI's
    `confidence`. `GET /admin/news?status=pending|reported&channel=&sourceId=` lists the items
    reported, then those waiting; `GET /admin/news/{id}` reads one with its open reports (an
    addition); `POST .../approve`, `.../takedown` (a reason), `.../retype` (`article` or
    `flash`).
  - `GET / PUT /admin/publishers` (a domain named or renamed, its tag the name in capitals when
    left empty) and `DELETE /admin/publishers/{id}` (an addition).
  - `GET /admin/news-sources?channel=` (an addition: the list), then
    `GET / PUT /admin/news-sources/{id}`: name, tag, site, language, verified, review mode
    (`after` or `before`), a partner newspaper's rate per unique click, monthly cap and FLASH
    quota, its media and News providers; `PUT / DELETE .../logo` (a PNG, JPEG or WebP of
    512 KB), served open at `/api/v1/news-sources/{id}/logo?v=`, its address changing with it.
  - `GET / PUT /admin/news-settings` (an addition): the AI's review mode and confidence
    threshold, and the views an hour of decision 11.
  - `GET / POST / DELETE /admin/ingest-clients`: name, key id, addresses (CIDR), items an hour,
    their use; the creation answers the signing secret once.
  - `POST /news/{id}/report` (an addition, for the queue's "reported"): the reasons of a
    publication's report.
  - `news:moderate` (NEWS, MOD and the publishers: the Data admin, the Admin) and
    `news:payments` (SRC: the Admin) come with these endpoints (decision 13); ADMCFG shows them in
    the news group. The audit log has ten new actions, three new targets and fifteen new fields.
- **NEWS** (Data admin): two tabs more, "Moderation (n)" and "Publishers". The queue lists the
  reported items, then those waiting, by kind and channel, each with its tags, subject, why it is
  there and the AI's confidence; the item opens beside as readers see it (or will), with its
  reports and the decisions Approve or Keep, Take down (a reason its newspaper reads) and Make it
  a FLASH or an ARTICLE. The publishers' tab names a domain (`mediaexample.com`, or a link of the
  site), renames or removes it.
- **MOD** (Admin): a third panel, "News to moderate", and its item in the reader (`?news=`).
- **SRC** (Admin, new, `/admin/sources`, after USER in the menu): the newspapers by channel, one
  open with its logo, description, verification, review mode, contract and News providers (each
  opens USER); CMarket AI and the clicks (automatic or approval, the threshold, the views an
  hour); the ingestion clients (key, addresses, the hour's items against the quota, the last 24
  hours, the last call), "+ Client" showing the secret once, Revoke.
- **NEWS NEW**: a newspaper reviewed before publication reads "Send for review" and "CMarket
  reviews Media I's items before they go live"; its item waits as "In review" (amber, a tab of
  My news), read only, and may be withdrawn.
- **N**: "Report" under an item sends it to the moderators.
- **EODH**: the international news load is a fourth job.
- **The card of a tag** shows the newspaper's logo, from the API's origin.
- **CMarket.Api** (phase 20):
  - `news.News` gains `Pending` with `SubmittedAt`, `HoldReason` and `Confidence`; `news.Sources`
    its review mode (after publication, before it for a partner newspaper not verified), its
    logo and the publisher's row that names it. New tables: `news.Publishers`,
    `news.NewsReports`, `news.IngestClients` with their addresses, `news.IngestedItems` (the
    pushes by external id), `news.IngestUsage` (the items of each hour, counted by one atomic
    update across instances) and `news.Settings`. The migration `NewsAdministration`, tested up,
    again by the idempotent script, and down (an item that waited goes back to its newspaper's
    drafts).
  - `/ingest/*` (spec section 10): the client's key in `X-CMarket-Key`, the HMAC-SHA256 of the
    body in hexadecimal in `X-CMarket-Signature` (`sha256=` before it, or not; an empty body for
    a GET or a DELETE), and its addresses; 401 for an unknown key or a wrong signature, 403 for a
    revoked client or another address, each a security event in the log; 429 past its items of
    the hour. The secrets are sealed with AES-256-GCM under `Ingestion:SecretKey` (ADR-044):
    without it no client can be created.
  - A push is checked (required fields, the spec's codes, the lengths of its type), then sent
    again by its external id it updates its item; a new one is refused when it comes from a
    partner newspaper's domain (`GET /ingest/excluded-sources`) or tells a partner newspaper's
    story again, a duplicate when its original article or a very similar headline is in the feed
    within 24 hours (letters 85% alike and the same names and numbers), else published or held
    as the Admin set it. `GET /ingest/news/{externalId}` answers `published`, `pending`,
    `rejected` (with the reason, a moderator's too), `duplicate` or `withdrawn`; `DELETE`
    withdraws it; `GET /ingest/reference` lists the codes.
  - EODHD `/news` every 15 minutes once EODHD is enabled: the stories of the mapped tickers (50 at
    most, or those configured) and of configured topics since yesterday, each once by its link,
    its securities through `SecurityMapping`, its countries through them or the exchange's
    suffix, its newspaper through `news.Publishers` (else its domain's name); an ARTICLE of the
    International category with its summary and the original link, its full text only when
    `Eodhd:NewsFullText` says the licence allows it.
  - The views an hour come from the Admin's setting (120 by default).
  - The demo: the moderation queue of the mockups' data (Daily Z's Kribi story at 0.58, Douala
    Éco's bond article, reviewed before publication, BRENT reported twice, the BTA auction once),
    six publishers, CMarket AI's client (local addresses, its secret in `tests/http/ingest.http`)
    with its pushes and its hours, a revoked staging client, the international news loads of the
    last two hours.
- **Checked**:
  - Type check, lint, the 304 unit tests.
  - Every Playwright flow on CMarket.Api from a fresh database: 91. Five new ones: NEWS approves
    the AI's item and names a publisher, MOD keeps a reported item and takes down a waiting one,
    SRC changes a contract, a logo, the threshold and a client, a newspaper reviewed before
    publication sends its FLASH for review, a reader reports an item.
  - Each spec of `@fresh-db` flows on its own fresh database. All pass but the two of
    `analysis.spec.ts`, which fail before this step too.
  - axe (WCAG 2.2 AA) at 1600, 390 and 320 px, in English and French: NEWS's moderation (an item
    waiting, a reported one, the take-down and retype dialogs) and publishers, MOD with a news
    item, SRC (a newspaper, CMarket AI, the clients, the new client's secret, the revocation), the
    studio with an item in review, N's report dialog: 89 audits, nothing found, nothing scrolls
    sideways. axe found SRC's links to the News providers 16 px high: they are 24 px targets now.
