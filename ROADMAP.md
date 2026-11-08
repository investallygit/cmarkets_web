# Roadmap

Screen-by-screen plan to finish the front end of `CMarket-developer-spec-EN.pdf`, the version of
2 November 2026; the first version, of 29 October, is kept as `CMarket-developer-spec-EN-v1.pdf`.

Every screen of both versions is built: the client terminal (MKT, DES with its FA and ANA tabs,
EQS, YCRV, YAS, PORT, PUB, PUB NEW, NET, MSG, NET ME, N, CAL, ALRT and CFG) with the public
profile page and the login, sign-up and password reset pages, the back-office of the Data admin
(IMP with DATA, HIST and EODH, then CORR and NEWS) and that of the Admin (USER with ANLY and MOD,
then ADMCFG, AUDT and PAY), and the home page that visitors see before login. The second version
added the Journalist and CEO account types and the professional directory with its messaging
(screens 10 to 12): steps 11 to 19, under [Second version of the spec](#second-version-of-the-spec).
What remains is listed under "Still to do" and in the open questions for the spec author.

ANLY and MOD were built with USER: in the mockups they are panels of the same screen. Sizes are
relative: S < M < L < XL.

## Order

| Step | Work                                                            | Status |
| ---- | --------------------------------------------------------------- | ------ |
| 1    | Shared groundwork, batch 1: form kit, `PriceChart`, XLSX export | Done   |
| 2    | DES                                                             | Done   |
| 3    | Watchlist editing (MKT), N, CAL, ALRT                           | Done   |
| 4    | EQS / FA, then YCRV / YAS                                       | Done   |
| 5    | PORT                                                            | Done   |
| 6    | PUB, then PUB NEW                                               | Done   |
| 7    | CFG, login and OTP (needed before connecting the real back end) | Done   |
| 8    | Back-office: IMP (with DATA, HIST, EODH), then CORR, then NEWS  | Done   |
| 9    | Admin: USER (with ANLY, MOD), then ADMCFG, AUDT, PAY            | Done   |
| 10   | Home page, before login: the product, markets, users, plans     | Done   |
| 11   | Second version of the spec: the plan, its open questions        | Done   |
| 12   | Journalist and CEO account types, approved by the Admin         | Done   |
| 13   | Portfolios shared with the organisation, read by its CEO        | Done   |
| 14   | NET ME: professional profile, visibility and contact rules      | Done   |
| 15   | NET: professional directory, public profile page                | Done   |
| 16   | MSG: conversations, contact requests, files, shared objects     | Done   |
| 17   | MSG in real time: the `/hubs/chat` hub                          | Done   |
| 18   | Admin: reported profiles and conversations, directory settings  | Done   |
| 19   | Second version done: README, accessibility, every flow          | Done   |
| 20   | Connecting `CMarket.Api`: `.env`, the API module, its checks    | Doing  |

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

### Step 20 · Connecting CMarket.Api (L): doing

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
5. **The API module** (`src/shared/api/endpoints/`): one file per controller folder of the API,
   each with its routes and its calls; every route checked against the API's OpenAPI and the
   mock's handlers.
6. **The hooks onto the module**, area by area: Auth, Me and the development tools; Market and
   Securities; Watchlists and Charts; Bonds and Analysis; Portfolios; Content and Alerts;
   Subscriptions and Organization; Research; the Data admin; the Admin; Network and Messaging.
7. **The module locked**: only `src/shared/api/` imports `apiClient`; README.
8. **`npm run test:api`**: the module's reads against a running API, for each demo account.
9. **`npm run e2e:api`**: the flows that name no id of the mock, on the API, port 5174.
10. **Wrap-up**: what steps 8 and 9 find, the README's guide to the real back end.

Deployment (the environments' `.env` files, the site and the API on one domain, CORS) comes after.

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

- DTOs in `shared/api/contracts`, mock handlers and sample data from the mockup.
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

### N · News (no mockup): done

- **Built**: two tabs, `/n` and `/n/documents`, each with its saved layout (`N`, `N-DOC`). News on
  the left, filtered by security, country and topic, the article on the right with links to the
  securities concerned; new items arrive through `NewsPublished`. Documents: full-text search
  (`/documents?q=`), type filter and the embedded PDF viewer. Filters and the open item are in
  the URL, so `/n?article=news-1` opens an article.
- **Still to do**: the list shows the 50 newest items; "load more" comes with the pagination of
  the shared groundwork.

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
- **Still to do**: setting off the publication alerts (a followed analyst, a security or a country)
  when a publication goes out: the analysts are followed from PUB since step 6.

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

### MSG · Messaging (screen 11): done

- **Built in steps 16 and 17**: the conversations, the thread and the participant of the mockup,
  contact requests, blocks, groups, files scanned before use, securities, charts and publications
  shared; then the `/hubs/chat` hub: new messages, read receipts, "typing…", online status and the
  count on MSG in the menu. See steps 16 and 17.
- **Still to do**: the thread's SEARCH and "⋯" of the mockup; the push and e-mail notifications
  of a message unread after 5 minutes, with the back end, which also encrypts the messages and
  keeps them 24 months.

### NET ME · My profile, visibility and contact (screen 12): done

- **Built in step 14**: the profile, its visibility and contact rules and the card preview of the
  mockup. Since: the people blocked (step 16); the Admin's default rules and specialties (step 18).
  See step 14.
- **Still to do**: choosing the square of the photo (the mock keeps its centre).

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

### CORR · Data corrections (no mockup): done

- **Built**: a security and a session (or a click on one of the two months of stored sessions,
  each with its source: daily prices file, initial history or correction), the stored open,
  high, low, close and volume typed again, a required reason; the log of corrections (when, the
  security, the session, the close before and after, the reason, who), a click opens one. Both
  are in the URL (`/data/corrections?security=SEMC&date=`).
- **Mock**: a correction replaces the session for every screen, today's last price too, and
  outlives the rollback of an earlier file.

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

### AUDT · Audit log (no mockup): done

- **Built**: when, who, action, target, the values before and after and the reason, newest first
  and 50 a page, filtered by user (an account picker), action and dates, all in the URL
  (`/admin/audit?userId=&action=&from=&to=`); a click shows the entry with each value before and
  after. USER's "View audit log" opens it on the account: what it did and what was done to it.
- **Built in steps 12 and 18**: a status approved or rejected, with the account type; the reports
  dismissed, the reported conversations read, the specialties and the directory settings changed.

### PAY · Analyst payouts (no mockup): done

- **Built**: by analyst and month, the sales, revenue, commission and net payable with its status
  (in progress for the current month, due once closed, paid), the total due in the title bar,
  filters by month, status and analyst in the URL, "Mark paid" for the selected payout in the title
  bar, with a confirmation (also by double click, Enter or the right-click menu). The analyst's
  earnings in PUB NEW show the payment.
- **Mock**: the months up to August are paid, K. Atangana's September too (on 5 October), the
  other analysts' September is due.

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
- **Fundamentals**: over which equities is a sector average computed (the prototype uses a fixed
  table)? The line items of the "Financial statements" file need agreed codes (the prototype:
  `revenue`, `ebitda`, `operatingIncome`...).
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
- **Messaging in real time**: what does JoinConversation change? The prototype sends "typing…"
  to the connections that joined the conversation only, and the other events to every member.
  MessageUpdated and MessageDeleted carry no message: the client reads the thread again after an
  edit and marks a deletion in place. The online status needs a first value besides
  PresenceChanged: the prototype adds `online` to the members of `GET /conversations` and
  `/conversations/{id}`. Who receives PresenceChanged (the prototype: the people the user has a
  conversation with), and does someone who hides their status still see the others' (the
  prototype: yes)? Does the hub send the user's own messages and reads to their other tabs (the
  client takes them)? ContactRequestReceived has no name: the toast gives the sender's account
  type. The count on MSG in the menu is the prototype's (the mockups draw none) and has no
  endpoint: it reads `GET /conversations`.
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
