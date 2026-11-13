# Third version of the spec

Built in steps 23 to 36: see the [order of the roadmap](../ROADMAP.md#order) and the files of
[`steps/`](steps).

The version of 10 November 2026 (96 pages, against 56), compared sentence by sentence and image by
image with the second. Sections 1, 2, 4 and 13 are unchanged, and so are the formulas of 14.1 to
14.3 and the planned enhancements, which move from section 16 to section 17. The mockups of
screens 2, 4 to 8 and 11 are the same images; those of screens 1, 3, 9, 10 and 12 are redrawn.

- **Account types** (sections 6, 12 and 15): nine. The News provider is a seventh client type, for
  media managers who publish flashes and articles under their newspaper's name and are paid per
  unique click. An Admin approves it on a letter from the media and a signed content agreement,
  which brings the VERIFIED badge, and links it to its newspaper (a source); several accounts may
  publish for one source. In the matrix it has the prices; the order book, the analysis, the
  curves and the calculator read only; no export, no portfolio, 20 alerts; the research, read and
  bought; the directory and the messaging. Two rows are new: "Publish news (entry or file)" (the
  News provider under its source, the Data admin) and "News read statistics" (the News provider
  for its source, the Data admin, the Admin); the permissions named add `news:write`. Its badge is
  teal, `#2EC4B6`; "Who can contact me" has seven types, Direct by default for the News provider.
- **News** (sections 5 and 16, new): four channels feed it: partner newspapers (screen 13), an
  international news API (EODHD `/news`, every 15 minutes), CMarket's AI (an ingestion API, server
  to server) and the Data admin. An item is an ARTICLE (standfirst of 400 characters, body of
  10,000, images and a PDF) or a FLASH (150 and 500 characters, no image, pushed to the users
  following its securities or countries, 20 a day per newspaper), in one of eight categories, for
  one or more countries ("CEMAC" for the six), in French or English, published at once or at a
  time of Douala. It carries its newspaper (`source`: id, channel, short name, name, logo,
  verified, original link) and shows two tags wherever it appears: its type and its newspaper,
  coloured by channel. The feed no longer returns the content: `GET /news/{id}` does, and
  `POST /news/{id}/view` records a unique click once the content showed 3 seconds in an active
  tab. A partner newspaper is paid per unique click, monthly, within a cap; some clicks are
  excluded (its own accounts, employees, suspended or day-old accounts, automated access, clicks
  after withdrawal or invalidated) and anti-fraud checks alert the Admin.
- **Screens** (section 9): twenty. 13 NEWS NEW, the news studio of a News provider; 14 SUBS,
  subscription management (Admin); 15 ETFS, the ETF screener; 16 BP, bond pricing, which YAS now
  opens; 17 BS, the bond screener; 18 MPAY, media payments (Admin); 19 and 20, the ETF and bond
  profiles, which DES opens by the security's type. Screen 1's news shows the two tags, screen 3
  adds the security's description, screen 9 counts nine types, screens 10 and 12 list the News
  provider. The client menu adds NEWS for a News provider; ETFS sits under EQS, BP and BS under
  YCRV (each has an entry of its own since [the spec author's answers](#the-spec-authors-answers)).
  The Admin's menu becomes USER, SUBS, MPAY, ANLY, MOD, PAY, CFG, AUDT.
- **API** (section 10): `/provider/*` for the studio; `/news` with its type, channel and source,
  and `/news/{id}/view`; `/ingest/*` for the AI (an API key, an HMAC-SHA256 signature, allowed
  addresses, 1,000 items an hour); `/admin/news*`, `/admin/news-sources`, `/admin/publishers`,
  `/admin/ingest-clients`; `/admin/news-statements*` and `/admin/news-clicks*`, with a second
  Admin's confirmation; `/admin/subscriptions*`; `/etfs*`; `/bonds/price`, `/bonds/screener*`,
  `/bonds/{id}/analytics*`, `/cashflows` and `/ratings`; saved ETF and bond screens; the type and
  the description of `/securities/{id}`.
- **Data** (section 11): the bond list (`BOND_MASTER`) and its ratings (`BOND_RATINGS`), two ETF
  files ("ETF profiles", "ETF NAV and spreads"); every night, each bond's figures (a model price
  when its last quote is more than 5 sessions old) and each ETF's performance.
- **Formulas** (sections 14.4 and 14.5, new): current yield, yield to worst, credit spread,
  Z-spread, effective duration and convexity, composite rating; an ETF's returns, premium or
  discount, bid-ask spread, distribution yield, tracking difference and tracking error.
- **Back end only** (section 7): the `news` schema, which replaces `data.News`; the ETF and bond
  tables.

## Decisions taken

Where the third version is silent or contradicts itself, steps 24 to 36 follow these choices;
each is also an open question for the spec author.

1. **The News provider's menu**: as the text says, NEWS (the studio) after N, and no PORT; the
   screen 13 mockup lights N and shows PORT.
2. **The NEWS code**: the Data admin's news and documents screen keeps NEWS; the studio's code is
   NEWS NEW, labelled NEWS in the News provider's menu. The command bar resolves a code among the
   screens the account opens, so the two never meet.
3. **Spelling of codes**: the API that the front end reads keeps its style (`etf`, `flash`,
   `ratesDebt`, `newsProvider`, `bond-master`); the ingestion API and the uploaded files (news,
   bonds, ETFs) take the spec's codes as written (`FLASH`, `RATES_DEBT`, `SOVEREIGN`), since other
   teams write to them.
4. **Topics and categories**: the eight categories replace the three topics, in the items and in
   the feed's filter (`category=`, the spec's `topic=`); MKT's ISSUERS and REGULATOR filter the
   categories of those names.
5. **Followers of a FLASH**: the users whose news alerts watch one of its securities or countries,
   as a publication reaches the alerts of its security and country; no new way to follow.
6. **News administration, without a mockup**: pending and reported items are moderated in the
   Data admin's NEWS (approve, take down, retype), which also keeps the publishers (domain →
   name), and in MOD for the Admin; a new Admin screen, SRC, holds the newspapers (members, rate,
   cap, FLASH quota, moderation mode), the AI's settings and the ingestion clients.
7. **Subscriptions**: a renewal charges the stored card, or sends a payment request to the mobile
   money number, through the payment port, a simulated provider standing in until a real one keeps
   cards. A failed charge is tried again for 7 days, while SUBS shows "Payment failed", then the
   plan expires. A change of plan is prorated by the day; a suspension cuts access at once, until
   the Admin lifts it; a media's News providers share a "Media source" plan at XAF 0, paid by
   "Agreement".
8. **EODHD**: news, ETFs and curves are built and tested against EODHD's answers, with demo data
   until the commercial licence; the "ETF profiles" and "ETF NAV and spreads" files fill what it
   lacks; EUR and USD spreads show n/a until the codes of their government curves are confirmed.
9. **Descriptions**: the Data admin writes a security's French and English text
   (`PUT /data/securities/{id}/description`, from CORR); EODHD's English text fills Europe and
   the US, and stands in, marked EN, where no French was written.
10. **Flags**: country flags come from `flag-icons` (MIT), one SVG per country; lucide-react stays
    the icon set.
11. **Automated access**: a view counts only if it comes 3 seconds or more after the same user
    read the item's content, from a browser that is not headless, below a number of views an hour
    per account that the Admin sets.
12. **A News provider's newspaper**: the media is the provider's organisation, as a CEO's; the
    source of a partner newspaper belongs to it, and the approval links the provider to it.
13. **Permissions**: `news:write` (the studio: an approved News provider), `news:stats` (read
    statistics: the News provider for its source, the Data admin, the Admin), `news:moderate`
    (moderation and publishers: the Data admin, the Admin), `news:payments` (MPAY and SRC: the
    Admin), `subscriptions:manage` (SUBS: the Admin). Each comes with the endpoints it guards, as
    CMarket.Api does for every key, since the front end opens a screen to whoever holds its key:
    `news:write` and `news:stats` with the studio (step 26).

## The spec author's answers

- **ETFS, BP and BS in the menu** (12 November 2026): each has an entry of its own in the client
  menu, after the one its mockup lights: MKT, EQS, ETFS, YCRV, BP, BS, PORT, and the rest as
  before. A profile lights the screener that lists its type, BS for a bond and ETFS for an ETF
  (the mockups of screens 19 and 20 light EQS and YCRV). Collapsed, an entry of the menu is now
  44 px high, as the mockups draw it, against 56 px before, so that a client's thirteen entries
  fit at 900 px.
