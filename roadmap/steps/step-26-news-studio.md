# Step 26 · NEWS NEW · News studio (screen 13) (XL): done

Step 26 of the [roadmap](../../ROADMAP.md#order), for the
[third version of the spec](../third-version.md).

CMarket.Api's phase 19.

- **Contract** (`contracts/newsStudio.ts`, `endpoints/provider.ts`, the API's
  `Controllers/Provider`):
  - An item of a partner newspaper has a `status`: `draft`, `scheduled`, `published`,
    `withdrawn`. `GET /provider/news?status=&type=` lists them, newest first, for every News
    provider of the media.
  - `POST /provider/news` makes a draft of the type chosen (required).
    `GET / PUT /provider/news/{id}` read and save it with the `version` read (409 when another
    save came between). `POST .../publish` publishes now or at `publishAt`, the rights
    certified. `POST .../withdraw` takes it back with its reason.
  - `POST .../attachments`: an image of the body (JPEG or PNG, 2 MB, its `credit` required) or
    the item's PDF (10 MB), an ARTICLE's only; `DELETE .../attachments/{fileId}`. The files are
    served at `/api/v1/news-files/{id}`, open as the research images are (ADR-034).
  - `GET /provider/news/stats?groupBy=item|day`, `GET /provider/earnings?month=`,
    `GET / PUT /provider/source` (name, tag, site, language; the rate, cap and FLASH quota read
    only), the template (`?format=csv|xlsx`) and the imports: `POST /provider/news/imports`,
    `GET` one and its rows (`?status=`), `PATCH .../rows/{rowId}`, `POST .../publish`.
    `GET /provider/news/imports` lists them, the first being the last import: an addition to
    section 10.
  - An ARTICLE's `body` is the document of the studio's editor (`RichTextDoc`), everywhere: N
    reads it, NEWS writes its paragraphs into it. `NewsArticleDto` adds the PDF, `attachment`.
  - `news:write` (an approved News provider) and `news:stats` (the News provider, the Data admin,
    the Admin) come with these endpoints (decision 13); ADMCFG shows their row group.
- **Screen** (`pages/news-studio`, `widgets/news-studio-panels`, `features/edit-news`,
  `features/import-news`), at `/n/new`, NEWS in the menu after N (decisions 1 and 2), its title
  "News studio — Media I":
  - **My news**: tabs All, Drafts, Scheduled, Published, Withdrawn; each row its headline, its
    status (Draft grey, Scheduled blue, Published green, Withdrawn red, drawn as the tags) and
    type tags, its payable unique clicks, a scheduled one's time ("Tomorrow 08:00"). "+ New"
    asks the type. The newest draft opens first, else the newest item.
  - **Earnings**: the current month's payable unique clicks, the rate, the amount within the
    cap, the clicks the checks excluded, asked again each minute.
  - **Editor**: the headline with its counter, the standfirst or a FLASH's 500 characters, an
    ARTICLE's body (TipTap: B, I, H2, list, quote, table, image with its credit, link,
    "CMarket security" cards), its PDF, "Source and author", the original link, the rights box.
    A draft saves every 10 seconds ("Saved at 07:58"); a scheduled or published item's changes
    wait for Schedule or Update. A withdrawn item shows its reason and no longer changes.
  - **Publishing**: category, countries (CEMAC ticks the six), related securities (10, the first
    one's code the amber subject), language, type (fixed once published), go live now or at a
    day and time of Douala (tomorrow 08:00 by default), Preview, then Publish, Schedule or
    Update. The button stays off, its missing fields listed under it, until they are filled and
    the rights box ticked. Withdraw sits in the title bar of a published or scheduled item.
  - **File import**: the CSV and XLSX templates in the title bar, the drop zone (CSV, XLSX or
    ZIP, 50 MB), the last import (rows read, published or scheduled, updates of a known
    `external_id`, errors), its rows in error ("Row 5: Unknown security code “SEMCX”") with
    "Fix row" and "View details", and "Publish N rows" while valid rows wait. Followed every
    second while its job checks it.
- **Shared with PUB NEW**: `shared/ui/rich-text` holds what both editors use (`ToolButton`,
  `LinkDialog`, `ApiImage`, `isLinkAllowed`) and the reader of both, `RichTextView`, to which
  PUB's charts and the news cards are nodes of their own (`renderBlock`). The editor's generic
  strings moved to `richText` (core). `SecurityListField` moved to `entities/security`, and the
  limits of an item to `entities/news`.
- **N**: an ARTICLE's body is drawn from the document (quotes, images with their credit under
  them), each "CMarket security" card with its live price (`QuoteCard`), its PDF under it.
- **CMarket.Api** (phase 19):
  - `news.News` gains the status, `PublishAt`, `CreatedAt`, `UpdatedAt`, the newspaper's
    `ExternalId`, the PDF, the rights statement, the withdrawal and a row version; drafts may be
    incomplete, the check constraints hold the others complete. `news.NewsAttachments`,
    `news.NewsVersions` (every published state, the publication's first), `news.NewsImports`
    and `news.NewsImportRows`; `news.Sources` gains its site, language, rate per click, monthly
    cap and FLASH quota (20).
  - The migration `NewsStudio` makes every item so far a published one with its first version,
    an ARTICLE's paragraphs the blocks of the editor's document; down, it goes back to the
    paragraphs and drops what the second schema cannot hold. Tested up, again by the idempotent
    script, and down on SQL Server.
  - The scheduled items go live within the minute (a job every minute), at their time unless the
    job came late; their news alerts follow. A FLASH past the newspaper's 20 of its day is
    refused (409). A click after the withdrawal is excluded (`Withdrawn`).
  - The file import of spec section 16: a job reads the file and checks each row (unknown codes,
    a file missing from the ZIP, `publish_at` more than 24 hours past, a headline twice the same
    day, a FLASH too long or past the quota, a known `external_id` withdrawn or retyped); a fix
    checks the waiting rows again; Publish turns each valid row into its item, a ZIP's image
    first in the body with its credit, its PDF under it. Uploading counts as the rights
    statement.
  - An approved News provider's media gets its partner newspaper when it has none (decision 12).
  - The demo: Media I's studio as the mockup: the BEAC draft with its card, published items
    with 2,532 payable and 87 excluded clicks (XAF 50,640 at XAF 20), a FLASH scheduled for
    tomorrow at 08:00, the withdrawn BVMAC procedure, and yesterday's import with its row 5 in
    error.
- **Checked**:
  - Type check, lint, the 301 unit tests.
  - Every Playwright flow on CMarket.Api from a fresh database: 86. Four new ones: the studio as
    the mockup, a draft published to N, a FLASH scheduled then withdrawn, and (`@fresh-db`) the
    import's row fixed and published.
  - Each spec of `@fresh-db` flows on its own fresh database. All pass but the two of
    `analysis.spec.ts`, which fail before this step too.
  - axe (WCAG 2.2 AA) at 1600, 390 and 320 px, in English and French: NEWS NEW (a draft, a
    published, scheduled and withdrawn item, the schedule, "+ New", the image, card, preview,
    withdrawal, "Fix row" and details dialogs), N's ARTICLE with a quote and a card, PUB NEW,
    NEWS and ADMCFG: 76 audits, nothing found, nothing scrolls sideways. axe found a read-only
    editor's hidden file input taken for focusable content: `useKeyboardScrolling` leaves the
    hidden elements out.
