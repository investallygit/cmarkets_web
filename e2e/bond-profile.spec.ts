import { expect, test, type Page } from '@playwright/test'

// The bond profile of ROADMAP step 31 (spec screen 20, DES on a bond): DES opens the profile of
// the security's type; ECMR as the mockup, its history, figures, ratings, terms and payments,
// BP inside the profile; the CF and RAT tabs; COMPANY X, callable and thinly traded.

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section', { has: page.getByRole('heading', { name: title }) })

async function command(page: Page, text: string) {
  await page.getByRole('combobox', { name: 'Command bar' }).fill(text)
  await page.keyboard.press('Enter')
}

test('ECMR DES opens the bond profile of the mockup, and its BP tab the pricing', async ({
  page,
}) => {
  await page.goto('/mkt')
  await command(page, 'ECMR 6.25 2029 DES')
  await expect(page).toHaveURL(/\/securities\/ECMR-6\.25-2029\/des$/)
  await expect(page).toHaveTitle(/ — Bond profile · CMarket$/)
  // Under YCRV in the menu, as the mockup lights it.
  await expect(
    page.getByRole('navigation', { name: 'Main menu' }).getByRole('link', { name: /^YCRV/ }),
  ).toHaveClass(/border-accent-amber/)

  const header = page.getByRole('region', { name: 'ECMR 6.25% 29' })
  await expect(header).toContainText('Republic of Cameroon · CM0000020010')
  await expect(header).toContainText(
    'Sovereign bond · BVMAC · XAF · Annual fixed coupon · Amortizing · Senior unsecured',
  )
  await expect(header).toContainText(/Maturity\s*04\/11\/2029/)

  // Screen 20's tabs, then the news and the research.
  const tabs = page.getByRole('navigation', { name: 'Security functions' })
  for (const name of [
    'GP Price and yield',
    'BP Pricing',
    'CF Schedule',
    'RAT Ratings',
    'ANA Research',
  ]) {
    await expect(tabs.getByRole('link', { name })).toBeVisible()
  }
  await expect(tabs.getByRole('link', { name: 'FA Fundamentals' })).toHaveCount(0)

  // The figures of the daily calculation; ECMR is not rated.
  const analytics = panel(page, "Today's analytics")
  await expect(analytics).toContainText(/Computed \d{2}\/\d{2}\/\d{4}/)
  await expect(analytics).toContainText(/Convexity · DV01 \(XAF 100 M\)\s*[\d.]+ · XAF [\d,]+/)
  await expect(analytics).toContainText(/Price source\s*BVMAC quote of \d{2}\/\d{2}\/\d{4}/)
  const ratings = panel(page, /^Ratings$/)
  await expect(ratings).toContainText(/S&P\s*NR\s*—/)
  await expect(ratings).toContainText(/Credit bucket\s*Not rated/)

  // ECMR repays a fifth of its face each November.
  await expect(panel(page, 'Characteristics')).toContainText(
    /Redemption\s*Amortizing, in equal parts\s*Early redemption\s*None/,
  )
  const flows = panel(page, 'Upcoming cash flows')
  await expect(flows.getByRole('row', { name: /04\/11\/2029/ })).toContainText(
    /1\.2500\s*20\.0000\s*21\.2500/,
  )
  await expect(flows).toContainText(/Next coupon in \d+ days?\./)
  await expect(panel(page, 'Documents and news')).toContainText(
    'Information note — Republic of Cameroon 6.25% 2025-2029',
  )

  // The history: the clean price and the YTM, then the yields over six months.
  const history = panel(page, 'Price and yield history')
  await expect(history.getByRole('figure')).toHaveAttribute(
    'aria-label',
    /^Clean price \(left axis\) from \d{2}\/\d{2}\/\d{4}/,
  )
  await history.getByRole('tab', { name: 'Yield' }).click()
  await history.getByRole('tab', { name: '6M' }).click()
  await expect(history.getByRole('tab', { name: '[6M]' })).toHaveAttribute('aria-selected', 'true')
  await expect(history.getByRole('figure')).toHaveAttribute('aria-label', /^YTM from/)

  // "Open in bond pricing (BP)": screen 16's panels inside the profile, on the bond.
  await flows.getByRole('link', { name: 'Open in bond pricing (BP)' }).click()
  await expect(page).toHaveURL(/\/securities\/ECMR-6\.25-2029\/bp$/)
  await expect(panel(page, 'Inputs').getByRole('combobox', { name: 'Bond' })).toHaveValue(
    'ECMR-6.25-2029',
  )
  await expect(panel(page, 'Results').getByRole('region', { name: 'A. Pricing' })).toContainText(
    'Dirty price',
  )
})

test('CF lists the whole schedule, RAT the ratings given; COMPANY X is callable and thinly traded', async ({
  page,
}) => {
  await page.goto('/mkt')
  await command(page, 'ECMR 6.25 2029 CF')
  await expect(page).toHaveURL(/\/securities\/ECMR-6\.25-2029\/cf$/)
  await expect(
    panel(page, 'Cash flow schedule').getByRole('row', { name: /04\/11\/2025/ }),
  ).toContainText(/6\.2500\s*20\.0000\s*26\.2500\s*80\.0000/)

  // Gabon, downgraded from B to B- by S&P.
  await page.goto('/securities/GAB-6.50-2028/rat')
  const ratings = panel(page, /^Ratings$/)
  await expect(ratings).toContainText('Composite: B-')
  await expect(ratings).toContainText(/S&P\s*B-\s*26\/09\/2025/)
  const given = panel(page, 'Rating history')
  await expect(given.getByRole('row', { name: /26\/09\/2025/ })).toContainText(
    /S&P\s*B-\s*B\s*Downgrade/,
  )
  await expect(given.getByRole('row', { name: /12\/04\/2024/ })).toContainText(/S&P\s*B\s*—\s*New/)

  // COMPANY X: callable at 101, its model prices drawn lighter.
  await page.goto('/securities/COMPANY-X-7.00-2028/des')
  const terms = panel(page, 'Characteristics')
  await expect(terms).toContainText(/Category · sector\s*Corporate · Industrials/)
  await expect(terms).toContainText(/Early redemption\s*Callable on 30\/06\/2027 at 101\.00/)
  const history = panel(page, 'Price and yield history')
  await expect(history).toContainText('Lighter: model price')
  await expect(history.getByRole('figure')).toHaveAttribute(
    'aria-label',
    /\d+ sessions with trades, \d+ at a model price\.$/,
  )
  // An equity's tab is not a bond's.
  await page.goto('/securities/COMPANY-X-7.00-2028/dvd')
  await expect(page.getByText('DVD does not apply to COMPANY X 7.00% 2028.')).toBeVisible()
})
