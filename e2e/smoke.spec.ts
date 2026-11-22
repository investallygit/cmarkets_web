import { expect, test } from '@playwright/test'
import { demoId } from './demoIds.js'

test('the market dashboard loads its panels and real-time data', async ({ page }) => {
  // /app opens the home screen of the account type.
  await page.goto('/app')
  await expect(page).toHaveURL(/\/mkt$/)
  for (const title of ['Indices', 'Top movers', 'Rates and FX', 'News', 'Session summary']) {
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
  }
  await expect(page.getByText('Real-time connected')).toBeVisible()
  // The hub sends IndexUpdated to the screens that follow the index: the panel follows its own.
  // Once the panels' first reads are over (the summary is read again every minute only), only
  // the hub moves the value. BVMAC trades at a fixing, once a session (ROADMAP decision 38): the
  // development tool publishes one now.
  const indices = page.locator('section', {
    has: page.getByRole('heading', { name: 'Indices', exact: true }),
  })
  const first = indices.getByRole('row').nth(1)
  await page.waitForLoadState('networkidle')
  const before = (await first.textContent()) ?? ''
  await page.evaluate(() => fetch('/api/v1/_prototype/market/fixing', { method: 'POST' }))
  await expect(first).not.toHaveText(before, { timeout: 15_000 })
})

test('the command bar opens a security profile', async ({ page }) => {
  await page.goto('/mkt')
  await expect(page.getByRole('heading', { name: 'Indices' })).toBeVisible()
  await page.keyboard.press('Control+K')
  await page.keyboard.type('SEMC DES')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/securities\/SEMC\/des$/)
  await expect(page.getByRole('heading', { name: 'Closing price (fixing)' })).toBeVisible()
})

test('the command bar says an unknown function and a code the account may not run', async ({
  page,
}) => {
  await page.goto('/mkt')
  const bar = page.getByRole('combobox', { name: 'Command bar' })
  // A security's code, then a word that is no code: said, nothing opened (B40).
  await bar.fill('SEMC XYZ')
  await bar.press('Enter')
  await expect(page.getByRole('listbox')).toContainText('Unknown function code XYZ')
  await expect(page).toHaveURL(/\/mkt$/)
  // The functions offered after an equity are an equity's: no ETF holdings (B40).
  await bar.fill('SEMC H')
  await expect(page.getByRole('option', { name: /SEMC HDS/ })).toBeVisible()
  await expect(page.getByRole('option', { name: /SEMC HLD/ })).toHaveCount(0)
  await bar.press('Escape')

  // The Student has no NEWS NEW, the News provider's studio: it is said, not searched as a name
  // (B39).
  await page.getByRole('button', { name: /analyst/i }).click()
  await page.getByRole('menuitemradio', { name: 'Student' }).click()
  await expect(page.getByRole('button', { name: /student/i })).toBeVisible()
  await bar.fill('NEWS NEW')
  await bar.press('Enter')
  await expect(page.getByRole('listbox')).toContainText('NEWS NEW is not part of your account')
})

test('the security profile follows the mockup and opens a document', async ({ page }) => {
  await page.goto('/securities/SEMC/des')
  for (const title of [
    'Closing price (fixing)',
    'Description',
    'Prices of recent sessions',
    'Key data',
    'Dividends',
    'Documents and news',
  ]) {
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
  }
  await page.getByRole('link', { name: /2025 annual report/ }).click()
  await expect(page).toHaveURL(
    new RegExp(`/securities/SEMC/doc\\?doc=${demoId('doc-semc-annual-2025')}$`),
  )
  await expect(page.locator('iframe[title="2025 annual report"]')).toBeAttached()
})

test('a bond opens the bond profile, its characteristics and payments to come', async ({
  page,
}) => {
  await page.goto('/securities/ECMR-6.25-2029/des')
  await expect(page.getByRole('heading', { name: 'Characteristics' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Upcoming cash flows' })).toBeVisible()
  const tabs = page.getByRole('navigation', { name: 'Security functions' })
  await expect(tabs.getByRole('link', { name: 'GP Price and yield' })).toBeVisible()
  await expect(tabs.getByRole('link', { name: 'FA Fundamentals' })).toHaveCount(0)
})

test('the client menu gives ETFS, BP, BS, CMDTY, ECO, FX and OPT entries of their own, after the ones they light', async ({
  page,
}) => {
  await page.goto('/mkt')
  const menu = page.getByRole('navigation', { name: 'Main menu' })
  // The mockups light EQS on ETFS, YCRV on BP and BS, MKT on CMDTY, ECO and FX, PORT on OPT: their
  // entries come after those.
  await expect(menu.getByRole('link')).toHaveText([
    /^MKT/,
    /^CMDTY/,
    /^ECO/,
    /^FX/,
    /^EQS/,
    /^ETFS/,
    /^YCRV/,
    /^BP/,
    /^BS/,
    /^PORT/,
    /^OPT/,
    /^PUB/,
    /^NET/,
    /^MSG/,
    /^N\s*News/,
    /^ALRT/,
    /^CFG/,
  ])
  for (const [code, address] of [
    ['ETFS', /\/etfs$/],
    ['BP', /\/bp$/],
    ['BS', /\/bs$/],
    ['OPT', /\/opt$/],
  ] as const) {
    await menu.getByRole('link', { name: new RegExp(`^${code}`) }).click()
    await expect(page).toHaveURL(address)
    // Its entry alone is lit.
    await expect(menu.locator('a.border-accent-amber')).toHaveText([new RegExp(`^${code}`)])
  }
})

test('the back-office menu replaces the client menu for a Data admin', async ({ page }) => {
  await page.goto('/mkt')
  await page.getByRole('button', { name: /analyst/i }).click()
  await page.getByRole('menuitemradio', { name: 'Data admin' }).click()
  // IMP opens the upload waiting in its preview.
  await expect(page).toHaveURL(/\/imp(\?import=|$)/)
  await expect(page.getByText('Back-office', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: /IMP/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /MKT/ })).toHaveCount(0)
})
