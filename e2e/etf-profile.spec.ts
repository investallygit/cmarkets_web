import { expect, test, type Page } from '@playwright/test'

// The ETF profile of ROADMAP step 33 (spec screen 19), DES on an ETF: IWDA's header, price and NAV
// history, performance against its index, risk, top 10 holdings, allocation, structure and costs,
// as the mockup; HLD with every line known (a fund of funds' lines open the profiles of the ETFs it
// holds), PERF with the total return against the index and the calendar years, DIST with VUSA's
// quarterly distributions; the command bar's HLD, PERF and DIST.

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section', { has: page.getByRole('heading', { name: title }) })

const figure = (page: Page, label: string) =>
  page
    .getByRole('region', { name: 'IWDA' })
    .locator('div', { has: page.getByText(label, { exact: true }) })
    .getByRole('definition')

test('DES on IWDA shows the mockup’s header, history, performance, risk, holdings, allocation and structure', async ({
  page,
}) => {
  await page.goto('/mkt')
  await page.getByRole('combobox', { name: 'Command bar' }).fill('IWDA DES')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/securities\/IWDA\.LSE\/des$/)
  // Under EQS in the menu, as ETFS.
  await expect(
    page.getByRole('navigation', { name: 'Main menu' }).getByRole('link', { name: /^EQS/ }),
  ).toHaveClass(/border-accent-amber/)

  const header = page.getByRole('region', { name: 'IWDA' })
  await expect(header.getByRole('img', { name: 'Domiciled in Ireland' })).toBeVisible()
  await expect(header.getByRole('heading', { level: 1 })).toHaveText('IWDA')
  await expect(header).toContainText('iShares Core MSCI World UCITS ETF')
  await expect(header).toContainText(
    'ETF · Equity · Global · BlackRock (iShares) · LSE · USD · UCITS · Accumulating',
  )
  await expect(header).toContainText('$121.80')
  await expect(figure(page, 'NAV')).toHaveText('$121.75')
  await expect(figure(page, 'Prem./disc.')).toHaveText('+0.04%')
  await expect(figure(page, 'TER')).toHaveText('0.20%')
  await expect(figure(page, 'AUM')).toHaveText('$98.4 bn')
  await expect(figure(page, '30-d avg vol.')).toHaveText('1.4 M')
  await expect(figure(page, 'YTD')).toHaveText('+10.4%')
  await expect(figure(page, 'Vol. 1Y')).toHaveText('11.9%')
  const tabs = page.getByRole('navigation', { name: 'Security functions' })
  for (const tab of ['DES', 'GP', 'HLD', 'PERF', 'DIST', 'DOC', 'N', 'ANA'])
    await expect(tabs.getByRole('link', { name: new RegExp(`^${tab}\\b`) })).toBeVisible()

  // The price over its area and the NAV, a year by default.
  const history = panel(page, 'Price history')
  await expect(history.getByRole('tab', { name: '[1Y]' })).toHaveAttribute('aria-selected', 'true')
  await expect(history.getByRole('figure')).toHaveAccessibleName(
    /^Price from .* to .*: .* \(USD\)$/,
  )
  await history.getByRole('button', { name: '[NAV]' }).click()
  await expect(history.getByRole('button', { name: 'NAV', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  // The price cannot go too: one line stays.
  await expect(history.getByRole('button', { name: '[PRICE]' })).toBeDisabled()

  const performance = panel(page, 'Performance')
  await expect(performance.getByRole('columnheader', { name: 'MSCI World index' })).toBeVisible()
  const row = (period: string) => performance.getByRole('row', { name: new RegExp(`^${period}`) })
  await expect(row('1 month')).toContainText(/\+1\.8%\s*\+1\.8%/)
  await expect(row('3 months')).toContainText(/\+4\.9%\s*\+5\.0%\s*-0\.1/)
  await expect(row('YTD')).toContainText(/\+10\.4%\s*\+10\.5%\s*-0\.1/)
  await expect(row('1Y')).toContainText(/\+21\.8%\s*\+22\.0%\s*-0\.2/)
  await expect(row('3 years \\(p\\.a\\.\\)')).toContainText(/\+9\.6%\s*\+9\.7%\s*-0\.1/)
  await expect(row('5 years \\(p\\.a\\.\\)')).toContainText(/\+12\.1%\s*\+12\.2%\s*-0\.1/)

  await expect(panel(page, 'Risk')).toContainText(
    /Volatility 1Y · 3Y\s*11\.9% · 15\.2%\s*Sharpe 1Y\s*\d\.\d{2}\s*Max drawdown 1Y\s*-8\.4%\s*Tracking error · difference\s*0\.12% · -0\.15%\s*Average bid-ask spread\s*0\.05% \(5 bp\)/,
  )

  const holdings = panel(page, 'Top 10 holdings')
  await expect(holdings).toContainText('1,523 holdings')
  const lines = holdings.getByRole('row')
  await expect(lines).toHaveCount(11)
  await expect(lines.nth(1)).toContainText(/Apple\s*4\.9%/)
  await expect(lines.nth(10)).toContainText(/JPMorgan Chase\s*1\.0%/)

  const allocation = panel(page, 'Allocation')
  await expect(allocation.getByRole('listitem')).toHaveText([
    /Technology\s*26\.1%/,
    /Financials\s*15\.8%/,
    /Industrials\s*10\.9%/,
    /Health care\s*10\.2%/,
    /Consumer discr\.\s*10\.0%/,
    /Communication\s*8\.1%/,
    /Other\s*18\.9%/,
  ])
  await allocation.getByRole('tab', { name: 'Region' }).click()
  await expect(allocation.getByRole('listitem').first()).toHaveText(/North America\s*73\.9%/)

  await expect(panel(page, 'Structure and costs')).toContainText(
    /Replication\s*Physical \(sampled\)\s*Dividends\s*Accumulating · no distribution\s*Domicile · status\s*Ireland · UCITS\s*Fund currency · hedging\s*USD · unhedged\s*Benchmark index\s*MSCI World\s*Inception date\s*25\/09\/2009\s*Issuer\s*BlackRock \(iShares\)\s*TER\s*0\.20% p\.a\.\s*ISIN\s*IE00B4L5Y983/,
  )
})

test('HLD lists every line known; a fund of funds’ lines open the ETFs it holds', async ({
  page,
}) => {
  await page.goto('/mkt')
  await page.getByRole('combobox', { name: 'Command bar' }).fill('IWDA HLD')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/securities\/IWDA\.LSE\/hld$/)
  const holdings = panel(page, /^Holdings$/)
  await expect(holdings.getByRole('row')).toHaveCount(26)
  await expect(holdings.getByRole('row', { name: /Apple/ })).toContainText(
    /1\s*Apple\s*Technology\s*United States\s*4\.9%/,
  )
  await expect(holdings).toContainText(/1,498 other holdings: 67\.3%/)
  await expect(holdings).toContainText(/As of \d{2}\/\d{2}\/\d{4} · EODHD/)
  await expect(panel(page, 'Allocation by sector').getByRole('listitem').first()).toHaveText(
    /Technology\s*26\.1%/,
  )
  await expect(panel(page, 'Allocation by region').getByRole('listitem').first()).toHaveText(
    /North America\s*73\.9%/,
  )

  // VNGA60 holds VUSA: its line opens VUSA's profile.
  await page.goto('/securities/VNGA60.XETRA/hld')
  await panel(page, /^Holdings$/)
    .getByRole('link', { name: 'Vanguard S&P 500 UCITS ETF' })
    .click()
  await expect(page).toHaveURL(/\/securities\/VUSA\.LSE\/des$/)
  await expect(page.getByRole('heading', { level: 1, name: 'VUSA' })).toBeVisible()
})

test('PERF compares the total return with the index, every period, the calendar years and the risk', async ({
  page,
}) => {
  await page.goto('/mkt')
  await page.getByRole('combobox', { name: 'Command bar' }).fill('IWDA PERF')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/securities\/IWDA\.LSE\/perf$/)

  const growth = panel(page, 'Total return and index')
  await expect(growth.getByRole('tab', { name: '[3Y]' })).toHaveAttribute('aria-selected', 'true')
  await expect(growth.getByRole('figure')).toHaveAccessibleName(
    /^IWDA \(total return\) from .*: 100 to [\d.,]+; MSCI World: 100 to [\d.,]+\.$/,
  )
  await growth.getByRole('tab', { name: '1Y' }).click()
  await expect(growth.getByRole('tab', { name: '[1Y]' })).toHaveAttribute('aria-selected', 'true')

  const performance = panel(page, 'Performance')
  await expect(performance.getByRole('row', { name: /^1 day/ })).toContainText('+0.3%')
  await expect(performance.getByRole('row', { name: /^Since inception \(p\.a\.\)/ })).toContainText(
    '+9.0%',
  )
  // The current year to date is block E's YTD.
  const years = panel(page, 'Calendar years')
  await expect(years.getByRole('row').nth(1)).toContainText(/\d{4} \(YTD\)\s*\+10\.4%\s*\+10\.5%/)
  await expect(years.getByRole('row')).not.toHaveCount(2)
  await expect(panel(page, 'Risk')).toContainText('11.9% · 15.2%')
})

test('DIST shows VUSA’s quarterly distributions and yield; IWDA accumulates', async ({ page }) => {
  await page.goto('/mkt')
  await page.getByRole('combobox', { name: 'Command bar' }).fill('VUSA DIST')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/securities\/VUSA\.LSE\/dist$/)

  const distributions = panel(page, /^Distributions$/)
  await expect(distributions.getByRole('row').nth(1)).toContainText(
    /\d{2}\/\d{2}\/\d{4}\s*\d{2}\/\d{2}\/\d{4}\s*\$0\.\d{4}/,
  )
  const policy = panel(page, 'Distribution policy')
  await expect(policy).toContainText(
    /Policy\s*Distributing\s*Frequency\s*Quarterly\s*12-month distribution yield\s*1\.\d{2}%/,
  )
  await expect(policy.getByRole('region', { name: 'Paid per calendar year' })).toContainText(
    /\d{4} so far\s*\$\d\.\d{4}/,
  )

  await page.goto('/securities/IWDA.LSE/dist')
  await expect(panel(page, /^Distributions$/)).toContainText(
    'IWDA accumulates its income: it pays no distributions.',
  )
  await expect(panel(page, 'Distribution policy')).toContainText(
    /12-month distribution yield\s*— \(accumulating\)/,
  )
})
