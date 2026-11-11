import type { Page } from '@playwright/test'
import { apiAs, expect, test } from './people.js'

// MPAY, the media payments of ROADMAP step 28 (spec screen 18): the month before today as the
// mockup's October 2026, read from the demo's clicks (DAILY K under review at XAF 400,000 under its
// cap, MEDIA I to approve, ÉCO HEBDO approved, GABON ÉCO paid, CONGO INFO approved, TCHAD MATIN
// disputed), DAILY K's anomalies, a second Admin's confirmation, the newspaper's dispute in its
// studio, a payment and the transfer file. The flows follow one another on the demo's month.

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section', { has: page.getByRole('heading', { name: title, exact: true }) })

/** The month before today, "2026-10", and its name, "October 2026". */
const now = new Date()
const previous = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
const MONTH = previous.toISOString().slice(0, 7)
const MONTH_NAME = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
}).format(previous)

const ADMIN = /^admin$/i
const PROVIDER = /news provider/i

/** The prototype's account switch reloads the app: wait for the new account's badge in the top bar. */
async function switchAccount(
  page: Page,
  from: RegExp,
  account: 'Admin' | 'News provider',
  badge: RegExp,
) {
  await page.goto('/cfg')
  const topBar = page.getByRole('banner')
  await topBar.getByRole('button', { name: from }).click()
  await page.getByRole('menuitem', { name: account, exact: true }).click()
  await expect(topBar.getByRole('button', { name: badge })).toBeVisible()
}

/** From the demo Analyst's session, which each flow starts with. */
const asAdmin = (page: Page) => switchAccount(page, /analyst/i, 'Admin', ADMIN)

/** The demo's other Admin (the population's), who confirms what L. Mvogo asked. */
async function secondAdminEmail(page: Page) {
  const call = await apiAs(page)
  const page1 = await call<{ items: { email: string }[] }>(
    'GET',
    '/admin/users?type=admin&pageSize=10',
  )
  const other = page1.items.find((account) => account.email !== 'l.mvogo@cmarket.example')
  expect(other, 'a second demo Admin').toBeDefined()
  return other!.email
}

/** The second Admin's confirmation, in English or in French. */
const CONFIRM = /^Confirm(er)?$/
const CONFIRMED = /^(Confirmed: the statement is Approved|Confirmé : le relevé est Approuvé)\.$/

/** A status picked with its reason in the statement panel. */
async function changeStatus(page: Page, status: string, reason: string) {
  const statement = panel(page, /^Statement · /)
  await statement.getByLabel('New status').selectOption(status)
  await statement.getByLabel('Reason (required)').fill(reason)
  await statement.getByRole('button', { name: 'Apply' }).click()
}

test('MPAY shows the month as the mockup, invalidates an anomaly and waits for a second Admin', async ({
  page,
  person,
}) => {
  test.slow()
  await asAdmin(page)
  await page
    .getByRole('navigation', { name: 'Main menu' })
    .getByRole('link', { name: /^MPAY/ })
    .click()
  await expect(page).toHaveURL(/\/admin\/media-payments/)

  // The header and the statements of the mockup.
  const header = page.getByRole('region', { name: 'Media payments' })
  await expect(header.getByLabel('Month')).toHaveValue(MONTH)
  await expect(header).toContainText('XAF 1,269,100')
  await expect(header).toContainText('72,925')
  await expect(header).toContainText('2,439')
  await expect(header).toContainText('XAF 122,100')
  const statements = panel(page, 'Monthly statements by newspaper')
  await expect(statements.getByRole('row', { name: /DAILY K/ })).toContainText(
    /15\s*214\s*33,060\s*1,860\s*31,200\s*468,000\s*400,000\s*400,000\s*Under review/,
  )
  await expect(statements.getByRole('row', { name: /TCHAD MATIN/ })).toContainText('Disputed')
  await expect(statements.getByRole('row', { name: /Total/ })).toContainText('1,269,100')

  // DAILY K's anomalies and statement.
  const anomalies = panel(page, 'Click anomalies · DAILY K')
  await expect(anomalies.getByRole('row', { name: /Spike ×7 the average/ })).toContainText(
    /Douala: BVMAC launches a new segment.*1,420\s*Invalidated/,
  )
  await expect(anomalies.getByRole('row', { name: /38 accounts · same IP address/ })).toContainText(
    /6 FLASH items\s*210\s*To handle/,
  )
  await expect(anomalies.getByRole('row', { name: /Accounts under 24 h old/ })).toContainText(
    'Excluded (rule)',
  )
  const statement = panel(page, 'Statement · DAILY K')
  await expect(statement).toContainText('33,060 · 1,860 · 31,200')
  await expect(statement).toContainText('Gross amount (31,200 × XAF 15)XAF 468,000')

  // The 210 clicks of one address invalidated, with a reason: the statement goes to approve.
  await anomalies.getByRole('button', { name: 'Invalidate the 210 clicks' }).click()
  const dialog = page.getByRole('dialog', { name: 'Invalidate 210 clicks' })
  await dialog.getByLabel('Reason').fill('One address, one campaign: not readers.')
  await dialog.getByRole('button', { name: 'Invalidate the 210 clicks' }).click()
  await expect(
    page.getByText('The clicks are invalidated: the statement is computed again.'),
  ).toBeVisible()
  await expect(anomalies.getByRole('row', { name: /38 accounts/ })).toContainText('Invalidated')
  await expect(statements.getByRole('row', { name: /DAILY K/ })).toContainText('To approve')
  await expect(statement).toContainText('33,060 · 2,070 · 30,990')

  // Above XAF 300,000, the approval waits for a second Admin, who confirms it.
  await changeStatus(page, 'approved', 'Figures checked against the newspaper’s count.')
  await expect(
    page.getByText('A second Admin must confirm: the change waits for them.'),
  ).toBeVisible()
  await expect(statement.getByRole('status')).toContainText(
    'Waiting for a second Admin: Approved · above the four-eyes threshold',
  )
  await expect(statement.getByRole('button', { name: 'Confirm' })).toHaveCount(0)

  // The demo's other Admin reads in French: their screen is named in both languages.
  const second = await person(await secondAdminEmail(page))
  await second.goto(`/admin/media-payments?month=${MONTH}`)
  const secondStatement = panel(second, /^(Statement|Relevé) · DAILY K$/)
  await secondStatement.getByRole('button', { name: CONFIRM }).click()
  await expect(second.getByText(CONFIRMED)).toBeVisible()
  await expect(secondStatement.getByText(/^(Current:|Actuel :)/)).toContainText(/Approved|Approuvé/)
})

test('the newspaper downloads its approved statement and disputes it; the Admin maintains it', async ({
  page,
  person,
}) => {
  test.slow()
  // MEDIA I's month approved by two Admins.
  await asAdmin(page)
  await page.goto(`/admin/media-payments?month=${MONTH}`)
  await panel(page, 'Monthly statements by newspaper')
    .getByRole('row', { name: /MEDIA I/ })
    .click()
  await changeStatus(page, 'approved', 'Figures checked.')
  await expect(panel(page, 'Statement · MEDIA I').getByRole('status')).toBeVisible()
  const second = await person(await secondAdminEmail(page))
  await second.goto(`/admin/media-payments?month=${MONTH}`)
  await panel(second, /^(Monthly statements by newspaper|Relevés mensuels par journal)$/)
    .getByRole('row', { name: /MEDIA I/ })
    .click()
  await panel(second, /^(Statement|Relevé) · MEDIA I$/)
    .getByRole('button', { name: CONFIRM })
    .click()
  await expect(second.getByText(CONFIRMED)).toBeVisible()

  // The News provider of Media I: its statement in the studio, the PDF, a dispute.
  await switchAccount(page, ADMIN, 'News provider', PROVIDER)
  await page.goto('/n/new')
  const mine = panel(page, 'Statements')
  const row = mine.getByRole('row', { name: new RegExp(MONTH_NAME) })
  await expect(row).toContainText(/18,420\s*368,400\s*Approved/)
  const download = page.waitForEvent('download')
  await row.getByRole('button', { name: 'PDF' }).click()
  expect((await download).suggestedFilename()).toBe(`MPAY-${MONTH}-MEDIAI.pdf`)
  await row.getByRole('button', { name: 'Dispute' }).click()
  const dialog = page.getByRole('dialog', { name: `Dispute the statement MPAY-${MONTH}-MEDIAI` })
  await dialog.getByLabel('Reason').fill('Our own count shows more readers.')
  await dialog.getByRole('button', { name: 'Dispute' }).click()
  await expect(page.getByText('Your dispute is sent.')).toBeVisible()
  await expect(row).toContainText('Disputed')

  // The Admin answers: the amount stands.
  await switchAccount(page, PROVIDER, 'Admin', ADMIN)
  await page.goto(`/admin/media-payments?month=${MONTH}`)
  await panel(page, 'Monthly statements by newspaper')
    .getByRole('row', { name: /MEDIA I/ })
    .click()
  const statement = panel(page, 'Statement · MEDIA I')
  await expect(statement).toContainText('Our own count shows more readers.')
  await statement.getByLabel('Answer (required)').fill('The excluded clicks were robots.')
  await statement.getByRole('button', { name: 'Maintain' }).click()
  await expect(page.getByText('The dispute is answered.')).toBeVisible()
  await expect(statement.getByText('Current:')).toContainText('Approved')
})

test('MPAY records a payment, gives the transfer file and keeps a newspaper’s settings by month', async ({
  page,
}) => {
  await asAdmin(page)
  await page.goto(`/admin/media-payments?month=${MONTH}`)
  const statements = panel(page, 'Monthly statements by newspaper')

  const transfer = page.waitForEvent('download')
  await statements.getByRole('button', { name: 'XLSX', exact: true }).click()
  expect((await transfer).suggestedFilename()).toBe(`cmarket-transfers-${MONTH}.xlsx`)

  await statements.getByRole('row', { name: /ÉCO HEBDO/ }).click()
  const statement = panel(page, 'Statement · ÉCO HEBDO')
  await statement.getByLabel('New status').selectOption('paid')
  await statement.getByLabel('Reference').fill('VIR-0420')
  await statement.getByLabel('Reason (required)').fill('Sent with the month’s batch.')
  await statement.getByRole('button', { name: 'Apply' }).click()
  await expect(page.getByText('The statement is Paid.')).toBeVisible()
  await expect(statement).toContainText(/Payment: .* · Transfer · VIR-0420/)
  await expect(statements.getByRole('row', { name: /ÉCO HEBDO/ })).toContainText('Paid')
  await expect(page.getByRole('region', { name: 'Media payments' })).toContainText('XAF 368,850')

  // ÉCO HEBDO's terms: a higher rate from next month, which leaves its paid month as it was.
  await statement.getByLabel('Rate per unique click (XAF)').fill('30')
  await statement.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText(/^Saved from .*: 0 statements computed again\.$/)).toBeVisible()
  await expect(statement).toContainText(/XAF 30 a click, no cap/)
})
