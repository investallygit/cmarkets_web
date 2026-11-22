# Step 52 · MSG and N on the live site, the client's report (S): done, no fault

Step 52 of the [roadmap](../../ROADMAP.md#order), for the
[fifth version of the spec](../fifth-version.md).

No CMarket.Api phase.

On 22 November 2026 the client sent, with the fifth version: "Please check some menu are not
working on cmarkets. Like Message News".

- **Checked on 22 November 2026**, on the live site (the web build of 19 November, CMarket.Api of
  21 November), read only: a guard aborted every call that writes, beside the login.
  - Each of the ten demo account types logged in and opened every entry of its menu (Student,
    Analyst, Manager, Trader, Journalist, CEO, News provider, SVT, Data admin, Admin): every entry
    opens its screen. MSG lists the conversations and the requests, N the news and its filters,
    for every client type and the SVT; the News provider's NEWS opens its studio, the Data
    admin's its news.
  - The same as the Analyst in Chromium at 1600 × 900 and 1366 × 768, and in WebKit (Safari's
    engine) at 1440 × 900 and at a phone's 390 × 844: the same.
  - `MSG` and `N` typed in the command bar open their screens; the N tab of a security's profile
    (SEMC, BRENT) opens its news.
  - No page error and no failed call, beside the calls a page change cancels.
  - Outside the demo, CMarket.Api holds six accounts, opened between 8 and 18 November and
    barely used: the client most likely used a demo account. The check's own logins replaced the
    demo accounts' last login, so the account cannot be found from the server.
- **What the client should say**: the account (its e-mail), the browser and the device, what
  happens on a click (nothing, a blank page, an error, a lock) and when, with a screenshot.
- **What could explain it**, to check with that answer:
  - A client's menu holds 17 or 18 entries, where the mockups draw ten: in a window under about
    800 px high, MSG, N, ALRT and CFG lie below the edge, and the menu scrolls (decision 15).
  - A plan without the monitoring module shows N with a lock, which opens the plans; an account
    whose status waits for the Admin opens MSG on "opens once approved".
  - CMarket.Api, in West US 3, answers slowly after a quiet spell: the first panels stay empty for
    a few seconds.
- **The client's answer, 22 November 2026**: "Sure", and a summary of screens 2, 16, 30 and 31 as
  the fifth version describes them, nothing on MSG or N
  ([the answer](../fifth-version.md#the-clients-answer-of-22-november)). The menus "not working"
  are those four screens, which the live site does not have yet: steps 54 and 55 built two, 56
  and 57 build the others. MSG and N work as checked above; the step is closed, and opens again
  if the client names an account and a page that fails.
- **What it changed**: decision 46 (BP's entry panel) and the second part of
  [step 55](step-55-bond-pricing-from-a-curve.md). Putting steps 54 and 55 on the live site
  before 56 lets the client see two of the four screens.
