# Step 12 · Journalist and CEO (L): done

Step 12 of the [roadmap](../../ROADMAP.md#order), for the
[second version of the spec](../second-version.md).

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
