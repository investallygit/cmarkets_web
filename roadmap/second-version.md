# Second version of the spec

Built in steps 11 to 19: see the [order of the roadmap](../ROADMAP.md#order) and the files of
[`steps/`](steps).

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

The prototype's answers where the spec is silent are in the
[open questions](open-questions.md#second-version).
