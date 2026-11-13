# Step 17 · MSG in real time (M): done

Step 17 of the [roadmap](../../ROADMAP.md#order), for the
[second version of the spec](../second-version.md).

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
