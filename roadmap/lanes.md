# Lanes: steps 41 to 48 at once

Since 14 November 2026 the steps left of the [fourth version](fourth-version.md) run in three
lanes at once, each a working session of its own on both projects (this one and CMarket.Api).
Back to the [order of the roadmap](../ROADMAP.md#order).

## The lanes

| Lane | Steps, in order                                                       | CMarket.Api's phases | ADRs reserved |
| ---- | --------------------------------------------------------------------- | -------------------- | ------------- |
| 1    | 43 SVT accounts, 44 RFQ, 45 SVT approval, then 48 Fourth version done | 34, 35, 36           | 060, 061, 062 |
| 2    | 41 CMDTY, then 46 RFQ AGR                                             | 32, 37               | 058, 063      |
| 3    | 42 OPT and OPT RES, then 47 RFQ REP                                   | 33, 38               | 059, 064      |

- Lane 1 holds the RFQ's chain, the longest: steps 43, 44 and 45 each need the one before.
- Lanes 2 and 3 start with the two steps that need nothing of the RFQ, then build the agreements'
  screen and the BEAC's reporting on what lane 1 lands.
- The RFQ comes earlier than step 37 planned it, which kept it for last for the four points the
  spec wants confirmed with the BEAC: it is built behind its switch (decision 24), and the spec
  author's answers, when they come, change what they touch.

## What waits for what

| Step       | Starts once                       | Finished once                                                    |
| ---------- | --------------------------------- | ---------------------------------------------------------------- |
| 41, 42, 43 | now                               |                                                                  |
| 44         | 43 is on `main`                   |                                                                  |
| 45         | 44 is on `main`                   |                                                                  |
| 46         | 44 is on `main`                   | 45 is too: the ticket's download and resending, the e-mail log   |
| 47         | 44 is on `main`                   | 45 is too for the concluded agreements, 46 for the cancellations |
| 48         | 45 is on `main`, screen by screen | 46 and 47 are too                                                |

- A step is on `main` when its commits are in the `main` branch of both repositories; their
  messages name it ("ROADMAP step 44"), so a lane finds it in the history.
- So that 46 and 47 can start on 44, step 44 sets the agreement's whole model: the columns of
  section 10's `rfq.Agreements`, the statuses (awaiting the SVTs, concluded, rejected, expired,
  cancelled), and demo agreements in each status. Lane 1 may land step 44's contract and model
  before its screen, as a commit of their own, to start them sooner.
- While a lane waits, it prepares its next step (the API's phase file, the contract) and runs step
  48's checks of the screens it built: axe at 1600, 390 and 320 px in both languages, the
  keyboard.

## The files the lanes share

Each lane adds to the same registries; the lane that lands second keeps both sides.

- **Here**: `shared/routes/screens.ts` and `paths.ts`, `app/routes/pages.ts`, the command bar's
  `functionCodes.ts`, `shared/api/contracts/index.ts`, `openapi-routes.txt` (generated again from
  the API), the locale area `core` (each module's own strings go in an area of their own:
  `commodities`, `optimizer`, `rfq`, spread in `locales/en.ts` and `fr.ts`), `e2e/smoke.spec.ts`
  (the menu's order), this roadmap's index and its screens' files, the README's status.
- **CMarket.Api**: the database context's sets and the migrations (each generated last, and again
  over a newer one of another lane), the permissions, the account types, the audit's actions, the
  import's file types, the recurring jobs, the dependency injection, the demo's seeders, the
  README, `tests/http`.
- **The menu** (decision 15): lane 2 adds CMDTY after MKT, before ECO; lane 3 OPT after PORT;
  lane 1 RFQ after BS, and the SVT's menu.
- **Numbers**: each step has its ADR above; a decision of this roadmap from 25 on, or an ADR from
  065 on, goes to the lane that claims it first.

## One machine

The three lanes run on one Mac that is short of memory: one heavy job at a time (a build, a test
suite, the API, the browser flows) across the lanes, each lane in its own copy of both
repositories, and one lane at a time bringing its commits onto `main`. Step 48 then runs every
flow once more on a fresh database, all the lanes' work together.
