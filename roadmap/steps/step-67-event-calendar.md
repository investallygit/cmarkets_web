# Step 67 · CAL: the event calendar (screen 32) (M–L): to do

Step 67 of the [roadmap](../../ROADMAP.md#order), for the
[sixth version of the spec](../sixth-version.md). CMarket.Api's phase 51 (ADR-078).

- **Contract**: `GET /calendar?from=&to=&types=&countries=&mine=` with the spec's nine types, the
  time and the detail of each event; `/calendar/{id}`; `/calendar/export?format=ics|xlsx`; the
  `calendar` alert type and `/alerts?source=calendar`; `CalendarEventChanged`.
- **CMarket.Api**: `mkt.CalendarEvents` for the events entered (CORR, `CORPORATE_EVENTS`, the
  statistics), "announced" until confirmed; the others read from the auctions, the BEAC's
  decisions, the corporate actions and the bond schedules; the EODHD Economic Events behind
  ADMCFG's switch, off by default (decision 57); the calendar alerts (D−2 for a dividend). A
  migration.
- **Screen**: CAL rebuilt as the mockup (the filters with their counts, the views, "only my
  securities", the export; the agenda by day; the event picked with its alert, ICS and link; the
  calendar alerts); ALRT's new alert type; MKT's calendar panel on the same events.
- **Checked by**: Vitest on the grouping by day and the ICS; the CAL flow rewritten (the filters,
  an alert created on an auction result, the ICS); axe in both languages.
