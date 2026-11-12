import { expect, test, type Page } from '@playwright/test'

// ETFS, the ETF screener of ROADMAP step 32 (spec screen 15): the demo's twenty ETFs, the
// mockup's six among them with its figures; its criteria, which leave CW8 out (its 0.38% is above
// the 0.25% they ask: a slip of the mockup); IWDA's five blocks; the criteria narrowed, a screen
// saved and loaded back, the export; a double-click to the ETF's profile.

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section', { has: page.getByRole('heading', { name: title }) })

const results = (page: Page) => panel(page, /^Results/)

test('ETFS lists the mockup’s ETFs under its criteria and shows IWDA’s five blocks', async ({
  page,
}) => {
  await page.goto('/mkt')
  await page.getByRole('combobox', { name: 'Command bar' }).fill('ETFS')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/etfs$/)
  // Under EQS in the menu, as the mockup lights it.
  await expect(
    page.getByRole('navigation', { name: 'Main menu' }).getByRole('link', { name: /^EQS/ }),
  ).toHaveClass(/border-accent-amber/)

  const criteria = panel(page, 'Criteria')
  await expect(criteria.getByRole('combobox', { name: 'Category (asset class)' })).toHaveValue(
    'equity',
  )
  await expect(criteria.getByRole('button', { name: 'Geography' })).toHaveText('Global, US')
  await expect(criteria.getByRole('checkbox', { name: 'UCITS only' })).toBeChecked()

  const list = results(page)
  await expect(list.getByRole('heading')).toHaveText(/Results: 5 ETFs/i)
  // The largest funds first, their assets in dollars.
  await expect(list.getByRole('row').nth(1)).toContainText('IWDA')
  const iwda = list.getByRole('row', { name: /IWDA/ })
  await expect(iwda.getByRole('img', { name: 'Domiciled in Ireland' })).toBeVisible()
  await expect(iwda).toContainText(
    /iShares Core MSCI World\s*Equity · Global\s*BlackRock\s*LSE · USD\s*0\.20%\s*\$98\.4 bn\s*\+10\.40%\s*\+21\.80%/,
  )
  await expect(iwda).toContainText('11.9%')
  await expect(list.getByRole('row', { name: /XDWD/ })).toContainText(
    /Xtrackers MSCI World\s*Equity · Global\s*DWS\s*Xetra · EUR\s*0\.19%\s*€9\.6 bn\s*\+9\.80%\s*\+20\.90%/,
  )
  await expect(list.getByRole('row', { name: /VUSA/ })).toContainText(/\+12\.10%\s*\+24\.60%/)
  await expect(list.getByRole('row', { name: /CW8/ })).toHaveCount(0)
  await expect(list).toContainText(/Computed \d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/)

  // IWDA, the first result: the mockup's blocks.
  const profile = panel(page, 'iShares Core MSCI World UCITS ETF · IWDA')
  const identification = profile.getByRole('region', { name: 'A. Identification' })
  await expect(identification).toContainText('IWDA · iShares Core MSCI World')
  await expect(identification.getByRole('img', { name: 'Listed in United Kingdom' })).toBeVisible()
  await expect(identification).toContainText(
    /Global large-cap equity\s*Issuer\s*BlackRock \(iShares\)\s*Exchange · currency\s*LSE · USD/,
  )
  await expect(profile.getByRole('region', { name: 'B. Structure' })).toContainText(
    /Physical \(sampled\)\s*Dividends\s*Accumulating \(Acc\)\s*Status\s*UCITS\s*Fund currency · hedging\s*USD · unhedged\s*Domicile\s*Ireland/,
  )
  const size = profile.getByRole('region', { name: 'C. Size and liquidity' })
  await expect(size).toContainText(/\$98\.4 bn\s*Market price\s*\$121\.80\s*NAV\s*\$121\.75/)
  await expect(size).toContainText(
    /\+0\.04%\s*30-day avg volume\s*1\.4 M shares\s*Average bid-ask spread\s*0\.05% \(5 bp\)/,
  )
  await expect(profile.getByRole('region', { name: 'D. Costs and yield' })).toContainText(
    /0\.20% p\.a\.\s*12-month distribution yield\s*— \(accumulating\)\s*Distribution frequency\s*—/,
  )
  const performance = profile.getByRole('region', { name: 'E. Performance and risk' })
  await expect(performance).toContainText(/\+0\.3%\s*·\s*\+1\.8%\s*·\s*\+4\.9%/)
  await expect(performance).toContainText(/\+10\.4%\s*·\s*\+21\.8%/)
  await expect(performance).toContainText(
    /\+9\.6%\s*·\s*\+12\.1%\s*Since inception \(p\.a\.\)\s*\+9\.0%/,
  )
  await expect(performance).toContainText(/0\.12% · [-−]0\.15%\s*Volatility 1Y · 3Y\s*11\.9% · 15\.2%/)
  await expect(performance).toContainText(/Sharpe 1Y · max drawdown\s*\d\.\d{2} · [-−]8\.4%/)

  // VUSA distributes every quarter.
  await list.getByRole('row', { name: /VUSA/ }).click()
  await expect(
    panel(page, /· VUSA$/).getByRole('region', { name: 'D. Costs and yield' }),
  ).toContainText(/12-month distribution yield\s*1\.\d{2}%\s*Distribution frequency\s*Quarterly/)
})

test('the criteria narrow the ETFs, a screen is saved and loaded back, the results export', async ({
  page,
}) => {
  await page.goto('/etfs')
  const criteria = panel(page, 'Criteria')
  const list = results(page)
  await expect(list.getByRole('heading')).toHaveText(/Results: 5 ETFs/i)

  // Fixed income, wherever it invests: AGGG and IEMB.
  await criteria
    .getByRole('combobox', { name: 'Category (asset class)' })
    .selectOption('fixedIncome')
  const geography = criteria.getByRole('button', { name: 'Geography' })
  await geography.click()
  for (const region of ['Global', 'US'])
    await criteria.getByRole('checkbox', { name: region, exact: true }).uncheck({ force: true })
  await page.keyboard.press('Escape')
  await expect(geography).toHaveText('All')
  for (const threshold of ['Minimum YTD return', 'Minimum Sharpe ratio (1Y)', 'Maximum fee (TER)'])
    await criteria.getByRole('combobox', { name: threshold }).selectOption('')
  await expect(criteria.getByText(/Criteria changed/)).toBeVisible()
  await criteria.getByRole('button', { name: 'Run' }).click()
  await expect(list.getByRole('heading')).toHaveText(/Results: 2 ETFs/i)
  await expect(list.getByRole('row', { name: /AGGG/ })).toContainText('Fixed Income · Global')
  await expect(list.getByRole('row', { name: /IEMB/ })).toContainText(
    'Fixed Income · Emerging Markets',
  )

  // Currency-hedged only: AGGG.
  await criteria.getByText('Currency-hedged only').click()
  await criteria.getByRole('button', { name: 'Run' }).click()
  await expect(list.getByRole('heading')).toHaveText(/Results: 1 ETF$/i)

  // Saved, then loaded back after a reset to the mockup's screen.
  await criteria.getByRole('button', { name: 'Save', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('textbox', { name: 'Name' }).fill('Hedged bonds')
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(dialog).toBeHidden()
  await criteria.getByRole('button', { name: 'Reset' }).click()
  await expect(list.getByRole('heading')).toHaveText(/Results: 5 ETFs/i)
  await criteria.getByRole('button', { name: 'Hedged bonds', exact: true }).click()
  await expect(list.getByRole('heading')).toHaveText(/Results: 1 ETF$/i)
  await expect(criteria.getByRole('checkbox', { name: 'Currency-hedged only' })).toBeChecked()

  for (const format of ['xlsx', 'csv'] as const) {
    const download = page.waitForEvent('download')
    await list.getByRole('button', { name: `Export ${format.toUpperCase()}` }).click()
    expect((await download).suggestedFilename()).toMatch(new RegExp(`^etfs-results.*\\.${format}$`))
  }

  // Deleted again, so that the flow runs again on the same database.
  await criteria.getByRole('button', { name: 'Delete Hedged bonds' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
  await expect(criteria.getByRole('button', { name: 'Hedged bonds', exact: true })).toHaveCount(0)
})

test('a double-click opens an ETF’s profile, its blocks beside its chart, under EQS', async ({
  page,
}) => {
  await page.goto('/etfs')
  await results(page).getByRole('row', { name: /CSPX/ }).dblclick()
  await expect(page).toHaveURL(/\/securities\/CSPX\.LSE\/des$/)
  await expect(page.getByRole('heading', { level: 1, name: 'CSPX' })).toBeVisible()
  await expect(page.getByText(/^ETF · LSE · Ireland · USD$/)).toBeVisible()
  const tabs = page.getByRole('navigation', { name: 'Security functions' })
  for (const tab of ['DES', 'GP', 'DOC', 'N', 'ANA'])
    await expect(tabs.getByRole('link', { name: new RegExp(`^${tab}\\b`) })).toBeVisible()
  await expect(tabs.getByRole('link', { name: /^FA/ })).toHaveCount(0)
  await expect(
    panel(page, 'iShares Core S&P 500 UCITS ETF · CSPX').getByRole('region', {
      name: 'B. Structure',
    }),
  ).toContainText('Physical (full)')
  await expect(
    page.getByRole('navigation', { name: 'Main menu' }).getByRole('link', { name: /^EQS/ }),
  ).toHaveClass(/border-accent-amber/)
  // An equity's tab is not an ETF's.
  await page.goto('/securities/CSPX.LSE/dvd')
  await expect(page.getByText('DVD does not apply to CSPX.')).toBeVisible()
})
