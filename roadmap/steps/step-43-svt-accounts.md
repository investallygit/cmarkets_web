# Step 43 · SVT accounts and trader links (L): to do

Step 43 of the [roadmap](../../ROADMAP.md#order), for the
[fourth version of the spec](../fourth-version.md).

CMarket.Api's phase 34. Lane 1 of the [lanes](../lanes.md), its first step.

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
