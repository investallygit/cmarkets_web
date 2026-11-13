# Step 35 · Security descriptions on EQS (screen 3) (S): done

Step 35 of the [roadmap](../../ROADMAP.md#order), for the
[third version of the spec](../third-version.md).

CMarket.Api's phase 28.

- **Built**:
  - EQS: the description of the selected row under the results, as the redrawn mockup ("SEMC —
    Description"): its text in the screen's language, its paragraphs and line breaks as written,
    "Source: Data admin" (or EODHD) and FR / EN in the title bar when both languages are written,
    the one shown in brackets; the choice holds from one security to the next. A security written
    in one language alone shows it, its code in the title bar, with "Not written in English yet:
    the text in French." when the screen's language is the missing one (decision 9). The text
    carries its `lang`. The default layout gives the results seven rows, the description four and
    the panels below fifteen, the mockup's proportions; a layout saved before finds the new panel
    in its default place.
  - CORR: a fourth panel, the description of the security the price correction works on: its
    French and English, 2,000 characters each counted as typed, who wrote each and when, what EQS
    shows of a language left empty (EODHD's English, the other language marked, or nothing), and
    EODHD's English, folded, where it has one. An empty text removes its language; a save keeps
    the form, the texts as the API tidied them.
  - AUDT: "Security description", each language changed before and after, as text rather than a
    figure.
  - Slices: `widgets/security-description-panel` (EQS), `widgets/description-editor-panel`
    (CORR), `features/describe-security` (the form), the description's hooks and the choice of
    the language shown in `entities/security`; the contracts in `securities.ts` and
    `dataImport.ts`, the routes of /data/securities/{id}/description.
- **CMarket.Api** (phase 28, ADR-052):
  - `ref.SecurityDescriptions`: a text per security, language and source, the Data admin's
    French and English and EODHD's English kept apart, so that the Data admin's replaces it
    without losing it; 2,000 characters, tidied (accents composed, line breaks, spaces); migration
    `SecurityDescriptions`.
  - `description` on `GET /securities/{id}`: in each language the Data admin's text, else
    EODHD's English, with its source and date. `GET` and `PUT /data/securities/{id}/description`
    for CORR (`data:import`); each language changed in the audit log.
  - EODHD's English from the nightly bulk fundamentals (`General.Description`), cut at the last
    sentence within 2,000 characters.
  - Demo: the seven BVMAC equities in French and English, SEMC's as the mockup, SCG-RE's in
    English only (the French screen shows it marked EN).
- **Checked**:
  - Type check, lint, the 367 unit tests (the language shown, the reader's choice kept from one
    security to the next, the note only where the screen's language has no text, CORR's form and
    what EQS shows of a language left empty).
  - CMarket.Api: 1,433 tests, all passing: 1,412 in the usual run, and the SQL Server suite's 21
    on SQL Server (the new migration up, as an idempotent script, and down).
  - Every Playwright flow on CMarket.Api from a fresh database: 113, all passing. Two new ones:
    EQS shows SEMC's description in English, then in French, and SCG-RE's in English alone; CORR
    writes SCG-RE's French, EQS shows it, and the Data admin removes it again. On a fresh database
    (`@fresh-db`), the flows of EQS and of the FA tab fail on the sector averages (6.2% for 6.3%,
    a P/E of 11.4x for 12.1x), as they did before this step.
  - axe (WCAG 2.2 AA) at 1600, 390 and 320 px, in English and French: EQS with a description in
    both languages and in one, marked; CORR's editor empty, saved and refusing a text too long;
    AUDT's entry: 18 audits, nothing found. The screenshots showed the note "Not written in
    English yet" under an English text once the reader had chosen French on another security:
    the note now follows the screen's language.
