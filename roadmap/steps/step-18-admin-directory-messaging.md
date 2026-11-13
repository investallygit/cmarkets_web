# Step 18 · Admin: directory and messaging (M): done

Step 18 of the [roadmap](../../ROADMAP.md#order), for the
[second version of the spec](../second-version.md).

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
