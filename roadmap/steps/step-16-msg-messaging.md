# Step 16 · MSG · Messaging (screen 11) (XL): done

Step 16 of the [roadmap](../../ROADMAP.md#order), for the
[second version of the spec](../second-version.md).

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
