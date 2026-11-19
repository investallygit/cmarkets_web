# Step 51 · CMarket.Api's messages in the user's language: done

Step 51 of the [roadmap](../../ROADMAP.md#order), planned on 18 November 2026 from
[step 50](step-50-page-bug-sweep.md)'s B18, on the user's word; started on 19 November 2026. On
CMarket.Api's side it is phase 41 (ADR-067).

## Why

CMarket.Api writes its messages in English, about 1,100 of them: the title and detail of each
problem (RFC 7807), the validators' messages by field, the reasons it gives. A page in French
shows them as they come, inside its own French sentence: OPT's "Le scénario ne s'est pas ouvert :
No scenario …", the refusals of RFQ's answer form on B. Ngoma's page, SUBS's "Extend to a day
after 2027-08-09." with a date in ISO among dd/mm/yyyy ones.

## What there is (19 November)

- Where the messages are written: 270 application exceptions (a title and a detail each), 469
  business rules (`DomainException`: a code and an English message), 560 validator messages
  (`WithMessage`), 90 field errors found by a handler (`ValidationErrors.Field`), 8 titles of the
  API's own problems (the exception handler, authorization, the JWT, the rate limits) and 2 hub
  errors. About 360 of them put a value in the sentence (a date, an amount, a limit, a name).
- Already in the user's language, and staying so: the alerts' texts (`AlertTexts`), the notices
  and the e-mails.
- FluentValidation's own messages are off (`LanguageManager.Enabled = false`): every rule has its
  sentence.
- The web shows a problem's `detail`, else its first field error, else its `title`
  (`problemMessage`), and sends no `Accept-Language` of its own (the browser's goes, whatever the
  page's language).
- The web writes dates dd/mm/yyyy in both languages, numbers "52 500,25" in French (a no-break
  space) and "52,500.25" in English.

## Decisions

- **The language** ([decision 37](../fourth-version.md#decisions-taken)): the page's. The web
  sends `Accept-Language` with the language it shows (the profile's once logged in, the visitor's
  choice before); CMarket.Api answers in French for `fr`, in English otherwise. Dates dd/mm/yyyy
  and numbers as the web writes them, in both languages. The codes of the business rules (`code`)
  stay as they are.
- **The sentences stay where they are written, in English.** `Text`, an interpolated string
  handler of `CMarket.Domain.Common`, keeps the English template ("Extend to a day after {0}.")
  and its values. Business rules, application exceptions (title and detail), field errors and
  validators (`Says(…)`, the `Text` riding on the failure's `CustomState`) take a `Text`; the logs
  and `Exception.Message` stay in English.
- **A French catalogue by area**: `CMarket.Api/Resources/Messages/fr/<area>.json`, from each
  English template to its French one, 700 lines at most per file. English needs no file: the
  template is the English.
- **Translated at the edge**: the exception handler and the API's own problems write the title,
  the detail and the field errors in the request's language (`MessageLocalizer`: the catalogue,
  then the values by language: dates, numbers, percentages). A template missing from the catalogue
  stays in English and logs a warning.
- **A test lists every message**: it reads the sources (Roslyn, syntax only) and finds each
  template in the French catalogue with the same placeholders, and no French entry without its
  English. A message made at run time (from a variable) is a `Text` built from parts the test
  sees, or is refused.
- **Values that are English words** (an enum, a status, a side) become a `Text` of their own, or a
  name the catalogue translates.

## Parts

1. **Groundwork**, both repositories: `Text`, the value formats, the catalogue and its loading,
   the request's language from `Accept-Language`, the exception handler, `Says`, the API's own
   problems. The web sends `Accept-Language` on every request. Tests: the formats; a request in
   French gets its problem in French; the web's header follows the language switch.
2. **The move**: every place that writes a message takes a `Text` (`WithMessage` → `Says`); helpers
   that return a message return a `Text`; the messages made at run time and the English values
   reviewed one by one. The list test is written, failing on every missing French entry.
3. **French, accounts and the platform**: identity, sessions, profile, organisations, settings,
   the Admin, subscriptions, payments, invoices.
4. **French, the market**: market data, bonds, ETF, FX, ECO, commodities, fundamentals, portfolios,
   OPT, watchlists, layouts.
5. **French, content and people**: research, news, the news studio, media payments, alerts,
   calendar, the directory, messaging.
6. **French, the RFQ and the back-office**: SVT, RFQ, agreements, BEAC reporting, imports,
   corrections, the Data admin's screens. The words are the web's (`fr/*.json`), so that a page and
   the API's sentence inside it say the same thing.
7. **Other English in the answers**: the texts the API returns outside a problem (reasons, labels):
   listed, then translated or kept with their reason.
8. **Checks and docs**: CMarket.Api's suites, the web's unit tests, the French flows of OPT, RFQ,
   SUBS and the toasts, axe in French; README, ROADMAP, the screens touched, phase 41 and ADR-067
   in CMarket.Api; commits and push on the user's word, then the live site.

## Done

### Parts 1 and 2's move (19 November)

The compiler did most of part 2 with part 1: `Text` takes no plain `string`, so every place that
wrote a message as a string stopped compiling until it wrote an interpolated literal.

- `Text` and `TextValues` (`CMarket.Domain.Common`): the template, the values, the values written
  by language (`TextValues.Write`), `Text.Verbatim` (said as it is) and `Text.Constant` (a constant
  an attribute needs, `[ForbiddenDetail]`); equal when the English is.
- `DomainException(code, Text)`, `AppException(Text title, Text? detail)` (`TitleText`,
  `DetailText`; `Title`, `Detail` and `Message` stay the English), `ValidationErrors.Field(field,
Text)`; the validators' `Says(…)` and `Fail(…)` (`ValidationTexts`) in place of `WithMessage`,
  `AddFailure` and `new ValidationFailure`.
- About 1,400 places moved: 1,300 literals by a script that read the compiler's errors and made
  them interpolated, about 100 by hand (choices between two sentences, helpers that returned a
  `string`, `const string` messages turned into `Text` properties, a DomainException's `Message`
  passed on as its `Text`). `OverdrawnException`, `OversoldException` and `OptimizerEngine.Describe`
  now give their values raw, for each language to write.
- At the edge (`CMarket.Api/Localization`): `RequestLanguage` (Accept-Language, by weight; English
  otherwise), `MessageCatalog` (the French JSON files embedded, merged, an English template in two
  files refused), `ProblemTexts`; the exception handler, the authorization's 403, the JWT's 401,
  the rate limits' 429 and the refresh's 401 say their sentences in the request's language, an
  extension's too (a submission's `errors`); every problem varies by `Accept-Language`.
- Kept in English: the hub errors (`Conversation not found`, the protocol's, never shown), the
  ingestion API's field errors (the providers' systems read them), ASP.NET Core's own sentence of a
  malformed request (`Text.Verbatim`), the news file check's issues (the web words them by code).
- The web sends `Accept-Language` with the page's language from `fetchApi`, so every request does,
  the session's renewal included; the hubs need none.
- Tests: `TextTests` (template, braces, numbers and dates by language, a nested sentence,
  verbatim and constant, equality); `ProblemLanguageTests` (a business rule, a field error with
  "12 500", an application exception and the 401 in French; the language by weight); the web's
  `fetchApi` test. `MessageCatalogueTests` reads the five projects with Roslyn
  (`Microsoft.CodeAnalysis.CSharp` 5.0.0, the test project only): 1,320 sentences without their
  French and 94 with a value that may be words, the work of parts 2 to 6; the other rules hold
  (no French without its English, the same values, no bypass of `Text`, verbatim where listed).

### Part 2: the values and the silent checks (19 November)

- The test found two more ways a sentence stayed English, now rules of its own: 80 checks of the
  validators without a sentence (`.NotNull()` before an `InclusiveBetween(…).Says(…)`, a bare
  `MaximumLength`), which said FluentValidation's English ("'Reason' must not be empty."), and the
  `(Text)$"…"` casts, which the compiler converts on the cast. The 80 got their `Says`: the
  sentence of the chain when it has one, else "Required.", "{n} characters at most.", "From {a} to
  {b}." and the like.
- Values written before they reached the sentence now go raw, for each language to write: the
  dates of a sale, a cash shortfall, a bond's issue, a report day; the XAF of a research price, a
  four-eyes threshold; the limits of an alert, an import, a description.
- English words put in a sentence became a sentence each or a name of their own: the account
  types and the modules as the web names them (`AccountType.Name()`, `ModuleCode.Name()`: "Un
  compte Étudiant peut détenir 1 portefeuille.", "La formule n'inclut pas le module
  Portefeuille."), a commodity's interval, an import's status, a portfolio limit's "and 100 at
  most". A payment's "provider could not be reached" is one sentence, not two joined. "No
  session" said two things: the market's is "No market session".
- 84 sentences keep a value that reads the same in both languages, each listed with why
  (`reviewed-values.json`): an id or a code sent, a name its user gave, a person or an
  organisation, a newspaper's tag, a file's column, the API's own codes.

### Parts 3 to 6: the French (19 November)

1,383 sentences in ten files of `CMarket.Api/Resources/Messages/fr`: `core` (the API's own and
those of several areas, 100), `accounts` (164), `billing` (68), `market` (245), `portfolios`
(146), `research` (85), `news` (261), `network` (98), `rfq` (186), `dataAdmin` (47). The words
are the web's: « titre » for a security, « filtre » for a saved screen, « relevé », « versement »,
« nominal », « prix pied de coupon », « Formule » for a plan, the account types as `accountTypes`
names them; the API's parameter names and codes stay as sent (`from doit être une date ISO.`).
Numbers keep a no-break space between groups and before "%".

### Part 7: other English in the answers (19 November)

- Shown by the web as they come, and now said in the reader's language: a news file's reason
  for failing (NEWS NEW's last import) and a failed report's (PORT's reports). They stay stored in
  English, written from a `Text`; the answer says them through `Text.Stored`, French when the
  catalogue has the sentence (one without values), as stored otherwise. `NewsImportFiles` wrote
  its reasons as plain strings, which the test could not see: they are `Text` now.
- Kept as they are: the mail server's and EODHD's errors (their own words, for the Admin), a
  payment's failure reason (the provider's; not shown), an import row's English (the web words
  it by its code), the names of the plans and publications on an invoice (decision 35).

### Part 8: checked (19 November)

- CMarket.Api: Domain 701, Application 800, API 303 and architecture 21 tests pass, the
  catalogue's among them (1,383 sentences, none without its French).
- The web: typecheck, lint and 505 unit tests pass.
- B18's pages, on a copy of CMarket.Api on a fresh database: OPT's scenario that does not open
  says "Le scénario ne s'est pas ouvert : aucun de vos scénarios n'a cette adresse", the page
  sending `fr`; SUBS's extension to a day already covered answers "Prolongez jusqu'à un jour
  après le 28/11/2026."; RFQ's answer form, its field errors in French ("Une réponse tient de 1
  à 40 minutes.").
- Every flow on the same copy: 137 pass. Two fail the same way on CMarket.Api as it was before
  this step, run just after midnight in Douala, and so are not this step's: the CEMAC sovereign
  yields flow (the Cameroon 7Y point is new rather than a replacement) and the CEO's RFQ flow
  (C. Abena's confirmed request not in the list); both seed a point or a request of the day.
- Axe was not run again: the step changes the API's words, not the pages.
