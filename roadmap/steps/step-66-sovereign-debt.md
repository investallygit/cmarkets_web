# Step 66 · DEBT: the sovereign debt (screen 35) (M): to do

Step 66 of the [roadmap](../../ROADMAP.md#order), for the
[sixth version of the spec](../sixth-version.md). CMarket.Api's phase 50 (ADR-077).

- **Contract**: `GET /debt/{country}/summary`, `/redemptions`, `/securities`, `/documents`,
  `GET /debt/compare`; `CEMAC` as the country of the whole zone.
- **CMarket.Api**: the outstanding from the auctions and the master, less the principal repaid
  (decision 60); `ref.SovereignRatings` and IMP's `SOVEREIGN_RATINGS`; ADMCFG's switch for the
  agencies' ratings; the documents of NEWS with a country as subject. Cached until the next
  auction result or upload.
- **Screen**: DEBT with its country bar, the six indicators, the redemption schedule (BTA and OTA
  apart), the CEMAC comparison, the outstanding securities (a double click opens the profile), the
  ratings and documents, Download; `DEBT CMR`, a link from a BTA's or an OTA's profile.
- **Checked by**: Vitest on the schedule's grouping; a Playwright flow (DEBT CMR, the comparison,
  a security opened); axe in both languages.
