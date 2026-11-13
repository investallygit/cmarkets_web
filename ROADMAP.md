# Roadmap

Screen-by-screen plan to finish the front end of `CMarket-developer-spec-EN.pdf`, the version of
13 November 2026; the earlier versions are kept as `CMarket-developer-spec-EN-v1.pdf` (29 October),
`CMarket-developer-spec-EN-v2.pdf` (2 November) and `CMarket-developer-spec-EN-v3.pdf` (10
November). This file is the entry point: what is built, the order of the steps and their status;
the rest is in the [`roadmap/`](roadmap) folder, listed under
[Where things are](#where-things-are).

Every screen of the first three versions is built: the client terminal (MKT, DES with its FA and ANA
tabs, EQS, ETFS, YCRV, BP, BS, PORT, PUB, PUB NEW, NET, MSG, NET ME, N, NEWS NEW, CAL, ALRT and
CFG, DES opening the equity, bond or ETF profile) with the public profile page and the login,
sign-up and password reset pages, the back-office of the Data admin (IMP with DATA, HIST and EODH,
then CORR and NEWS) and that of the Admin (USER with ANLY and MOD, SUBS, MPAY, SRC, ADMCFG, AUDT
and PAY), and the home page that visitors see before login. The second version added the
Journalist and CEO account types and the professional directory with its messaging (screens 10
to 12): steps 11 to 19, under [Second version of the spec](roadmap/second-version.md). The third
version added a ninth account type, the News provider, a news feed rebuilt around partner
newspapers paid per unique click, and eight screens (13 to 20): steps 23 to 36, under
[Third version of the spec](roadmap/third-version.md). The fourth version adds a tenth account
type, the SVT, requests for quotes on government securities, and nine screens (21 to 29): steps 37
to 48, under [Fourth version of the spec](roadmap/fourth-version.md). What remains is listed
under "Still to do" for each screen and for the [shared groundwork](roadmap/shared-groundwork.md),
in those steps and in the [open questions for the spec author](roadmap/open-questions.md).

ANLY and MOD were built with USER: in the mockups they are panels of the same screen. Sizes are
relative: S < M < L < XL.

## Where things are

| Document                                                | What it holds                                                                                                          |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [Second version of the spec](roadmap/second-version.md) | What the spec of 2 November 2026 changed                                                                               |
| [Third version of the spec](roadmap/third-version.md)   | What the spec of 10 November 2026 changed, the decisions taken where it is silent (1 to 13), the spec author's answers |
| [Fourth version of the spec](roadmap/fourth-version.md) | What the spec of 13 November 2026 changes, the decisions taken (14 to 24)                                              |
| [Steps](roadmap/steps)                                  | A file per step from step 11, named after its number: what it built, checked, fixed and left to do                     |
| [Client screens](roadmap/client-screens.md)             | Each screen of the terminal: what is built, by which step, what is still to do                                         |
| [Back-office screens](roadmap/back-office-screens.md)   | The same for the screens of the Data admin and of the Admin                                                            |
| [Shared groundwork](roadmap/shared-groundwork.md)       | What steps 1 to 10 added to the shared kit, and what it still lacks                                                    |
| [Open questions](roadmap/open-questions.md)             | The questions for the spec author, by version of the spec, each with the choice made meanwhile                         |

The code's comments cite a step or a decision by its number ("ROADMAP step 27", "ROADMAP decision
6"): a step is its file of [`roadmap/steps/`](roadmap/steps), decisions 1 to 13 are in the
[third version](roadmap/third-version.md#decisions-taken) and decisions 14 to 24 in the
[fourth](roadmap/fourth-version.md#decisions-taken).

A step has its file from the day it is planned. When it is done, its title says so, and its line
in the order below, the screens it touched and the README's status are brought up to date.

## Order

| Step | Work                                                                                                                 | Status |
| ---- | -------------------------------------------------------------------------------------------------------------------- | ------ |
| 1    | Shared groundwork, batch 1: form kit, `PriceChart`, XLSX export                                                      | Done   |
| 2    | DES                                                                                                                  | Done   |
| 3    | Watchlist editing (MKT), N, CAL, ALRT                                                                                | Done   |
| 4    | EQS / FA, then YCRV / YAS                                                                                            | Done   |
| 5    | PORT                                                                                                                 | Done   |
| 6    | PUB, then PUB NEW                                                                                                    | Done   |
| 7    | CFG, login and OTP (needed before connecting the real back end)                                                      | Done   |
| 8    | Back-office: IMP (with DATA, HIST, EODH), then CORR, then NEWS                                                       | Done   |
| 9    | Admin: USER (with ANLY, MOD), then ADMCFG, AUDT, PAY                                                                 | Done   |
| 10   | Home page, before login: the product, markets, users, plans                                                          | Done   |
| 11   | [Second version of the spec: the plan, its open questions](roadmap/steps/step-11-second-version-plan.md)             | Done   |
| 12   | [Journalist and CEO account types, approved by the Admin](roadmap/steps/step-12-journalist-and-ceo.md)               | Done   |
| 13   | [Portfolios shared with the organisation, read by its CEO](roadmap/steps/step-13-organisation-portfolios.md)         | Done   |
| 14   | [NET ME: professional profile, visibility and contact rules](roadmap/steps/step-14-net-me-profile.md)                | Done   |
| 15   | [NET: professional directory, public profile page](roadmap/steps/step-15-net-directory.md)                           | Done   |
| 16   | [MSG: conversations, contact requests, files, shared objects](roadmap/steps/step-16-msg-messaging.md)                | Done   |
| 17   | [MSG in real time: the `/hubs/chat` hub](roadmap/steps/step-17-msg-real-time.md)                                     | Done   |
| 18   | [Admin: reported profiles and conversations, directory settings](roadmap/steps/step-18-admin-directory-messaging.md) | Done   |
| 19   | [Second version done: README, accessibility, every flow](roadmap/steps/step-19-second-version-done.md)               | Done   |
| 20   | [Connecting `CMarket.Api`: `.env`, the API module, its checks](roadmap/steps/step-20-connecting-the-api.md)          | Done   |
| 21   | [The mock removed: every screen on `CMarket.Api`](roadmap/steps/step-21-mock-removed.md)                             | Done   |
| 22   | [The Azure demo checked](roadmap/steps/step-22-azure-demo-checked.md)                                                | Done   |
| 23   | [Third version of the spec: the plan, its decisions, questions](roadmap/steps/step-23-third-version-plan.md)         | Done   |
| 24   | [News provider account type, approved by the Admin](roadmap/steps/step-24-news-provider.md)                          | Done   |
| 25   | [News rebuilt: ARTICLE, FLASH, newspapers, tags, unique clicks](roadmap/steps/step-25-news-rebuilt.md)               | Done   |
| 26   | [NEWS NEW: the news studio of a News provider (screen 13)](roadmap/steps/step-26-news-studio.md)                     | Done   |
| 27   | [News administration, AI ingestion, international news](roadmap/steps/step-27-news-administration.md)                | Done   |
| 28   | [MPAY: media payments (screen 18)](roadmap/steps/step-28-media-payments.md)                                          | Done   |
| 29   | [Daily bond analytics, BS: bond screener (screen 17)](roadmap/steps/step-29-bond-screener.md)                        | Done   |
| 30   | [BP: bond pricing (screen 16)](roadmap/steps/step-30-bond-pricing.md)                                                | Done   |
| 31   | [Bond profile (screen 20), the profile chosen by security type](roadmap/steps/step-31-bond-profile.md)               | Done   |
| 32   | [ETF data, ETFS: ETF screener (screen 15)](roadmap/steps/step-32-etf-screener.md)                                    | Done   |
| 33   | [ETF profile (screen 19)](roadmap/steps/step-33-etf-profile.md)                                                      | Done   |
| 34   | [SUBS: subscription management (screen 14)](roadmap/steps/step-34-subscription-management.md)                        | Done   |
| 35   | [Security descriptions on EQS (screen 3)](roadmap/steps/step-35-security-descriptions.md)                            | Done   |
| 36   | [Third version done: README, accessibility, every flow](roadmap/steps/step-36-third-version-done.md)                 | Done   |
| 37   | [Fourth version of the spec: the plan, its decisions, questions](roadmap/steps/step-37-fourth-version-plan.md)       | Done   |
| 38   | [Rate series, the CEMAC sovereign yields file, stale curve points](roadmap/steps/step-38-rate-series.md)             | Done   |
| 39   | [FX: the XAF's cross rates on the ECB's reference rates (screen 26)](roadmap/steps/step-39-fx-dashboard.md)          | Done   |
| 40   | [ECO: macroeconomic dashboard (screen 25)](roadmap/steps/step-40-macro-dashboard.md)                                 | Done   |
| 41   | [CMDTY: commodities, the profile of a commodity (screen 21)](roadmap/steps/step-41-commodities.md)                   | To do  |
| 42   | [OPT, OPT RES: portfolio optimisation (screens 28 and 29)](roadmap/steps/step-42-portfolio-optimisation.md)          | To do  |
| 43   | [SVT account type, licensed SVTs, trader links, `/hubs/rfq`](roadmap/steps/step-43-svt-accounts.md)                  | To do  |
| 44   | [RFQ: requests for quotes on BTA and OTA (screen 22)](roadmap/steps/step-44-rfq-trading.md)                          | To do  |
| 45   | [SVT: approval of the agreements, tickets by e-mail (screen 27)](roadmap/steps/step-45-svt-approval.md)              | To do  |
| 46   | [RFQ AGR: agreements (screen 23)](roadmap/steps/step-46-rfq-agreements.md)                                           | To do  |
| 47   | [RFQ REP: daily reporting to the BEAC (screen 24)](roadmap/steps/step-47-beac-reporting.md)                          | To do  |
| 48   | [Fourth version done: README, accessibility, every flow](roadmap/steps/step-48-fourth-version-done.md)               | To do  |

Steps 1 to 10 built the first version, screen by screen, and have no file of their own: their
record is under each screen in [Client screens](roadmap/client-screens.md) and
[Back-office screens](roadmap/back-office-screens.md), and in
[Shared groundwork](roadmap/shared-groundwork.md).

## Done for every screen

- DTOs in `shared/api/contracts` and the calls in `shared/api/endpoints`, served by `CMarket.Api`
  with demo data from the mockup (the mock handlers until step 21).
- A `pages/<screen>` slice, registered in `app/routes/pages.ts`.
- French and English strings; actions hidden or locked by permission and quota.
- Tables: sorting, right-click menu, export. Layout saved per user, one column below 1280 px.
- Vitest for the logic and one Playwright flow; README status updated.
