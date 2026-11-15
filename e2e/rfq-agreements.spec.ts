import { expect, test, type Page } from '@playwright/test'

// RFQ AGR, the agreements (screen 23), ROADMAP step 46, on the demo's trading of the last three
// sessions (step 44) and its approvals (step 45): T. Bekale's Bank C party to ten of its eleven
// agreements, E. Fouda's Asset manager A to five, Bank E named by all; filtered, sorted, saved,
// exported; both SVTs' approvals and the e-mails by recipient; the ticket downloaded and sent
// again; one cancelled on both parties' letters.

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section', { has: page.getByRole('heading', { name: title }) })

/** The prototype's account switch reloads the app: wait for the new account's badge. */
async function switchAccount(page: Page, from: RegExp, account: string, badge: RegExp) {
  const topBar = page.getByRole('banner')
  await topBar.getByRole('button', { name: from }).click()
  await page.getByRole('menuitem', { name: account, exact: true }).click()
  await expect(topBar.getByRole('button', { name: badge })).toBeVisible()
}

// The panel's title (lane 1's request shows its agreements under an "Agreements" heading too).
const list = (page: Page) =>
  page.locator('section', {
    has: page.getByRole('heading', { name: /^Agreements · \d+ results/, level: 2 }),
  })
/** The demo's numbers carry the day of its sessions: the last three before today. */
const number = (sequence: string) => new RegExp(`ACC-\\d{6}-${sequence}`)
const rows = (page: Page) => list(page).getByRole('row').filter({ hasText: /ACC-/ })

async function openAgreements(page: Page) {
  const menu = page.getByRole('navigation', { name: 'Main menu' })
  await menu.getByRole('link', { name: /^RFQ/ }).click()
  await page
    .getByRole('navigation', { name: 'RFQ screens' })
    .getByRole('link', { name: /RFQ AGR\s*Agreements/ })
    .click()
  await expect(page).toHaveURL(/\/rfq\/agreements$/)
  // RFQ's entry stays lit under its tabs.
  await expect(menu.locator('a.border-accent-amber')).toHaveText([/^RFQ/])
}

test('the RFQ tabs open the agreements, a click shows one', async ({ page }) => {
  await page.goto('/mkt')
  await switchAccount(page, /analyst/i, 'Trader', /trader/i)
  await openAgreements(page)

  await expect(list(page)).toContainText(/\d+ results · XAF/)
  await rows(page).first().click()
  await expect(page).toHaveURL(/agreement=/)
  const detail = panel(page, /^Agreement ACC-/)
  await expect(detail).toContainText(/RFQ-\d{6}-\d{4} · agreement \d \/ \d/)
  await expect(detail).toContainText('Security · CRCT code')
})

// @fresh-db: the demo's agreements as seeded, which the last flow changes.
test(
  'a trader filters, sorts, loads a saved filter and exports; the CEO reads its organisation’s',
  { tag: '@fresh-db' },
  async ({ page }) => {
    await page.goto('/mkt')
    await switchAccount(page, /analyst/i, 'Trader', /trader/i)
    await openAgreements(page)
    await expect(list(page)).toContainText('10 results')
    await expect(rows(page).first()).toContainText(
      /ACC-0011.*BUY.*OTA CMR 3 yr 2029.*Asset manager A/,
    )

    // Concluded only: the filters go to the address.
    const filters = panel(page, 'Filters')
    await filters.getByRole('button', { name: 'Status', exact: true }).click()
    await filters.getByRole('checkbox', { name: 'Concluded' }).check({ force: true })
    await filters.getByRole('button', { name: 'Apply' }).click()
    await expect(page).toHaveURL(/status=concluded/)
    // Four of the sessions before, C. Abena's sale of the morning (approved by Bank E, step 45).
    await expect(list(page)).toContainText('5 results')
    await expect(rows(page)).toHaveCount(5)

    // Sorted by face amount, the address keeps it.
    await list(page).getByRole('columnheader', { name: 'Nominal' }).click()
    await expect(page).toHaveURL(/sort=-?faceAmount/)
    // The table's first order for numbers may be the largest first.
    const largestFirst = page.url().includes('sort=-faceAmount')
    await expect(rows(page).first()).toContainText(largestFirst ? 'ACC-0004' : 'ACC-0003')

    // B. Ngoma's anonymous sale, her name known at the agreement.
    await rows(page).filter({ hasText: 'ACC-0004' }).click()
    const detail = panel(page, number('0004'))
    await expect(detail).toContainText(/RFQ-\d{6}-0003 · agreement 1 \/ 2 · anonymous/)
    await expect(detail).toContainText('T. Bekale · Bank C')
    await expect(detail).toContainText('B. Ngoma · Pension fund G')
    await expect(detail.getByRole('button', { name: 'Cancel agreement (reason)' })).toBeVisible()

    // Reset, then the demo's saved filter.
    await filters.getByRole('button', { name: 'Reset' }).click()
    await expect(list(page)).toContainText('10 results')
    await filters
      .getByRole('combobox', { name: 'Saved filters' })
      .selectOption({ label: 'Concluded OTA' })
    await expect(page).toHaveURL(/status=concluded.*type=OTA|type=OTA.*status=concluded/)
    await expect(list(page)).toContainText('5 results')

    const download = page.waitForEvent('download')
    await list(page).getByRole('button', { name: /^csv$/i }).click()
    expect((await download).suggestedFilename()).toBe('cmarket-agreements.csv')

    // E. Fouda, C. Abena's CEO: Asset manager A's five, read only.
    await switchAccount(page, /trader/i, 'CEO', /ceo/i)
    await openAgreements(page)
    await expect(list(page)).toContainText('5 results')
    await rows(page).filter({ hasText: 'ACC-0001' }).click()
    await expect(panel(page, number('0001'))).toBeVisible()
    await expect(page.getByRole('button', { name: 'Download ticket PDF' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Resend ticket' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Cancel agreement (reason)' })).toHaveCount(0)
  },
)

test(
  'the SVT reads the agreements naming its bank from AGR, the Admin every one from RFQ',
  { tag: '@fresh-db' },
  async ({ page }) => {
    await page.goto('/mkt')
    await switchAccount(page, /analyst/i, 'SVT', /svt/i)
    const menu = page.getByRole('navigation', { name: 'Main menu' })
    await menu.getByRole('link', { name: /^AGR/ }).click()
    await expect(page).toHaveURL(/\/svt\/agreements$/)
    await expect(page.getByRole('navigation', { name: 'RFQ screens' })).toHaveCount(0)
    await expect(list(page)).toContainText('11 results')
    // From its client's side: C. Abena sold to Bank C through Bank E.
    await expect(rows(page).filter({ hasText: 'ACC-0001' })).toContainText(/SELL.*Bank C/)

    await switchAccount(page, /svt/i, 'Admin', /^admin$/i)
    await menu.getByRole('link', { name: /^RFQ/ }).click()
    await expect(page).toHaveURL(/\/admin\/rfq$/)
    await expect(list(page)).toContainText('11 results')
    await expect(list(page).getByRole('columnheader', { name: 'Buyer' })).toBeVisible()
    await expect(list(page).getByRole('columnheader', { name: 'Side' })).toHaveCount(0)
    await expect(panel(page, 'Filters').getByRole('combobox', { name: 'Role' })).toHaveCount(0)
  },
)

test(
  'the detail shows both approvals and the e-mails; a trader downloads the ticket and sends it again',
  { tag: '@fresh-db' },
  async ({ page }) => {
    await page.goto('/mkt')
    await switchAccount(page, /analyst/i, 'Trader', /trader/i)
    await openAgreements(page)
    await rows(page).filter({ hasText: 'ACC-0001' }).click()
    const detail = panel(page, number('0001'))

    // C. Abena's sale to T. Bekale: each SVT approved its leg; the ticket bounced at Bank E's back
    // office and was sent again (the demo's).
    const approvals = detail.getByRole('region', { name: 'SVT approvals', exact: true })
    await expect(approvals.getByRole('listitem')).toHaveText([
      /^Bank D \(buyer's SVT\)\s*Approved \d\d\/\d\d \d\d:\d\d · A\. Okala$/,
      /^Bank E \(seller's SVT\)\s*Approved \d\d\/\d\d \d\d:\d\d · B\. Sima$/,
    ])
    const emails = detail.getByRole('region', { name: 'E-mails', exact: true })
    const backOffice = emails.getByRole('listitem').filter({ hasText: /^Seller's SVT back office/ })
    await expect(backOffice).toContainText(/Ticket\s*Failed .*Ticket\s*Resent /)
    await expect(detail).toContainText('E-mail resent')

    // The ticket, made at this first download and kept: its fingerprint shows.
    const ticket = detail.getByRole('region', { name: 'Ticket', exact: true })
    await expect(ticket).toContainText('Made at its first download')
    const download = page.waitForEvent('download')
    await ticket.getByRole('button', { name: 'Download ticket PDF' }).click()
    expect((await download).suggestedFilename()).toMatch(/^ACC-\d{6}-0001\.pdf$/)
    await expect(ticket).toContainText(/SHA-256 fingerprint\s*[0-9a-f]{64}/)

    // Sent again to the four, each send logged.
    await ticket.getByRole('button', { name: 'Resend ticket' }).click()
    const dialog = page.getByRole('dialog', { name: number('0001') })
    await expect(dialog.getByRole('combobox', { name: 'Send to' })).toHaveValue('all')
    await dialog.getByRole('button', { name: 'Send', exact: true }).click()
    await expect(page.getByText(/Ticket ACC-\d{6}-0001 sent again to 4 recipients\./)).toBeVisible()
    await expect(dialog).toHaveCount(0)
    await expect(
      emails.getByRole('listitem').filter({ hasText: /^Requesting trader · C\. Abena/ }),
    ).toContainText(/Ticket\s*Sent .*Ticket\s*Resent /)
  },
)

test(
  'a trader cancels a concluded agreement on both parties’ letters',
  { tag: '@fresh-db' },
  async ({ page }) => {
    await page.goto('/mkt')
    await switchAccount(page, /analyst/i, 'Trader', /trader/i)
    await openAgreements(page)
    await rows(page).filter({ hasText: 'ACC-0004' }).click()
    const detail = panel(page, number('0004'))
    await detail.getByRole('button', { name: 'Cancel agreement (reason)' }).click()

    const dialog = page.getByRole('dialog', { name: number('0004') })
    // Nothing goes without the reason and both letters.
    await dialog.getByRole('button', { name: 'Cancel the agreement' }).click()
    await expect(dialog).toContainText('Enter the reason for the cancellation.')
    await dialog.getByRole('textbox', { name: 'Reason' }).fill('Crossed settlement instructions')
    const letter = (name: string) => ({
      name,
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.7\n1 0 obj <<>> endobj\n%%EOF\n'),
    })
    const files = dialog.locator('input[type=file]')
    await files.nth(0).setInputFiles(letter('pension-fund-g.pdf'))
    await files.nth(1).setInputFiles(letter('bank-c.pdf'))
    await dialog.getByRole('button', { name: 'Cancel the agreement' }).click()

    await expect(page.getByText(/Agreement ACC-\d{6}-0004 cancelled\./)).toBeVisible()
    await expect(dialog).toHaveCount(0)
    await expect(detail).toContainText(/Cancelled \d\d\/\d\d \d\d:\d\d/)
    await expect(detail).toContainText('Crossed settlement instructions')
    await expect(detail).toContainText("Requester's: pension-fund-g.pdf")
    await expect(detail.getByRole('button', { name: 'Cancel agreement (reason)' })).toHaveCount(0)
    await expect(rows(page).filter({ hasText: 'ACC-0004' })).toContainText('Cancelled')
  },
)
