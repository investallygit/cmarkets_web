# Step 24 · News provider (M): done

Step 24 of the [roadmap](../../ROADMAP.md#order), for the
[third version of the spec](../third-version.md).

CMarket.Api's phase 17.

- **Type**: `newsProvider` is the seventh client type, after the CEO, in `ACCOUNT_TYPES`,
  `CLIENT_ACCOUNT_TYPES` and `VERIFIED_ACCOUNT_TYPES`. Like an Analyst, a Journalist and a CEO, it
  waits for an Admin's approval, then gets the VERIFIED badge. Until the studio (step 26) its
  permissions are a Journalist's, the matrix's "Read" rows: prices, the order book and the
  analysis without saving, no export, no portfolio, 20 alerts, the research, the directory and
  the messaging. `news:write` and `news:stats` come with the studio's endpoints (decision 13).
  Its home screen is MKT, and PORT is not in its menu.
- **Sign-up**: the News provider names its media, whose organisation the sign-up opens with the
  provider as its administrator, as a CEO's (decision 12). It sends two documents, both required:
  a letter from the media (`mediaLetter`) and the content agreement the media signed
  (`contentAgreement`). The form gives the media's hint and the note on the Admin's check.
- **Admin**: USER counts nine types on one row (`xl:grid-cols-9`, three by three below), as on the
  redrawn screen 9. ANLY lists and approves a News provider's request, with its two documents.
  ADMCFG sets its quotas and shows its column of the permission matrix.
- **Directory**: a News provider is listed, with the teal NEWS PROVIDER badge
  (`--type-news-provider`, `#2EC4B6`, 5.3:1 on a selected row, so no lighter shade is needed).
  NET filters on it. "Who can contact me" in NET ME has a seventh row, Direct by default, and the
  Admin's directory settings have its default rule and its 20 new conversations a day.
- **Home page**: seven client types in rows of three, the last one centred. The News provider's
  card shows a newspaper's printing press (Pexels 36376366, where no newspaper's name shows).
- **French**: the type is "Éditeur de presse".
- **CMarket.Api** (phase 17):
  - The type, its default permissions, quotas and plans; the checks of `usr.Users` and of the
    contact rules, widened by the migration `NewsProviderAccountType`.
  - The demo accounts: L. Mballa of Media I, a demo account on the login page, and two
    colleagues, S. Nana and J. Edzoa. Eleven generated providers of six partner newspapers
    (Daily K, Éco Hebdo, Gabon Éco, Congo Info, Tchad Matin, and Daily Z, which step 25 renames
    Douala Éco) make the 14 of screen 9.
    They are generated last, so the other generated accounts keep their numbers.
  - The directory lists 1,177 profiles, 14 of them News providers.
- **Checked**:
  - Type check, lint, the 271 unit tests.
  - Every Playwright flow on CMarket.Api from a fresh database: 82 flows, among them a new one
    for the News provider, with the counters of USER and NET.
  - Each spec of `@fresh-db` flows on its own fresh database. The two `@fresh-db` flows of
    `analysis.spec.ts` fail, on the API before this step too: the sector averages of EQS and FA
    drift with the live demo prices.
  - axe (WCAG 2.2 AA) at 1600, 390 and 320 px, in English and French, on the home page, the
    sign-up, MKT, NET, NET ME and CFG as L. Mballa, and USER, ANLY and ADMCFG as the Admin:
    nothing found, nothing scrolls sideways.
