# Step 15 · NET · Professional directory (screen 10) (L): done

Step 15 of the [roadmap](../../ROADMAP.md#order), for the
[second version of the spec](../second-version.md).

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
