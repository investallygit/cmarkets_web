# Roadmap

Screen-by-screen plan to finish the front end of `CMarket-developer-spec-EN.pdf`, the version of
13 November 2026; the earlier versions are kept as `CMarket-developer-spec-EN-v1.pdf` (29 October),
`CMarket-developer-spec-EN-v2.pdf` (2 November) and `CMarket-developer-spec-EN-v3.pdf` (10
November).

Every screen of the first three versions is built: the client terminal (MKT, DES with its FA and ANA
tabs, EQS, ETFS, YCRV, BP, BS, PORT, PUB, PUB NEW, NET, MSG, NET ME, N, NEWS NEW, CAL, ALRT and
CFG, DES opening the equity, bond or ETF profile) with the public profile page and the login,
sign-up and password reset pages, the back-office of the Data admin (IMP with DATA, HIST and EODH,
then CORR and NEWS) and that of the Admin (USER with ANLY and MOD, SUBS, MPAY, SRC, ADMCFG, AUDT
and PAY), and the home page that visitors see before login. The second version added the
Journalist and CEO account types and the professional directory with its messaging (screens 10
to 12): steps 11 to 19, under [Second version of the spec](#second-version-of-the-spec). The third
version added a ninth account type, the News provider, a news feed rebuilt around partner
newspapers paid per unique click, and eight screens (13 to 20): steps 23 to 36, under
[Third version of the spec](#third-version-of-the-spec). The fourth version adds a tenth account
type, the SVT, requests for quotes on government securities, and nine screens (21 to 29): steps 37
to 48, under [Fourth version of the spec](#fourth-version-of-the-spec). What remains is listed
under "Still to do", in those steps and in the open questions for the spec author.

ANLY and MOD were built with USER: in the mockups they are panels of the same screen. Sizes are
relative: S < M < L < XL.

## Order

| Step | Work                                                               | Status |
| ---- | ------------------------------------------------------------------ | ------ |
| 1    | Shared groundwork, batch 1: form kit, `PriceChart`, XLSX export    | Done   |
| 2    | DES                                                                | Done   |
| 3    | Watchlist editing (MKT), N, CAL, ALRT                              | Done   |
| 4    | EQS / FA, then YCRV / YAS                                          | Done   |
| 5    | PORT                                                               | Done   |
| 6    | PUB, then PUB NEW                                                  | Done   |
| 7    | CFG, login and OTP (needed before connecting the real back end)    | Done   |
| 8    | Back-office: IMP (with DATA, HIST, EODH), then CORR, then NEWS     | Done   |
| 9    | Admin: USER (with ANLY, MOD), then ADMCFG, AUDT, PAY               | Done   |
| 10   | Home page, before login: the product, markets, users, plans        | Done   |
| 11   | Second version of the spec: the plan, its open questions           | Done   |
| 12   | Journalist and CEO account types, approved by the Admin            | Done   |
| 13   | Portfolios shared with the organisation, read by its CEO           | Done   |
| 14   | NET ME: professional profile, visibility and contact rules         | Done   |
| 15   | NET: professional directory, public profile page                   | Done   |
| 16   | MSG: conversations, contact requests, files, shared objects        | Done   |
| 17   | MSG in real time: the `/hubs/chat` hub                             | Done   |
| 18   | Admin: reported profiles and conversations, directory settings     | Done   |
| 19   | Second version done: README, accessibility, every flow             | Done   |
| 20   | Connecting `CMarket.Api`: `.env`, the API module, its checks       | Done   |
| 21   | The mock removed: every screen on `CMarket.Api`                    | Done   |
| 22   | The Azure demo checked                                             | Done   |
| 23   | Third version of the spec: the plan, its decisions, questions      | Done   |
| 24   | News provider account type, approved by the Admin                  | Done   |
| 25   | News rebuilt: ARTICLE, FLASH, newspapers, tags, unique clicks      | Done   |
| 26   | NEWS NEW: the news studio of a News provider (screen 13)           | Done   |
| 27   | News administration, AI ingestion, international news              | Done   |
| 28   | MPAY: media payments (screen 18)                                   | Done   |
| 29   | Daily bond analytics, BS: bond screener (screen 17)                | Done   |
| 30   | BP: bond pricing (screen 16)                                       | Done   |
| 31   | Bond profile (screen 20), the profile chosen by security type      | Done   |
| 32   | ETF data, ETFS: ETF screener (screen 15)                           | Done   |
| 33   | ETF profile (screen 19)                                            | Done   |
| 34   | SUBS: subscription management (screen 14)                          | Done   |
| 35   | Security descriptions on EQS (screen 3)                            | Done   |
| 36   | Third version done: README, accessibility, every flow              | Done   |
| 37   | Fourth version of the spec: the plan, its decisions, questions     | Done   |
| 38   | Rate series, the CEMAC sovereign yields file, stale curve points   | To do  |
| 39   | FX: the XAF's cross rates on the ECB's reference rates (screen 26) | To do  |
| 40   | ECO: macroeconomic dashboard (screen 25)                           | To do  |
| 41   | CMDTY: commodities, the profile of a commodity (screen 21)         | To do  |
| 42   | OPT, OPT RES: portfolio optimisation (screens 28 and 29)           | To do  |
| 43   | SVT account type, licensed SVTs, trader links, `/hubs/rfq`         | To do  |
| 44   | RFQ: requests for quotes on BTA and OTA (screen 22)                | To do  |
| 45   | SVT: approval of the agreements, tickets by e-mail (screen 27)     | To do  |
| 46   | RFQ AGR: agreements (screen 23)                                    | To do  |
| 47   | RFQ REP: daily reporting to the BEAC (screen 24)                   | To do  |
| 48   | Fourth version done: README, accessibility, every flow             | To do  |

## Second version of the spec

The version of 2 November 2026 adds the professional directory and its messaging, with two client
account types, Journalist and CEO. Sections 1 to 5, 8, 11, 13 and 14 are unchanged, and so are the
mockups of screens 1 to 8; the planned enhancements move from section 15 to section 16.

- **Account types** (sections 6 and 12): eight. Journalist and CEO are clients and mostly read: in
  the permission matrix, "Read" means viewing without creating or saving anything (no saved
  screens, no saved drawings, no portfolios). A Journalist has the prices, the research and the
  directory, reads the order book, the analysis, the curves and the calculator, exports nothing,
  holds no portfolio and sets 20 alerts. A CEO has the same with the exports, and reads the
  portfolios that the managers of the organisation share with it, without changing them. Analyst,
  Journalist and CEO get their permissions and a green VERIFIED badge once an Admin approved them:
  identity and background for an Analyst, a press card or an employer letter for a Journalist, a
  proof of position and a link to an organisation for a CEO.
- **Permission matrix**: three new rows. The six client types and the Admin browse the directory;
  the six client types are listed in it; the six client types write to each other within the
  contact rules, and the Admin reads reported conversations only. Data admins have none of them.
- **Screens** (section 9): 10, the professional directory (NET); 11, messaging (MSG); 12, my
  profile, visibility and contact (NET ME). The client menu becomes MKT, EQS, YCRV, PORT, PUB, NET,
  MSG, N, ALRT, CFG, less the entries outside the account's permissions (PORT for a Journalist). A
  type badge takes the type's colour: Student #36C5F0, Analyst #FF9F1A, Manager #19D27A, Trader
  #B07CFF, Journalist #FF7AB6, CEO #E0C068. The screen 9 mockup is redrawn with eight counters
  (Journalist 37, CEO 58) and E. Fouda, CEO of Bank C, in the list.
- **API** (section 10): the directory and the profiles (`/directory` and its facets,
  `/profiles/{userId}` and its contact permission, `/public/profiles/{slug}`, `/me/profile` with
  its photo, experiences and privacy, reports and blocks); messaging (`/conversations` with their
  messages, read, accept, decline, mute, members and report, `/attachments`, `/messages/search`);
  `/admin/reports` and `/admin/conversations/{id}` for the Admin; a second hub, `/hubs/chat`.
- **Rules** (section 15, new): the fields of a profile; three levels of visibility (hidden, CMarket
  members, public at `/p/{handle}`); who may contact the user, by type: direct, request or no;
  blocks; limits against abuse; groups of up to 50; messages of up to 4,000 characters; files of up
  to 10 MB, scanned before use; securities, charts and publications shared; 24 months of retention.
- **Back end only** (section 7): the `net` schema, with the message bodies encrypted.

The prototype's answers where the spec is silent are in the open questions.

### Step 11 · The plan (S): done

The second version is now `CMarket-developer-spec-EN.pdf`, the first one
`CMarket-developer-spec-EN-v1.pdf`; this section, the order above, the status of the screens to
come in the README and the open questions of the second version.

### Step 12 · Journalist and CEO (L): done

- **Types and permissions**: `journalist` and `ceo` are account types and client types, with the
  permissions and quotas of the matrix (20 alerts each; a CEO exports, a Journalist does not;
  `portfolios:read` for a CEO only). "Read" is the new `analysis:save`: without it, EQS has no
  SAVE and no saved screens, GP no drawing tools, and the server refuses both saves (403); the
  Journalist and the CEO lack it, the other clients have it. Watchlists and alerts stay. PORT is
  out of a Journalist's menu; a CEO's says that the organisation's portfolios come from its
  managers (step 13).
- **Approval**: `analystStatus` and `analystDecision` became `verificationStatus` and
  `verificationDecision`, in `/me` and the Admin's account DTOs, for an Analyst, a Journalist or
  a CEO; an approved one shows the green VERIFIED badge in CFG (`VerifiedBadge`). The sign-up asks
  a Journalist for a press card or an employer letter, a CEO for a proof of position and the
  organisation they head. ANLY and the panel of screen 9 list the three kinds as "Status
  requests", each with its type; the audit log records `status-approve` and `status-reject`, with
  the type as the scope of the change. An Admin who creates an account of one of the three types,
  or changes an account to one, approves its status with it.
- **Admin**: USER counts the eight types in one row as on the redrawn screen 9; ADMCFG has the
  quotas of the six client types and the eight columns of the permission matrix.
- **Colours**: `--type-student` to `--type-ceo`, the badge colours of section 9, for every place a
  type shows, screen 9 included; on the selected background the Trader's purple becomes
  `--type-trader-selected` (5.0:1). axe finds nothing on the screens changed, for each new type.
- **Home page and login**: the six client types in two rows of three, with two more photos from
  Pexels (their numbers in `photos.ts`; the photographers' names could not be read, Pexels
  refusing automated access, and the licence does not require them); R. Tamba (Journalist,
  screen 11) and E. Fouda (CEO, screens 9 and 11) are demo accounts and in the account switch.
- **Mock**: R. Tamba, an individual account, pays Analysis monthly by card; E. Fouda heads
  Asset manager A, not Bank C as on screens 9 and 11, since Bank C's plan lacks the Portfolio
  module that the organisation's portfolios need; 37 Journalists of three media and 58 CEOs of
  the generated banks and asset managers fill the counters; `SEED_VERSION` raised.
- **CMarket.Api**: `/me` answers `verificationStatus`, with the two new types and `analysis:save`
  (its phase 13).

### Step 13 · Portfolios of the organisation (M): done

- **Sharing**: the settings of a portfolio held by a member of an organisation have "Share with
  Asset manager A", sent as `sharedWithOrganization` with `POST /portfolios` and
  `PUT /portfolios/{id}` (the spec names no endpoint: open question). `GET /portfolios` lists the
  user's portfolios, then those colleagues share, each with `sharedBy`, the colleague who holds
  it: every member who reads portfolios gets them, a CEO among them, who holds none. The owner
  sees SHARED next to the name; the others "Shared by P. Owona" and READ ONLY, and the selector
  lists them under "Shared with the organisation".
- **Read only**: on a colleague's portfolio, PORT has no new transaction, import, correction,
  settings, deletion, limit change or report: no Reports tab, no report link under the income.
  The panels ask `usePortfolioAccess` (`features/manage-portfolios`); the server answers 403 to
  every write and to a report. The quota counts the user's own portfolios only.
- **Approval**: a member whose status waits for an Admin, or was declined, reads none of the
  organisation's portfolios; a CEO's PORT says why.
- **Alerts**: a portfolio limit alert may watch a portfolio the user reads, as a CEO watches the
  organisation's fund. An account type without portfolios (a Journalist) is offered no portfolio
  alert, the server refuses one, and its sample alerts have none.
- **Mock**: each user's portfolios are read for a colleague too (`usersStore`, `db/session.ts`);
  P. Owona shares the sample fund with Asset manager A. A demo user's sample portfolios keep
  their short ids (`/port/portfolio-cemac`); another user's carry the user's id, since a
  colleague's are listed beside one's own. `SEED_VERSION` raised.
- **CMarket.Api**: the two fields, the colleagues' read access and the 403 on their writes (its
  phase 13).

### Step 14 · NET ME · My profile, visibility and contact (screen 12) (L): done

- **Built**: the three panels of the mockup. My profile: the photo (JPEG or PNG up to 2 MB, sent
  at once), the type and VERIFIED badges, which the user does not change, the name, job title,
  organisation, city and country, languages, about with its count of 600, up to 8 specialties of
  the Admin's list, experience and certifications (each saved on its own), contact details.
  Visibility and contact: Hidden, CMarket members or Public; Direct, Request or No for each of the
  six client types; the work e-mail, phone, online status and, for an Analyst, the publication
  statistics shown or not. The card preview: the card as the directory will show it, changes not
  saved included, seen by each client type, and which types see which button. One SAVE sends the
  profile and its privacy; the title bar says when it was saved, or that changes wait.
- **Shared**: `entities/profile` holds the avatar (photo or initials, circled in the type's
  colour), the type badge, the directory card and its contact button, which NET and MSG will
  reuse; the type colours moved to `shared/config/accountTypes.ts`. A `Switch` joins the form kit
  (and `/_kit`), `format.language` names the languages.
- **Access**: `NET ME` in the command bar and in the user menu; NET joins the left menu with the
  directory (step 15). Three permissions in the matrix, under "Directory and messaging":
  `directory:list`, `directory:profile` and `messages:write`; the six client types have them, the
  Admin browses the directory, the Data admin has none.
- **Mock**: the demo clients' profiles, K. Atangana's that of the mockup, with the 42 notes
  published in the library, their 4.4 and 412 followers; any other client starts from the
  account. The contact rules as pure, tested logic (`lib/contact.ts`: a block first, then the
  employees, a conversation already open, a hidden profile, the rule of the sender's type; Direct
  by default, Request for a Student). The checks of the profile, the privacy and the experiences
  (`lib/profile.ts`); `SEED_VERSION` raised.
- **Since**: the people blocked, with the messaging (step 16); the Admin's default contact rules
  and specialties (step 18).
- **Still to do**: choosing the square of the photo (the mock keeps its centre).

### Step 15 · NET · Professional directory (screen 10) (L): done

- **Built**: the three panels of the mockup. Filters: the text (name, organisation, job, city or
  specialty, without accents), the six types in their colours with the counts of the whole
  directory, country, specialty, organisation and language with theirs, "Only profiles I can
  contact", "Analysts who published in the last 90 days", RESET; the note that hidden profiles and
  CMarket staff are not listed. Results: "PROFESSIONALS: 64 RESULTS", the cards in two columns,
  20 a page, sorted by relevance, name or newest members; each card's button follows the
  profile's rule for the user: amber CONTACT, "Send a contact request", or a greyed "Contact not
  open"; the user's own card leads to NET ME. Profile: about, specialties, experience, the three
  latest publications with their price, who may write ("Accepts messages from…", the requests in
  amber) and the contact details shown, then Send a message, Follow analyst, View their
  publications (PUB) and Report this profile. The search and the profile open live in the URL
  (`/net?types=analyst,manager&specialty=sovereign-bonds&contactable=1&profile=user-ndong`); the
  first result opens when none is chosen.
- **Public page**: `/p/{handle}`, outside the app shell and without login, in the brand colours:
  the profile without its contact details or rules, and "Log in to contact", which opens it in
  NET once logged in ("Open in CMarket" for a visitor already logged in). M. Ndong's and
  L. Fotso's profiles are public; another one says it is not.
- **Reused**: PUB takes `?analyst=` ("Publications of M. Ndong", and back to all the analysts),
  sent as `/library?analystId=`; Follow is the library's (`/analysts/{id}/follow`), in a button of
  its own; the report dialog follows that of the publications, with its own reasons. Send a
  message and Send a contact request say that the conversation comes with MSG (step 16).
- **Shared**: `entities/profile` gains the directory's queries, the order of the experiences and
  their period, and the statistics line, which NET ME uses too; `useVisitorStatus` moved from the
  home page to `entities/session`; `Checkbox` takes a colour of its own (the types, shown on
  `/_kit`); `ButtonLink` has the terminal's primary, secondary and info looks. The hidden inputs
  of `Checkbox`, `Switch` and the NET ME radios stay inside the panel that scrolls, so that their
  focus shows.
- **Access**: NET in the left menu after PUB and in the command bar, with `directory:list`; the
  Admin, who has it too, reads the profiles from MOD (step 18).
- **Mock**: the directory lists the 2,054 accounts of screen 9 (`fixtures/directory.ts` gives the
  generated ones their profiles, made on every load): the active clients whose profile is not
  hidden, 412 Students of 1,284 and every other client, 1,163 in all; the search of the mockup
  finds 64 for a Manager as for an Analyst. A. Tchakounté (closed to Managers) and B. Ngoma join
  the accounts with their employers; M. Ndong, D. Moussavou and the library's analysts have their
  profiles. The account lists of the Admin moved to `db/accounts.ts` (`allAccounts`,
  `anyAccount`), which the directory reads too. The search, its orders and its counts are pure,
  tested logic (`lib/directory.ts`); a client waiting for an Admin's approval writes to nobody and
  nobody writes to them (`lib/contact.ts`); a handle is unique among all the accounts; the
  reports are kept for MOD (`profileReportStore`), one per reporter and profile. `SEED_VERSION`
  raised.
- **Since**: Contact opens the conversation, the blocks, a hidden profile open to its
  conversations (step 16); the online status, shown in MSG as the mockups draw it, and not on
  the cards (step 17); the reported profiles in MOD, the specialties in ADMCFG (step 18).

### Step 16 · MSG · Messaging (screen 11) (XL): done

- **Built**: the three panels of the mockup. Conversations: the search of the messages (the
  messages found, each opening its conversation at it), the tabs All, Unread (3), Requests (1) and
  Groups, the rows with the type badge or GROUP, the time, "You: …" or the author of a group, the
  unread count, a request in yellow, a muted bell; "+ NEW" opens a conversation with one person,
  or a named group with several. The thread: "K. ATANGANA · ANALYST", the history 50 at a time
  ("Load earlier messages"), the days Today, Yesterday or their date, received messages on the left
  on #1A1A1A, sent ones on the right on #1E3A5F with ✓ or ✓✓; the author edits a message within
  15 minutes, or deletes it for everyone ("This message was deleted."). The composer: Enter sends,
  Shift + Enter adds a line, the count near 4,000 characters, files (PDF, XLSX, CSV, PNG, JPEG,
  10 MB, five at most) and a security, a chart (1M to 5Y) or a publication of the library, shared
  as a card in amber that opens YAS, DES, GP or PUB, as it was when shared. The participant: the
  profile, View profile, Their publications, Mute, Block, Report conversation, the files shared;
  a group's members instead, which its creator adds or takes out, and Leave the group.
- **Requests**: the first message of a request waits, Accept or Decline above it; the sender reads
  that the request waits and writes again once it is accepted; a decline is not told, the
  conversation leaves the recipient's list. Contact and Send a contact request in NET open
  `/msg?to={userId}`: the conversation already open with the person, or a new one whose first
  message the person's rule turns into a request.
- **Blocks**: Block in MSG, after a confirmation; NET ME lists the people blocked, to unblock. A
  block closes the conversation both ways, hides the profile from the blocked person and leaves
  them "Contact not open"; a hidden profile stays open to the people it already talks with.
- **Shared**: `entities/conversation` (queries, limits, the days of a thread, the read receipt);
  `ReportForm` (`shared/ui`), which the reports of profiles and conversations share;
  `format.day`, the calendar day in the user's time zone.
- **Access**: MSG in the left menu after NET and in the command bar, with `messages:write`; a
  client whose status waits for an Admin reads that messaging opens once approved.
- **Mock**: the conversations of the mockup as P. Owona sees them, and K. Atangana's (a request
  from B. Eyinga, R. Tamba unread), counted back from a time kept on the first load so that the
  conversations and their messages agree after a reload. The rules are pure and tested
  (`lib/messaging.ts`: the state of a conversation for each member, the unread messages, the read
  receipts, the pages of 50, the 15 minutes, the search, the new conversations of the day: 20, 5
  for a Student); the routes are tested through MSW (`messaging.test.ts`). A file is scanned in
  2 seconds, one named "eicar" holds a virus; the bytes stay in the tab until a reload, the files
  of the mockup are made when downloaded. The reports of conversations are kept for MOD.
  `SEED_VERSION` raised.
- **Since**: the hub (step 17); the reported conversations in MOD, the defaults and daily
  limits in ADMCFG (step 18).

### Step 17 · MSG in real time (M): done

- **Built**: the `/hubs/chat` hub beside `/hubs/market` (`shared/realtime`): `ChatClient` and its
  SignalR implementation, which shares the connection code of the market's. A thread joins its
  conversation while it shows (JoinConversation and LeaveConversation, counted like the
  securities subscribed and sent again after a reconnection); the composer sends Typing every 2.5
  seconds at most while the user writes. `useChatRealtimeSync` (`entities/conversation`),
  mounted once by the app shell, connects the hub for the users who may write. MessageReceived
  adds the message to its thread and refreshes the rows; an open thread reads it first.
  MessageUpdated, MessageDeleted and ReadReceipt refresh the thread and its ✓✓.
  TypingIndicator shows "K. Atangana is typing…" under the last message, until 4 seconds after
  the last one or their message. PresenceChanged keeps the green dots of the rows and "· ONLINE"
  in the thread's title. ContactRequestReceived shows a toast. A new connection reads the
  conversations again, as it may have missed events.
- **Thread**: a new message scrolls into view when the user reads the end of the thread, or sent
  it; someone reading older messages stays where they are. "typing…" is a polite live region;
  screen readers hear "online" in the row, where the dot shows.
- **Menu**: MSG counts the unread messages and the requests waiting, muted conversations aside,
  on every screen but MSG, whose tabs count them (`UnreadBadge`).
- **Contract**: `online` on the members of a conversation, since PresenceChanged only tells the
  changes; null when the member hides it, or across a block.
- **Mock** (`src/mocks/chat.ts`): K. Atangana and M. Ndong online, the green dots of the mockup.
  As on screen 11, K. Atangana types then answers when P. Owona opens the thread; M. Ndong reads
  P. Owona's message (✓✓), types and answers; R. Tamba comes online to answer the Analyst, and
  leaves a minute later. Someone online without an answer scripted only reads; each answer comes
  once, and a block stops it. Half a minute after login, S. Mvondo's contact request reaches the
  Analyst. Who is online is kept by the tab: each load starts from the mockup. Tested with fake
  timers (`chat.test.ts`); the client side with a fake hub (`useChatRealtimeSync.test.tsx`).
- **Since, on CMarket.Api** (9 Nov 2026): `ConversationUpdated` opens the sender's thread when
  their request is accepted, and closes the thread of a member taken out of a group, who no longer
  reads anyone typing; a file's verdict comes as `MessageUpdated` (the thread asks every 3 s
  meanwhile, in case the event is missed). A message found by the search loads the older pages
  until it shows. The composer uploads five files at most of those chosen and says so; a message
  refused in a closed conversation says it is closed. A hidden tab reads nothing until it shows.
  The flows between two sessions replace the prototype's scripted people
  (`e2e/messaging-realtime.spec.ts`, with `person()` of `e2e/people.ts`).

### Step 18 · Admin: directory and messaging (M): done

- **MOD**: below the moderation queue of screen 9, which keeps its publications as the mockup
  draws them, "Reported profiles and conversations" (`GET /admin/reports`): a tag Profile or
  Conversation, Referred in red past the Admin's threshold, the latest reason; the accounts
  referred first. Opened beside them: the reports with their reasons, comments and senders,
  "Referred to the Admin: 4 open reports about Y. Abessolo", Dismiss the reports; the profile
  as the directory shows it, with its About; for a conversation, Read the conversation, which
  says that the reading is written to the audit log, then its members and messages
  (`GET /admin/conversations/{id}`), a deleted one deleted. The account follows with the actions
  of USER: Change type, Reset two-factor authentication, View audit log, Suspend, and Open in
  USER. In the URL: `/admin/moderation?report=profile:user-abessolo`.
- **Rules**: an account is referred beyond the threshold of open reports (3 by default: the
  fourth refers it), counting the reports of its profile, of its direct conversations and of its
  notes. Dismissing closes the reports of a profile or a conversation, without telling their
  senders; suspending the account closes those of its profile and its direct conversations. The
  Admin reads any client's profile, and a conversation once reported only, whatever became of
  the report; each reading is a line of AUDT. USER: "Reports received" for every client, its
  notes', profile's and conversations' together, in red once referred.
- **ADMCFG**: two panels below the permissions. Directory and messaging: the default contact
  rules (the grid of NET ME, now `ContactRulesGrid` in `entities/profile`), the new conversations
  a day for each client type, the report threshold, saved together. Specialties: their names in
  English and French and the profiles listing each; add, rename, or remove one that no profile
  lists. NET and NET ME read the list again.
- **Audit log**: Reports dismissed, Reported conversation read (Moderation); Specialty added,
  renamed, removed (Settings); "Default contact rule, Student: Request → Direct".
- **Mock**: Y. Abessolo, a trader who promises 30% a month, reported by M. Ndong, L. Fotso and
  B. Ngoma, and by T. Bekale for their conversation: referred. R. Ondo, reported once. The
  defaults and limits apply at once: a profile never saved takes the new rules, the limit of the
  day counts. The pure rules in `lib/reports.ts`, the Admin's views in `reports.ts`, the routes
  in `handlers/admin/{reports,directory}.ts`, tested through MSW (`reports.test.ts`).
  `SEED_VERSION` raised.

### Step 19 · Second version done (S): done

- **Checked**: axe-core (WCAG 2.2 AA) on NET, a profile in NET, NET ME and MSG, with their
  dialogs, for each of the six client types, a client waiting for approval and the French texts;
  the screens a Data admin or an Admin may not open; MOD, ADMCFG, USER and AUDT; the public
  profile page. axe finds nothing at 1600, 390 and 320 px, and no page scrolls sideways. From the
  keyboard: Tab reaches every control of the new screens, the focus always shows and never sticks,
  and each dialog keeps it, closes on Escape and gives it back. Every Playwright flow passes; no
  file is over 700 lines.
- **Checked again**: every screen of both versions for each account type, the client waiting for
  approval, a client, the Data admin and the Admin in French, and the visitor, at 1600, 390 and
  320 px; the dialogs of the first version's screens at 1600 and 320 px. axe finds nothing, no
  page scrolls sideways, no column of a table is under 44 px, no translation key shows and the
  console has no error. The last four faults below were found then.
- **Fixed**:
  - A profile's latest publications in NET were links 18 px high, too close for 24 px targets
    (WCAG 2.5.8): 24 px now.
  - A dialog shown while some state holds (Leave the group, Delete a message, Remove a specialty)
    left the focus on the page once Escape closed it: `Dialog` now gives the focus back to the
    control that opened it when it leaves the page open, unless the action moved the focus or took
    the control away.
  - In a narrow window the columns given as a share of the width shrank to a few pixels (USER,
    whose sort buttons then overlapped, EQS, PORT, ALRT, CAL, CFG, IMP, HIST, CORR, NEWS, EODH,
    ANLY, PAY, AUDT): such a column now keeps 56 px (`columnTrack`), more for the columns of USER
    and the line items of the statements and ratios, and the table scrolls sideways in its panel
    instead. On a desktop only the invoices of CFG, cramped at 1280 px, scroll.
  - MSG cut the names of the conversations at 320 px ("R. …"): the badge goes below the name, the
    time stays on its right.
  - The figures of the bond calculator (YCRV, YAS) scroll in a short panel with nothing in them to
    focus, so the keyboard could not scroll them at 390 px (WCAG 2.1.1): they take the focus, as
    `ScrollArea` does.
  - The choices of a title bar (`PanelSelect`: the countries and instruments of the auctions in
    CAL, the transactions of PORT) were 14 px high, too close together at 320 px (WCAG 2.5.8):
    24 px now, as tall as the bar.
  - The countries of the yield curves' legend (YCRV, YAS) were 16 px high, too close together in
    French at 320 px (WCAG 2.5.8): 24 px now, in a legend as tall as before.
  - The public page of a profile that is not public, or no longer exists, took the directory's
    title: it is titled with what it says.
- **Added**: a Playwright flow from the keyboard alone (NET from the command bar, a profile found,
  Send a message, two lines sent with Enter, a dialog closed with Escape) and the titles of NET,
  MSG, NET ME and the public page.
- **Documentation**: the README (the directory and the messaging in the introduction and the mock,
  `ui-kit` among the pages, the shared components added) and this roadmap, each screen with the
  steps that built it.

### Step 20 · Connecting CMarket.Api (L): done

`CMarket.Api` (the back end's repository, phases 0 to 16) serves the routes, JSON and errors of
the mock: 202 of the mock's 203 routes are among its controllers, the last one being the
`accept`/`decline` pair of a contact request. The front end moves onto it in ten steps; each ends
with the type check, the lint, the unit tests and the flows of the screens it touches.

1. **Addresses in `.env`: done.** `VITE_API_URL`, the API's origin, gives the REST API and both
   hubs; a malformed one stops the dev server and the build. The images the API names by its own
   path (profile photos, a publication's images) show from its origin, and the studio keeps the
   path the API checks on save.
2. **`npm run dev:api`: done.** The mode `api` turns the mock off and forwards `/api` and `/hubs`
   to the API on port 5001: one origin, so the session cookie works as in production.
3. **The prototype's helpers on the API: done.** The demo accounts, the code filled in and the
   account switch follow `VITE_DEV_TOOLS`, on in the mode `api`: the API serves `/_prototype/*` in
   development. Checked in a browser: login, MKT with prices through the hub, a reload that keeps
   the session, the switch to the Data admin.
4. **Every screen on the API: done.** Each of the eight demo accounts opened every screen it may
   (the client screens with the eight tabs of a security and YAS, the Data admin's six, the
   Admin's six) on a fresh database: no request failed, the console stayed clean and no panel
   showed an error. The account form's `org-cmarket`, the mock's id, does no harm: the API leaves
   CMarket's organisation out of the list and places its employees itself.
5. **The API module: done** (`src/shared/api/endpoints/`): one file per controller folder of
   the API, each a route table and its calls; `routes.test.ts` checks every route against the
   API's OpenAPI (`openapi-routes.txt`, from `npm run api:routes`), and the mock's
   `routes.test.ts` that each has a handler.
6. **The hooks onto the module: done**, area by area: Auth, Me and the development tools; Market
   and Securities; Watchlists and Charts; Bonds and Analysis; Portfolios; Content and Alerts;
   Subscriptions and Organization; Research; the Data admin; the Admin; Network and Messaging.
7. **The module locked: done.** Only `src/shared/api/` imports the client (ESLint).
8. **`npm run test:api`: done.** About seventy reads, each made by every demo account its
   permissions and plan allow: 391 pass, 169 skipped as not allowed. It found one probe of ours
   wrong (the Admin may not read `/me/blocks`), nothing in the API.
9. **`npm run e2e:api`: done.** 77 of the 92 flows pass on the API, twice in a row from a fresh
   database, its rate limits on. They name demo records with `demoId()` (the API's GUIDs derive
   from the mock's ids); a flow that logs out takes a session of its own, one that arranges MKT
   starts from the default layout, one that changes the profile puts it back. The 15 tagged
   `@mock` stay on the mock: its simulated people (3) and service worker (1), its sample sector
   averages (2), and the data as seeded, which the other flows change on the one database (9:
   counts, the newest note first, P. Owona's password reset, the latest conversation). Each spec
   run alone on a fresh database passes on the API but for the first six.
10. **Wrap-up: done.** README: the scripts, the tests, the guide to the real back end.

What the check of 8 November found, all flows run on the API and each call of the module compared
with its OpenAPI (queries, bodies, answers: they match):

- `src/mocks/reports.test.ts` ("the referred account first") failed from 7 November: the reported
  conversation's times counted back from today, the profile reports' were fixed, and the newer of
  the two came first. The conversation now keeps fixed times as well.
- A layout change in its last 800 ms was lost when the tab closed or reloaded (no React cleanup
  runs then), and a save under way was cut short. The save now goes out on `pagehide`, kept alive.
- A build for the API (`VITE_USE_MOCKS=false`) still carried the mock and MSW, never loaded:
  `main.tsx` now tests `VITE_USE_MOCKS` as Vite writes it into the code, and such a build leaves
  them out (4.0 MB instead of 4.8).
- `CMarket.Api`, fixed there (its ADR-040): a GET of a route its output cache keeps
  (`/subscription/plans`, `/directory/specialties`, `/public/profiles/{slug}`) answered 500 when it
  waited on the cache's fill and the request filling it was cancelled by its browser:
  `OutputCacheMiddleware` shared the fill and its cancellation (reproduced, 2 rounds in 10). The
  three policies now turn the lock off (`SetLocking(false)`): each request that misses runs its
  own query. The same script then gave no 500 in 300 rounds.

Deployment (the environments' `.env` files, the site and the API on one domain, CORS) comes after.
The API's Bicep template gives it its default `*.azurecontainerapps.io` address while the site is
`staging.cmarket.example`: two sites, so the `SameSite=Strict` refresh cookie would not be kept.
The API needs a custom domain on the site's (`api.cmarket.example`), or a proxy on the site's
origin.

### Step 21 · The mock removed (M): done

The front end takes all its data from `CMarket.Api`. `src/mocks` (the MSW routes, the in-memory
state, the sample data, the simulated hubs and their tests) and `public/mockServiceWorker.js` are
gone, and so are MSW, `VITE_USE_MOCKS` and the "Prototype — sample data" labels. The spec's
formulas (bond math 14.1, the portfolio engine 14.2 and 14.3, the upload checks 11) are now
tested in the API's repository only.

- `npm run dev` is what `npm run dev:api` was: `.env.development` (formerly `.env.api`) forwards
  `/api` and `/hubs` to port 5001 and turns on `VITE_DEV_TOOLS`, which is off in every other mode.
  `/_kit` follows it.
- `npm run e2e` is what `npm run e2e:api` was, on port 5173: one worker, the API's GUIDs always.
  The `@mock` tag is now `@fresh-db` (`E2E_FRESH_DB=1` runs those flows, one spec per fresh
  database). The flow of the missing service worker is gone. The three messaging flows that
  relied on the mock's scripted people still need a second session to play the other person on
  the API.
- The routes of `shared/api/endpoints` are checked against the API's OpenAPI only.

### Step 22 · The Azure demo checked (M): done

Since 9 November 2026 the site runs on Azure Static Web Apps and `CMarket.Api` on an App Service,
on a shared Azure SQL database. A read-only check of every screen of every account type, and of
every GET of the API, found:

- **Logged out every 15 minutes**, on a reload and on a new tab: the site and the API are two
  sites, so browsers dropped the `SameSite=Strict` refresh cookie. The API's deployment now sets
  it `SameSite=None` and `Partitioned` (its ADR-041); Safari may still log out, until the site
  and the API share a domain.
- **Documents, message files and sign-up documents answered 404 and 410**: the shared database
  had been seeded from a developer's machine, which kept the files. The API now writes the demo's
  missing files again at start-up.
- **The indices never moved in real time**: the hub sends IndexUpdated to the connections that
  follow the index, and nothing followed one. `IndicesPanel`, `IndexChartPanel`, `TickerTape`
  and `PortfolioHeader` (its benchmark) now subscribe their index codes; the smoke flow checks
  that the first index moves.
- The API's development tools were open on Azure (off now), SignalR ran without web sockets
  (on now, with HTTP/2), and the site's hashed files were kept 30 seconds only: one year now
  (`public/staticwebapp.config.json`), which also keeps other sites from framing the site.

Left to do on Azure: the API runs in West US 3 and its database in France Central, so every query
crosses the Atlantic (1.5 to 3 s for the heavier reads); the App Service belongs in France Central.

## Third version of the spec

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

### Decisions taken

Where the third version is silent or contradicts itself, the steps below follow these choices;
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

### The spec author's answers

- **ETFS, BP and BS in the menu** (12 November 2026): each has an entry of its own in the client
  menu, after the one its mockup lights: MKT, EQS, ETFS, YCRV, BP, BS, PORT, and the rest as
  before. A profile lights the screener that lists its type, BS for a bond and ETFS for an ETF
  (the mockups of screens 19 and 20 light EQS and YCRV). Collapsed, an entry of the menu is now
  44 px high, as the mockups draw it, against 56 px before, so that a client's thirteen entries
  fit at 900 px.

### Step 23 · The plan (S): done

The third version is now `CMarket-developer-spec-EN.pdf` and the second `-v2.pdf`; this section,
the order above, the status of the screens to come in the README, the open questions of the third
version, and the same plan in CMarket.Api's `docs/PLAN.md` (its phases 17 to 28). With the mock
gone, each step writes its contract first (`shared/api/contracts` and `shared/api/endpoints`, from
spec section 10), CMarket.Api serves it (domain, tests, migration, demo data as in the mockups),
then the screen is built on the API and checked by its Playwright flow and axe.

### Step 24 · News provider (M): done

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

### Step 25 · News rebuilt (L): done

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

### Step 26 · NEWS NEW · News studio (screen 13) (XL): done

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

### Step 27 · News administration, AI ingestion, international news (L): done

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

### Step 28 · MPAY · Media payments (screen 18) (XL): done

CMarket.Api's phase 21.

- **Built**:
  - MPAY (Admin, `news:payments`; `/admin/media-payments?month=2026-10&id=`), after SRC in the
    Admin's menu (the spec puts it between SUBS and ANLY; SUBS comes in step 34). Over the
    workspace, the header of the mockup: the month (the one before this by default), the total
    amount due, payable and excluded unique clicks, anomalies open, amount already paid.
  - The statements by newspaper: rate per click, items, unique, excluded and payable clicks,
    gross amount, cap, amount due and status in its colour, with a total row; in the title bar
    the global settings, the table as XLSX and the transfer file (XLSX or CSV: the approved,
    unpaid statements, newspaper, amount and reference); below, the cycle and the two notes of
    the mockup. A statement below the minimum payment reads "Carried over".
  - The click anomalies of the newspaper picked: day, signal ("Spike ×7 the average", "38
    accounts · same IP address", "Accounts under 24 h old"), items (an item's headline, "6 FLASH
    items", "Several items"), clicks and decision; Invalidate and Keep, each with a reason; the
    clicks in detail (time, item, account, address, exclusion).
  - The statement: its figures as the mockup lists them, items by type and the five most clicked,
    its approval and dispute window, its payment; the status picked with a reason (and the
    payment's date, method and reference for Paid); a change a second Admin must confirm (the
    API's 409 `statementSecondAdmin`) waits on the statement, which another Admin confirms and
    either drops; the newspaper's dispute with Maintain and Correct; Release, Recalculate and the
    PDF; the newspaper's payment settings from a month on (this one by default, "No cap") with
    their versions; the history.
  - NEWS NEW gets the newspaper's statements under the studio: month, reference, payable clicks,
    amount due and status, its payment or the Admin's answer; the PDF once approved; Dispute,
    with a reason, within the window after the approval.
  - SRC's rate and cap are the payment settings in force this month: a change there is a version
    from this month on. AUDT files the seven new actions under "Media payments".
  - Slices: `entities/news-statement`; the features `change-statement-status`,
    `decide-click-anomaly`, `edit-payment-terms`, `edit-payment-settings`,
    `resolve-statement-dispute` and `dispute-statement`; `widgets/media-payments-panels`,
    `pages/media-payments`; the studio's `NewsStatementsPanel`. The contracts in
    `newsPayments.ts`, the endpoints of `/admin/news-statements*`, `/admin/news-clicks/anomalies*`,
    `/admin/news-sources/{id}/payment-settings*`, `/admin/news-payment-settings` and
    `/provider/statements*`.
- **CMarket.Api** (phase 21):
  - Tables `news.ClickStatements` (one a newspaper and month, guarded by a row version) with its
    history, payments, disputes and the changes waiting for a second Admin; its clicks per item
    as computed (`news.ClickStatementItems`); `news.ClickAnomalies` and the clicks of each;
    `news.SourcePaymentSettings` (dated versions) and `news.PaymentSettings`. The migration
    `MediaPayments` makes each partner newspaper's rate and cap its first version, from the month
    it joined, and drops them from `news.Sources`; tested up, again by the idempotent script, and
    down on SQL Server.
  - Amount due: min(payable clicks × rate, cap) in whole francs, plus what the month before
    carried; below the minimum payment (XAF 5,000) the whole is carried over. A statement keeps
    its figures as computed: approved, its amount no longer moves; a month's terms are the latest
    version not after it, and a new version computes again the statements not approved yet.
  - The cycle and the manual changes of the spec; a second Admin above the four-eyes threshold
    (XAF 300,000), with an anomaly open, for Paid without approval and out of Paid; the dispute
    within 15 days; every action audited with its reason; the newspaper's News providers told in
    the app (statement available, approved, paid, dispute answered).
  - Jobs: `news-click-anomalies` at 01:00 for the day before (a spike: an item's payable clicks of
    a day five times the newspaper's average per item of the 30 days before, 50 at least; 20
    accounts on one address; 20 accounts under a day old, excluded by rule already) and
    `news-statements` every 15 minutes, which issues the month before's statements once their
    day and time of Douala have passed (the 1st at 02:00 by default), once.
  - The demo: the month before the seed as the mockup's October 2026, from 770 items and 74,364
    unique clicks the population read (the mockup's six rows to the click); DAILY K's three
    anomalies; ÉCO HEBDO and CONGO INFO approved, GABON ÉCO paid by transfer, TCHAD MATIN
    disputed by its News provider; the mockup's contracts (DAILY K's earlier version: XAF 12 and
    300,000). Without the population, a small month of the same shape.
- **Checked**:
  - Type check, lint, the 316 unit tests.
  - CMarket.Api: 1,255 tests and the SQL Server suite's 16.
  - Every Playwright flow on CMarket.Api from a fresh database: 93, all passing, and the studio's
    `@fresh-db` flow on a fresh database of its own. Three new ones, of MPAY: the month as the
    mockup, the 210 clicks of one address invalidated and the approval above the threshold
    confirmed by a second Admin; MEDIA I approved, its statement's PDF and dispute in the studio,
    maintained by the Admin; a payment, the transfer file, a newspaper's terms from this month.
  - axe (WCAG 2.2 AA) at 1600, 390 and 320 px, in English and French: MPAY (a statement waiting
    for a second Admin, a disputed one, the payment fields, the global settings, the clicks of an
    anomaly) and the studio's statements with the dispute dialog: 54 audits, nothing found,
    nothing scrolls sideways.

### Step 29 · Bond analytics and BS · Bond screener (screen 17) (XL): done

CMarket.Api's phase 22.

- **Built**:
  - BS (`/bs`, `analysis:read` and the analysis module), opened from the command bar; the menu lit
    YCRV, as the mockup does, until BS had an entry of its own
    ([the spec author's answers](#the-spec-authors-answers)). The criteria of the mockup: the issue
    category (Sovereign, Supranational / regional, Corporate, and Municipal, which the mockup's
    boxes leave out) and the market (BVMAC, BEAC, and Other markets) ticked, then minimum yield,
    modified duration, maturity, country, currency, minimum rating and coupon type, each a
    drop-down with an amber border while it filters; the mockup's screen by default (above 5%,
    duration 0 to 5, this year to six years on, XAF). RUN, Reset, SAVE under a name and the saved
    screens below, as on EQS (`analysis:save`).
  - The results of the latest daily calculation: bond, issuer and country, market, coupon ("Zero"
    for a BTA), maturity, clean price (an asterisk for a model price), dirty price, YTM, YTW (in
    yellow when it differs from YTM: a call), current yield, spread in bp, composite rating ("NR"
    when not rated), modified duration; "Computed" with the date and time of the calculation and
    "Export XLSX" for the accounts that export (`analysis:export`); the mockup's notes below. A
    click shows the bond below, a double-click opens its profile (DES, the bond profile of step
    31), the right-click menu is the security's.
  - The selected bond in the mockup's four blocks: identification and issuer; pricing, yield and
    spreads (YTW "(to 30/06/2027)", the OAS "n/a (V2)" for a bond with options); risk and ratings
    (S&P, Moody's and Fitch, the credit bucket, the durations, the effective duration and
    convexity, the time to maturity); cash flow and structure (coupon and type, frequency,
    maturity and next call, payment status). "Open in BP" opens the bond in the pricing of
    screen 4 (YAS) until BP (step 30).
  - IMP takes the bond list (`bond-master`, BOND_MASTER) and the bond ratings (`bond-ratings`,
    BOND_RATINGS): their templates and columns, their checks worded (a ticker another security
    holds, an amortization schedule that does not add up, dates out of order), their publication
    and rollback. ADMCFG chooses the XAF reference curve among the six CEMAC states' (EUR and USD:
    n/a until their EODHD codes are confirmed, decision 8). AUDT words the new field.
  - Slices: `features/screen-bonds` (criteria, store, saved screens),
    `widgets/bond-screener-results-panel`, `widgets/bond-analytics-panel`, `pages/bond-screener`;
    the screener's hooks and labels in `entities/bond`; the contracts in `bondScreener.ts`, the endpoints of
    `/bonds/screener*`, `/bonds/{id}/analytics*` and `/analysis/bond-screens`; the strings in the
    area file `bonds.json`.
- **CMarket.Api** (phase 22):
  - Section 14.4 in `CMarket.Domain`: current yield, yield to worst over each call (its date and
    price), credit spread over the currency's reference curve at the average life, Z-spread over
    its rates at each payment, OAS (the Z-spread without options, n/a with), effective duration
    and convexity (±25 bp with the yield to worst's logic), time to maturity, composite rating
    (median of the agencies, the lower of two; Investment Grade from BBB− / Baa3); the model price
    of a bond without a quote for 5 sessions (its country's curve at the average life plus its
    last known spread). The calculator of section 14.1 now takes zero coupons, a first coupon
    date, odd first and last periods and amortization schedules; cases A and B unchanged.
  - The bond list's terms on `ref.BondTerms` (category, sector, market, seniority, coupon type,
    floating index and margin, first coupon, status), `ref.BondSchedule` and
    `ref.BondCallSchedule`; `ref.BondRatings` (history); `mkt.BondAnalyticsDaily`;
    `usr.BondScreens`; the XAF curve in `usr.PlatformSettings`; the markets BEAC and OTC and five
    sectors of non-state issuers. The migration `BondAnalytics`, tested up, again by the
    idempotent script, and down on SQL Server.
  - The job `bond-analytics` at 18:30 Douala on weekdays, and after a publication of a bond list,
    prices, auctions or curves, or a new reference curve: each bond of the list not matured,
    settled the next session.
  - The demo: the mockup's six bonds (ECMR and GAB; Cameroon's OTA 3 years and 26-week BTA of the
    latest auction on the BEAC's market, at model prices; BDEAC 5.50% 2030 and COMPANY X 7.00%
    2028, callable on 30/06/2027 at 101, listed on BVMAC at the mockup's prices), S&P's B and B−
    of Gabon, 65 sessions of figures.
- **Checked**:
  - Type check, lint, the 321 unit tests.
  - CMarket.Api: 1,285 tests and the SQL Server suite's 17.
  - Every Playwright flow on CMarket.Api from a fresh database: 96, all passing, and the market's
    two `@fresh-db` flows on a fresh database of their own. Three new ones, of BS: the mockup's
    list, a callable bond's and a rated bond's blocks, the profile and the pricing it opens; the
    BEAC's securities only, a saved screen loaded again, a minimum rating, the XLSX export; a bond
    list published in IMP, whose new bond BS prices at a model price.
  - axe (WCAG 2.2 AA) at 1600, 390 and 320 px, in English and French: BS (the list, a callable
    bond, the save dialog), IMP's upload of a bond list, ADMCFG: 30 audits, nothing found,
    nothing scrolls sideways.

### Step 30 · BP · Bond pricing (screen 16) (M): done

CMarket.Api's phase 23.

- **Built**:
  - BP (`/bp`, `/bp/{bondId}`, `analysis:read` and the analysis module), under YCRV in the menu as
    the mockup lights it, until BP had an entry of its own
    ([the spec author's answers](#the-spec-authors-answers)). "ECMR 6.25 2029 BP" opens it on that
    bond, BP alone on the first bond of the master list; YAS now opens it too (spec section 8),
    with or without a bond, and the old addresses `/yas/{bondId}` lead there. Screen 4 keeps its
    calculator, on `/ycrv/{bondId}`, with a link to BP; BS's "Open in BP" and a bond shared in MSG
    ("Open in bond pricing") open BP.
  - Inputs: A, a bond of the master list, whose characteristics fill the fields (face value M,
    annual coupon C, frequency k, maturity, settlement, day count, redemption: bullet, or
    amortizing with its schedule of dates and shares); changing one makes it a bond entered by
    hand ("or enter all characteristics manually"). B, the target yield the platform supplies,
    amber: the last YTM of the daily calculation ("Source: last computed YTM (BS screen) as of
    …"), otherwise the issuer country's curve and the bond's spread; the user's own yield says the
    platform's and offers it back. The face amount, XAF 100,000,000 by default. CALCULATE prices;
    a bond opens calculated; inputs changed since show a note.
  - Results: A, dirty price, accrued interest, clean price; B, Macaulay and modified durations,
    DV01 of the face amount ("DV01 (100 M XAF)"); C, current yield, settlement amount, time to
    maturity; "As of" the settlement. The cash-flow schedule (date, t, coupon, principal, total,
    discount factor, present value per 100 outstanding; the Total row is the dirty price; XLSX
    for the accounts that export); the clean price from 3 points below the yield to 3 above, the
    bond in amber; the rate sensitivity for ±25, ±50 and ±100 bp, rises in green, falls in red,
    the yield itself highlighted.
  - Slices: `features/price-bond` (the form, its store, the inputs panel and the redemption
    schedule), `widgets/bond-pricing-panels` (results, cash flows, price-yield, sensitivity),
    `pages/bond-pricing`; `useMarketYield` and `useBondPrice` in `entities/bond`; the contracts in
    `bondPricing.ts`, the endpoints of `/bonds/price`, `/bonds/{id}/market-yield` and
    `/bonds/{id}/price-yield`; the strings under `bondPricing` in the area file `bonds.json`.
- **CMarket.Api** (phase 23):
  - `POST /bonds/price` on the calculator's engine, from a yield: a bond of the list (at its
    market yield and its market's settlement by default) or its characteristics; the three
    blocks, the cash flows discounted one by one, the shifts asked and the price-yield points in
    one answer, so a bond entered by hand has its curve too. `GET /bonds/{id}/market-yield` (BS's
    yield of the latest calculation, else the country curve at the average life plus the bond's
    last spread) and `GET /bonds/{id}/price-yield` over any range.
  - A bond entered by hand pays a period apart back from maturity, from the coupon date before
    the settlement or before its first repayment; M is the price its principal is repaid at. BVMAC
    settles at T+2, the BEAC's securities at T+1. Nothing stored, no migration. ADR-047.
  - Tested on case A at the mockup's yield (dirty price 107.5643, DV01 XAF 27,242, the four cash
    flows and the seven shifts of the mockup) and at its clean price's, on case B, by hand and on
    the list.
- **Checked**:
  - Type check, lint, the 330 unit tests.
  - CMarket.Api: 1,308 tests (the SQL Server suite's 17 not needed: no migration).
  - Every Playwright flow on CMarket.Api from a fresh database: 98, all passing, and MSG's
    `@fresh-db` flow, whose bond card now opens BP, on a database fresh for it. Two new ones, of BP: ECMR
    from the command bar at BS's yield, its schedule, its cash flows and their export, a yield of
    the user's, YAS alone; case A by hand with the mockup's figures, cash flows, shifts and curve,
    then a repayment off the payment dates refused under the schedule. The flows of YCRV's
    calculator, BS's "Open in BP" and MSG's bond card follow the new addresses.
  - axe (WCAG 2.2 AA) at 1600, 390 and 320 px, in English and French: BP on a bond of the list,
    case A by hand, a yield of the user's, a schedule refused, YCRV's calculator: 30 audits,
    nothing found, nothing scrolls sideways.
  - The audits of steps 24 to 29 set French in the browser, which the app replaces at each load
    with the profile's language: their French runs were English ones. They now switch the
    profile's language from the user menu, and ran again in French: steps 24 to 29, nothing
    found, except the studio's dispute dialog of step 28, which needs a statement awaiting the
    newspaper that this database did not have.

### Step 31 · Bond profile (screen 20), profiles by security type (L): done

CMarket.Api's phase 24.

- **Built**:
  - One place decides the profile from the security's type: `SECURITY_PROFILES`
    (`shared/routes/profiles.ts`) gives each type its tabs, its name in the title bar and the
    menu entry it lights. DES in the command bar, a double-click in a list or a screener, a search
    result and a card shared in MSG all open `/securities/{id}/des`, and the type that
    `GET /securities/{id}` answers picks the profile: screen 2 for an equity, screen 20 for a bond
    (an ETF's comes in step 33). The command bar offers a code on the types whose profile has it:
    CF and RAT on a bond, FA, DVD and HDS on an equity.
  - The bond profile, under YCRV in the menu (under BS since
    [the spec author's answers](#the-spec-authors-answers)) and named "Bond profile" in the title
    bar as the mockup: the header (the issuer's country, the code, the issuer and ISIN, the line of
    the terms: category, market, currency, coupon, redemption, seniority; the clean price of the
    latest daily calculation, an asterisk for a model price, and its change; dirty price, YTM, YTW
    in yellow when a call makes it lower, modified duration, spread, maturity) and the tabs DES, GP
    Price and yield, BP Pricing, CF Schedule, RAT Ratings, DOC Documents, then N and ANA, which
    every profile keeps.
  - DES as the mockup: the price and yield history (the clean price in amber on the left axis,
    lighter on a model price's days, the YTM dotted in blue on the right; YIELD shows the YTM and
    the YTW, SPREAD the spread over the curve; 6M, 1Y by default, 3Y and MAX from the issue; the
    volume of the traded sessions below; the values of the day under the cursor), today's
    analytics (clean, accrued and dirty prices, YTM, YTW and current yield, durations, convexity
    and DV01 of 100 million, spread and Z-spread, the price's source; "Computed" with its date),
    the ratings (S&P, Moody's, Fitch with their dates, NR without one, the composite and the credit
    bucket), the characteristics (issuer, category and sector, seniority, coupon and type,
    frequency and day count, issue and maturity, redemption, early redemption, amount
    outstanding), the upcoming cash flows per 100 of face value with the days to the next coupon
    and "Open in bond pricing (BP)", and the documents and news with their tags.
  - GP, the history alone; BP, screen 16's panels inside the profile on the bond (the analysis
    module's, as FA; another bond of its drop-down opens that bond's profile); CF, the whole
    schedule (past payments in grey, total and principal outstanding, CSV and XLSX) beside the
    payments to come and the characteristics; RAT, the ratings in force, the day's figures and
    every rating given with the one it replaced (upgrades green, downgrades red).
  - Screen 2 keeps the equities: its header and key data lose their bond lines, the DES income
    panel is the dividends. A bond's order book and trades leave its DES (the mockup has none;
    its traded sessions are the history's bars).
  - Slices: `pages/security-profile` split by type (`EquityTab`, `BondTab`, `SharedTab` for N,
    DOC and ANA), the layouts BOND, BOND-GP, BOND-BP, BOND-CF and BOND-RAT saved apart from
    screen 2's; `widgets/bond-profile-panels`; `TwoAxisChart` in `shared/ui/charts` (two axes, a
    lighter stretch, volume below); `useBondHistory`, `useBondRatings` and `useBondCashFlows` in
    `entities/bond`; the contracts in `bondProfile.ts`; the strings under `bondProfile` in
    `bonds.json`.
- **CMarket.Api** (phase 24):
  - `GET /bonds/{id}` adds the bond list's details (ISIN, category, sector, market, seniority,
    coupon type, index and margin, first coupon, payment status) and the calls and puts;
    `GET /bonds/{id}/analytics` the clean price's change since the calculation before, the
    convexity and the DV01 of 100 million; `GET /bonds/{id}/analytics/history` each session's
    volume (the session under way's so far), and MAX up to a bond's life.
  - New: `GET /bonds/{id}/ratings` (each agency's rating in force, the composite and its bucket,
    every rating given and what it did) and `GET /bonds/{id}/cashflows?from=` (the payments from
    today and the days to the next coupon).
  - The profile's reads need only `market:read`, as every security profile: the analytics and
    their history leave the analysis module; BS's screener and BP stay in it. ADR-048.
  - Demo: a year of daily figures (260 sessions, against 65), and COMPANY X traded two sessions
    in twelve before its last five, so that its history mixes quotes and model prices.
- **Checked**:
  - Type check, lint, the 338 unit tests.
  - CMarket.Api: 1,332 tests, 1,315 run and passing (the SQL Server suite's 17 not needed: no
    migration). `npm run test:api` now reads the bond profile's four endpoints as every demo
    account: 476 reads, 190 left out by permission or plan.
  - Every Playwright flow on CMarket.Api from a fresh database: 100, all passing, and MSG's
    `@fresh-db` flow, whose bond card now opens the bond profile, on a database fresh for it. Two
    new ones: ECMR from the command bar (header, tabs, analytics, ratings, characteristics,
    payments to come, documents, the yields over six months, "Open in bond pricing (BP)" to the
    BP tab); CF from the command bar, Gabon's ratings, COMPANY X callable and at model prices,
    DVD refused on a bond. The smoke flow of a bond's DES and BS's double-click follow the bond
    profile.
  - axe (WCAG 2.2 AA) at 1600, 390 and 320 px, in English and French: the bond profile's DES
    (and its yields over 6M), COMPANY X's, GP, BP, CF, RAT, an equity's profile and MSG's bond
    card: 49 audits, nothing found, nothing scrolls sideways.

### Step 32 · ETF data and ETFS · ETF screener (screen 15) (XL): done

CMarket.Api's phase 25.

- **Built**:
  - ETFS under EQS in the menu, as its mockup lights it (an entry of its own since
    [the spec author's answers](#the-spec-authors-answers)), on the Analysis module (the "Screener,
    XLSX / CSV exports" row): the criteria of the mockup (category, sub-category, geography,
    several at once, sector, issuer, listing exchange, minimum YTD return, minimum Sharpe ratio,
    maximum TER, UCITS only, accumulating only, currency-hedged only), active ones with an amber
    border; it opens on the mockup's screen, to which Reset returns; RUN, SAVE and the saved
    screens as on BS; the values of the drop-downs from `/etfs/facets`.
  - The results: the flag of the fund's domicile left of the ticker (`flag-icons`, decision 10),
    name, class (asset class · geography), issuer, exchange · currency, TER, AUM in the trading
    currency, YTD and 1Y in colour, Sharpe, 1Y volatility; the largest funds first; the time of the
    evening's calculation; XLSX and CSV for the accounts that export; a click shows the ETF below,
    a double-click opens its profile. No comparison block, as the spec says.
  - The selected ETF in its five blocks: A. identification (ticker and name with the listing
    country's flag, asset class, sub-category, sector of a sector fund, issuer and brand, exchange
    and currency); B. structure (replication, dividends, UCITS status, fund currency and hedging,
    domicile); C. size and liquidity (AUM, market price, NAV, premium or discount, 30-session
    volume, average bid-ask spread in % and bp); D. costs and yield (TER, 12-month distribution
    yield, "— (accumulating)" for a fund that accumulates, distribution frequency); E. performance
    and risk (1D, 1M, 3M, YTD, 1Y, 3Y and 5Y a year, since inception a year, tracking error and
    difference, volatility 1Y and 3Y, Sharpe 1Y and maximum drawdown). "ETF profile" opens DES.
  - DES on an ETF until step 33: the type `etf` in `SECURITY_PROFILES`, under EQS, tabs DES (the
    price chart, the five blocks, the documents and news), GP, DOC, N and ANA; its header shows the
    session's open, high, low and volume (an ETF has no capitalisation, earnings nor dividend of
    its own). Its layouts ETF and ETF-GP are saved apart.
  - IMP: the "ETF profiles" and "ETF NAV and spreads" files (their templates, columns, checks and
    words, an ask below its bid named as such); ADMCFG: the risk-free rates of EUR, USD and GBP
    beside XAF's, audited by currency; EODH: the ETFs' loads among the jobs.
  - Slices: `pages/etf-screener`, `features/screen-etfs` (criteria, store, saved screens),
    `widgets/etf-screener-results-panel`, `widgets/etf-blocks-panel`, `entities/etf` (hooks,
    labels, the realtime refresh after an ETF file); `shared/ui/CountryFlag` and
    `shared/ui/form/MultiSelect`; the contracts in `etfs.ts`; the strings under `etf` and
    `etfScreener` in the new area file `etfs.json`.
- **CMarket.Api** (phase 25):
  - The ETF type, a security per listing (TICKER.EXCHANGE, EODHD's code) whose fund's ISIN its
    other listings share; `ref.Etfs` (blocks A, B and D), `mkt.EtfDaily` (NAV, bid and ask),
    `mkt.EtfPerformance` (block E and block C's figures, a row per ETF and session),
    `mkt.BenchmarkCloses`, `usr.RiskFreeRates`, `usr.EtfScreens`; EODHD's exchanges (LSE, Xetra,
    Euronext Paris and Amsterdam, Borsa Italiana, the US) and the countries of the listings and
    domiciles in the reference data; migration `EtfData`.
  - The evening's calculation (section 14.5, the risk as section 14.3 with 252 sessions a year):
    total returns with the distributions added back on their ex-dates, annualized over 3 and 5
    years and since inception, the index's over the same periods, premium, 30-session averages,
    12-month yield, volatilities, Sharpe ratio on the trading currency's rate, maximum drawdown,
    tracking error and difference; at 23:00 Douala, and after an ETF file, a correction, EODHD's
    ETF data or a change of the rates.
  - `GET /etfs` (the criteria of the spec's query, the largest funds first), `/etfs/facets`,
    `/etfs/{id}` (blocks A to D), `/etfs/{id}/performance?periods=` (block E),
    `/etfs/{id}/distributions`, `/analysis/etf-screens`; the screener in the analysis module, an
    ETF's reads on `market:read`, as its profile.
  - EODHD: each evening the benchmarks' closes, each Saturday each listing's fundamentals (fees,
    assets, inception, index) and distributions, the job `etfs` on EODH; built and tested on
    EODHD's documented answers.
  - Demo: twenty ETFs, the mockup's six and fourteen others of each class, geography and kind,
    drawn so that the evening finds the mockup's figures (IWDA's blocks and profile, the five
    others' YTD, 1Y and volatility). ADR-049.
- **Checked**:
  - Type check, lint, the 342 unit tests.
  - CMarket.Api: 1,369 tests, all passing: 1,351 in the usual run, and the SQL Server suite's 18
    on SQL Server (the new migration up, as an idempotent script, and down). `npm run test:api`
    now reads the ETFs as every demo account: 527 reads, 193 left out by permission or plan.
  - Every Playwright flow on CMarket.Api from a fresh database: 104, all passing. Three new ones:
    ETFS from the command bar (the mockup's criteria and five ETFs, IWDA's flag and five blocks,
    VUSA's quarterly distributions); the criteria narrowed to hedged bonds, saved, loaded back
    after Reset, the XLSX and CSV export; a double-click to CSPX's profile (its tabs, its blocks,
    EQS lit, DVD refused).
  - axe (WCAG 2.2 AA) at 1600, 390 and 320 px, in English and French: ETFS (the geographies'
    list open, VUSA selected), an ETF's DES and GP, ADMCFG's rates, IMP's ETF templates, EODH.

### Step 33 · ETF profile (screen 19) (L): done

CMarket.Api's phase 26.

- **Built**:
  - DES on an ETF opens screen 19, under EQS as ETFS (under ETFS since
    [the spec author's answers](#the-spec-authors-answers)), named "ETF profile" in the title bar,
    with the mockup's tabs DES Profile, GP Chart, HLD Holdings, PERF Performance, DIST
    Distributions, DOC Documents, then N and ANA, which every profile keeps; the command bar offers
    HLD, PERF and DIST on an ETF.
  - The header: the flag and code of the fund's domicile, the ticker, the full name, the line of
    its description (class and geography as ETFS writes them, provider and brand, exchange,
    currency, UCITS, accumulating or distributing), the price and its change, then NAV, premium
    or discount, TER, AUM, 30-day average volume, YTD and 1Y volatility.
  - DES as the mockup: the price history (the price in amber over its filled area and the NAV
    dotted in blue on one price axis, 1M to MAX, 1Y by default, by week past three years; the
    volume below; PRICE, NAV and VOLUME switch their line, one of the prices kept; the date, the
    price, the NAV and the premium or discount under the cursor), the performance against the
    benchmark index (1 month to 5 years a year, the ETF's, the index's and the gap in points),
    the risk (volatility 1Y and 3Y, Sharpe 1Y on the currency's risk-free rate as a tooltip,
    maximum drawdown with its dates as a tooltip, tracking error and difference, average spread),
    the top 10 holdings (each line's weight as a bar and in percent, the number of lines in all;
    a line CMarket lists opens its profile), the allocation ([SECTOR] · REGION: a stacked bar and
    its legend, the six largest and the rest as "Other"), structure and costs.
  - HLD, every line known (rank, name, sector, country, weight; the other lines and their weight;
    the day and the source), the allocation by sector and by region side by side. PERF, the total
    return against the index from 100 (1Y, 3Y by default, 5Y, MAX), every period of block E with
    1 day and since inception, the calendar years (the latest to date, ten at most) and the risk.
    DIST, the distributions (ex-date, payment date, amount per share) and the fund's policy (its
    rhythm, the 12-month yield, what it paid over 12 months, its last distribution, what it paid
    each calendar year as bars); a fund that accumulates says it pays none. GP keeps the price
    chart. Each tab keeps its layout (ETF, ETF-GP, ETF-HLD, ETF-PERF, ETF-DIST).
  - IMP: the "ETF profiles" file's portfolio columns (holdings_count, holdings_date,
    top_holdings, sector_weights, region_weights) with their words and their check (weights
    adding up past 100%).
  - Slices: `widgets/etf-profile-panels` (the header and the eleven panels, their periods and the
    portfolio's arithmetic in `lib`), `shared/ui/charts/AllocationBar` (PORT's stacked bar and
    legend, shared), `TwoAxisChart` with a filled area, the price axis on either side and a
    figure of the day beside the date; the contracts and calls of the four reads, their hooks in
    `entities/etf` with the labels of the sectors and regions; the strings under `etfProfile`.
- **CMarket.Api** (phase 26):
  - An ETF's portfolio, `ref.EtfCompositions` with its lines (`ref.EtfHoldings`, the 100
    largest) and its weights (`ref.EtfSectorWeights`, `ref.EtfRegionWeights`), written whole by
    EODHD's weekly fundamentals (Holdings, Sector_Weights, World_Regions, Holdings_Count) or by
    a row of the "ETF profiles" file that gives one of its lists ("name:weight" separated by "|",
    as the bond list's schedules); migration `EtfComposition`. ADR-050.
  - `GET /etfs/{id}/history?with=nav,total,index` (the NAV and the premium; the total return
    from 100; the index on its scale), `/holdings?top=`, `/allocation?by=sector|region`, and
    `/annual-returns` for PERF's calendar years, all on `market:read`.
  - Benchmarks loaded over ten years the first time (eleven in the demo), for the calendar years.
  - Demo: each ETF's portfolio as its factsheet gives it, IWDA's the mockup's; VNGA60 holds VWRL
    and VUSA.
- **Checked**:
  - Type check, lint, the 349 unit tests.
  - CMarket.Api: 1,387 tests, all passing: 1,368 in the usual run, and the SQL Server suite's 19
    on SQL Server (the new migration up, as an idempotent script, and down). `npm run test:api`
    now reads the profile as every demo account: 563 reads, 193 left out by permission or plan.
  - Every Playwright flow on CMarket.Api from a fresh database: 108, all passing. Four new ones:
    IWDA's DES from the command bar (the mockup's header, performance, risk, top 10, allocation
    by sector and by region, structure and costs, the NAV switched off); HLD's 25 lines and
    VNGA60's line opening VUSA's profile; PERF's total return against MSCI World, every period
    and the calendar years; DIST with VUSA's distributions and IWDA accumulating. ETFS's
    double-click opens the new profile.
  - axe (WCAG 2.2 AA) at 1600, 390 and 320 px, in English and French: an ETF's DES (by sector and
    by region), HLD, a fund of funds' HLD, PERF, DIST of a distributing and an accumulating fund,
    ETFS, IMP's templates with the portfolio columns: 54 audits, nothing found.

### Step 34 · SUBS · Subscription management (screen 14) (L): done

CMarket.Api's phase 27.

- **Built**:
  - SUBS (/admin/subscriptions, `subscriptions:manage`, the Admin's), in the Admin's menu between
    USER and MPAY as the spec orders them; SRC, which the spec does not place, now follows MPAY.
    The command bar opens it with SUBS.
  - The counters: active subscriptions, expiring within 30 days (yellow), expired and not renewed
    and failed payments over 30 days (red), the amount collected this month (green); the yellow
    and red ones filter the list on their status.
  - The subscriptions: a row per account, its own plan or its organisation's ("Org. (name)", "—
    (via organisation)"), and per organisation that pays one ("Manager ×4, CEO ×1"); search by
    name, e-mail or organisation, plan, status and expiry (7, 30, 90 days) filters in the address,
    the mockup's columns sorted by expiry (the plans in force first, a failed charge's at the top,
    then those that ended), the status colours of the mockup, the footer "14 of 1,871
    subscriptions · page 1 / 134 · sort: expiry date", Export CSV of every row of the filters.
  - The account subscription: account, type, plan and price, status, start, expiry, auto-renewal
    with the stored card or number ("Yes · card •••• 4417"), last payment and invoice, a failed
    charge's last try, a suspension's reason; for a member, the organisation's subscription. Its
    payments and invoices, the latest first, "Failed, then paid" in yellow; each invoice number
    opens its PDF in a dialog. Extend subscription (a later day and a reason), Change plan (a plan
    the account may have and its cycle, the proration previewed before it is confirmed), Resend
    last invoice (by e-mail with its PDF), Suspend subscription (a reason, confirmed) or Lift the
    suspension.
  - CFG names the plan in force (the media's included) and shows a failed charge and a suspension;
    USER's account details too; AUDT words the five new actions.
  - Slices: `widgets/subscription-admin-panels` (the counters, the list, the account's
    subscription, its payments; the words and the address's filters in `lib`),
    `features/manage-subscription` (the actions and their dialogs), `pages/subscription-management`,
    SUBS's hooks and colours in `entities/subscription`, the contracts `subscriptionAdmin.ts` and
    the routes of /admin/subscriptions and /admin/invoices/{id}; the strings in the area file
    `subscriptions.json`.
- **CMarket.Api** (phase 27, ADR-051):
  - Renewals for real (decision 7): the billing job charges the card or mobile money number stored
    at checkout through the payment port, invoices a transfer, gives an agreement free, expires a
    plan that does not renew by itself; a failed charge keeps the plan in force and is tried again
    once a day for seven days, then the plan expires. The statuses Payment failed and Suspended;
    the method Agreement and the plan "Media source" (XAF 0), offered to nobody, which an Admin
    gives to a media; migration `SubscriptionManagement` (the periods moved on to today's).
  - The endpoints of section 10 (`/admin/subscriptions`, `/stats`, `/export`, `/{accountId}`,
    `/payments`, `/invoices`, `/plan`, `/extend`, `/suspend`, `/admin/invoices/{id}/pdf` and
    `/resend`), and `/plans`, `/proration` and `/reactivate`.
  - A change of plan prorated by the day: the days left of the plan in force buy days of the new
    one; less than a day, a full period charged at once.
  - Demo: the demo accounts as their mockup rows where the other screens allow it, and the
    generated accounts' plans drawn so that the counters read the mockup's whatever the day.
- **Checked**:
  - Type check, lint, the 354 unit tests (the address's filters, the footer's pages, the
    members' line among them).
  - CMarket.Api: 1,422 tests, all passing: 1,402 in the usual run, and the SQL Server suite's 20
    on SQL Server (the new migration up with its periods moved on, as an idempotent script, and
    down). `npm run test:api` reads SUBS as the Admin: 567 reads, 225 left out by permission or
    plan.
  - Every Playwright flow on CMarket.Api from a fresh database: 110, all passing. Two new ones:
    the Admin extends L. Fotso's month, suspends and lifts it, changes M. Ndong's plan prorated by
    the day; the counters filter the list, Research house M's declined card, Media I by agreement,
    a resent invoice and the CSV. CFG's transfer flow now takes the newest of K. Atangana's
    invoices, among the months the SUBS demo gives him. On a fresh database (`@fresh-db`): the
    mockup's counters (1,871 · 143 · 62 · 9 · 48.6 M XAF), the list by expiry, K. Atangana's plan,
    history and an invoice's PDF.
  - axe (WCAG 2.2 AA) at 1600, 390 and 320 px, in English and French: SUBS, an account's
    subscription, the Change plan, Extend and Suspend dialogs, an invoice's PDF, a declined card's
    retries, CFG of a News provider on the media's plan: 43 audits, nothing found.

### Step 35 · Security descriptions on EQS (screen 3) (S): done

CMarket.Api's phase 28.

- **Built**:
  - EQS: the description of the selected row under the results, as the redrawn mockup ("SEMC —
    Description"): its text in the screen's language, its paragraphs and line breaks as written,
    "Source: Data admin" (or EODHD) and FR / EN in the title bar when both languages are written,
    the one shown in brackets; the choice holds from one security to the next. A security written
    in one language alone shows it, its code in the title bar, with "Not written in English yet:
    the text in French." when the screen's language is the missing one (decision 9). The text
    carries its `lang`. The default layout gives the results seven rows, the description four and
    the panels below fifteen, the mockup's proportions; a layout saved before finds the new panel
    in its default place.
  - CORR: a fourth panel, the description of the security the price correction works on: its
    French and English, 2,000 characters each counted as typed, who wrote each and when, what EQS
    shows of a language left empty (EODHD's English, the other language marked, or nothing), and
    EODHD's English, folded, where it has one. An empty text removes its language; a save keeps
    the form, the texts as the API tidied them.
  - AUDT: "Security description", each language changed before and after, as text rather than a
    figure.
  - Slices: `widgets/security-description-panel` (EQS), `widgets/description-editor-panel`
    (CORR), `features/describe-security` (the form), the description's hooks and the choice of
    the language shown in `entities/security`; the contracts in `securities.ts` and
    `dataImport.ts`, the routes of /data/securities/{id}/description.
- **CMarket.Api** (phase 28, ADR-052):
  - `ref.SecurityDescriptions`: a text per security, language and source, the Data admin's
    French and English and EODHD's English kept apart, so that the Data admin's replaces it
    without losing it; 2,000 characters, tidied (accents composed, line breaks, spaces); migration
    `SecurityDescriptions`.
  - `description` on `GET /securities/{id}`: in each language the Data admin's text, else
    EODHD's English, with its source and date. `GET` and `PUT /data/securities/{id}/description`
    for CORR (`data:import`); each language changed in the audit log.
  - EODHD's English from the nightly bulk fundamentals (`General.Description`), cut at the last
    sentence within 2,000 characters.
  - Demo: the seven BVMAC equities in French and English, SEMC's as the mockup, SCG-RE's in
    English only (the French screen shows it marked EN).
- **Checked**:
  - Type check, lint, the 367 unit tests (the language shown, the reader's choice kept from one
    security to the next, the note only where the screen's language has no text, CORR's form and
    what EQS shows of a language left empty).
  - CMarket.Api: 1,433 tests, all passing: 1,412 in the usual run, and the SQL Server suite's 21
    on SQL Server (the new migration up, as an idempotent script, and down).
  - Every Playwright flow on CMarket.Api from a fresh database: 113, all passing. Two new ones:
    EQS shows SEMC's description in English, then in French, and SCG-RE's in English alone; CORR
    writes SCG-RE's French, EQS shows it, and the Data admin removes it again. On a fresh database
    (`@fresh-db`), the flows of EQS and of the FA tab fail on the sector averages (6.2% for 6.3%,
    a P/E of 11.4x for 12.1x), as they did before this step.
  - axe (WCAG 2.2 AA) at 1600, 390 and 320 px, in English and French: EQS with a description in
    both languages and in one, marked; CORR's editor empty, saved and refusing a text too long;
    AUDT's entry: 18 audits, nothing found. The screenshots showed the note "Not written in
    English yet" under an English text once the reader had chosen French on another security:
    the note now follows the screen's language.

### Step 36 · Third version done (M): done

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

## Fourth version of the spec

The version of 13 November 2026 (132 pages, against 96), compared sentence by sentence and image by
image with the third. Nothing of the third version is taken out: sections 1 to 5, 7, 13 and 15 to
17 are unchanged, and so are the formulas of 14.1 to 14.5; sections 6, 8, 9 and 12 are reworded
where they count the account types, the codes and the screens. The mockups of screens 1 to 5 and 7
to 20 are the same images; that of screen 6 is redrawn: its session coverage expects "CEMAC
sovereign yields" at 17:30 where it expected "Curves and rates" on Friday, and the BEAC auctions
are "Under review" where they were "Being checked".

- **Account types** (sections 6 and 12): ten. The SVT is an officer of the securities back office
  of a bank licensed as a Treasury Securities Specialist: it approves or rejects the RFQ agreements
  that name its bank, confirms the traders' links and sets their limits (screen 27). The account is
  created at the bank's request and approved by the Admin (the SVT licence and an employer letter),
  logs in with a code every time, neither publishes nor answers requests (the bank's traders hold
  Trader accounts) and is not listed in the directory. The matrix has no column for it; a paragraph
  gives its rights: the markets as a CEO reads them, screen 27, the list and the export of the
  agreements that name its bank, messages with its linked traders; no portfolio, no publication, no
  request board. The Trader now trades BTA and OTA through the RFQ, the CEO reads the
  organisation's agreements, and the News provider is for "managers of local partner newspapers"
  (media managers of newspapers, agencies and business news sites until then).
- **RFQ** (screens 22 to 24 and 27): requests for quotes on the BTA and OTA of the BEAC's auctions.
  A Trader or a Manager of a registered organisation, linked to at least one SVT that confirmed the
  link, publishes a request (the security, buy or sell, the face amount, a rate for a BTA, a clean
  price or a yield for an OTA, the delivery-versus-payment date, 1 to 30 minutes, its SVT for the
  trade, anonymous or not) on a board that every such trader sees. The others answer with a price
  or a rate, a quantity and their SVT, and improve or withdraw the answer until the confirmation.
  CMarket ranks the answers (the best price, then the largest quantity, then the earliest) and
  fills them in that order; the requester confirms the selection as computed, or cancels. Each
  answer selected makes an agreement, "Awaiting SVT": the buyer's SVT and the seller's each approve
  it within 60 minutes and before 16:00 (two approvers above XAF 1 bn), or reject it with a reason.
  Once concluded, its PDF ticket goes by e-mail to both traders and both back offices; the SVTs
  settle at the CRCT, outside CMarket. Every business day at 18:00, a PDF summary and an Excel file
  of the day's concluded agreements go to the BEAC. The spec itself lists points to confirm before
  development: the module's status with the BEAC and, if needed, COSUMAF, the scope of the SVTs'
  confirmation, the BTA calculation convention and the format of the reporting.
- **Screens** (section 9): twenty-nine. 21 CMDTY, the commodities and the profile of one (DES on a
  commodity); 22 RFQ, 23 RFQ AGR (the agreements) and 24 RFQ REP (the daily reporting to the BEAC),
  under one tab bar; 25 ECO, the macroeconomic dashboard (`ECO CMR` opens Cameroon); 26 FX, the
  XAF's cross rates; 27 SVT, the SVT's approvals; 28 OPT and 29 OPT RES, portfolio optimisation,
  its setup and its result. Screen 1's "Rates and FX" panel opens FX; PORT and a watchlist get
  "Optimise"; BS and the bond profile get "Request a price (RFQ)" on a BTA or an OTA; screen 4
  marks a curve point older than 90 days. The mockups of screens 22 to 24 add RFQ to the client
  menu, after YCRV; those of screens 21, 25 and 26 light MKT, those of 28 and 29 PORT; the SVT's
  menu is SVT, TRD, AGR, N, CFG.
- **API** (section 10): some seventy-five rows of routes. `/commodities*` and
  `PUT /data/commodities/{code}`; `/rfq*` (the requests, the board, the answers, the allocation,
  confirm, cancel, the blotter), `/me/svt` and `/svt-links/{token}`, `/rfq/agreements*` with their
  ticket, export and saved filters, `/rfq/daily-reports*`; `/svt/*` (the summary, the approvals,
  the links and their limits, the settings); `/macro/*` (countries, a country's summary, the
  indicators, compare, the CEMAC table, the global rates), `/fx/*` (the crosses, a currency's
  history, convert, the matrix), `/rates/series` and `/rates/{code}/history`; `/optimizer/*` (the
  estimates, check, run, a point of the frontier, the scenarios with their portfolio, rebalancing
  and export); for the Admin, `/admin/rfq/svt`, `/admin/rfq/audit`,
  `/admin/rfq/daily-report-settings`, `/admin/svt-accounts` and `/admin/macro/settings`. A third
  hub, `/hubs/rfq`, with fifteen events.
- **Data** (section 11): from EODHD, the commodities (23 series that FRED publishes, 5 calls a
  request), the macro indicators (39 World Bank series a country, by year, 10 calls), the
  sovereign yields (`.GBOND`: 154 series of 34 countries, none of the CEMAC, 1 call), and Euribor,
  the EUR 10-year swap and the ECB's reference rates of the euro against 42 currencies (`.MONEY`,
  10 calls). Two file templates: `COMMODITY_PRICES` for the products the API lacks (cocoa, rubber,
  palm oil, gold, okoumé timber) and `CEMAC_SOV_YIELDS` for the six countries' yields (a tenor from
  13W to 10Y, a point of type AUCTION, SECONDARY or MODEL, series named `CMR5Y.CMKT`), which
  replaces the "Curves and rates" file.
- **Formulas** (section 14.6, new): mean-variance optimisation under constraints: the expected
  return, the volatility, the Sharpe ratio, each security's share of the risk, the 1-day 95% VaR
  and the bonds' duration; estimates from weekly returns (a bond's yield to maturity), a covariance
  shrunk towards a constant correlation (Ledoit-Wolf); four problems (the lowest risk for a minimum
  return, the highest return for a maximum risk, the best ratio, the lowest risk), a frontier of 25
  points and a test case of eight securities.
- **Back end only** (the notes of section 10): the `rfq` schema (Svt, TraderSvtLinks, Requests,
  Responses, ResponseVersions, Allocations, Agreements, AgreementEmails, AgreementCancellations,
  SavedFilters, SvtApprovals, SvtSettings, DailyReports, DailyReportSends, AuditLog);
  `ref.Commodities` and `mkt.CommodityValues`; `ref.MacroIndicators` and `mkt.MacroValues`;
  `ref.RateSeries`, `mkt.RateValues` and `mkt.FxReferenceRates`; `pf.OptScenarios`,
  `pf.OptScenarioSecurities` and `pf.OptResults`.

CMarket.Api already loads the macro indicators: since 13 November 2026 (its ADR-053) it asks EODHD
for the 39 indicators of the six CEMAC countries once a week, with its key alone, keeps them by
country, indicator and year and answers `GET /macro?country=`, for which the web project has no
contract yet. Step 40 builds on it.

### Decisions taken

The decisions of the third version stand (1 to 13). Where the fourth is silent or contradicts
itself, the steps below follow these; each is also an open question for the spec author.

14. **The spec's files**: the fourth version is `CMarket-developer-spec-EN.pdf`, as the code's
    comments name the spec, and the third `CMarket-developer-spec-EN-v3.pdf`.
15. **The menu**: CMDTY, ECO, FX, RFQ and OPT each get an entry of their own, as ETFS, BP and BS
    since the spec author's answer of 12 November: CMDTY, ECO and FX after MKT, which their
    mockups light; RFQ after BS (the mockups of screens 22 to 24 draw it after YCRV); OPT after
    PORT, which its mockups light. A Trader's menu then has eighteen entries, more than a window
    900 px high shows at 44 px each: the menu scrolls, and step 39, the first to add an entry,
    settles how it holds them.
16. **The SVT account**: not offered at sign-up. An Admin creates it from USER, on the bank's
    request, its licence and an employer letter, for a bank of the licensed SVTs; the bank is its
    organisation, as a media is a News provider's (decision 12). Its menu is the mockup's (SVT,
    TRD, AGR, N, CFG) with MSG, for its messages with the traders linked to it; the market
    screens a CEO reads stay open to it from the command bar, out of the menu.
17. **The compliance team**: the Admin. RFQ REP (screen 24), every organisation's agreements and
    the compliance export are back-office screens, under an RFQ entry of the Admin's menu; the
    screen 24 mockup draws the client menu for a "CMARKET ADMIN" account.
18. **Permissions**: `rfq:trade` (publish and answer: the Trader and the Manager, once an SVT
    confirmed their link), `rfq:read` (the organisation's requests and agreements: the Trader, the
    Manager and the CEO), `svt:approve` (screen 27, the links and the agreements that name the
    bank: the SVT), `rfq:report` (RFQ REP, every agreement, the compliance export and the RFQ's
    settings: the Admin), `portfolios:optimize` (OPT: the Student, the Analyst, the Manager and the
    Trader). CMDTY, ECO and FX open with `market:read`. Each key comes with the endpoints it guards
    (decision 13).
19. **Commodities**: a commodity is a security of type `commodity`, as section 9 has
    `GET /securities/{id}` answer it, so that the search, DES, the watchlists, the alerts and the
    news hold it as they hold an equity; its profile is the fourth of `SECURITY_PROFILES`. The
    files and the Data admin write the spec's codes as written (`BRENT`, `COMMODITY_PRICES`,
    decision 3).
20. **CEMAC curves**: the `.CMKT` series take the place of the weekly file's points in screen 4's
    curves (the latest point of each tenor, stale past 90 days); the auctions of the last 90 days
    and the closes of the listed bonds still feed them, as since step 4 (CMarket.Api's ADR-023).
    The points the weekly files published are kept, as points of those series.
21. **Macro indicators**: what CMarket.Api loads since 13 November stays; the refresh becomes
    monthly, as the spec says; ECO offers the 37 indicators EODHD serves once the two the spec
    leaves out are taken off (`real_interest_rate`, `startup_procedures_register`), in the spec's
    six categories, where its table names 25.
22. **Exchange rates**: the ECB's reference rates feed MKT's `/fx` too (EUR/XAF at the peg, the
    others through the euro), so that MKT and FX show one USD/XAF; section 11 still names EODHD's
    real-time FOREX for MKT.
23. **The optimiser**: the quadratic programmes of section 14.6 are solved in `CMarket.Domain`, by
    a solver written for at most 20 securities and checked on the spec's test case, without a
    native library (the spec leaves the library, OSQP or ALGLIB, "to be confirmed by the
    developer").
24. **The RFQ behind a switch**: the module is built with its demo data behind a platform setting
    of the Admin, off until the BEAC confirms its status (on in the demo): off, RFQ leaves the
    menus and its endpoints are closed.

### Step 37 · The plan (S): done

The fourth version is now `CMarket-developer-spec-EN.pdf` and the third `-v3.pdf`; this section,
the order above, the status of the screens to come in the README, the open questions of the fourth
version, and the same plan in CMarket.Api's `docs/PLAN.md` (its phases 29 to 38). Each step still
writes its contract first (`shared/api/contracts` and `shared/api/endpoints`, from spec section
10), CMarket.Api serves it, then the screen is built on the API and checked by its Playwright flow
and axe. The market data comes first (steps 38 to 41), then the optimisation (step 42): they wait
for no answer. The RFQ (steps 43 to 47), about half of the work, comes last, which leaves the spec
author time to answer its points to confirm.

The spec's test case of section 14.6 was recomputed from the correlations of the screen 28 mockup:
its weights give a return of 8.01%, a volatility of 5.41%, a Sharpe ratio of 0.65 and a VaR of
0.56%, and equal weights 8.74% and 7.84%, as it expects.

### Step 38 · Rate series and CEMAC sovereign yields (M): to do

CMarket.Api's phase 29.

- **Contract**: `GET /rates/series?origin=&country=`, `GET /rates/{code}/history?from=&to=` and
  `GET /macro/global-rates?set=world|euro`, which steps 39 and 40 read. A series has a code
  (`US10Y.GBOND`, `EURIBOR3M.MONEY`, `CMR5Y.CMKT`), an origin, a country, a tenor and its French
  and English names; a CEMAC point also has its type, reference security and source.
- **IMP**: the `cemac-sov-yields` file (date, country, tenor from 13W to 10Y, yield, point type,
  reference security, source, comment): a yield between 0 and 30%; a move of more than 100 bp from
  the series' point before, to confirm; a point of the same date, country and tenor replaced once
  confirmed. It takes the place of "Curves and rates" in the session coverage, expected at 17:30;
  a file being checked reads "Under review", as the redrawn mockup.
- **YCRV**: a country's curve takes the latest point of each tenor; a point older than 90 days
  (the Admin's setting) is marked stale; the tooltip gives the point's type, reference security
  and source.
- **CMarket.Api**: `ref.RateSeries` and `mkt.RateValues`; EODHD's sovereign yields (`.GBOND`) and
  its Euribor and swap rates (`.MONEY`) every day, once it is known which of them the key in use
  opens; the points of the weekly files kept as CMKT points (decision 20).

### Step 39 · FX · FX dashboard (screen 26) (M): to do

CMarket.Api's phase 30.

- The header (the fixed parity, the date of the reference rates), the cross rates against the XAF
  (the ECB's rate, XAF per unit, the change over 1 day, 1 month, the year to date and 1 year; a
  click draws the currency), the chart from 1 month to MAX with the last rate, the year's high and
  low and the volatility, the converter, the cross-rate matrix and the euro area's benchmarks
  (Euribor at 1, 3, 6 and 12 months, the EUR 10-year swap), as the mockup; the note that reference
  rates are indicative and settle nothing.
- FX in the menu, after MKT (decision 15); MKT's "Rates and FX" panel opens it.
- **Contract**: `/fx/xaf-crosses?date=`, `/fx/{ccy}/history`, `/fx/convert`,
  `/fx/matrix?currencies=`; `GET / PUT /admin/macro/settings` for the currencies shown (ADMCFG).
- **CMarket.Api**: `mkt.FxReferenceRates`; the ECB's rate of each currency shown, once a day at
  17:15 CET (10 calls each), the last value kept on a day without publication; XAF per unit =
  655.957 / the ECB's rate, the yen per 100; MKT's `/fx` on the same rates (decision 22).

### Step 40 · ECO · Macroeconomic dashboard (screen 25) (L): to do

CMarket.Api's phase 31, on the indicators it loads since 13 November 2026 (its ADR-053).

- The country selector (the six CEMAC countries, Sub-Saharan Africa and the World, the comparison
  countries the Admin chooses); six tiles (GDP growth, inflation, GDP per capita, government debt
  to GDP, exports to GDP, population) with their year and seven years of history, "n/a" for a
  series not published; the chart of an indicator for up to six countries since 1960, with its
  XLSX export; the sovereign and reference rates (the CEMAC's in amber, then the 10-year yields of
  seven countries and the 3-month Euribor); the CEMAC comparison table with the year of each
  value, as the mockup.
- ECO in the menu, after MKT (decision 15); `ECO CMR` opens Cameroon.
- **Contract**: `/macro/countries`, `/macro/countries/{iso3}/summary`, `/macro/indicators`,
  `/macro/compare` and `/macro/cemac-table`; the comparison countries and the tiles' indicators in
  `/admin/macro/settings`.
- **CMarket.Api**: the World Bank's aggregates and the comparison countries beside the six; the
  refresh once a month (10 calls a request); the indicators in the spec's six categories, less the
  two it leaves out (decision 21); a "Macro" file by which the Data admin fills a series the World
  Bank lacks, its source shown.

### Step 41 · CMDTY · Commodities (screen 21) (L): to do

CMarket.Api's phase 32.

- The list by category (energy, metals, agriculture, indices, the CEMAC complement) with the last
  value, the change since the observation before and the frequency's badge (D, W, M). The profile
  of a commodity: the header, the tabs DES, GP, CMP (up to five series rebased to 100 and their
  correlations) and N, the history (the value in amber, its moving average in blue, by day, week
  or month, without volume or candles), the statistics, the description in French and English, the
  data's sources and usual lag, the CEMAC links (the countries exposed, the related securities,
  the latest news), as the mockup.
- The observation date beside every value, yellow past 10 days for a daily or weekly series and
  past 50 days for a monthly one.
- `CMDTY` opens the screen, in the menu after MKT (decision 15); `BRENT DES`, a search result or a
  card opens the profile (decision 19). An alert on a commodity goes off when a new value comes.
- **Data admin**: the `commodity-prices` file of IMP (date, code, value, unit, source) for cocoa,
  rubber, palm oil, gold and okoumé timber; a commodity's name, description, countries and
  securities in CORR (`PUT /data/commodities/{code}`).
- **CMarket.Api**: the `commodity` type, `ref.Commodities` and `mkt.CommodityValues`; EODHD's 23
  series twice a day, each series and interval kept 12 hours (5 calls a request); the changes, the
  volatility at the series' own frequency and the correlations on monthly changes.

### Step 42 · OPT · Portfolio optimisation (screens 28 and 29) (XL): to do

CMarket.Api's phase 33.

- **Setup** (screen 28): the universe (2 to 20 equities, bonds and ETFs, searched or taken from a
  portfolio or a watchlist, each with its type, an expected return the user may change, its
  volatility and its minimum and maximum weights), one of four objectives, the constraints (per
  security, asset class, country or currency), the capital, the history of the estimates and the
  risk-free rate, the correlations changed cell by cell, and the checks before a run.
- **Result** (screen 29): the indicators; the allocation with each weight, amount and share of the
  risk ("max" or "min" where a limit binds); the efficient frontier with the securities, the
  optimum, equal weights and an existing portfolio (a click on the curve computes that point); the
  breakdown by class, country and currency; the binding constraints and the comparison; then Save
  as a model portfolio, Create a portfolio, the trades that adjust an existing one, the XLSX and
  PDF export. A scenario is saved, opened again, duplicated and computed again on today's data.
- OPT in the menu, after PORT (decision 15); "Optimise" on PORT and on a watchlist; "not
  investment advice" on both screens. A Student saves an allocation as a model portfolio only.
- **CMarket.Api**: section 14.6 in `CMarket.Domain`: the estimates (weekly returns over the
  history chosen, a bond's yield to maturity, the covariance in XAF shrunk towards a constant
  correlation, a security quoted too seldom flagged), the solver (decision 23) checked on the
  spec's test case, amounts rounded to whole securities with the rest in cash, under 2 seconds for
  20 securities; `pf.OptScenarios` and its results.

### Step 43 · SVT accounts and trader links (L): to do

CMarket.Api's phase 34.

- **Type**: `svt`, the tenth account type, created by an Admin from USER for a bank of the
  licensed SVTs (decision 16), with a code at every login and no profile in the directory; ten
  counters on USER; its menu SVT, TRD, AGR, MSG, N, CFG.
- **Licensed SVTs** (ADMCFG): the banks, their back-office address, the minimum trading amount and
  the validity of a link (`/admin/rfq/svt`); the RFQ's switch (decision 24).
- **Links**: a Trader or a Manager asks an SVT of the list for a link from "My SVTs" (`/me/svt`),
  the right panel of screen 22, alone on the RFQ screen until step 44. The bank's SVT accounts are
  told by e-mail and on TRD, where they confirm the link with a daily limit, decline it, change
  the limit or remove the link (`/svt/links`); a request without an answer expires after 7 days, a
  link after a year.
- **Real time**: the `/hubs/rfq` hub, with `LinkRequested`, `LinkChanged`, `SvtLinkChanged` and
  `ServerTime`.

### Step 44 · RFQ · Government securities RFQ (screen 22) (XL): to do

CMarket.Api's phase 35.

- New request (a BTA or an OTA of the master list, buy or sell, the face amount, a rate for a BTA,
  a clean price or a yield for an OTA, the delivery-versus-payment date, 1 to 30 minutes, the
  requester's SVT, anonymous or not, the curve's reference); my request (the countdown, the
  answers ranked with their allocation, the total, the weighted average price, Confirm selection
  and Cancel request); the board of the other organisations' requests with the answer form (a
  price or a rate, the other worked out, a quantity, an SVT, a validity; Send, Improve, Withdraw);
  today's blotter; the tab bar Trading, Agreements, BEAC reporting, as the mockup.
- RFQ in the menu, after BS (decision 15); "Request a price (RFQ)" on BS and on the bond profile,
  for a BTA or an OTA; the organisation's requests read only for its CEO.
- **Rules**: the selection is the server's: the requester confirms the version shown, or gets the
  new one (409). A responder sees neither the other answers nor their number, nor an anonymous
  requester before the agreement. An organisation does not answer its own requests; a trader
  without a confirmed SVT reads the board only.
- **CMarket.Api**: the `rfq` schema; the ranking (the best price, the largest quantity, the
  earliest answer) and the allocation (in that order up to the face amount, the last answer in
  part, down to the minimum trading amount of XAF 10 million); a request without confirmation
  expires 10 minutes after its end; each answer selected makes an agreement that waits for its
  SVTs; a BTA priced by section 14.1, an OTA by BP's engine; every event stamped to the
  millisecond and kept five years, with the compliance export (`/admin/rfq/audit`); the hub's
  `RfqPublished`, `RfqClosed`, `ResponseReceived`, `ResponseUpdated`, `AllocationChanged`,
  `RfqConfirmed` and `AgreementCreated`.

### Step 45 · SVT · SVT approval (screen 27) (XL): to do

CMarket.Api's phase 36.

- The counters, the agreements to approve by time left with the checks on the client (its link,
  its daily limit and what it used of it, the day's trades), the latest decisions, the trader
  links (step 43), the approval settings and the agreement's detail with both approvals, Approve
  and Reject (a reason required), as the mockup.
- **Rules**: 60 minutes to decide (the Admin's setting) and 16:00 at the latest, 10:00 on the next
  business day for an agreement confirmed after the cut-off; without a decision the approval
  expires and the agreement is cancelled; two approvers above the bank's threshold (XAF 1 bn); one
  decision when both sides chose the same SVT; a rejection's reason told to both traders; a
  reminder 15 minutes before the deadline.
- **CMarket.Api**: `rfq.SvtApprovals` and `rfq.SvtSettings`; once both SVTs approved, the
  agreement is concluded and its PDF ticket (a timestamp, a SHA-256 fingerprint, the approvers'
  names) goes by e-mail to both traders and both back offices; `ApprovalRequested`,
  `ApprovalDecided`, `AgreementConcluded` and `AgreementRejected`; the notices on screen, by
  e-mail and by SMS.

### Step 46 · RFQ AGR · Agreements (screen 23) (L): to do

CMarket.Api's phase 37.

- The filters (search, period, status, e-mail status, side, type, country, security, SVT, role,
  trader, face amount; the filters saved), the list with its count and total face amount, sorted,
  paged and exported (XLSX, CSV), and the detail (the request and the agreement's rank, the buyer,
  the seller and their SVTs, the security and its CRCT code, the amounts, the e-mail log by
  recipient; Download ticket PDF, Resend ticket, Cancel agreement), as the mockup.
- Each organisation reads the agreements it is party to, its CEO too; an SVT those that name its
  bank, from AGR; the Admin all of them (decision 17).
- **CMarket.Api**: a ticket sent again is the same document; a concluded agreement is cancelled
  only on both parties' written requests, with a reason and a notice to the four recipients, and
  then leaves the BEAC's reporting; a delivery that fails alerts the trader and the Admin.

### Step 47 · RFQ REP · Daily reporting to the BEAC (screen 24) (L): to do

CMarket.Api's phase 38.

- The header (the send time, the recipients, the files, the next send), the month's reports by
  business day (scheduled, sent, nil report sent, failed, resent), the preview of the day's PDF,
  the send panel (Send now or Resend, Download PDF, Download Excel) and the settings (the send
  time, the BEAC's address, the copies, the nil report), as the mockup; in the Admin's back-office
  (decision 17).
- **CMarket.Api**: a job at the send time (18:00) of each business day: the agreements concluded
  since the send before, a one-page PDF (the key figures, by security, by residual maturity) and
  an Excel file of 17 columns, each with its fingerprint; a cancellation reported on its day; a
  nil report on a day without a trade; a send that fails alerts the Admin; every send logged, the
  files kept five years.

### Step 48 · Fourth version done (M): to do

- axe at 1600, 390 and 320 px and the keyboard on every new screen, for each of the ten account
  types; every flow on a fresh database; the README and this roadmap; the new jobs (the rates, the
  exchange rates, the macro indicators, the commodities, the BEAC's report) on Azure.

## Shared groundwork

Done in step 1, shown on `/_kit` in the prototype:

- **Form kit in `shared/ui`**: buttons, fields, selects, text, number and date inputs (in the
  user's format, amber border when editable), checkboxes, segmented choices, file drop zone,
  dialog and side form, confirmation with a required reason, toasts.
- **`PriceChart`** on Lightweight Charts (candles, bars or line, overlays such as MA20 / MA50,
  volume, amber last price, crosshair values, wheel zoom and drag pan) for DES and the "CMarket
  chart" block of PUB NEW. Moving averages and other indicators come from `/indicators`.
- **XLSX export** next to CSV in every data table, hidden without `analysis:export` (Student).

Done in step 2, with DES:

- **`PriceChart`** gained indicator panes (RSI, MACD), comparison rebased to 100 and drawings.
- **Embedded PDF viewer** (`shared/ui/PdfViewer`): the file is fetched through the API client, so
  the request carries the user's session, then shown by the browser's viewer.
- **Screen tabs** (`shared/ui/ScreenTabs`), one route per tab.

Done in step 3, with the monitoring screens:

- **Security picker** (`entities/security`): code or name, suggestions from `/search`, arrow keys
  and Enter. Used by "+ Add" in a watchlist, the news filter and the alert form.
- **Forms opened from anywhere**: the right-click menu of any security opens the list and alert
  forms. Each entity holds a small store saying what to open (`openWatchlistDialog`,
  `openAlertDialog`), the feature holds the form, and the app shell mounts it once.
- **Dialogs** are rendered in `<body>`: a dialog opened from a panel title bar no longer inherits
  its upper-case text or sits inside its drag handle.
- **`PanelSelect`** for choices in a panel title bar ("ALL COUNTRIES"), **`useSearchParamsUpdate`**
  for filters kept in the URL, the CEMAC country list with the short names of the mockups.
- **BEAC auctions panel** (`widgets/auctions-panel`), shown by CAL and YCRV.

Done in step 4, with the analysis screens:

- **Recharts** for the EQS comparison bars and the yield curves (log maturity axis), with
  `useChartTheme` giving it the section 8 colours.
- **Export links in a title bar** ("EXPORT XLSX · CSV" of the screen 3 mockup): `DataTable` hands
  its export through `exportRef`, so the rows go out as sorted.
- **`GET /securities`** (`useSecurities`): the equities of a market, for a peer group or the
  choices of a filter. `useDebouncedValue`, `addMonths`, and a unit after a change (`+0.3 pt`).

Done in step 5, with PORT:

- **Chart palette**: section 8 has none, so `--chart-1` to `--chart-8` colour series that only
  carry identity (allocation by sector or country), in a fixed order; they pass the lightness,
  colour-blind separation and 3:1 contrast checks on the panel background. Ordered classes (bond
  maturities) take a one-hue ramp, `--chart-ordinal-1` to `-5`. Both come with `useChartTheme`.
- **Uploads and jobs**: `apiClient.postForm` sends a multipart form (an import file, a logo); a
  job is asked for its progress until it is done (`useReportJob`), then its file is fetched with
  the session (`useReportFile`, `saveBlob`).
- **Live values**: `useLivePrices` follows several securities at once; `DataTable` takes a
  `footer` row outside the sorting (the cash of a portfolio); `useMarketDay` gives today in Douala
  without reading the clock during render.
- **Mock**: the daily history of the BVMAC and CMarket indices is chained from their members'
  closes, so an index and its securities move together; `read-excel-file` reads Excel uploads;
  MSW builds into a chunk of its own.

Done in step 6, with PUB and PUB NEW:

- **Pagination**: `Pager` under a list of `{ items, page, pageSize, totalCount }`, the page kept in
  the URL. USER, HIST and AUDT will use it.
- **Rich text**: TipTap for the studio, loaded with that screen only. The library draws the same
  JSON without the editor (`PublicationBody`) and follows safe links and images only; both share
  the `publication-text` styles, so the reader preview is what readers get. `shared/lib/richText`
  gives the contents, the page count and the text of a PDF to the front end and the mock alike.
- **Forms and charts**: one segment of `SegmentedControl` can be disabled (Paid once read for
  free); `AreaChart` takes a colour and a fixed mode for a chart inside a document;
  `format.month`.
- **Mock**: `sharedStore` keeps what every account sees (publications, analysts) next to each
  user's own data; the PDF writer prints a watermark.

Done in step 7, with CFG and the login pages:

- **Session**: `shared/api/session.ts` keeps the access token in memory and renews it with the
  refresh cookie (`POST /auth/refresh`) at start-up, before it expires and after a 401, once for
  all the requests waiting; a refused renewal ends the session. The app shell needs a session
  (`RequireSession`), the login page brings the user back to `?next=`, and the hub connects with
  the session (SignalR takes the token). The tabs of a browser log in and out together; 30 minutes
  without an action in any tab log the user out after a one-minute warning
  (`shared/lib/activity`). Logging in or out empties the query cache.
- **Subscription gating**: `/me` returns the modules of the user's plan (`modules`, and
  `trialEndsAt` while the free trial runs); each screen names its module (Monitoring: MKT, DES, N,
  CAL, ALRT; Analysis: EQS, YCRV, YAS and the FA tab; Portfolio: PORT); a screen outside the plan
  shows a lock in the menu and offers the plans instead of its content (`ModuleLocked`). The mock
  refuses the analysis and portfolio data the same way.
- **User time zone**: `useFormat` shows dates and times in the profile's time zone; a calendar
  day keeps its date in every zone; the session clock stays in Douala time.
- **Forms and payments**: `PasswordInput`, a brand-green button for the login pages,
  `shared/lib/billing` (VAT on a price per user, VAT inside a price) and `shared/lib/phone`. The
  mock's payments (`mocks/payments.ts`) serve research and plans alike; a confirmed purchase of
  research also issues its receipt.
- **Tests**: a Playwright `setup` project logs in once through the login page; the other tests
  start from that session.

Done in step 8, with the back-office of the Data admin:

- **Uploads**: `entities/data-import` holds the file types and their templates (CSV or Excel,
  downloaded with the session), the coverage of a session, the uploads and their rows. An upload
  is asked again every second while its checks run, should `ImportStatusChanged` not come; the
  reasons of the checks come as a code and figures, and the screen words them in the user's
  language. `DataPublished` refreshes the quotes, histories, indices, auctions and curves.
- **Forms and API**: `apiClient.putForm` (a document replaced with its PDF); `ConfirmDialog` with a
  required reason for the rollback; the security picker as a list of chips in the NEWS form.
- **Mock**: `mocks/lib/dataImport.ts` reads a file against its template and runs the checks of
  spec section 11 (tested); `mocks/imports.ts` keeps the uploads, puts the published rows and the
  corrections in place of the generated prices (`setStoredSessions` in `lib/bars`) and index
  closes, adds the auctions, curve points and dividends, and takes them out again on a rollback;
  `mocks/content.ts` keeps the news and documents entered. The CSV reader of the transaction
  import became `lib/templateFile`.

Done in step 9, with the back-office of the Admin:

- **Server sorting**: `DataTable` takes `sorting` and `onSortingChange` for a list the server
  sorts and pages (`?sort=-lastLoginAt`, spec section 10); the rows keep the order they come in.
- **Admin's data**: the query keys of the Admin's screens start with `admin`
  (`shared/api/adminData.ts`); an action refreshes them all, without waiting, so a toast still
  shows when the refreshed list removes the row that asked for it. The labels of the permissions
  are in `shared/config/permissions.ts`, for the matrix and the audit log alike.
- **No placeholder left**: every screen has its page, so `pages/placeholder` and its plans are
  gone and `app/routes/pages.ts` lists all of them.
- **Mock**: `mocks/admin.ts` lists the stored accounts with the 1,937 generated ones of
  `fixtures/population.ts`, so the counters show the screen 9 mockup (a generated account is
  copied into the stored ones when an Admin changes it; it cannot log in). The settings and the
  role -> permission table are stores that `/me`, `GET /publications/rules` and the portfolio
  engine read. `recordAudit` writes every action of a Data admin or an Admin (publish, rollback,
  discard, correction, news, document, then the Admin's), and the seeded uploads write theirs.
  Payouts are due until marked paid; reports have a status. The data kept in localStorage is
  dropped when `SEED_VERSION` changes, which ends the prototype's session once.

Done in step 10, with the home page:

- **Routes**: `/` is the home page, open without a session like the login pages; `/app` sends a
  user to the home screen of the account type (MKT, IMP or USER), and the login, the sign-up, the
  account switch, the logo of the top bar and "Back to home" go there. `signUpPath` opens the
  sign-up with an account type chosen (`/signup?type=analyst`).
- **UI**: `ButtonLink` (a link drawn as a button, `brand` or `outline`) and the `xl` size of
  `Button`; `LanguageSwitch` (FR / EN before login) for the home and login pages; `Logo` takes the
  page it leads to; the type sizes `text-lead`, `text-headline` and `text-display`, for the home
  page only.
- **Plans before login**: `usePublicPlans` asks `GET /subscription/plans` without the session; the
  mock answers every plan to a call without a token, and an account the plans of its type.
- **Motion**: `useInView` (`shared/lib`); the `rise`, `fade-in`, `draw`, `ticker`, `blink`,
  `drift`, `grid`, `lines`, `glow` and `parallax` animations, the `.reveal` class (blocks that
  come in once their section is seen) and the backdrop's `.home-grid`, `.home-glow` and photo
  shades in `app/styles`, all off under `prefers-reduced-motion`. `parallax` is driven by the
  scroll (`animation-timeline: view()`); a browser without it keeps the photos still.
  `ButtonLink` nudges its arrow on hover.
- **Photos**: seven photos from Pexels (free to use, credit not required; "Photos: Pexels" in the
  footer), cropped and saved as WebP at two widths in `pages/home/assets/photos`, about 790 kB in
  all: a city at night, Douala at sunset, a coastal city at dusk, and one for each client account
  type. `pages/home/config/photos.ts` gives the number and the photographer of each. They are
  decoration (`alt=""`), with no identifiable person, so none suggests a user's endorsement.
- **Translation by the browser**: Chrome's (and Cốc Cốc's) swaps text nodes for its own, so React
  updated nodes that were no longer on screen and threw on removing one ("Failed to execute
  'removeChild' on 'Node'") on the home page, MKT, PORT and YCRV. The terminal now turns it off
  while it is open, dialogs included (`useNoBrowserTranslation`, `shared/lib`): its live figures
  would otherwise freeze without a sign, and it speaks French and English itself. The home and
  login pages can still be translated; the picture of the terminal is `translate="no"`, and a
  text that changes stands alone in its element, which React rewrites whole. A Playwright flow
  translates the home page and waits for the command bar to type its next command.
- **Accessibility (WCAG 2.2 AA)**: axe-core finds nothing on any screen, tab or account type.
  - Contrast: on the selected background, secondary text and falling figures take
    `--text-secondary-selected` and `--down-selected` (4.7:1; the section 8 colours give 3.4:1
    and 3.5:1 there).
  - Targets of 24 px (2.5.8): panel and dialog title bars and the pager are 25 px (`h-bar`), so
    their buttons, the options of `PanelTabs` and the sort buttons of `DataTable` reach 24 px,
    while table rows keep their 22 px. A row has no button of its own any more: PAY's "Mark
    paid" and CFG's invoice PDF act on the selected row from the title bar (also by double click,
    Enter or the right-click menu).
  - Keyboard: a `DataTable` takes the focus, the arrows move from row to row as a click would and
    Enter opens a row as a double click; a box that scrolls with nothing to focus in it takes the
    focus itself (`ScrollArea`, `useKeyboardScrolling`), a panel's body included.
  - Keyboard, second pass: Tab no longer stays in the command bar (2.1.2), which completes only a
    word under way; the menu key or Shift + F10 opens a row's menu, where rows are not selected
    a cursor of the table's own (2.1.1), and screen readers hear the row reached; a menu takes the
    focus, goes through its entries with the arrows and gives the focus back (the user's menu,
    the row menus); the selected row is `aria-current`.
  - A panel moves and sizes without dragging, from the layout menu of its title bar's code, which
    also brings the screen's default layout back (2.5.7).
  - Each page names itself in the tab's title (2.4.2, `useDocumentTitle`); each chart is a figure
    named with its period, move and range (1.1.1, `useChartLabel`).
  - Windows contrast themes: the selection, the current page and the focus get an outline in the
    system colours, which keep no background or box shadow.
  - Narrow windows (a tablet, a zoomed page, down to 320 px): the top bar drops its least needed
    items, a title bar's options go to the next line, the tabs scroll, the security header wraps;
    no page scrolls sideways. A table's sr-only text no longer widened the page.
  - Links inside a sentence are underlined; the sign-up form's pairs of fields stack on a phone;
    the FR / EN buttons are named Français and English.
- **Mock session**: a logout no longer takes the user away from the requests already let through
  by the auth gate (`setRequestUser`, `endSession`): they were failing with 500 while they waited
  for their latency.
- **Failures**: a link to `/login?next=` with a tab or a line break (which the URL parser drops)
  showed the error screen; a browser that blocks the service worker or the site's storage left an
  empty page, it now says why the prototype cannot start; INDEX CHART and NEW UPLOAD waited for
  ever on a request that had failed, they show it with Retry; a server out of reach reads in the
  user's language. The mock's ids carry 32 random bits: those written in the same millisecond
  could repeat, and two rows of AUDT shared a key.
- **Moving the panels** (spec section 8): they moved and resized from 1280 px wide, but nothing
  showed it before the pointer was on them. A grip now comes before a panel's title, and the
  corner that resizes it shows at rest (the library drew it under the pointer only, which a
  touch screen lacks); stacked panels no longer take the move pointer. Under
  `prefers-reduced-motion`, a panel takes its place without sliding there.
- **Arranging the panels**, beyond the spec, from the layout menu of any panel:
  - Below 1280 px, where they stack, a panel goes a place up or down; this order is kept apart
    from the grid's (`stacked`), which it leaves as it is.
  - A panel hides, the others packing up, and comes back at its place from the menu of any
    other ("Show: Rates and FX"); the last one shown stays. Each panel has a name for this
    (`ScreenPanel.name`, `panels.*`), as its title may change ("Watchlist: My picks").
  - Undo and redo go through the changes made since the screen opened, per tab: drags, steps,
    hidden panels, a saved layout applied or the default one. Ctrl + Z and Ctrl + Y (⌘Z, ⇧⌘Z)
    do the same, except in a text field, the publication editor or a dialog, which keep theirs.
  - A locked layout neither drags nor resizes, and its menu changes nothing until unlocked; a
    padlock replaces the grip.
  - Up to 10 layouts per screen are kept under a name, applied (and undone) or deleted.
  - A layout the server could not give shows the screen's default, with a message, and is never
    saved over: a PUT from it would have deleted the saved layouts and the lock.
  - The mock checks what `PUT /me/layouts/{screen}` receives (`mocks/lib/layouts.ts`), and
    still reads the layouts saved before, the positions alone.
  - Menus are as wide as their longest entry (up to 400 px, then on two lines) and stay inside
    the window: "Disposition par défaut de l'écran" and the long names of panels were cut.
  - Playwright flows on each: a panel dragged and resized, hidden and shown, a change undone and
    redone, the layout locked, a layout saved then applied, the stacked order kept, a layout that
    failed to load left as it was on the server.
- **PAY flow**: the sample sales follow the date (a new month draws more of them), so the
  amount to pay is read from the row instead of a figure that held in October only.

Still to do, with the first screen that needs it:

- **PNG and PDF export of charts** (spec section 3), for the price chart, the comparison bars and
  the curves alike.

## Done for every screen

- DTOs in `shared/api/contracts` and the calls in `shared/api/endpoints`, served by `CMarket.Api`
  with demo data from the mockup (the mock handlers until step 21).
- A `pages/<screen>` slice, registered in `app/routes/pages.ts`.
- French and English strings; actions hidden or locked by permission and quota.
- Tables: sorting, right-click menu, export. Layout saved per user, one column below 1280 px.
- Vitest for the logic and one Playwright flow; README status updated.

## Client screens

### MKT · Market dashboard (screen 1): done

- **Built in step 3**: watchlist editing. "…" creates a list, changes its name and columns (name,
  last, change, change %, volume, 5-day chart) or deletes it; "+ Add" adds securities; the
  right-click menu of a row removes it. "Add to a list" in the right-click menu of any security
  ticks the lists that hold it and offers "New list…". A click on a news item opens the article
  on the N screen; a double-click on a calendar event opens the security.
- **Still to do**: sharing a list with colleagues of the same organisation (spec section 6) has no
  API yet.
- **Built in step 25 (third version)**: each news item shows its type and newspaper tags, which
  filter N; ISSUERS and REGULATOR filter the categories issuers and regulation; the content
  opened on N counts its unique click once it shows 3 seconds.
- **Fourth version (steps 39 and 42)**: the Rates and FX panel opens FX (screen 26); a watchlist
  gets "Optimise", which opens OPT on its securities.

### DES · Security profile (screen 2): done

- **Built**: header (last price at 26 px, change, 7 key figures, delayed tag for Students) and
  the tabs DES, GP, DVD, N, DOC, HDS, each with its own saved layout (`DES`, `DES-GP`...). DES
  follows the mockup: price chart, order book with depth bars, latest trades, key data,
  dividends, documents and news. GP adds 1D to 10Y, candles / bars / line, Bollinger bands, RSI
  and MACD panes, comparison with securities and indices rebased to 100, and trend lines and
  levels saved per user. A bond gets its terms and redemption schedule instead of the key data
  and dividends, and no FA, DVD or HDS tab.
- **Built in step 4**: the FA tab, with the panels of EQS (see below).
- **Built in step 6**: the ANA tab, with the list, the preview and the analyst of PUB.
- **Built in step 12**: GP has no drawing tools without `analysis:save` (the Journalist, the CEO).
- **Still to do**: PNG and PDF export of the chart stays in the shared groundwork.
- **Built in step 25 (third version)**: the N tab and the DOC · N panel show the news tags.
- **Built in step 31 (third version)**: DES opens the profile of the security's type, the bond
  profile (screen 20) for a bond, and screen 2 keeps the equities (the ETF profile, screen 19,
  comes in step 33).
- **Fourth version (step 41)**: DES opens the commodity profile (screen 21) for a commodity.

### N · News (no mockup): done

- **Built**: two tabs, `/n` and `/n/documents`, each with its saved layout (`N`, `N-DOC`). News on
  the left, filtered by security, country and topic, the article on the right with links to the
  securities concerned; new items arrive through `NewsPublished`. Documents: full-text search
  (`/documents?q=`), type filter and the embedded PDF viewer. Filters and the open item are in
  the URL, so `/n?article=news-1` opens an article.
- **Shared by link (2026-11-10)**: every news item has its address, `/n?article={id}`, which a
  member opens after logging in if need be (`?next=`). The items of N, of the MKT News panel and
  of a profile's N tab are links (a new tab, "Copy link address"); the article's title bar copies
  the address ("Copy link") or sends the article as a card to an open conversation ("Share",
  `features/share-news`, for whoever writes messages). CMarket.Api takes a news item as a shared
  object (`{ type: 'news', newsId }`, kept with its source, time and headline); the card opens
  the article. In MSG, an address of the site pasted in a message is a link. A removed article
  says so instead of an error.
- **Still to do**: the list shows the 50 newest items; "load more" comes with the pagination of
  the shared groundwork.
- **Built in step 25 (third version)**: the type and newspaper tags; filters by security, country,
  category (instead of topic), type and newspaper; the content read from `GET /news/{id}`, with
  its newspaper, author, original link and "Updated on …", and its unique click.

### CAL · Market calendar (no mockup): done

- **Built**: week (Monday to Sunday, today in amber, weekends without a session) or day view
  (a table that sorts and exports) of sessions, auctions, ex-dividend dates, bond redemptions,
  general meetings and earnings releases, filtered by type and country; an event on a security
  opens its profile. Below, the latest BEAC auctions of the screen 4 mockup, cover ratio in green
  above 1 and red below. The view, the day and the filters are in the URL.
- **Mock**: holidays at fixed dates close BVMAC, redemptions come from the bond schedules, held
  auctions from the auction results.

### ALRT · Alerts (no mockup): done

- **Built**: the alert list (on / off, type, subject, condition, channels, last time it went off;
  edit, turn off and delete from the right-click menu), the form for the 6 types of spec
  section 5 with push, e-mail and SMS, and the history of triggered alerts (`/notifications`): a
  click marks it read and points at its alert. The quota of the account type (10, 50, 100,
  unlimited) comes from `/me`. "Create an alert" in the right-click menu of any security opens the
  form with the security filled in and its last price as a hint.
- **Mock**: the fake server sets off the user's alerts as a server would: price and volume alerts
  when a trade crosses their threshold (once a session), release and auction alerts when the news
  arrives.
- **Built in step 5**: a portfolio limit alert watches one portfolio or all of them, and goes off
  when a transaction or a limit change breaches a limit.
- **Built in step 7**: SMS go to the mobile phone of the profile (CFG): without one, the SMS
  channel is off and the form says where to add it; e-mail goes to the login address.
- **Built in step 13**: a portfolio limit alert on a portfolio the user reads, as a CEO watches the
  organisation's fund; none for an account type without portfolios (the Journalist).
- **Built in step 25 (third version)**: a news alert follows a security or a country (decision
  5): a FLASH goes out on its channels, an ARTICLE in the app; the notification starts with the
  item's two tags.
- **Still to do**: setting off the publication alerts (a followed analyst, a security or a country)
  when a publication goes out: the analysts are followed from PUB since step 6.
- **Fourth version (step 41)**: an alert on a commodity goes off when a new value comes.

### EQS / FA · Equity screener and fundamental analysis (screen 3): done

- **Built**: criteria of the mockup (market, country, sector, then ranges "at least", "at most"
  or "between" for market cap, P/E, dividend yield, ROE, net debt / equity and 1-year change),
  amber while they filter; "+ Add a criterion" adds price-to-book, net margin, revenue growth and
  beta. Run, Reset (and run), "Criteria changed" until the next run; saved screens (High yield,
  Banks) load and run with a click, SAVE names the criteria, × deletes one. Results: "5 of 7
  securities", sortable, columns chosen in COLUMNS (kept in the browser), day change in real time,
  XLSX / CSV in the title bar and the right-click menu; a click feeds the lower panels, a
  double-click opens DES. Comparison: P/E, yield, ROE, margin bars, the selected security in amber
  first, its sector average dashed in yellow; a click on a bar selects it. Statements: income,
  balance sheet, cash flow over 2021-2025 with the CAGR (or the change in points for a
  percentage), and the balance sheet and cash flow key lines below. The criteria, the results and
  the selection survive a visit to DES.
- **FA tab of DES**: the same comparison against the other equities of the market, its sector
  first, the ratios next to the sector average, the statements and the price chart. Recharts loads
  with the tab, not with every profile.
- **Mock**: 2021-2025 accounts of the seven BVMAC equities, built so the screen 3 mockup's ratios
  come back at the mockup prices (SEMC grows as in the mockup); ratios follow the live price; the
  sector averages are a table, Beverages at the mockup's 6.3%.
- **Built in step 12**: without `analysis:save` (the Journalist, the CEO), no SAVE and no saved
  screens; the server refuses them too.
- **Still to do**: the "ANNUAL" switch of the mockup: the statements file has half-years, the API
  no period parameter.
- **Built in step 35 (third version)**: the description of the selected row under the results,
  as the redrawn mockup: its text in the screen's language, its source (the Data admin, EODHD) and
  FR / EN when both languages are written; a language without text shows the other one, marked.
  The results keep seven rows of the grid, the description four, the panels below fifteen.

### YCRV / YAS · Yield curves and bond calculator (screen 4): done

- **Built**: the curves of the six CEMAC countries in the mockup's colours on a log axis from 3M
  to 10Y; a click on a legend item hides a country; "COMPARE TO" draws the curve of the
  calculator's bond country 1 week to 1 year earlier, dashed; the tooltip marks auction points.
  Calculator: settlement date (two business days after today, as in the mockup), clean price or
  yield (the figure typed last drives, the other follows), face amount, all amber; then the
  outstanding principal, accrued interest, dirty price, settlement amount, average life, Macaulay
  and modified durations, convexity, DV01 and the spread over the issuer's curve. The figures come
  back about 150 ms after typing stops (120 ms pause, a stale request is cancelled). `/ycrv` opens
  the first bond, `ECMR 6.25 2029 YAS` that bond; picking another goes to `/yas/{id}`. The BEAC
  auctions below.
- **Mock**: the section 14.1 formulas, tested against cases A and B to four decimals, with
  Newton-Raphson then bisection for the yield; curves from a weekly curve file and the auctions of
  the last 90 days (BTA rates converted, 4.95% on 182 days giving 5.0819%); earlier dates 0.15
  point lower a month back.
- **Still to do**: US and European curves (in the spec, not in the mockup); bond quotes on the
  CEMAC curves (left out by the mock).
- **Third version (step 30)**: YAS opens BP, bond pricing (screen 16), and its old addresses
  `/yas/{bondId}` lead there; screen 4's calculator stays, on the same engine, at
  `/ycrv/{bondId}`, with a link to BP ("Full pricing in BP").
- **Fourth version (step 38)**: the CEMAC curves read the sovereign yield series of the
  `CEMAC_SOV_YIELDS` file, the latest point of each tenor; a point older than 90 days is marked
  stale, and the tooltip gives its type, reference security and source.

### PORT · Portfolio (screen 5): done

- **Built**: header with the portfolio selector (new, settings, delete) and the 7 metrics of the
  mockup. Six tabs, one route each (`/port/{id}`, `/port/{id}/risk`...), each with its saved
  layout. Positions has the 5 panels of the mockup: the lines (a weight above the limit on one
  issuer in yellow with ▲, cash last, Excel / CSV export, IMPORT CSV), performance against the
  benchmark, allocation by sector, country or asset class, risk metrics (a breached limit in red
  with the limit below) and upcoming income with "Generate portfolio PDF report". Transactions:
  the history with the gain each sale realized; a right-click corrects or deletes one. Performance:
  portfolio in amber, benchmark in grey, base 100, YTD to inception, with TWR, annualized return,
  IRR and the returns by period. Risk: every metric of spec section 14.3 ("insufficient data"
  below 60 returns), the limits and their status, issuer concentration, the bonds by maturity.
  Income: upcoming and received. Reports: period, sections, comments and logo; the job is followed
  until the PDF shows. "New transaction" opens the side form for the 9 types, with the cash a share
  trade takes; "Buy" and "Sell" on a line fill it in. Import from the CSV or Excel template: all
  rows or none, errors listed by line. Model portfolios simulate an allocation (amount, start
  date, weights): the only kind a Student holds. The quota of the account type (3, 5, unlimited)
  comes from `/me`; PDF reports need the Portfolio manager account.
- **Real time**: value, unrealized gain, weights, day change and the year-to-date returns follow
  live prices: each line comes with its value per point of price and its accrued interest, and
  today's live return is chained onto the server's year to date.
- **Mock**: replays the transactions at each session's closing price, bonds on their principal
  outstanding with accrued interest (spec section 14.2); average cost, realized gains, TWR and the
  risk metrics follow sections 14.2 and 14.3 and are tested against their cases. The sample fund
  ends with the mockup's lines, bought in two tranches, with deposits, a withdrawal, custody fees
  and the dividends, coupons and redemption it received. A breach after a transaction or a limit
  change sets off the portfolio alerts.
- **Built in step 13**: a portfolio shared with the organisation from its settings: SHARED for
  its owner, "Shared by P. Owona" and READ ONLY for the colleagues and the CEO, who change nothing
  and generate no report.
- **Still to do**: the mock leaves the logo out of the PDF; a portfolio in EUR holds XAF
  securities at the peg, no floating currency.
- **Fourth version (step 42)**: "Optimise" opens OPT on the portfolio's securities; an allocation
  of OPT becomes a model portfolio, a portfolio, or the trades that adjust an existing one.

### PUB · Research library (screen 8): done

- **Built**: filter bar (subject, country, sector, access, rating, sort, free text) kept in the
  URL; the list with its tabs All / Purchased / Followed analysts, 20 a page: price in amber or FREE
  in green, title, subject, analyst, coloured rating, date, readers' score, Read or Bought. The
  preview: summary, locked contents, rating with the upside from the reference price, price (the
  student price for a Student), Mobile money or Card. The payment is followed until the operator
  confirms, with its dialog closed or not; the full content then replaces the preview with the
  buyer's name as a watermark, the disclosures, the watermarked PDF, the attachment, a 1 to 5 rating
  and "Report content". The analyst: Follow, the four figures of the mockup and each Buy / Hold /
  Sell against the price 12 months later. The same list and preview make the ANA tab of a security
  (a bond shows the research on its country).
- **Rules**: Data admins and Admins cannot buy (the server refuses, the preview says why); an
  author reads without buying or rating; a free publication read once cannot become paid; a
  withdrawn one stays readable by its buyers only.
- **Mock**: 128 publications by five analysts, the first eight those of the mockup. K. Atangana's
  profile gives the mockup's 42 publications, 4.4 / 5, 412 followers and 68% of ratings
  confirmed, worked out from the price history. Mobile money confirms after about 3 seconds; a
  number ending in 0000 is declined. Reads, sales and ratings are counted by month for screen 7.
- **Built in step 15**: "Publications of M. Ndong" (`?analyst=`), opened from a profile in NET.
- **Still to do**: the country page (open question); notifying the followers of an analyst or a
  subject (the hub sends `PublicationPublished`, alerts of type "publication" are not set off
  yet); card payment through the provider's page (3-D Secure) and its return. Employees read free
  research through the moderation queue (MOD, step 9): the library is a client screen.

### PUB NEW · Publishing studio (screen 7): done

- **Built**: my publications (status badge, access, "Update draft" when a published one has changes
  not out yet) with + New on a company or a country; my earnings for a month (reads, sales,
  revenue, CMarket's commission, net payable, rating, followers) and the monthly payouts; the
  editor (subject, title, summary, TipTap with B, I, H2, H3, list, table, image, CMarket chart and
  link); the settings (Free / Paid within the Admin's range, student price, free after a delay,
  rating or outlook, target, horizon, reference price, the three disclosures, PDF attachment,
  moderation mode). Reader preview, before and after purchase. Submit is enabled once the three
  disclosures are ticked and shows the automatic checks by field; a published publication gets
  Publish update; Archive or Withdraw takes a reason. An Analyst not approved yet sees why.
- **Rules**: autosave every 10 seconds, and on leaving the publication or the screen; each save
  carries the row version, and a 409 offers to reload the copy saved elsewhere. Closing a tab with
  unsaved changes asks first. A CMarket chart (security, period, line or candles) is frozen by the
  server at insertion and the body holds its id; images are uploaded as attachments. A new price
  applies to readers at once; a change of content becomes a new version.
- **Mock**: K. Atangana's 44 publications, with the SEMC update of the mockup in progress (the
  sources to tick again) and its chart frozen on 28/10/2026; October gives the mockup's earnings.
- **Still to do**: ratio and yield curve charts in a publication (price charts only); a version
  history readers can open (the library shows the latest version and its date).

### NET · Professional directory (screen 10): done

- **Built in step 15**: the filters, the results and the profile of the mockup, the search and the
  profile open in the URL, and the public page `/p/{handle}`. Since: Contact and Send a message
  open MSG, blocks (step 16); the reported profiles reviewed in MOD, the specialties of ADMCFG
  (step 18). See step 15.
- **Third version (step 24)**: the News provider among the types, with its teal badge.
- **Fourth version (step 43)**: the SVT, a tenth type, has no profile and is not listed.

### MSG · Messaging (screen 11): done

- **Built in steps 16 and 17**: the conversations, the thread and the participant of the mockup,
  contact requests, blocks, groups, files scanned before use, securities, charts, publications and
  news items (from N) shared; then the `/hubs/chat` hub: new messages, read receipts, "typing…", online status and the
  count on MSG in the menu. See steps 16 and 17.
- **Still to do**: the thread's SEARCH and "⋯" of the mockup; the push and e-mail notifications
  of a message unread after 5 minutes, with the back end, which also encrypts the messages and
  keeps them 24 months.
- **Built in step 25 (third version)**: a news card shows its tags and subject.
- **Built in step 31 (third version)**: a security card opens the profile of its type, a
  bond's the bond profile (it opened BP since step 30).
- **Fourth version (step 43)**: an SVT writes to the traders linked to its bank.

### NET ME · My profile, visibility and contact (screen 12): done

- **Built in step 14**: the profile, its visibility and contact rules and the card preview of the
  mockup. Since: the people blocked (step 16); the Admin's default rules and specialties (step 18).
  See step 14.
- **Still to do**: choosing the square of the photo (the mock keeps its centre).
- **Third version (step 24)**: a seventh row, the News provider, in "Who can contact me".

### CFG · Settings (no mockup): done

- **Built**: five panels. Profile: the login address, the account type (an Analyst's status), the
  organisation, then the name, the mobile phone, the language and the time zone, which apply at
  once (`PUT /me`). Security: the password (`PUT /me/password`, which closes the sessions of other
  devices), where the login codes go (e-mail, or SMS once a phone is set), the automatic logout.
  Subscription: the plan that covers the user, with its modules, its renewal or the end of the
  trial, who pays (the user, or the organisation for its members), then the plans by month or year
  per user; Choose opens the checkout: card or mobile money followed until confirmed, or a bank
  transfer against an invoice due in 15 days, the plan applying at once. Organisation: the members
  and the invitations; an administrator invites by e-mail and, from the right-click menu, changes
  a role or removes a member (with a confirmation); the last administrator stays. Invoices: the
  plan's, the organisation's for its administrators and the receipts of research bought, each in
  PDF from the title bar once selected (or by double click); a transfer still due shows its date.
  Members of an organisation read its plan without changing it.
- **Mock**: four plans (Monitoring, Analysis, Professional, and Student for students), prices per
  user and month excluding VAT at 19.25%, a year for ten months. K. Atangana pays Professional
  yearly by card; Asset manager A pays Professional monthly and Bank C Analysis yearly (no
  Portfolio: PORT is locked for T. Bekale), both by transfer; University B has the student plan.
- **Built in step 12**: the green VERIFIED badge of an approved Analyst, Journalist or CEO; the
  user menu opens NET ME since step 14.
- **Still to do**: accepting an invitation (the e-mail link and its sign-up); the status of a
  Student's proof of enrolment.

### Home page (no mockup): done

- **Built**: `/`, in the brand navy and green of spec section 8, in French or English: what
  CMarket does and a picture of the terminal drawn with sample data, four figures, the three uses
  of spec section 1 with research and their function codes, the CEMAC and international markets,
  the client account types (each opening the sign-up with its type), the plans by month or year as
  the server prices them, why CMarket, then the trial. A visitor already logged in in the browser
  (the refresh cookie) gets "Open the terminal" instead of the trial and the login, and the plans
  lead to CFG. Motion: the hero rises into place and each section comes in as it scrolls into
  view; the picture types the commands of spec section 8, draws its charts, moves its sample
  quotes with the screens' 400 ms flash and scrolls its tape, only while on screen and until its
  Pause button (WCAG 2.2.2); a plan's price glides to the other billing cycle; the header gets a
  shadow once the page scrolls. Behind the hero, a city at night closes in slowly, the grid of a
  chart drifts and price lines slide by; two glows of the brand colours drift behind the whole
  page; the same button stops them. Photos set the mood: Douala at sunset above the markets, the
  work of each account type on its card, a coastal city at dusk behind the trial; those behind a
  section move against the scroll. The navy shades them where text stands on them (4.5:1 at
  least, measured behind each line of text at several scroll positions).
- **Built in step 12**: the six client account types, in two rows of three, with two more photos.
- **Still to do**: the texts are the prototype's, to be checked by the spec author.
- **Third version (step 24)**: seven client types, the News provider among them.

### Login, OTP, sign-up, password reset: done

- **Built**: `/login`, `/signup` and `/reset-password`, outside the app shell in the brand navy and
  green, in French or English. Login: e-mail and password, then the one-time code of 6 digits sent
  by e-mail or SMS (`POST /auth/login` answers where it went; `/auth/otp/verify` gives the tokens),
  5 tries, a new code after 30 seconds by logging in again; wrong passwords lock the account for 15
  minutes after the fifth. Sign-up: the account type of spec section 12, the user, a proof of
  enrolment for a Student without a school address, an identity document and a CV (and a licence)
  for an Analyst, whose status then waits for an Admin; the code then confirms the address and the
  14-day trial of the account type's plan starts. Password reset: a code sent to the address, then
  the new password; the answer is the same whether an account uses the address or not. Logout from
  the user menu, in every tab; automatic logout after 30 minutes without activity.
- **Mock**: the accounts of the eight demo users and of their colleagues (password `cmarket2026`),
  salted SHA-256 hashes, access tokens of 15 minutes, refresh tokens of 7 days in the cookie the
  mock keeps for the browser, codes shown by the prototype (`GET /_prototype/codes`). The account
  switch of the user menu opens a session for a demo user.
- **Built in step 12**: the sign-up asks a Journalist for a press card or an employer letter, a
  CEO for a proof of position and the organisation they head; their status then waits for an
  Admin. R. Tamba (Journalist) and E. Fouda (CEO) are demo accounts.
- **Third version (step 24)**: the sign-up of a News provider: its media, the media's letter
  and the signed content agreement.
- **Fourth version (step 43)**: the SVT is not among the types of the sign-up: an Admin creates
  it, and it logs in with a code every time.

### NEWS NEW · News studio (screen 13): done

- **Built in step 26**: the five panels of the mockup: My news by status, with its badges and
  unique clicks; the month's earnings; the editor (headline and counter, standfirst or FLASH text,
  the rich body with its images, credits and CMarket security cards, the PDF, source and author,
  original link, rights box); the publishing settings (category, countries, securities, language,
  type, go live now or at a time of Douala, Preview, Publish, Schedule or Update, Withdraw); the
  file import (templates, drop zone, the last import and its rows in error, Fix row, details,
  Publish). NEWS in the menu, after N; "News studio — Media I" in the top bar.
- **Mockup**: the mockup's country field is a drop-down ("CEMAC (6) · Cameroon"): the studio
  ticks the six and each country in the panel, as NEWS does. Its card "RELATED · BEAC POLICY
  RATES" shows rates, which no security holds: a card names a security of the master list, its
  live price shown. The withdrawal, which section 16 asks for, has no control on the mockup: it
  sits in the publishing panel's title bar.

### ETFS · ETF screener (screen 15): done

- **Built in step 32**: the criteria, the results with the domicile's flag and the five blocks
  of the selected ETF of the mockup, saved screens and the XLSX and CSV export, on the evening's
  calculation of CMarket.Api (see step 32).
- **Mockup**: its criteria keep fees "< 0.25%" while its results list CW8 at 0.38%: the screen
  keeps the criteria, five ETFs. Its Sharpe ratios (1.18 to 1.45) imply a risk-free rate near 6%
  in dollars and in euros, which no single rate a currency gives for all six: the demo's rates
  are 4% in dollars and 2% in euros, the Admin's to change, and IWDA's Sharpe ratio reads 1.45.
  Its prices "XX,XX $" are written as the user's language writes amounts ($121.80, 121,80 $).
  Its "30-day" averages are read as the last 30 sessions.
- **Changed on 12 November 2026**: its own entry in the menu, after EQS, which the mockup lights
  ([the spec author's answers](#the-spec-authors-answers)).

### BP · Bond pricing (screen 16): done

- **Built in step 30**: the inputs (a bond of the master list or its characteristics entered by
  hand, the platform's yield the user may change, the face amount), the three blocks of results,
  the cash-flow schedule with its total and its XLSX export, the price-yield curve and the rate
  sensitivity of the mockup, on CMarket.Api's `/bonds/price` (see step 30). YAS opens BP.
- **Mockup**: its values are case A of section 14.1 at the yield it shows, 5.7302%: the dirty
  price, the durations, DV01, the cash flows and the shifts follow that yield; its clean price
  101.4000 and settlement amount XAF 107,564,384 follow case A's clean price of 101.40, whose
  yield it rounds (BP shows 101.3999 and XAF 107,564,262 at 5.7302%, 101.4000 at the platform's
  unrounded yield). The demo's ECMR is the amortizing bond of case B.
- **Changed on 12 November 2026**: its own entry in the menu, after YCRV, which the mockup lights
  ([the spec author's answers](#the-spec-authors-answers)).

### BS · Bond screener (screen 17): done

- **Built in step 29**: the criteria, the results and the four blocks of the selected bond of the
  mockup, saved screens and the XLSX export, on the daily calculation of CMarket.Api (see step
  29).
- **Mockup**: its figures are of 29/10/2026; the demo computes its bonds on the latest session,
  so that the accrued interest, the yields and the durations follow the date. ECMR is the
  amortizing bond of YAS (case B of section 14.1), where the mockup shows case A's yield.
  "Open in BP" opens BP since step 30.
- **Changed on 12 November 2026**: its own entry in the menu, after BP, under YCRV, which the
  mockup lights ([the spec author's answers](#the-spec-authors-answers)).
- **Fourth version (step 44)**: "Request a price (RFQ)" on a BTA or an OTA.

### DES on an ETF · ETF profile (screen 19): done

- **Built in step 33**: the header and the tabs DES, GP, HLD, PERF, DIST and DOC of the mockup,
  then N and ANA; DES with the price and NAV history, the performance against the index, the risk,
  the top 10 holdings, the allocation and the structure and costs; under ETFS in the menu (EQS, as
  the mockup, until [the spec author's answers](#the-spec-authors-answers)). See step 33.

### DES on a bond · Bond profile (screen 20): done

- **Built in step 31**: the header and the tabs DES, GP, BP, CF, RAT and DOC of the mockup, then N
  and ANA; DES with the price and yield history (model prices lighter, volume bars), today's
  analytics, ratings, characteristics, upcoming cash flows and documents and news; under BS in the
  menu (YCRV, as the mockup, until [the spec author's answers](#the-spec-authors-answers)). See
  step 31.
- **Fourth version (step 44)**: "Request a price (RFQ)" on a BTA or an OTA.

### CMDTY · Commodities (screen 21): to do

- **Planned in step 41**: the list of the commodities and the profile of one, DES on a commodity.

### RFQ · Government securities RFQ (screen 22): to do

- **Planned in steps 43 and 44**: "My SVTs" first, then the requests, the answers, the automatic
  selection and the blotter.

### RFQ AGR · Agreements (screen 23): to do

- **Planned in step 46**.

### ECO · Macroeconomic dashboard (screen 25): to do

- **Planned in step 40**.

### FX · FX dashboard (screen 26): to do

- **Planned in step 39**.

### SVT · SVT approval (screen 27): to do

- **Planned in steps 43 and 45**: the SVT's account, menu and trader links first, then the
  approval of the agreements.

### OPT / OPT RES · Portfolio optimisation (screens 28 and 29): to do

- **Planned in step 42**.

## Back-office

### IMP · Data import (screen 6): done, with DATA, HIST and EODH

- **Built**: the four panels of the mockup. Session coverage: each file expected for the session
  (daily prices and indices every session, auctions on an auction day, curves on Fridays) with
  its state, published (and when), being checked, expected (and when), missing, or none
  expected, the issuer news of the day; a click opens the latest upload; "Download file
  templates" lists the columns and checks of each file with its CSV and Excel template. Current
  upload: the five steps, the counters (rows read, new, changed, unchanged, alerts, errors; a
  click shows those rows only), the rows as read with ✓, ! or ✕ and the reason in the Check
  column (yellow for an alert, red for an error), a changed cell in amber with the stored value in
  its tooltip. The first row to look at is selected, with what to do; "Alert checked" ticks it.
  Publish N rows, Fix row (the cells typed again, then the whole file checked again), Replace file
  and Discard (with a confirmation). A published file shows who published it and offers Roll back
  (with a reason) and New upload; a rolled back one comes back to its preview with the reason.
  Upload history: the last 7 days, the status in colour ("Rolled back, republished" in yellow),
  a click opens the upload, the right-click menu rolls back. EODHD connector: state, the latest
  US, Europe and fundamentals bulk loads, calls today, quota used (with its bar), 429 answers in
  24 hours, the last error. The upload shown is in the URL (`/imp?import=`).
- **DATA**: the coverage of any session (picker and previous / next), its uploads, and the
  templates. **HIST**: the history over any period, by type, status and dates, 50 a page.
  **EODH**: the connector in detail and its loads of the last 7 days, by load and result.
- **Rules**: Publish stays disabled while an error remains or an alert is not ticked "checked";
  one upload at a time is checked for a type and a session (a second one is refused, with a
  link to open the first); only a file not published is replaced or discarded, only a published
  one rolled back.
- **Mock**: the upload is read now and its checks reported step by step (format, then business
  rules, about 2.5 seconds): required cells, dates, figures, the high and the low, unknown
  security, index or country, duplicates, a day without a session or of another session, a
  change above ±15% (5% for an index, 1 point for a rate) from the stored value, a zero volume
  with a moved close. The seeds follow the mockup: the files of the last five sessions by
  A. Mbarga and J. Ekane, the 29/10 prices rolled back and published again, and the BEAC
  auctions of the latest session waiting in their preview with the Gabon 13-week BTA 1.40 points
  above its previous auction. A published file replaces the generated prices of its sessions
  (today's last prices too), the index closes, adds the auctions to CAL and YCRV, the curve
  points and the dividends; the EODHD loads are generated, a 429 now and then retried 15
  minutes later.
- **Still to do**: the securities and financial statements files are checked and kept, but the
  security master and the statements of the screens do not read them yet; the curves of a
  published file apply from its date, without the shift of the sample file.
- **Third version (steps 29 and 32)**: the bond list and ratings files, the two ETF files.
- **Built in step 29**: the bond list (`bond-master`) and the bond ratings (`bond-ratings`): a
  bond listed or described by its ISIN, a rating added to its history; their rollback.
- **Built in step 32**: "ETF profiles" (`etf-profiles`: a listing by its ticker and exchange,
  listed as an ETF or described again, the size, inception and benchmark EODHD keeps left as they
  are where the file is empty) and "ETF NAV and spreads" (`etf-nav`: a session's NAV and bid and
  ask, an alert past 10% from the NAV before); their rollback.
- **Built in step 33**: the portfolio of "ETF profiles" (its count, day, largest lines and
  weights by sector and region, packed as the bond list's schedules), written back the largest
  first, its rollback to the portfolio it replaced.
- **Fourth version (steps 38, 40 and 41)**: the CEMAC sovereign yields file, which takes the
  place of "Curves and rates" in the session coverage (expected at 17:30, "Under review" while it
  is checked, as the redrawn mockup); the commodity prices file; a "Macro" file for the series
  the World Bank lacks.

### CORR · Data corrections (no mockup): done

- **Built**: a security and a session (or a click on one of the two months of stored sessions,
  each with its source: daily prices file, initial history or correction), the stored open,
  high, low, close and volume typed again, a required reason; the log of corrections (when, the
  security, the session, the close before and after, the reason, who), a click opens one. Both
  are in the URL (`/data/corrections?security=SEMC&date=`).
- **Mock**: a correction replaces the session for every screen, today's last price too, and
  outlives the rollback of an earlier file.
- **Built in step 35 (third version)**: the description of the security picked, in French and
  English (2,000 characters each), who wrote each and when, what EQS shows of a language left
  empty, EODHD's English apart; an empty text removes that language. AUDT keeps each language
  changed, before and after.
- **Fourth version (step 41)**: a commodity's name, description, exposed countries and related
  securities.

### NEWS · News and documents (no mockup): done

- **Built**: the news and the documents published, newest first, in two tabs; a click opens one
  in the editor. News: headline, source, topic, country, securities and text, published at once
  to the terminals (`NewsPublished`); documents: type, title, source, securities and the PDF
  (20 MB), shown in the DOC tab of their securities and the N screen. An edit keeps the
  publication date; a document keeps its file unless another is dropped.
- **Mock**: the entries are kept with the sample news and documents; a PDF uploaded stays in the
  tab that sent it (a generated one stands in after a reload).
- **Still to do**: the PDF attached to a news item (spec section 11): for now the Data admin
  publishes it as a document of the same securities.
- **Built in step 25 (third version)**: an item of the CMARKET channel with its type (an
  ARTICLE's standfirst and body, a FLASH's 500 characters), subject, category, countries and
  language; the list keeps the CMARKET channel's items.
- **Built in step 27 (third version)**: the Moderation tab (the items reported, then those
  waiting; approve or keep, take down, retype) and the Publishers tab (the domains of the feeds'
  newspapers).

### USER · Account administration (screen 9): done, with ANLY and MOD

- **Built**: the five panels of the mockup. Counters: the active accounts by type in the type's
  colour, reused in the list, the details and the permission matrix; a click filters the list.
  Accounts: search by name, e-mail or organisation, type and status (active, under review,
  suspended) filters, sorting and pages by the server, "+ Create account" (any type; Data admin
  and Admin belong to CMarket and log in with a code every time) and "Export CSV" of every
  account of the filters. Account details: type with the Analyst approval, organisation,
  subscription, two-factor, publications, sales and reports of an analyst or research bought by a
  client, last login and its place; Change type (a client among the client types, an employee
  among the employee ones), Reset two-factor (codes by e-mail again, every session ended), View
  audit log (AUDT on the account), Suspend or Reactivate with a reason and a confirmation. An Admin
  neither changes nor suspends their own account. Analyst status requests: the applicant, the
  documents sent at sign-up (in the PDF viewer), Approve or Reject with a reason. Moderation
  queue: reports then publications waiting, Open (MOD), Approve, Take down with a reason. The
  account shown and the filters are in the URL (`/admin/users?id=&type=&status=&sort=`).
- **ANLY**: the requests waiting, approved or rejected, and one with its documents side by side.
  **MOD**: the queue by kind, and the publication opened in the PUB reader with its reports;
  approved, a publication waiting goes live and its followers are told, a reported one stays and
  its reports close; taken down, it leaves the library and its buyers keep their version.
- **Built in step 12**: the eight account types in the counters, as on the redrawn screen 9;
  "Status requests" of the Analysts, Journalists and CEOs, each with its type and documents.
- **Built in step 18**: "Reports received" in the details of every client, in red once referred;
  MOD reviews the reported profiles and conversations below its publications (see step 18).
- **Mock**: the counters add up to 2,041 active accounts (2,054 with the suspended; 1,946 before
  the second version); the three requests, the two reports and C. Nguema's first publication of
  the mockup are seeded. Suspending ends the user's sessions at once; a type changed to Analyst,
  Journalist or CEO is approved with it.
- **Third version (steps 24 and 27)**: nine counters, the News provider approved in ANLY;
  MOD's news panel (step 27).
- **Fourth version (step 43)**: ten counters; the SVT accounts of a licensed bank, which an Admin
  creates.

### ADMCFG · Platform settings (no mockup): done

- **Built**: quotas of portfolios and alerts by client type (empty for unlimited), the price
  range, CMarket's commission and the moderation mode of research, the risk-free rate of the
  Sharpe ratio, saved together with who changed them last. The permission matrix: the
  permissions by area as rows, the eight account types as columns, the changes counted and saved
  role by role (`PUT /admin/roles/{role}/permissions`); the Admin keeps `settings:manage`.
- **Built in steps 12, 14 and 18**: the quotas of the six client types and the eight columns of
  the matrix, with the rows of the directory and messaging (step 14); the panels Directory and
  messaging (default contact rules, new conversations a day, report threshold) and Specialties.
- **Mock**: users get the new permissions and quotas with their next `/me`, the studio and the
  library the new price range, commission and moderation, PORT the new rate.
- **Third version (steps 24, 29 and 32)**: the News provider's quotas and column of the
  matrix; the reference curve and the risk-free rate of each currency.
- **Built in step 29**: the XAF reference curve of the bonds' spreads (Cameroon's by default).
- **Fourth version (steps 38 to 47)**: the age past which a curve point is stale; ECO's comparison
  countries and tiles, FX's currencies; the licensed SVTs with their back-office address, the
  minimum trading amount, the validity of a link, the approval window and the RFQ's switch
  (decision 24); the keys of the RFQ and of OPT in the matrix.

### AUDT · Audit log (no mockup): done

- **Built**: when, who, action, target, the values before and after and the reason, newest first
  and 50 a page, filtered by user (an account picker), action and dates, all in the URL
  (`/admin/audit?userId=&action=&from=&to=`); a click shows the entry with each value before and
  after. USER's "View audit log" opens it on the account: what it did and what was done to it.
- **Built in steps 12 and 18**: a status approved or rejected, with the account type; the reports
  dismissed, the reported conversations read, the specialties and the directory settings changed.
- **Fourth version (step 44)**: the RFQ's compliance export, over a period.

### PAY · Analyst payouts (no mockup): done

- **Built**: by analyst and month, the sales, revenue, commission and net payable with its status
  (in progress for the current month, due once closed, paid), the total due in the title bar,
  filters by month, status and analyst in the URL, "Mark paid" for the selected payout in the title
  bar, with a confirmation (also by double click, Enter or the right-click menu). The analyst's
  earnings in PUB NEW show the payment.
- **Mock**: the months up to August are paid, K. Atangana's September too (on 5 October), the
  other analysts' September is due.

### SUBS · Subscription management (screen 14): done

- **Built in step 34**: the counters, the subscriptions of every account and paying organisation
  (search, plan, status and expiry filters, sorted by expiry, CSV), the account's subscription
  with its payments and invoices (each invoice's PDF), Extend, Change plan, Resend last invoice and
  Suspend; "via organisation" for a member. See step 34.

### MPAY · Media payments (screen 18): done

- **Built in step 28**: the month's header, the statements by newspaper with their total, the
  global settings and the transfer file; the click anomalies of the newspaper picked, Invalidate
  and Keep; the statement with its status, a change a second Admin confirms, the newspaper's
  dispute, Release, Recalculate and the PDF; the newspaper's payment settings by month. NEWS NEW
  shows the newspaper its statements and lets it dispute one. See step 28.

### SRC · News sources (no mockup): done

- **Built in step 27**: the newspapers by channel (contract, review mode, logo, News providers),
  CMarket AI's review mode and threshold, the views an hour, the ingestion clients (decision 6 of
  the third version).

### RFQ REP · Daily reporting to the BEAC (screen 24): to do

- **Planned in step 47**, in the Admin's back-office with every organisation's agreements
  (decision 17 of the fourth version).

## Open questions for the spec author

- **Home page**: the spec names "marketing pages" (section 8) but gives no mockup, route or text.
  The prototype puts the home page at `/` and the app's home screen at `/app`, and reads the plans
  with `GET /subscription/plans` before login: is that endpoint public (the prototype: every plan
  without a token, those of the account type with one)?
- **Country page**: mentioned (`/macro?country=`, research on a country) but without a mockup,
  route or function code.
- **Admin**: section 6 lists statistics and the management of organisations, plans, trials and
  invoices, with no API or screen.
- **IMP**: the prototype adds `POST /data/imports/{id}/discard`, and Replace file sends the new
  file to `POST /data/imports` with `replacesId`; "Alert checked" is
  `PATCH /data/imports/{id}/rows/{rowId}` with `{ checked: true }`, Fix row the same PATCH with
  `{ values }`. `/data/imports/{id}/rows?status=` takes `error`, `alert`, `new`, `changed` or
  `unchanged` (the spec says `warning`). Each issue comes with a code, a severity, a column and
  its figures (`params`), so the screen words it in the user's language. `GET /data/import-types`
  lists `{ type, frequency, columns, checks, changeThreshold }`; `GET /data/coverage` answers
  `{ date, items }`, each item `{ type, status, published, lastPublishedAt, dueOn, importId }`,
  for the current session without a date. Which thresholds apply (the prototype: ±15% on a
  close, 5% on an index, 1 point on a rate), and are they Admin settings? Is a second upload of
  the same type and session refused while one is checked (the prototype: yes)? The screen 4
  mockup shows the 28/10 auctions published while the screen 6 mockup checks them: the prototype
  keeps the 26-week Cameroon BTA published, so the file shows it unchanged.
- **CORR**: only `PUT /data/securities/{id}/prices/{date}` is given; the prototype adds
  `GET /data/securities/{id}/prices?from=&to=` (the stored sessions and their source) and
  `GET /data/corrections` (the log). May a correction change the volume (the prototype: yes)?
- **NEWS**: the bodies are not specified. The prototype sends
  `{ headline, source, topic, country, securityIds, body }` to `POST /data/news` and
  `PUT /data/news/{id}`, and a multipart form (`type`, `title`, `source`, `securityIds`, `file`)
  to `/data/documents`. Is a news item or a document withdrawn (no endpoint)?
- **EODHD**: the status fields are not specified. The prototype answers
  `{ status, latest, runs, callsToday, dailyQuota, rateLimited24h, lastError, checkedAt }`.
- **Screens 6 and 9 mockups**: J. Ekane is a Data admin on screen 6, and on screen 9 in the first
  version; the prototype's demo Admin is L. Mvogo.
- **USER**: no endpoint returns the counters by account type: the prototype adds
  `GET /admin/users/counts` (`{ student, analyst, ... }`, the active accounts). It also adds
  `GET /admin/users/export` (the CSV of every account of the filters), `GET /admin/organizations`
  (for the account form) and `?sort=` on `GET /admin/users`, whose items are
  `{ id, displayName, email, accountType, organization, status, verificationStatus, createdAt,
lastLoginAt }`. `POST /admin/users` takes `{ displayName, email, accountType, organizationId,
phone, language }`, `PUT /admin/users/{id}/type` `{ accountType }`, the suspension, the
  reactivation, the rejection of a request and the takedown `{ reason }`. May a type change cross
  from client to employee (the prototype: no)? Is an account changed to Analyst approved with it
  (the prototype: yes)? What does "Reset two-factor" reset when the codes go by e-mail or SMS (the
  prototype: codes by e-mail again, every session ended)? Where does the place of the last login
  come from (the prototype: the time zone)?
- **ANLY and MOD**: the prototype adds `?status=approved|rejected` to
  `GET /admin/analyst-requests`, `GET /admin/analyst-requests/{id}/documents/{kind}` (the files
  sent at sign-up) and `GET /admin/publications/{id}` (the publication as readers will see it, a
  draft waiting included). Approve on a reported publication keeps it online and closes its
  reports. The screen 9 mockup reviews a first publication before it goes live although the
  moderation is after publication: the prototype does the same.
- **ADMCFG, AUDT, PAY**: the spec gives no body. The prototype sends the settings as
  `{ quotas, minPrice, maxPrice, commissionPct, moderation, riskFreeRatePct }`; R_f is one rate
  set by the Admin, where section 14.3 defaults it to the 52-week BTA rate of each portfolio's
  country. An audit entry is `{ at, actor, action, target, changes: [{ field, scope, before,
after }], reason }`; `?userId=` matches who acted or the account acted on, and `?action=` takes
  several actions. Which actions are logged (the prototype: publications, rollbacks, discards,
  corrections, news and documents of the Data admin, every action of the Admin, not each row
  fixed in an upload)? Marking a payout paid has no permission in section 12: the prototype adds
  `payouts:manage`. A closed month stays due until marked paid.
- **Screen 9 mockup**: T. Bekale, the demo Trader, is suspended: the prototype suspends his
  colleague F. Mba instead. "Gabon: oil price impact on auctions" is K. Atangana's note waiting
  in moderation on screen 7 but M. Ndong's reported note on screen 9: the prototype reports
  M. Ndong's Gabon note and keeps K. Atangana's waiting (2 reports, 2 pending). The details give
  K. Atangana 42 publications (3 withdrawn) and 412 sales; the prototype counts 43 (1 withdrawn)
  and 726 in the library of screens 7 and 8.
- **Real time**: no event for the order book and latest trades; the prototype polls them every
  5 seconds.
- **Quote**: the security header shows the session's open, high and low, which the example of
  `GET /securities/{id}/quote` lacks; the prototype adds them to the response.
- **Login**: the spec gives a JWT of 15 minutes, a refresh token of 7 days and a code, without
  saying where the refresh token lives, how the code goes or for how long. The prototype keeps the
  access token in memory and expects the refresh token in an `HttpOnly` cookie on `/auth`
  (`POST /auth/refresh` without a body answers `{ accessToken, tokenType, expiresIn }`).
  `/auth/login` answers `{ challengeId, channel, destination, codeLength, expiresAt, resendAt }`:
  6 digits valid 5 minutes, 5 tries, a new code by logging in again after 30 seconds; 401 for wrong
  credentials, 429 after 5 wrong passwords (locked 15 minutes), 410 for an expired code. Does every
  client log in with a code (the prototype: yes, by e-mail or SMS as chosen in CFG; section 12 says
  "mandatory" for employees only), and is an authenticator app (TOTP) wanted? Does the refresh
  token rotate, and how do two tabs renew it at once? How long is the inactivity (the prototype: 30
  minutes, with a warning in the last one)? Which password rules (the prototype: 8 characters, a
  letter and a digit)? `/auth/register` takes a multipart form with the documents and answers a code
  that confirms the address: which domains make a school address, and does an Admin check a proof
  of enrolment? Changing one's password has no endpoint: the prototype adds `PUT /me/password`.
- **Subscriptions**: `/me` returns neither the modules nor the trial: the prototype adds `modules`
  and `trialEndsAt`, with `phone` and `twoFactorChannel`. No plan, price or VAT is given: the
  prototype offers Monitoring, Analysis, Professional and Student, per user and month excluding
  VAT at 19.25%, a year for ten months, and a 14-day trial of every module of the account type.
  Which screens belong to which module (the prototype: Monitoring MKT, DES, N, CAL, ALRT; Analysis
  EQS, YCRV, YAS and the FA tab; Portfolio PORT; research and settings in none)?
  `POST /subscription/checkout` takes `{ planId, billingCycle, method, phone }` and answers
  `{ payment, invoice, subscription }`: a transfer applies the plan at once, the invoice due in 15
  days; a change of plan starts a new period, without proration. Does an organisation pay for
  each member (the prototype: yes), and how is an invitation accepted? `GET /organization` answers
  404 for an individual account; `PUT /organization/members/{id}` takes `{ role }`. Is VAT due on
  research sold for the analysts (the prototype's receipts include it)?
- **Time zone**: what does the profile's time zone change? The prototype shows dates and times in
  it; the session clock and the market's days stay in Douala time.
- **In the spec, not in the mockups**: the bond profile, US and European curves,
  `/global/indices` and `/commodities` on MKT.
- **Calendar**: the Data admin "manages the calendar", but no API writes it. The prototype adds a
  `country` filter to `/calendar` and accepts several `type` values; `/auctions` gets an
  `instrument` filter.
- **Watchlists**: the request bodies are not specified. The prototype sends `{ name, columns }`,
  with the first securities of a new list, and `POST .../items/{securityId}` returns the item.
  Sharing a list with colleagues (spec section 6) has no endpoint.
- **Alerts**: does the quota count alerts that are off (the prototype counts every alert)? Does a
  price alert go off at each crossing, or once (the prototype: once a session)? The notification
  text should be written in the user's language.
- **Screener**: the request and response bodies are not specified. The prototype sends
  `{ criteria: [{ field, values } | { field, min, max }] }` (bounds included) and gets
  `{ universe, items }`; saved screens are `{ name, criteria }`. No endpoint lists the sectors (the
  prototype reads them from `/securities`); section 10 filters on sector codes (`sector=BANK`) but
  the profile returns names, in English in both languages. The columns chosen have no endpoint.
- **Fundamentals**: over which equities is a sector average computed? The mock used a fixed
  table (Beverages at the mockup's 6.3%); CMarket.Api averages the equities it covers in the
  sector, so that SEMC, the only Beverages equity, is its own sector's average. The line items of
  the "Financial statements" file need agreed codes (the prototype: `revenue`, `ebitda`,
  `operatingIncome`...).
- **Portfolios**: the bodies are not specified. The prototype sends a transaction as
  `{ type, date, securityId, quantity, price, fees, amount, note }`, prices and fees in the
  security's currency, amounts in the portfolio's; the server adds a bond's accrued interest.
  Portfolios and transactions carry a `version` (409 when someone else saved meanwhile). Model
  portfolios have no endpoint: their `{ notional, startDate, lines }` go in the portfolio's
  settings. Which limits can a user set (the prototype: weight of one issuer, which also marks the
  lines with ▲, volatility, drawdown, beta, bond duration), and when are they checked (the
  prototype: after a change of transactions or limits, and when the risk is read)? The import
  template has no endpoint (the front end writes it); past reports have no list (the prototype
  shows those of the session). BVMAC-A is a price index: is there a total return index to use?
- **Screen 5 mockup**: its figures do not add up (lines worth XAF 1,202.7 M for a total of
  1,248.65 M; "Upcoming income (3 months)" of 18.4 M against 63.8 M listed). The prototype computes
  them, leaves principal out of upcoming income, and holds 15,000 and 11,000 bonds of XAF 10,000
  for the mockup's 1,500 and 1,100.
- **Research**: the bodies are not specified. The prototype saves the TipTap JSON as the body; a
  "CMarket chart" node holds the id of a chart frozen by `POST /publications/{id}/charts`
  (`{ securityId, period, type, title }`, answered with the bars as of today). The price range,
  commission and moderation mode come from `GET /publications/rules`, which the spec lacks (the
  Admin's settings are under /admin), and `/me` gets `verificationStatus` (`analystStatus` in the
  first version). `/library` takes `followed=true` for the Followed analysts tab and `q` for the
  search; `/me/purchases` takes the same filters; `GET /library/{id}/attachment` serves the
  attachment to readers.
  `POST /library/{id}/purchase` takes `{ method, phone }` and answers 202 with the payment. When
  is a rating "confirmed at 12 months" (the prototype: a Buy by a rise, a Sell by a fall, a Hold by
  a move within ±10%)? Is a read counted once per reader (the prototype) or at each opening? Does
  an update need the disclosures ticked again and go through moderation again (the prototype: yes,
  as the moderation mode says)? May the price change after publication (the prototype applies it
  at once)?
- **Screens 7 and 8 mockups**: the SEMC note is a draft on screen 7 but published on 28/10/2026 on
  screen 8; the prototype publishes it and shows an update in progress in the studio. Screen 8
  lists Apple and TotalEnergies notes, but the prototype's master list has no US or European
  security yet: SCG-RE and REGIONALE notes take their places. Screen 7 shows a note in moderation
  although the moderation mode is "post-publication review".
- **Bond calculator**: the body is `{ settlementDate, faceAmount, cleanPrice | yieldPct }` in the
  prototype, with a 400 for a date before the issue or after the last payment and a 422 when no
  yield fits. Which settlement lag (the mockup shows two business days) and which curve date for
  the spread (the prototype: the settlement date, today at the latest)? "No extrapolation beyond
  the first and last points (shown dashed)": the prototype draws nothing outside the points and
  gives no spread there. `/yield-curves` without a country returns all six. Validation messages
  should come in the user's language.
- **Account types, second version**: which permission keys stand for browsing the directory,
  being listed in it and reading a reported conversation (section 12 names `directory:list` and
  `messages:write` only; the prototype adds `directory:profile` and leaves the reported
  conversations to the Admin's `moderation:manage`)? "Read" forbids saved screens and drawings:
  the prototype adds `analysis:save`, which the Journalist and the CEO lack, and leaves them their
  watchlists and alerts. Which plans do they take (the prototype: the professional ones,
  Monitoring, Analysis and Professional, with the trial of Professional)? Does a CEO need the
  Portfolio module to read the organisation's portfolios? The members of an organisation share its
  plan, so the managers who hold those portfolios have the module. The Admin browses the
  directory, while employees only use the back-office: from which screen (the prototype: MOD,
  which shows the profiles reported; NET stays a client screen)?
- **Portfolios of the organisation**: sharing a portfolio with the organisation has no endpoint.
  The prototype adds `sharedWithOrganization` to the settings of `POST` and
  `PUT /portfolios/{id}`, and `sharedBy` to `GET /portfolios`, which lists the portfolios shared
  after the user's own. Section 6 shares them "between colleagues", section 12 with the CEO: the
  prototype lets every member who reads portfolios read them, without changing them, recording
  transactions or generating reports. May a reader set a limit alert on them (the prototype: yes)?
  Watchlists, which section 6 shares too, are not shared yet.
- **Function codes** (section 8): the table lacks NET, MSG and NET ME, which the mockups of screens
  10 to 12 type in the command bar.
- **Screen 9 mockup, second version**: the list still counts "8 of 1,946 accounts", while the eight
  counters add up to 2,041 (the prototype counts 2,041, and 2,054 with the suspended); its panel
  is still "ANALYST STATUS REQUESTS", while Journalists and CEOs are approved too (the prototype:
  "Status requests", each with its type). E. Fouda is the CEO of Bank C on screens 9 and 11, whose
  plan has no Portfolio module: the prototype makes E. Fouda the CEO of Asset manager A, whose
  managers have portfolios to share.
- **Status requests, second version**: `GET /admin/analyst-requests` keeps its name and lists the
  requests of the three types, each with its `accountType`; `/me` and the Admin's accounts call
  the status `verificationStatus`. What may a Journalist or a CEO do while waiting (the
  prototype: view as the type does; for a CEO, without the organisation's portfolios; without
  messaging)? A Journalist sends one document, a press card or an employer letter; a CEO a proof
  of position and the name of the organisation they head, which the sign-up opens: how does a CEO
  join an organisation already on CMarket?
- **Screen 10 mockup**: "Only profiles I can contact" is ticked, yet A. Tchakounté shows "Contact
  not open" (the prototype leaves out, once ticked, the profiles the user cannot write to; a
  request counts as a contact); D. Moussavou has 9 publications, yet the Analyst status of
  D. Moussavou waits on screen 9 (the prototype lists D. Moussavou without the VERIFIED badge and
  without contact until approved); the directory counts 412 Students for 1,284 active Student
  accounts (the prototype: the others hide their profile); "Analysts who published in last 90
  days" has no parameter in `GET /directory` (the prototype: `recent=true`); the button is "Send
  a request" in section 9 and "Send a contact request" on screen 12. The viewer of the mockup,
  "P. MANAGER", is in no list.
- **Directory**: `GET /directory` gives each card its `contactMode`, which saves a call of
  `/profiles/{id}/contact-permission` per card; the prototype adds `sort` (relevance, name,
  newest members) for "SORT: RELEVANCE", `pageSize` (20) and a comma list in `types`. What is
  relevance? The prototype ranks the text match (the name first), then how complete the profile
  is, the VERIFIED badge and an Analyst's followers. `GET /directory/facets` takes no filter: the
  prototype counts the whole directory and adds the organisations and languages, which the lists
  of the filters need. Do users see their own card (the prototype: yes, with Edit my profile, and
  not among the profiles they can contact)? Are Analysts, Journalists and CEOs waiting for an
  Admin's approval listed (the prototype: yes, without the badge, and without messaging either
  way)? The report reasons are the prototype's (fake profile, spam, inappropriate content,
  harassment, other), one report per reporter and profile (409 after). The public endpoint is
  `/public/profiles/{slug}` and the page `/p/{handle}`: the prototype takes the handle as the
  slug, and answers `GET /directory/specialties` without login for the page. Follow is the
  library's `/analysts/{id}/follow`: the profile gives its `analystId`.
- **Profiles**: the public page is `/p/{handle}` and its endpoint `/public/profiles/{slug}`: how is
  the handle chosen (the prototype: the display name, "k-atangana", numbered when another account
  had it first)? The prototype takes the display name of `PUT /me/profile` as the account's, the
  one CFG changes too, and keeps the work e-mail and phone of the profile apart from the login and
  the phone of the codes. LinkedIn has no display toggle on screen 12, unlike the e-mail and the
  phone: the prototype keeps it from the others, as by default. Who crops the photo square: the
  prototype's server keeps its centre. The specialties have no endpoint: the prototype reads them
  from `GET /directory/specialties`, named in French and English. Which languages may a profile
  list (the prototype: nine, by ISO code)? What does Follow do on a profile that is not an
  analyst's (the prototype shows it on an analyst's only)? Which module of the plans holds the
  directory and messaging, if any (research and settings are in none)?
- **Messaging**: how is a chart frozen for a message (the prototype: a line chart of 1M to 5Y,
  frozen when sent, as PUB NEW freezes one with `POST /publications/{id}/charts`)? A security is
  shared with its price, and a bond with its yield and duration, as they were. What do the other
  members see of an edited or deleted message (the prototype: "edited", and "This message was
  deleted.")? Who adds members to a group (the prototype: its creator, among the people they may
  write to at once; a member leaves, the creator takes one out)? Does a message reach the
  notification centre of the top bar, besides push and e-mail after 5 minutes? Employees cannot be
  messaged and support goes through a help centre, which the spec does not describe. The
  prototype's answers where the API is silent: the Unread tab counts the messages unread, not the
  requests, which have their tab; the
  conversations panel searches with `GET /messages/search` (the thread's SEARCH and "⋯" of the
  mockup are not built); `q` of `GET /conversations` matches the names and the text; the request
  declined stays "sent" for its sender, who cannot write again; the files are uploaded first
  (`POST /attachments`) then sent with `attachmentIds`, and may be sent while scanned; the reasons
  of a conversation report are spam, harassment, scam or market manipulation, inappropriate
  content and other. The mockup's conversation with D. Moussavou is left out: the status of
  D. Moussavou waits for an Admin (screen 9), and a client waiting has no messaging.
- **Messaging in real time**: what does JoinConversation change? CMarket.Api lets a connection
  send "typing…" only from a thread it joined, and sends it, as every other event, to the members
  still in the conversation; the client shows it in the thread it has open (a group per
  conversation kept a member taken out reading the others typing). The spec has no event for a
  conversation that changes: CMarket.Api adds `ConversationUpdated { conversationId }` (a request
  accepted, a member added or taken out, a mute), which the client reads again; and tells a file's
  verdict with `MessageUpdated`. Does a member brought back into a group read what was said while
  they were out (CMarket.Api: yes, as a new member reads the whole history)?
  MessageUpdated and MessageDeleted carry no message: the client reads the thread again after an
  edit and marks a deletion in place. The online status needs a first value besides
  PresenceChanged: the prototype adds `online` to the members of `GET /conversations` and
  `/conversations/{id}`. Who receives PresenceChanged (the prototype: the people the user has a
  conversation with), and does someone who hides their status still see the others' (the
  prototype: yes)? Does the hub send the user's own messages and reads to their other tabs (the
  client takes them)? ContactRequestReceived has no name: the toast gives the sender's account
  type. The count on MSG in the menu is the prototype's (the mockups draw none) and has no
  endpoint: it reads `GET /conversations`. A thread reads the messages that arrive only while its
  tab shows: hidden, it reads them when the user comes back, so ✓✓ means seen.
- **Directory and messaging settings**: the default contact rules, the daily limits of new
  conversations, the report threshold and the list of specialties are the Admin's, without an
  endpoint: the prototype's are `GET / PUT /admin/settings/directory` and `/admin/specialties`
  (GET, POST, PUT and DELETE). Do new defaults reach the profiles never saved (the prototype:
  yes, the others keep theirs)? Is the limit a day set per type (the prototype: yes, 20 and 5
  for a Student by default)? What becomes of the profiles listing a specialty the Admin removes
  (the prototype keeps such a specialty, which can be renamed)?
- **Reports of the directory and the messaging**: `GET /admin/reports?type=` lists reports; the
  prototype groups them by profile or conversation, the open ones only, and dismisses them with
  `POST /admin/reports/{type}/{id}/dismiss`, an endpoint of its own. Which reports count toward
  "beyond 3 reports" (the prototype: the open ones about the account, on its profile, its direct
  conversations and its notes; the reports of a group are about no one)? Is the account only
  shown as referred, or also told, limited or suspended (the prototype: shown, in MOD and USER)?
  Does a suspension close the reports (the prototype: those of the profile and the
  conversations)? Does the Admin read a conversation whose reports were dismissed (the
  prototype: yes, it was reported)? The prototype reads it on request only, since each reading
  is logged.
- **News provider, third version**: the text gives a News provider NEWS (the studio) in the menu,
  but the screen 13 mockup lights N and shows PORT, which the matrix refuses: the plan follows the
  text. The studio's code is NEWS NEW (section 9), while NEWS is the Data admin's news and
  documents screen: the plan keeps both, each in its own menu. Is the media a News provider works
  for its organisation, as a CEO's (the plan: yes, and its newspaper belongs to it)? Which
  permission keys stand for the two new rows (the plan: `news:write` and `news:stats`, with
  `news:moderate`, `news:payments` and `subscriptions:manage` for the back-office)?
- **News, third version**: are the eight categories the feed's `topic=` (the plan: yes, as
  `category=`, MKT's ISSUERS and REGULATOR filtering the categories of those names)? Who
  "follows" the securities or countries of a FLASH (the plan: the owners of news alerts on them,
  as for a publication)? Which casing does the JSON take: the spec writes `"type": "FLASH"` and
  `EQUITY`, the API elsewhere `camelCase` (the plan: the spec's codes for the ingestion API and the
  files, the API's style for the front end)? How is automated access told apart (the plan: a view
  3 seconds or more after the content was read, no headless browser, a cap per account and hour
  set by the Admin)? The administration of news (moderation, newspapers, publishers, ingestion
  clients) has no mockup: the plan puts the moderation and the publishers in NEWS and MOD, the
  rest in a new Admin screen, SRC.
- **News, step 25**: the feed's "excerpt" is not described (the plan: an ARTICLE's standfirst,
  none for a FLASH, whose text is the content whose display is paid). Screen 1 shows a subject in
  amber that no field of the studio's table holds (the plan: a Subject field in NEWS, and in the
  studio the first security's code unless written). How many views an hour make automated access
  (the plan: 120 until the Admin sets it in SRC)? The feed filters by `sourceId`, but no endpoint
  lists the newspapers (the plan: `GET /news/sources`). Screen 1 shows DAILY Z in the AI's green,
  and screen 18 pays no Daily Z: the plan takes DAILY Z for a story the AI processed.
- **News studio, step 26**: the studio's table names no subject, while the feed and the
  notifications show one ("[FLASH · MEDIA I] SEMC: …"): the plan takes the code of the first
  related security when it is an amber code (a bond's "ECMR 6.25% 29" is not). Does an edit of a
  published item go live at once (the plan: yes, on Update, with "Updated on …" and a version
  kept), and may a scheduled item change before its time (the plan: yes, it stays complete)?
  May a draft be deleted (the plan: no; it stays a draft)? A `publish_at` less than 24 hours past
  publishes at once; an Excel cell's time, without its zone, is one of Douala. The month of a
  click, its statement's, is counted in UTC for now (step 28 settles the statements). Does a
  withdrawal reach the terminals at once (the plan: the feed drops the item at its next read, no
  hub event)? `PUT /provider/source` names a logo, which the studio does not upload yet: SRC
  (step 27) keeps the newspapers' logos.
- **News administration, step 27**: `/admin/news?status=reported` lists items readers reported,
  but no endpoint lets them report one: the plan adds `POST /news/{id}/report`, with a
  publication's reasons. Which statuses does `GET /ingest/news/{externalId}` answer for an item
  withdrawn (the plan: `withdrawn`, by the AI or after its publication; `rejected`, a moderator's
  reason, when it never went live)? The signature is of the body alone, as written: a call sent
  again is applied again, which an idempotent push makes harmless; should a timestamp be signed
  with it? A push without a category takes MARKETS, without a language French, without a country
  those of its securities (refused when it has none); is an ARTICLE of the AI without a body
  allowed (the plan: yes, "a short summary and a link to the original article")? "A very similar
  headline": the plan compares letters (85% of the character trigrams) and the names and numbers
  (all of one in the other). EODHD's news API needs a ticker or a topic: the plan asks the
  mapped securities (50 at most) every 15 minutes, 5 calls each. A retyped published item is not
  pushed again; should an ARTICLE retyped as a FLASH reach the alerts' channels? The Admin's menu
  places SRC after USER until MPAY (step 28) comes before it. Is a newspaper's item taken down
  told to its News providers (the plan: they read the reason in the studio)?
- **Media payments, third version**: the mockup's total of unique clicks reads 74,364, its rows
  add to 75,364 (its payable and excluded totals agree with them): the screen sums the rows. "38
  accounts · same IP address" on "3 FLASH items" makes 210 clicks, but a reader counts once per
  item, so 38 accounts make 114 at most: the demo's 38 accounts read 6 FLASH items. Which
  newspapers get a statement (the plan: those with clicks in the month, or an amount carried
  over)? Is the cap of the month's amount alone (the plan) or with what the month before carried?
  A statement below the minimum payment follows the cycle with nothing due and never reaches the
  transfer file: is that the intent? "Spike above 5 times the average": the plan compares an
  item's clicks of a day with the newspaper's clicks per item of the 30 days before, from 50 clicks;
  a "wave of new accounts" has no threshold (the plan: the 20 accounts of the shared address). Is
  the newspaper told of a hold (the plan: no)? MPAY follows SUBS (step 34), and SRC, which the spec
  does not place, follows MPAY.
- **Bond screener, third version**: the mockup's figures do not all follow from its bonds' terms:
  ECMR's are case A of section 14.1 (bullet), YAS's case B (amortizing), and COMPANY X's accrued
  interest of 4.51 matches no coupon date of an annual bond paying on 30/06. Its prices fit a
  settlement the next session (29/10 → 30/10), YAS's mockup two sessions (28/10 → 30/10): which
  convention does each market keep (the plan: the next session for the daily calculation)? The
  BTA's spread reads "—": the plan computes it as for any bond (0 on its own curve). The mockup's
  note says a double-click opens BP, the text the bond profile (screen 20): the plan follows the
  text. The issue category boxes leave out MUNICIPAL, the market boxes OTHER: the plan adds a box
  for each. A floating, step-up or inflation-linked coupon is held at the list's rate (the file
  gives no fixings, steps nor index); an odd first or last period earns its share of a coupon by
  actual days; a model price and the Z-spread read a curve flat beyond its ends, the credit spread
  only inside it. The sector of a corporate issuer: FINANCIALS, UTILITIES or INDUSTRIALS, as block
  A lists them. "ISIN · nom" in the mockup's block A is French.
- **Bond pricing, third version**: "Face value (M)" reads 100.00%: the plan takes it as what the
  principal is repaid at per 100 of face value (the coupons run on the face). The
  characteristics give no issue date nor first coupon: a bond entered by hand pays a period apart
  back from maturity, every period whole. "T+1 or T+2 by default depending on the market": the
  plan settles BVMAC and other markets at T+2, as the BP and YAS mockups settle ECMR, and the
  BEAC's securities at T+1; which does each market keep? "The country curve + spread": the plan
  adds the bond's last known spread over its country curve (0 without one), and takes BS's yield
  when its latest calculation priced the bond. `/bonds/{id}/price-yield` cannot draw a bond
  entered by hand: `POST /bonds/price` also answers the curve. The mockup mixes the yield it shows
  (5.7302%, which gives the dirty price, the durations and the shifts) with case A's clean price
  (101.4000 and XAF 107,564,384, which need the unrounded yield), and its +50 bp row reads −1.26%
  where the dirty price falls 1.25%. The modified duration is written in percent, as the mockup
  does; "CALCULATE" in the inputs' title bar is the button below it.
- **ETFS, third version**: the screen 15 mockup keeps fees "< 0.25%" yet lists CW8 at 0.38%; its
  Sharpe ratios need a risk-free rate near 6% for both the dollar and the euro, which no single
  rate a currency fits (the plan: the Admin's rate of each trading currency, 4% and 2% in the
  demo). An ETF is a security per listing, so that IWDA and EUNL, one fund, have their own prices,
  spreads and premiums: are both to be listed, as the mockup does (the plan: yes)? The AUM shows
  in the listing's currency, the fund's turned at the day's rate. "30-day" averages are read as 30
  sessions; the returns are worked out from the stored prices, EODHD's published returns not
  shown; since inception needs the history from the inception. The 1D return of block E (+0.3%)
  and the change of screen 19's header (+0.42%) are one figure for an ETF priced at the close.
  Which EODHD codes are the benchmarks' (MSCI World in dollars and in euros)?
- **ETF profile, third version**: the mockup's allocation lists Health care (10.2%) above
  Industrials (10.9%): the plan orders the classes by weight. Its header shows "$XX.XX" for the
  price, the NAV and the AUM: the plan shows the latest close, NAV and size. Its description line
  reads "Global equity", which the plan writes as ETFS's class line, "Equity · Global", in both
  languages. The tabs HLD, PERF and DIST have no mockup: the plan gives HLD every line kept (the
  100 largest) and both allocations, PERF the total return against the index, every period and
  the calendar years, DIST the distributions and the policy; PERF's chart and years need the
  index's and the fund's total return, which the spec's history (`with=nav`) does not name, so
  the API adds `with=total,index` and `/etfs/{id}/annual-returns`. The "ETF profiles" file
  carries the portfolio in five optional columns: is a separate holdings file wanted? The
  mockup's tabs leave out N and ANA: kept after DOC, as on the bond profile.
- **Bond profile, third version**: the mockup's tabs leave out N and ANA, which screen 2 has: the
  plan keeps them after DOC, so that a bond's news and the research on its country stay one
  click away. Its BP tab shows screen 16's panels inside the profile, as FA shows EQS's; "Open in
  bond pricing (BP)" opens that tab, the BP code still screen 16. The header takes the clean
  price of the latest daily calculation (the spec names `/bonds/{id}/analytics`), not the
  session's live quote, and the change since the calculation before. "AUM" in the
  characteristics is the amount outstanding the text names; "6.25% · fixe" is French; "Sovereign
  · Government" names a state's sector, which the bond list leaves empty. DV01 is for 100 million
  of face value in the bond's currency, as the mockup's "XAF 100 M". The profile's reads (the
  analytics and their history, the ratings, the cash flows) need only `market:read`, as DES: is
  a bond's yield part of the Monitoring plan (the plan: yes), BS and BP staying in Analysis? The
  mockup's ECMR is bullet (case A) where the demo's amortizes (case B), as on BS and BP. A bond's
  order book and latest trades, on screen 2 until now, have no place in the mockup: the plan
  leaves them out. MAX starts at the issue; the history is the daily calculation's, which the
  platform keeps from its start.
- **Subscriptions, third version**: SUBS shows auto-renewal, a stored card and failed payments,
  but no payment provider that keeps cards is named. The plan: a renewal charges the stored card
  or sends a mobile money request, a simulated provider standing in; a failed charge is tried
  again for 7 days, then the plan expires. How is a change of plan prorated (the plan: by the
  day)? Does Suspend cut access at once (the plan: yes, until lifted)? The mockup's Media I pays
  XAF 0 by "Agreement": is that a plan of its own (the plan: "Media source", for the media's News
  providers)? Built in step 34: the proration converts the value of the days left into days of
  the new plan (no refund, no credit carried), a full period charged at once when they buy less
  than a day; Suspend has its own lifting, `/reactivate`, which section 10 does not list, nor the
  catalogue (`/plans`) and the preview of a change (`/proration`) that SUBS reads.
- **SUBS, third version**: the mockup's plans are by account type ("Analyst annual", "Org.
  annual", "Institution annual") where the catalogue's are by module (Monitoring, Analysis,
  Professional, Student, the prototype's): SUBS shows the catalogue's with their cycle
  ("Professional annual") and its prices; is a catalogue by account type wanted? Its invoices are
  numbered FAC-2026-0412, the platform's CM-2026-000130 since phase 9. Its counters count accounts
  (1,871 active against a list of 1,871 subscriptions), which the plan follows: a member counts as
  a subscription, and the list adds a row per paying organisation. Its rows disagree with the
  other screens' demo accounts: S. Mvondo and T. Bekale pay their own plans there, members of
  University B and Bank C elsewhere; Bank C and E. Fouda are expired, while the Trader's flows need
  Bank C's plan and E. Fouda heads Asset manager A; D. Moussavou pays since April, while screen 9
  has him waiting for approval since 22 October; Asset manager A has 5 managers, the demo 3 and a
  CEO; University B 120 students, the demo 4. The plan keeps the other screens' accounts and fits
  the counters with the generated ones. The list says "sort: expiry date" but its rows are not in
  that order; an organisation's expiry is the last day of its period (31/12/2026) where an
  account's is the day it renews (15/03/2027): the plan shows the day it renews or ends for all.
  The organisations of the demo logins renew by themselves, so that a demo account keeps its
  modules (the mockup's "No"). Is "Expiring soon" meant for a plan that renews by itself (the
  mockup's S. Mvondo is)?

- **ETFs and bonds, third version**: which EODHD licence covers news, ETF holdings, NAV and
  spreads, and the EUR and USD government curves, whose codes are "to confirm" (the plan: demo
  data until then; EUR and USD spreads n/a)? The description of a security is in French and
  English, but EODHD writes English only and no endpoint lets the Data admin write it (the plan:
  `PUT /data/securities/{id}/description` from CORR, the English standing in, marked EN). Flags
  are "SVG flag icons" while the icons come from lucide (the plan: `flag-icons`).
- **EQS, third version**: the redrawn mockup's SEMC text ends with "Text written by the Data
  admin and updated with each annual report", a note on where it comes from, which its title bar
  gives ("Source: Data admin"): the demo leaves it out. The results count "5 of 8 securities"
  where the market lists seven equities, the mockup's ticker too: the screen counts the equities
  listed. FR / EN reads as a choice between the two texts, the one shown in brackets as on the
  screen's other tabs. The spec shows the description on EQS alone: should DES, or its FA tab,
  show it too (the plan: no)?
- **RFQ, fourth version**: the spec's own points to confirm before development: the status, with
  the BEAC and if needed COSUMAF, of a board where every trader sees the requests and answers them
  with firm prices, which resembles a multilateral trading system; the scope of the SVTs'
  confirmation, to be backed by participation terms; the BTA calculation convention (section
  14.1's until the CRCT's is confirmed); the format of the reporting. The plan builds the module
  behind a switch, off until then (decision 24). Besides: which days are the "BEAC payment system
  business days" of the delivery date, the cut-off and the daily report (the plan: BVMAC's
  sessions, until a calendar is given)? The 16:00 cut-off and the 18:00 send are read as times of
  Douala. A trader belongs to a "registered organisation": may an individual account trade (the
  plan: no)? The "maximum face amount per request and per day set by each organisation" and the
  "quota of cancelled or expired requests" have no endpoint and no figure: who sets them, and
  where? A security's "CRCT code", the mockup's `CMXXXXXXXXXX`, is not in the master list (the
  plan: its ISIN, which the Excel file allows). Section 10 keeps the tracking of the CRCT's
  settlement for a later phase, in a note placed under the commodities.
- **SVT, fourth version**: the matrix has no column for the SVT, whose rights a paragraph gives:
  which keys stand for them (the plan: `svt:approve`, with `market:read` and `messages:write`)?
  Its menu on the screen 27 mockup is SVT, TRD, AGR, N, CFG, without the markets "a CEO views" nor
  the messaging "with linked traders" (the plan: MSG added, the market screens from the command
  bar, decision 16); TRD and AGR have no mockup (the plan: the trader links on a screen of their
  own, and screen 23 on the agreements that name the bank). Is the account, "created at the
  bank's request and approved by the Admin", a sign-up to approve, as an Analyst's, or an account
  the Admin creates (the plan: the latter)? Does it need a plan (the plan: none to pay, as a
  media's News providers)? It has no badge colour, which screen 9's counters need. The link's
  e-mail "opens screen 27 after signing in" while the screen 22 mockup reads "Confirmed by
  e-mail": the plan confirms on screen 27. The mockup's buttons read Confirm and Reject for a link
  the text confirms or declines; a link the SVT removes and one the trader removes both read
  "Withdrawn".
- **The compliance team, fourth version**: screen 24 is "reserved for the CMarket compliance
  team", which is no account type; its mockup draws the client menu, RFQ lit, for a "CMARKET
  ADMIN" account without the BACK-OFFICE badge (the plan: the Admin, in the back-office, decision
  17). Its tab bar is the traders', who may not open it: the plan shows them two tabs.
- **Menu and codes, fourth version**: section 9's text of the client menu is unchanged and lacks
  RFQ, which the mockups of screens 22 to 24 draw after YCRV; the codes of section 8 name ECO, FX,
  SVT and OPT, not CMDTY, RFQ, RFQ AGR, RFQ REP nor OPT RES, which the mockups type (the plan: all
  of them). The mockups of CMDTY, ECO and FX light MKT, those of OPT light PORT (the plan: an
  entry each, decision 15, which makes eighteen entries for a Trader). Which module of the plans
  holds each new screen (the plan: Monitoring for CMDTY, ECO and FX, Portfolio for OPT, none for
  the RFQ)?
- **Rates and curves, fourth version**: `CEMAC_SOV_YIELDS` "replaces the Curves and rates file
  type", yet section 11's table of files still lists "Curves and rates", and its sources still
  feed screen 4 from the "Auctions" and "Curves" files: are the auctions and the bonds' closes
  still points of the curve (the plan: yes, decision 20)? The old file also carried the "BEAC
  rates", for which the new template has no row: where do the policy rates and the money market
  rates of `/rates/policy` and `/rates/money-market` come from (the demo's are seeded)? Screen 6
  expects the file at 17:30 of its session, while its points follow the auctions: how often is it
  due (the plan: each session)? Its tenors 13W, 26W and 52W are read as the old file's 3M, 6M and
  1Y. Are the German and US yields of the GBOND series the reference curves of BS's EUR and USD
  spreads, n/a since decision 8? Which EODHD plan will the commercial licence cover: the spec
  names the Fundamentals Data Feed and All-in-One plans for the macro, GBOND and MONEY data.
- **FX, fourth version**: section 11 still feeds `/fx` from EODHD's real-time FOREX, screen 26
  from the ECB's daily reference rates: two USD/XAF on two screens (the plan: the reference rate
  on both, decision 22). The matrix writes EUR/XAF 655.96, the header 655.957 (the plan: three
  decimals for the peg, two for the others, as MKT). Which currencies are quoted per 100 (the
  plan: the yen alone)? A currency the ECB lacks, such as the naira, "can be added by file or
  through the EODHD Forex API", without a template (the plan: not built).
- **ECO, fourth version**: the chart offers "any of the 39 indicators", the table names 25 and
  the rules leave two out (the plan: the 37 that EODHD serves besides those two, decision 21). Its
  routes and its code take ISO alpha-3 codes (`CMR`), the rest of the API alpha-2 (`CM`): the plan
  keeps each as written. Are Sub-Saharan Africa and the World, which are World Bank aggregates,
  countries of the selector like the others (the plan: yes, as `SSF` and `WLD`)? The "Macro" file
  that fills a missing series has no template (the plan: year, country, indicator, value,
  source). Is ECO the "country page" that sections 10 and 11 still name for `GET /macro?country=`
  and that has no mockup (the plan: yes; that route stays as CMarket.Api serves it)?
- **CMDTY, fourth version**: the five series of the CEMAC complement have no code, unit nor
  frequency (the mockup lists cocoa, rubber and palm oil by day, gold at "XX", timber by month at
  "XXX"), and their sources and licences are "to be confirmed before go-live": the plan seeds
  them as demo data. Which series is the "reference series" of a commodity's 1-year correlation
  (the mockup: WTI for Brent)? Is an alert on a commodity a threshold on its value, checked when
  a new value comes (the plan: yes, as a price alert)? `PUT /data/commodities/{code}` is placed
  on screen 6 (the plan: in CORR, beside a security's description). The catalogue's market rows
  still give `/commodities` and `/global/indices` to screen 1, which no mockup of MKT shows.
- **OPT, fourth version**: "Student on simulated portfolios": the plan lets a Student run OPT and
  save the allocation as a model portfolio only. The test case's weights add up to 100.1%: ECMR's
  8.6% reads 8.5% on the screen 29 mockup. The estimates are "mean weekly return × 52" while the
  setup offers a history "weekly or daily" (the plan: the same formulas on daily returns, × 252,
  refused when a security is flagged as quoted too seldom). The mockup's risk-free rate is 4.50%,
  "52-week BTA", where PORT's Sharpe ratio takes the Admin's rate (the plan: the Admin's rate,
  which the user changes for a run). "Create a portfolio from the allocation": with which
  transactions (the plan: buys at the last prices, dated today, the rest in cash)? The mockup's
  amounts are round and add up to the capital, while the rule rounds them to whole securities and
  leaves the rest in cash.
