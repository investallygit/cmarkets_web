import { expect, test, type Locator, type Page } from '@playwright/test'

// RFQ REP, the daily reporting to the BEAC (screen 24, ROADMAP step 47; CMarket.Api's phase 38), the
// Admin's: the demo's reports of the last twenty business days, made at 18:00 from the RFQ's demo
// agreements (DemoRfqReports): nil reports, the OTA's issue day, whose first send the mail server
// rejected and the Admin resent the next morning, then the day after.

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section', { has: page.getByRole('heading', { name: title, exact: true }) })

/** The account switch of the development tools reloads the app: wait for the new badge. */
async function switchAccount(page: Page, from: RegExp, account: string, badge: RegExp) {
  const topBar = page.getByRole('banner')
  await topBar.getByRole('button', { name: from }).click()
  await page.getByRole('menuitem', { name: account, exact: true }).click()
  await expect(topBar.getByRole('button', { name: badge })).toBeVisible()
}

async function openReporting(page: Page) {
  await page.goto('/cfg')
  await switchAccount(page, /analyst/i, 'Admin', /^admin$/i)
  await page
    .getByRole('navigation', { name: 'Main menu' })
    .getByRole('link', { name: /RFQ/ })
    .click()
  // The Admin's RFQ entry opens every agreement (ROADMAP step 46), the reporting beside it.
  await expect(page).toHaveURL(/\/admin\/rfq$/)
  await page
    .getByRole('navigation', { name: 'RFQ screens' })
    .getByRole('link', { name: /BEAC reporting/ })
    .click()
  await expect(page).toHaveURL(/\/admin\/rfq\/reports/)
}

/** The demo's resent day: this month's list, else the month before's (early in a month). */
async function resentRow(list: Locator): Promise<Locator> {
  const row = list.getByRole('row', { name: /Resent/ })
  await expect(list.getByRole('row').nth(1)).toBeVisible()
  if ((await row.count()) === 0) await list.getByRole('button', { name: 'Previous month' }).click()
  await expect(row).toHaveCount(1)
  return row
}

test('RFQ REP lists the reports by business day and shows one as it was sent, its files and its sends', async ({
  page,
}) => {
  await openReporting(page)
  // The Admin's RFQ screens: every agreement and the BEAC's reporting, not the trading.
  const tabs = page.getByRole('navigation', { name: 'RFQ screens' })
  await expect(tabs.getByRole('link', { name: /Agreements/ })).toBeVisible()
  await expect(tabs.getByRole('link', { name: /BEAC reporting/ })).toBeVisible()
  await expect(tabs.getByRole('link', { name: /Trading/ })).toHaveCount(0)
  const header = page.getByRole('region', { name: 'Automatic send' })
  await expect(header).toContainText('Automatic send every business day at 18:00')
  await expect(header).toContainText('to: marche-secondaire@beac.example')
  await expect(header).toContainText('copy: compliance@cmarket.example')

  const list = panel(page, 'Daily reports')
  await expect(list.getByRole('row', { name: /Nil report sent 18:00/ }).first()).toBeVisible()
  const resent = await resentRow(list)
  await expect(resent.getByRole('cell').nth(1)).toHaveText('3')
  await resent.getByRole('button').click()
  await expect(resent.getByRole('button')).toHaveAttribute('aria-pressed', 'true')

  const preview = panel(page, /^PDF summary preview · \d{2}\/\d{2}\/\d{4}$/)
  await expect(
    preview.getByRole('heading', {
      name: 'CMarket — Secondary market for BTA / OTA government securities',
    }),
  ).toBeVisible()
  await expect(preview.getByText('1 page')).toBeVisible()
  await expect(preview.getByRole('rowheader', { name: /^OTA CMR 3 yr \d{4}$/ })).toBeVisible()
  await expect(preview.getByRole('rowheader', { name: '1 to 3 years' })).toBeVisible()
  await expect(
    preview.getByText(/^SHA-256 fingerprint of the Excel file: [0-9a-f]{64}$/),
  ).toBeVisible()

  const send = panel(page, /^Send of \d{2}\/\d{2}\/\d{4}$/)
  await expect(send.getByText(/^CMarket · BTA\/OTA trades · \d{2}\/\d{2}\/\d{4}$/)).toBeVisible()
  await expect(send.getByText(/^CMarket_BEAC_synthese_\d{8}\.pdf$/)).toBeVisible()
  await expect(send.getByText(/^3 rows · 18 columns/)).toBeVisible()
  await expect(
    send.getByText("552 5.3.4 Message size exceeds the fixed limit of the recipient's server."),
  ).toBeVisible()
  await expect(send.getByText('L. Mvogo').first()).toBeVisible()

  const pdf = page.waitForEvent('download')
  await send.getByRole('button', { name: 'Download PDF' }).click()
  expect((await pdf).suggestedFilename()).toMatch(/^CMarket_BEAC_synthese_\d{8}\.pdf$/)
  const excel = page.waitForEvent('download')
  await send.getByRole('button', { name: 'Download Excel' }).click()
  expect((await excel).suggestedFilename()).toMatch(/^CMarket_BEAC_transactions_\d{8}\.xlsx$/)

  // Resend: the same files, to the recipients in force, logged with the Admin's name.
  const sends = send
    .getByRole('listitem')
    .filter({ hasText: /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}/ })
  const before = await sends.count()
  await send.getByRole('button', { name: 'Resend' }).click()
  const confirm = page.getByRole('dialog', { name: /^Send the report of .* again\?$/ })
  await confirm.getByRole('button', { name: 'Resend' }).click()
  await expect(
    page.getByText(/^The report of \d{2}\/\d{2}\/\d{4} went to the BEAC\.$/),
  ).toBeVisible()
  await expect(sends).toHaveCount(before + 1)
})

test('RFQ REP keeps its settings, checked, and the header shows them', async ({ page }) => {
  await openReporting(page)
  const header = page.getByRole('region', { name: 'Automatic send' })
  const send = panel(page, /^Send of /)

  await send.getByRole('button', { name: 'Edit settings' }).click()
  let dialog = page.getByRole('dialog', { name: 'BEAC daily report settings' })
  await dialog.getByRole('textbox', { name: 'Send time (Douala)' }).fill('18h')
  await dialog.getByRole('button', { name: 'Add a copy' }).click()
  await dialog.getByRole('textbox', { name: 'Copy 2' }).fill('COMPLIANCE@cmarket.example')
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(dialog.getByText('A time, HH:mm.')).toBeVisible()
  await expect(dialog.getByText("Each address once, the BEAC's in To.")).toBeVisible()
  await dialog.getByRole('textbox', { name: 'Send time (Douala)' }).fill('17:30')
  await dialog.getByRole('textbox', { name: 'Copy 2' }).fill('risk@cmarket.example')
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText("The report's settings are saved.")).toBeVisible()
  await expect(header).toContainText('Automatic send every business day at 17:30')
  await expect(header).toContainText('copy: compliance@cmarket.example, risk@cmarket.example')
  await expect(send.getByText('BEAC + 2 copies')).toBeVisible()

  // As the demo had them, for the next run.
  await send.getByRole('button', { name: 'Edit settings' }).click()
  dialog = page.getByRole('dialog', { name: 'BEAC daily report settings' })
  await dialog.getByRole('textbox', { name: 'Send time (Douala)' }).fill('18:00')
  await dialog.getByRole('button', { name: 'Remove copy 2' }).click()
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(header).toContainText('Automatic send every business day at 18:00')
  await expect(send.getByText('BEAC + 1 copy')).toBeVisible()
})
