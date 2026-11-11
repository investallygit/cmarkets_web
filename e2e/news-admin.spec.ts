import { expect, test, type Page } from '@playwright/test'

// The news administration, ROADMAP step 27: NEWS moderates and names the publishers (Data admin),
// MOD moderates (Admin), SRC keeps the newspapers, CMarket AI and the ingestion clients (Admin), a
// newspaper reviewed before publication sends its items for review, and a reader reports an item.
// The demo's queue: BRENT (two reports) and the BTA auction (one) reported, Daily Z's Kribi story
// (0.58 sure) and Douala Éco's bond article waiting.

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section', { has: page.getByRole('heading', { name: title, exact: true }) })

/** A PNG of one pixel: a newspaper's logo. */
const LOGO = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

/** The prototype's account switch reloads the app: wait for the new account's badge in the top bar. */
async function switchAccount(page: Page, from: RegExp, account: string, badge: RegExp) {
  const topBar = page.getByRole('banner')
  await topBar.getByRole('button', { name: from }).click()
  await page.getByRole('menuitem', { name: account, exact: true }).click()
  await expect(topBar.getByRole('button', { name: badge })).toBeVisible()
}

async function as(page: Page, account: 'Data admin' | 'Admin' | 'News provider', badge: RegExp) {
  await page.goto('/cfg')
  await switchAccount(page, /analyst/i, account, badge)
}

/** The Media I's review mode on SRC, as the Admin. */
async function setMediaIReview(page: Page, mode: 'After publication' | 'Before publication') {
  await page.goto('/admin/sources?channel=partner')
  await panel(page, 'Newspapers')
    .getByRole('row', { name: /Media I/ })
    .click()
  const source = panel(page, 'Newspaper')
  await source.getByRole('radio', { name: mode }).check({ force: true })
  await source.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Media I saved.')).toBeVisible()
}

test('NEWS lists the items reported then those waiting, approves one, and names a publisher', async ({
  page,
}) => {
  await as(page, 'Data admin', /data admin/i)
  await page.goto('/data/content')
  await page.getByRole('tab', { name: /^Moderation \(\d+\)$/ }).click()
  await expect(page).toHaveURL(/tab=moderation/)

  const queue = panel(page, 'News to moderate')
  await expect(queue.getByRole('button', { name: /Brent crude above \$90/ })).toContainText(
    '2 reports',
  )
  const kribi = queue.getByRole('button', { name: /Kribi port: container traffic up 12%/ })
  await expect(kribi).toContainText('CMarket AI is less sure than the threshold')
  await expect(kribi).toContainText('Confidence 0.58')

  // The item waiting, as readers will see it once approved, then approved.
  await kribi.click()
  const reader = panel(page, 'News item')
  await expect(reader).toContainText('In review')
  await expect(
    reader.getByRole('heading', {
      name: 'Kribi port: container traffic up 12% in the third quarter',
    }),
  ).toBeVisible()
  await expect(reader).toContainText('A story of the feeds')
  await reader.getByRole('button', { name: 'Approve' }).click()
  const dialog = page.getByRole('dialog', { name: 'Approve this item?' })
  await dialog.getByRole('button', { name: 'Approve' }).click()
  await expect(page.getByText('Approved: the item is live.')).toBeVisible()
  await expect(reader).toContainText('Published')
  await expect(queue.getByRole('button', { name: /Kribi port/ })).toHaveCount(0)

  // The publishers' domains: a new one, its tag the name in capitals.
  await page.getByRole('tab', { name: 'Publishers' }).click()
  const publishers = panel(page, 'Publishers')
  await expect(publishers.getByRole('row', { name: /agency-x\.example/ })).toContainText('AGENCY X')
  const form = panel(page, 'Name a domain')
  await form.getByLabel('Domain').fill('https://www.ft.com/markets')
  await form.getByLabel('Name', { exact: true }).fill('Financial Times')
  await form.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Saved: the newspapers of ft.com take its names.')).toBeVisible()
  await expect(publishers.getByRole('row', { name: /ft\.com/ })).toContainText('FINANCIAL TIMES')
})

test('MOD keeps a reported item and takes down a newspaper item that waited', async ({ page }) => {
  await as(page, 'Admin', /^admin$/i)
  await page.goto('/admin/moderation')
  const queue = panel(page, 'News to moderate')

  // BRENT's two reports, the newest first; kept, it stays online and leaves the queue.
  await queue.getByRole('button', { name: /Brent crude above \$90/ }).click()
  await expect(page).toHaveURL(/news=/)
  const reader = panel(page, 'News item')
  await expect(reader.getByRole('heading', { name: 'Reports' })).toBeVisible()
  await expect(reader).toContainText('P. Owona')
  await expect(reader).toContainText('Brent closed at $89.40')
  await reader.getByRole('button', { name: 'Keep' }).click()
  await page
    .getByRole('dialog', { name: 'Keep this item?' })
    .getByRole('button', { name: 'Keep' })
    .click()
  await expect(page.getByText('Kept: its reports are closed.')).toBeVisible()
  await expect(queue.getByRole('button', { name: /Brent crude/ })).toHaveCount(0)

  // Douala Éco's article waits: its newspaper is reviewed before publication. Taken down with a reason.
  await queue.getByRole('tab', { name: /^Waiting/ }).click()
  await queue
    .getByRole('button', { name: /Douala prépare son premier emprunt obligataire/ })
    .click()
  await expect(reader).toContainText('Its newspaper is reviewed before publication')
  await reader.getByRole('button', { name: 'Take down' }).click()
  const dialog = page.getByRole('dialog', { name: 'Take this item down?' })
  await dialog.getByLabel('Reason').fill('The council has not voted the issue yet.')
  await dialog.getByRole('button', { name: 'Take down' }).click()
  await expect(page.getByText('Taken down: the item left the feed.')).toBeVisible()
  await expect(reader).toContainText(/Withdrawn on .*: The council has not voted the issue yet\./)
})

test('SRC keeps a newspaper’s contract and logo, CMarket AI and its clients', async ({ page }) => {
  await as(page, 'Admin', /^admin$/i)
  const menu = page.getByRole('navigation', { name: 'Main menu' })
  await menu.getByRole('link', { name: /^SRC/ }).click()
  await expect(page).toHaveURL(/\/admin\/sources/)

  const sources = panel(page, 'Newspapers')
  await expect(sources.getByRole('row', { name: /Douala Éco/ })).toContainText('Before publication')
  await sources.getByRole('row', { name: /Daily K/ }).click()
  const source = panel(page, 'Newspaper')
  // The contract of the screen 18 mockup (ROADMAP step 28): XAF 15 a click.
  await expect(source.getByLabel('Rate per unique click (XAF)')).toHaveValue('15.00')
  await source.getByLabel('FLASH items a day').fill('25')
  await source.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Daily K saved.')).toBeVisible()
  await expect(sources.getByRole('row', { name: /Daily K/ })).toContainText('25')

  // Its logo, shown on the card of its tag.
  const chooser = page.waitForEvent('filechooser')
  await source.getByRole('button', { name: 'Upload a logo' }).click()
  await (await chooser).setFiles({ name: 'daily-k.png', mimeType: 'image/png', buffer: LOGO })
  await expect(page.getByText('Logo saved.')).toBeVisible()
  await expect(source.getByRole('img', { name: 'Logo of Daily K' })).toBeVisible()

  // CMarket AI: a higher threshold.
  const settings = panel(page, 'CMarket AI and clicks')
  await expect(settings.getByLabel('Confidence threshold')).toHaveValue('0.70')
  await settings.getByLabel('Confidence threshold').fill('0.75')
  await settings.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Settings saved.')).toBeVisible()

  // A new ingestion client: its secret shows once, then it is revoked.
  const clients = panel(page, 'Ingestion clients')
  await expect(clients).toContainText('cmk_demoaicmarket2026news')
  await clients.getByRole('button', { name: 'Client' }).click()
  const create = page.getByRole('dialog', { name: 'A new ingestion client' })
  await create.getByLabel('Name').fill('CMarket AI · e2e')
  await create.getByLabel('Allowed addresses').fill('203.0.113.7\n10.0.0.0/8')
  await create.getByRole('button', { name: 'Create' }).click()
  const created = page.getByRole('dialog', { name: 'CMarket AI · e2e created' })
  await expect(created.getByRole('textbox', { name: 'Signing secret' })).not.toHaveValue('')
  await created.getByRole('button', { name: 'Done' }).click()
  // Kept as CIDR ranges, in order.
  await expect(clients).toContainText('10.0.0.0/8, 203.0.113.7/32')
  await clients.getByRole('button', { name: 'Revoke · CMarket AI · e2e' }).click()
  await page
    .getByRole('dialog', { name: 'Revoke CMarket AI · e2e?' })
    .getByRole('button', { name: 'Revoke' })
    .click()
  await expect(page.getByText('CMarket AI · e2e revoked.')).toBeVisible()
})

test('a newspaper reviewed before publication sends its FLASH for review', async ({ page }) => {
  await as(page, 'Admin', /^admin$/i)
  await setMediaIReview(page, 'Before publication')

  try {
    await switchAccount(page, /^admin$/i, 'News provider', /news provider/i)
    await page.goto('/n/new')
    await panel(page, 'My news').getByRole('button', { name: '+ New' }).click()
    const dialog = page.getByRole('dialog', { name: 'A new item' })
    await dialog.getByRole('radio', { name: 'Flash' }).check({ force: true })
    await dialog.getByRole('button', { name: 'Write it' }).click()
    const headline = `SEMC: board approves the accounts (${Date.now()})`
    const editor = panel(page, 'Editor')
    // The new draft is open, not the BEAC draft the studio showed first.
    await expect(editor.getByLabel('Headline (150 characters max.)')).toHaveValue('')
    await editor.getByLabel('Headline (150 characters max.)').fill(headline)
    await editor
      .getByLabel('Text of the FLASH (500 characters max.)')
      .fill('SEMC’s board approved the half-year accounts on Friday.')
    const publishing = panel(page, 'Publishing')
    await publishing.getByLabel('Category').selectOption({ label: 'Issuers' })
    await publishing.getByRole('checkbox', { name: 'Cameroon' }).check({ force: true })
    await editor
      .getByRole('checkbox', { name: 'I certify I hold the rights to this text and its images' })
      .check({ force: true })
    await expect(publishing).toContainText("CMarket reviews Media I's items before they go live.")
    await publishing.getByRole('button', { name: 'Send for review' }).click()
    await expect(
      page.getByText('Sent for review: CMarket publishes it once approved.'),
    ).toBeVisible()
    await expect(panel(page, 'My news').getByRole('button', { name: headline })).toContainText(
      'In review',
    )
    await expect(publishing).toContainText(/Waiting for CMarket's review since/)
  } finally {
    await page.goto('/cfg')
    await switchAccount(page, /news provider/i, 'Admin', /^admin$/i)
    await setMediaIReview(page, 'After publication')
  }
})

test('a reader reports an item of N to the moderators', async ({ page }) => {
  await page.goto('/n')
  const news = panel(page, 'News')
  await news.getByRole('link', { name: /TotalEnergies raises its quarterly dividend/ }).click()
  const article = panel(page, 'Article')
  await article.getByRole('button', { name: 'Report' }).click()
  const dialog = page.getByRole('dialog', { name: 'Report this item' })
  await dialog.getByLabel('Reason').selectOption({ label: 'Misleading or false information' })
  await dialog.getByLabel('Comment').fill('The rate decision was a cut, not a hold.')
  await dialog.getByRole('button', { name: 'Send the report' }).click()
  await expect(page.getByText('Report sent to the moderators.')).toBeVisible()
})
