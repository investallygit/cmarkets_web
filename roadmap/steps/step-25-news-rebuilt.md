# Step 25 · News rebuilt (L): done

Step 25 of the [roadmap](../../ROADMAP.md#order), for the
[third version of the spec](../third-version.md).

CMarket.Api's phase 18.

- **Contract** (`contracts/news.ts`):
  - An item has its `type` (`article`, `flash`) and its newspaper, `source`: id, channel, short
    name, name, logo, verified, original link. It also has a `category` among the eight
    (decision 4), a `subject` (the amber code: SEMC, BEAC), its `countries` (the six for CEMAC),
    its `securityIds` (ten at most), its `language`, and an `excerpt`: an ARTICLE's standfirst,
    none for a FLASH, whose text is its content.
  - The feed, `GET /news?type=&channel=&sourceId=&securityId=&country=&category=`, gives no
    content. `GET /news/{id}` gives it (`summary`, `body`, `author`, `updatedAt`).
    `POST /news/{id}/view` records the unique click and always answers 204.
  - `GET /news/sources` lists the newspapers for the N filter: an addition to section 10.
  - `NewsPublished` carries the type, the channel and the source. MSG's news card and the
    notifications carry the two tags too.
- **Tags** (`entities/news`):
  - `NewsTypeTag` is FLASH red or ARTICLE blue. `NewsSourceTag` is teal for a partner, grey
    for the international API, green for the AI and CMarket.
  - 18 px high, Inter 10.5 px bold, a 1 px border, the colour at 15% on the panel. The background
    is opaque, so that a hovered or selected row keeps 4.9:1 at the least; a tint would leave
    2.9:1 on a selected row.
  - The newspaper's card (`shared/ui/HoverCard`) shows on hover and focus: name, logo or
    initials, channel, original link. Escape closes it, and it follows its tag when the page
    scrolls.
  - A click on a tag filters N (`/n?type=flash`, `/n?source={id}`). In a list the tags take the
    pointer only, since the filter bar does the same from the keyboard. `useKeyboardScrolling`
    no longer counts the links taken out of the tab order.
  - They show on MKT, N, the N tab and the DOC · N panel of DES, the notifications (MKT, ALRT),
    MSG's news card and NEWS.
- **MKT**: ALL · ISSUERS · REGULATOR filter the categories issuers and regulation.
- **N**:
  - Filters by security, country, category, type and newspaper, kept in the address.
  - The content shows the newspaper's name and channel, the author, "Updated on …" and the
    original article.
- **Unique click** (`useNewsView`): the content shown 3 seconds in a visible tab sends the view,
  once per item and tab. A hidden tab pauses the time.
- **NEWS** (Data admin):
  - An item of the CMARKET channel: its type, an ARTICLE's standfirst and body or a FLASH's
    500 characters (the body field goes), the headline (150), subject, category, language,
    countries (CEMAC ticks the six) and securities.
  - The list shows the CMARKET channel's items, with their type tag, subject, category and
    countries. The newspapers' items wait for the moderation of step 27.
- **ALRT**: a news alert follows a security or a country (decision 5); the type reads "News".
- **CMarket.Api** (phase 18):
  - The schema `news`: `Sources`, `News` with `NewsCountries` and `NewsSecurities`, and
    `NewsUniqueViews`, partitioned by month on SQL Server. The pair of item and user is unique
    across the months.
  - The migration `NewsOfTheThirdVersion` moves `data.News` there. The items become ARTICLEs of
    CMARKET, their topic a category, their source code the subject, their first paragraph the
    standfirst when it fits. The news shared in messages get the new shape.
  - The unique click keeps the exclusion that sets it apart: the newspaper's own accounts (its
    media organisation), CMarket's employees, suspended accounts and accounts less than a day
    old. Also automated access: a headless browser or a robot, a view less than 3 seconds after
    `GET /news/{id}` gave the content, or past 120 views an hour, until the Admin sets the cap
    in step 27.
  - A FLASH goes out on the channels of the news alerts of its securities and countries, its tags
    first ("[FLASH · MEDIA I] SEMC: …"). An ARTICLE notifies in the app only.
  - The demo has newspapers of the four channels and 19 items, those of the screen 1 mockup first,
    in French and English. The demo market publishes five more, a FLASH of Media I first.
  - Step 24's sixth partner organisation, Daily Z, is Douala Éco now: screen 1 shows DAILY Z in
    green, a story the AI processed, and screen 18 has no Daily Z.
- **Moved**: the scheduled items published on time and the clicks after a withdrawal come with
  the studio (step 26), which schedules and withdraws. The Admin's cap of views an hour comes with
  SRC (step 27).
- **Checked**:
  - Type check, lint, the 287 unit tests.
  - Every Playwright flow on CMarket.Api from a fresh database: 83 flows. A new one covers the
    tags, their card, the filters and the unique click; NEWS's flow enters an ARTICLE and tries a
    FLASH.
  - Each spec of `@fresh-db` flows on its own fresh database. All pass but the two of
    `analysis.spec.ts`, which fail before this step too: the sector averages drift with the live
    demo prices.
  - axe (WCAG 2.2 AA) at 1600, 390 and 320 px, in English and French: MKT, N (a FLASH, an
    ARTICLE, the newspaper's card open), DES and its N tab, ALRT and its news alert on a country,
    MSG's news card and NEWS. Nothing found, nothing scrolls sideways.
