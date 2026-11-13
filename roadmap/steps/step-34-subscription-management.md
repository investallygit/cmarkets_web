# Step 34 · SUBS · Subscription management (screen 14) (L): done

Step 34 of the [roadmap](../../ROADMAP.md#order), for the
[third version of the spec](../third-version.md).

CMarket.Api's phase 27.

- **Built**:
  - SUBS (/admin/subscriptions, `subscriptions:manage`, the Admin's), in the Admin's menu between
    USER and MPAY as the spec orders them; SRC, which the spec does not place, now follows MPAY.
    The command bar opens it with SUBS.
  - The counters: active subscriptions, expiring within 30 days (yellow), expired and not renewed
    and failed payments over 30 days (red), the amount collected this month (green); the yellow
    and red ones filter the list on their status.
  - The subscriptions: a row per account, its own plan or its organisation's ("Org. (name)", "—
    (via organisation)"), and per organisation that pays one ("Manager ×4, CEO ×1"); search by
    name, e-mail or organisation, plan, status and expiry (7, 30, 90 days) filters in the address,
    the mockup's columns sorted by expiry (the plans in force first, a failed charge's at the top,
    then those that ended), the status colours of the mockup, the footer "14 of 1,871
    subscriptions · page 1 / 134 · sort: expiry date", Export CSV of every row of the filters.
  - The account subscription: account, type, plan and price, status, start, expiry, auto-renewal
    with the stored card or number ("Yes · card •••• 4417"), last payment and invoice, a failed
    charge's last try, a suspension's reason; for a member, the organisation's subscription. Its
    payments and invoices, the latest first, "Failed, then paid" in yellow; each invoice number
    opens its PDF in a dialog. Extend subscription (a later day and a reason), Change plan (a plan
    the account may have and its cycle, the proration previewed before it is confirmed), Resend
    last invoice (by e-mail with its PDF), Suspend subscription (a reason, confirmed) or Lift the
    suspension.
  - CFG names the plan in force (the media's included) and shows a failed charge and a suspension;
    USER's account details too; AUDT words the five new actions.
  - Slices: `widgets/subscription-admin-panels` (the counters, the list, the account's
    subscription, its payments; the words and the address's filters in `lib`),
    `features/manage-subscription` (the actions and their dialogs), `pages/subscription-management`,
    SUBS's hooks and colours in `entities/subscription`, the contracts `subscriptionAdmin.ts` and
    the routes of /admin/subscriptions and /admin/invoices/{id}; the strings in the area file
    `subscriptions.json`.
- **CMarket.Api** (phase 27, ADR-051):
  - Renewals for real (decision 7): the billing job charges the card or mobile money number stored
    at checkout through the payment port, invoices a transfer, gives an agreement free, expires a
    plan that does not renew by itself; a failed charge keeps the plan in force and is tried again
    once a day for seven days, then the plan expires. The statuses Payment failed and Suspended;
    the method Agreement and the plan "Media source" (XAF 0), offered to nobody, which an Admin
    gives to a media; migration `SubscriptionManagement` (the periods moved on to today's).
  - The endpoints of section 10 (`/admin/subscriptions`, `/stats`, `/export`, `/{accountId}`,
    `/payments`, `/invoices`, `/plan`, `/extend`, `/suspend`, `/admin/invoices/{id}/pdf` and
    `/resend`), and `/plans`, `/proration` and `/reactivate`.
  - A change of plan prorated by the day: the days left of the plan in force buy days of the new
    one; less than a day, a full period charged at once.
  - Demo: the demo accounts as their mockup rows where the other screens allow it, and the
    generated accounts' plans drawn so that the counters read the mockup's whatever the day.
- **Checked**:
  - Type check, lint, the 354 unit tests (the address's filters, the footer's pages, the
    members' line among them).
  - CMarket.Api: 1,422 tests, all passing: 1,402 in the usual run, and the SQL Server suite's 20
    on SQL Server (the new migration up with its periods moved on, as an idempotent script, and
    down). `npm run test:api` reads SUBS as the Admin: 567 reads, 225 left out by permission or
    plan.
  - Every Playwright flow on CMarket.Api from a fresh database: 110, all passing. Two new ones:
    the Admin extends L. Fotso's month, suspends and lifts it, changes M. Ndong's plan prorated by
    the day; the counters filter the list, Research house M's declined card, Media I by agreement,
    a resent invoice and the CSV. CFG's transfer flow now takes the newest of K. Atangana's
    invoices, among the months the SUBS demo gives him. On a fresh database (`@fresh-db`): the
    mockup's counters (1,871 · 143 · 62 · 9 · 48.6 M XAF), the list by expiry, K. Atangana's plan,
    history and an invoice's PDF.
  - axe (WCAG 2.2 AA) at 1600, 390 and 320 px, in English and French: SUBS, an account's
    subscription, the Change plan, Extend and Suspend dialogs, an invoice's PDF, a declined card's
    retries, CFG of a News provider on the media's plan: 43 audits, nothing found.
