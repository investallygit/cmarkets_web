# Step 67 · CAL: the event calendar (screen 32) (M–L): done

Step 67 of the [roadmap](../../ROADMAP.md#order), for the
[sixth version of the spec](../sixth-version.md). CMarket.Api's phase 51 (ADR-078).

## Built (27 November 2026)

- **Contract** (`contracts/calendar.ts`, `endpoints/content.ts`, `endpoints/dataAdmin.ts`):
  `GET /calendar?from=&to=&types=&countries=&mine=` (the spec's nine types, each event's time in
  Douala and its facts, the notes of the BVMAC's closed days, the count of each type, whether
  EODHD's events are shown), `/calendar/{id}` (the issuer, the previous comparable auction, a
  result's marginal rate and bidders, a dividend's two dates, the source),
  `/calendar/export?format=ics|xlsx` (the list, or one event); CORR's `/data/calendar`; the alert
  type `calendar` and `/alerts?source=calendar`; `CalendarEventChanged`; ADMCFG's
  `internationalEvents`; IMP's `corporate-events`.
- **CMarket.Api** (phase 51): `mkt.CalendarEvents` (data.CalendarEntries moved, the BVMAC's days
  dropped for notes) for the events no other table holds, with their time, detail and "announced"
  until confirmed; the others read where they live (the planned auctions not held at 10:00, the
  results at 15:00, the redemptions, the dividends, the BEAC's meetings at 10:00); the ICS in
  Africa/Douala; CORPORATE_EVENTS; CORR's entries in AUDT; the calendar alerts (with the results,
  with a BEAC decision, or each morning the days they ask ahead, once an event); EODHD's economic
  events each morning while ADMCFG's switch is on; the demo's statistics, issuer events and
  fourteen international examples, the Manager's four calendar alerts; migration `EventCalendar`.
- **Screen**: CAL rebuilt as the mockup (`pages/market-calendar`, `widgets/calendar-panels`,
  `entities/calendar-event`): the filters (types with colours and counts, the six states, day,
  week, list and month, only my securities, Export ICS · XLSX), the agenda by day (time, type,
  state, event, detail; the bell of each event), the event picked (its facts, Create an alert, Add
  to my calendar, its screen) and My calendar alerts. The alert form's new type, prefilled from an
  event; ALRT lists it. MKT's calendar panel on the same events. CORR's calendar events
  (`widgets/calendar-editor-panel`, `features/edit-calendar-event`); ADMCFG's switch; IMP's file.
  Strings in `calendar.json`, English and French.

## Decisions taken while building

- The table the spec names, `mkt.CalendarEvents`, is the one of the events entered or loaded:
  every other event is read on each request from the data that holds it, never copied.
- CAL opens on the list of two weeks from today, the international events unchecked (as the
  mockup), every state; the view, the day, the filters and the event picked are in the URL.
- A country keeps the zone's events (the BEAC's, the CEMAC's) and the international ones, which
  are no CEMAC state's; "only my securities" reads the transactions of the user's portfolios and
  the watchlists.
- An auction's result is an event of its day at 15:00, which replaces the planned auction it
  completes; an auction entered by hand gives way to the Treasury's calendar of the same day and
  state.
- CORPORATE_EVENTS reads a meeting (AGM, EGM, AG, AGE) or a release (earnings, results, revenue,
  other); an issuer's file confirms its dates, an entry by hand is announced until confirmed.
- A calendar alert follows a type and one of: a state, a security, the user's securities, or any
  event; D−2 for a dividend, the day before for another dated event, the results and the BEAC's
  decisions when published.
- The latest auctions panel, which CAL showed without a mockup, stays on YCRV; the flows that read
  it there changed.

## Checked

- CMarket.Api: Domain `CalendarEventsTests` (7), `ContentTests` and the suite (741), Application
  `CalendarTests` (7) and the suite (868), integration `CalendarEndpointsTests` (2) and the suite
  (322), architecture (21, the French of the new messages), the migration on SQL Server and back
  (`EventCalendarMigrationTests`).
- Web: typecheck, lint, Vitest (580; `agenda.test.ts`, `words.test.ts`, `eventForm.test.ts`,
  `calendarParams.test.ts`), `routes.test.ts` on the API's refreshed routes; the whole Playwright
  run (162 passed; the CEMAC sovereign yields flow fails before the Douala session, as before this
  step: the session field defaults to a day with no stored point to replace);
  `e2e/calendar.spec.ts`: CAL from the command bar, the agenda with BANGE's GM and the coming
  auctions, an auction's detail and ICS, the types, a state, only my securities, the XLSX, the month
  and AUC on a double click; an announced statistic entered in CORR shown on CAL, an alert set from
  an auction's bell and listed (`@fresh-db`). axe (WCAG 2.2 AA) finds nothing on CAL (the list, an
  event, the alert form, the month), MKT, CORR and its form, and ADMCFG at 1600 and 390 px, in
  English and in French.

### Found and fixed

- The axe script reached the month view's radio, which the segmented control hides: the flow and
  the script click its label.
- A Data admin's profile keeps its own language: the French and English passes set it after each
  switch of account.
