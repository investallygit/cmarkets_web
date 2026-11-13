import { expect, test, type Page } from '@playwright/test'

// ECO, the macroeconomic dashboard (screen 25), ROADMAP step 40: the country bar, the key indicator
// tiles, the comparison chart, the sovereign and reference rates and the CEMAC comparison, on the
// demo's figures of the mockup; `ECO CMR` from the command bar; ADMCFG chooses its countries and
// tiles; IMP's "Macro" file fills a series the World Bank does not publish.

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section', { has: page.getByRole('heading', { name: title, exact: true }) })

const tile = (page: Page, name: string) =>
  page
    .getByRole('region', { name: 'Key indicators' })
    .getByRole('listitem')
    .filter({
      has: page.getByRole('heading', { name, exact: true }),
    })

/** The prototype's account switch reloads the app: wait for the new account's badge. */
async function switchAccount(page: Page, from: RegExp, account: string, badge: RegExp) {
  const topBar = page.getByRole('banner')
  await topBar.getByRole('button', { name: from }).click()
  await page.getByRole('menuitem', { name: account, exact: true }).click()
  await expect(topBar.getByRole('button', { name: badge })).toBeVisible()
}

/** The settings of the demo, for the flows that read the mockup's. */
async function restoreSettings(page: Page) {
  const refresh = await page.request.post('/api/v1/auth/refresh')
  const { accessToken } = (await refresh.json()) as { accessToken: string }
  const restored = await page.request.put('/api/v1/admin/macro/settings', {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: {
      fxCurrencies: ['USD', 'GBP', 'CHF', 'JPY', 'CNY', 'ZAR', 'INR', 'TRY', 'BRL', 'CAD'],
      matrixCurrencies: ['EUR', 'USD', 'GBP', 'CNY', 'XAF'],
      comparisonCountries: ['NGA', 'FRA'],
      tileIndicators: [
        'gdpGrowth',
        'inflation',
        'gdpPerCapitaUsd',
        'governmentDebt',
        'exports',
        'population',
      ],
    },
  })
  expect(restored.ok()).toBe(true)
}

test('ECO gives Cameroon’s tiles, the CEMAC’s growth and comparison of the mockup, another country on a click', async ({
  page,
}) => {
  await page.goto('/mkt')
  const menu = page.getByRole('navigation', { name: 'Main menu' })
  await menu.getByRole('link', { name: /^ECO/ }).click()
  await expect(page).toHaveURL(/\/eco$/)
  await expect(menu.getByRole('link', { name: /^ECO/ })).toHaveAttribute('aria-current', 'page')

  const bar = page.getByRole('group', { name: 'Country' })
  await expect(bar.getByRole('button', { name: /CMR/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(bar.getByRole('button')).toHaveText([
    /CMR\s*Cameroon/,
    /GAB\s*Gabon/,
    /COG\s*Congo/,
    /TCD\s*Chad/,
    /CAF\s*CAR/,
    /GNQ\s*Eq\. Guinea/,
    /SSF\s*Sub-Saharan Afr\./,
    /NGA\s*Nigeria/,
    /FRA\s*France/,
    /WLD\s*World/,
  ])
  await expect(bar.getByText('Annual World Bank data · latest year: 2025')).toBeVisible()

  // The mockup's tiles: Cameroon's government debt is not published.
  await expect(tile(page, 'GDP growth')).toContainText(/3\.6%\s*2025/)
  await expect(tile(page, 'Inflation (consumer prices)')).toContainText(/4\.5%\s*2025/)
  await expect(tile(page, 'GDP per capita')).toContainText('$1,720')
  await expect(tile(page, 'Government debt / GDP')).toContainText(/n\/a\s*–\s*series not published/)
  await expect(tile(page, 'Exports / GDP')).toContainText('19.8%')
  await expect(tile(page, 'Population')).toContainText('29.1 M')

  // The chart: the CEMAC's first four, 2010 to 2025.
  const chart = panel(page, 'GDP growth (%)')
  await expect(chart.getByText('2010 – 2025')).toBeVisible()
  const lines = chart.getByRole('group', { name: 'Economies of the chart' })
  for (const code of ['Cameroon', 'Gabon', 'Congo', 'Chad'])
    await expect(lines.getByRole('button', { name: code, exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  await lines.getByRole('button', { name: 'Sub-Saharan Afr.', exact: true }).click()
  await expect(
    chart.getByRole('img', {
      name: /GDP growth \(%\) of Cameroon, Gabon, Congo, Chad, Sub-Saharan Africa from 2010 to 2025/,
    }),
  ).toBeVisible()

  // The CEMAC comparison, the year of each row; "n/a" where the World Bank publishes nothing.
  const table = panel(page, 'CEMAC comparison · latest year available')
  await expect(
    table.getByRole('row', { name: /^GDP growth \(%\) 3\.6 2\.9 3\.5 3\.3 1\.5 -2\.8 3\.9 2025$/ }),
  ).toBeVisible()
  await expect(
    table.getByRole('row', { name: /^Fiscal balance \/ GDP \(%\)( n\/a){7} –$/ }),
  ).toBeVisible()
  await expect(
    table.getByRole('row', {
      name: /^Debt service \/ GNI \(%\) 2\.4 5\.6 8\.1 1\.9 0\.9 n\/a 3\.7 2024$/,
    }),
  ).toBeVisible()
  await expect(
    table.getByRole('row', {
      name: /^Population \(M\) 29\.1 2\.5 6\.3 19\.3 5\.5 1\.9 1,240 2025$/,
    }),
  ).toBeVisible()

  // The CEMAC's yields in amber, then the world's.
  const rates = panel(page, 'Sovereign and reference rates')
  await expect(rates.getByRole('row', { name: /^Cameroon 5Y CMR5Y\.CMKT / })).toBeVisible()
  await expect(rates.getByRole('row', { name: /^Euribor 3M EURIBOR3M\.MONEY / })).toBeVisible()

  await bar.getByRole('button', { name: /GAB/ }).click()
  await expect(page).toHaveURL(/\/eco\?country=GAB$/)
  await expect(tile(page, 'GDP growth')).toContainText(/2\.9%\s*2025/)
  await expect(tile(page, 'GDP per capita')).toContainText('$8,450')
})

test('ECO CMR opens an economy from the command bar; one ECO does not offer is said', async ({
  page,
}) => {
  await page.goto('/mkt')
  const command = page.getByRole('combobox', { name: 'Command bar' })
  await command.fill('ECO GAB')
  await command.press('Enter')
  await expect(page).toHaveURL(/\/eco\?country=GAB$/)
  await expect(
    page.getByRole('group', { name: 'Country' }).getByRole('button', { name: /GAB/ }),
  ).toHaveAttribute('aria-pressed', 'true')

  await page.goto('/eco?country=XYZ')
  await expect(
    page.getByRole('status').filter({ hasText: 'No economy XYZ on ECO: CMR is shown.' }),
  ).toBeVisible()
})

test('the chart takes another indicator and period, six economies at most, and exports its figures', async ({
  page,
}) => {
  await page.goto('/eco')
  const chart = panel(page, 'GDP growth (%)')
  await chart.getByRole('combobox', { name: 'Indicator' }).selectOption('population')
  const population = panel(page, 'Population (M)')
  await population.getByRole('tab', { name: 'MAX' }).click()
  await expect(population.getByText('2000 – 2025')).toBeVisible()
  const lines = population.getByRole('group', { name: 'Economies of the chart' })
  await lines.getByRole('button', { name: 'CAR', exact: true }).click()
  await lines.getByRole('button', { name: 'Eq. Guinea', exact: true }).click()
  // Six drawn: the others wait.
  await expect(lines.getByRole('button', { name: 'Nigeria', exact: true })).toBeDisabled()

  const download = page.waitForEvent('download')
  await population.getByRole('button', { name: "Export the chart's figures to Excel" }).click()
  expect((await download).suggestedFilename()).toBe('eco-population-2000-2025.xlsx')
})

test('ADMCFG chooses ECO’s countries and tiles, audited, and ECO follows them', async ({
  page,
}) => {
  await page.goto('/cfg')
  await switchAccount(page, /analyst/i, 'Admin', /^admin$/i)
  await page.goto('/admin/settings')
  const macro = panel(page, 'Macro and FX')
  await macro.getByRole('button', { name: 'Remove FRA' }).click()
  await macro
    .getByRole('combobox', { name: 'Add a country to “Comparison countries”' })
    .selectOption('ZAF')
  await macro.getByRole('combobox', { name: 'Tile 6' }).selectOption('unemployment')
  await macro.getByRole('button', { name: 'Save the settings' }).click()
  await expect(page.getByText('Settings saved.')).toBeVisible()

  await page.getByRole('link', { name: /AUDT/ }).click()
  const entry = panel(page, 'Audit log').getByRole('row').nth(1)
  await expect(entry).toContainText('Macro and FX settings')
  await expect(entry).toContainText('ECO comparison countries: NGA, FRA → NGA, ZAF')
  await expect(entry).toContainText(
    'ECO tile indicators: gdpGrowth, inflation, gdpPerCapitaUsd, governmentDebt, exports, population → gdpGrowth, inflation, gdpPerCapitaUsd, governmentDebt, exports, unemployment',
  )

  await switchAccount(page, /^admin$/i, 'Analyst', /analyst/i)
  await page.goto('/eco')
  const bar = page.getByRole('group', { name: 'Country' })
  await expect(bar.getByRole('button').nth(8)).toHaveText(/ZAF\s*South Africa/)
  await expect(bar.getByRole('button', { name: /FRA/ })).toHaveCount(0)
  await expect(tile(page, 'Unemployment')).toContainText('series not published')

  await switchAccount(page, /analyst/i, 'Admin', /^admin$/i)
  await restoreSettings(page)
})

test('IMP’s macro file fills the debt the World Bank does not publish, its source shown, and rolls back', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await page.goto('/cfg')
  await switchAccount(page, /analyst/i, 'Data admin', /data admin/i)
  await page.goto('/imp?import=new')
  const form = panel(page, 'New upload')
  await form.getByRole('combobox', { name: 'File type' }).selectOption('macro')
  await expect(form.getByRole('textbox', { name: 'Session' })).toHaveValue(/^\d{2}\/\d{2}\/\d{4}$/)
  const csv = [
    'country;indicator;year;value;source;comment',
    'CMR;debt_percent_gdp;2024;43.2;IMF;Article IV',
    'Cameroun;gdp_growth_annual;2025;3.8;BEAC;',
  ].join('\r\n')
  await form.locator('input[type=file]').setInputFiles({
    name: 'macro_fmi_e2e.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csv),
  })
  await form.getByRole('button', { name: 'Upload and check' }).click()

  const upload = panel(page, 'Current upload: macro_fmi_e2e.csv')
  // The World Bank's 3.6 is stored for Cameroon's 2025 growth: replacing it waits for a tick.
  const replaced = upload.getByRole('row', { name: /Replaces the stored value/ })
  await replaced.click()
  const publish = upload.getByRole('button', { name: 'Publish 2 rows' })
  await expect(publish).toBeDisabled()
  await upload.getByText('Alert checked', { exact: true }).click()
  await publish.click()
  await expect(upload.getByText(/^Published .* 2 rows\.$/)).toBeVisible()

  await switchAccount(page, /data admin/i, 'Analyst', /analyst/i)
  await page.goto('/eco')
  await expect(tile(page, 'Government debt / GDP')).toContainText(/43\.2%\s*2024\s*Source: IMF/)
  await expect(tile(page, 'GDP growth')).toContainText(/3\.8%\s*2025\s*Source: BEAC/)

  await switchAccount(page, /analyst/i, 'Data admin', /data admin/i)
  await page.goto('/data/history')
  const history = panel(page, 'Upload history')
  await history.getByRole('combobox', { name: 'File type' }).selectOption('macro')
  const row = history.getByRole('row', { name: /macro_fmi_e2e\.csv/ })
  await row.click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Roll back…' }).click()
  const rollBack = page.getByRole('dialog', { name: 'Roll back the publication' })
  await rollBack.getByRole('textbox', { name: 'Reason' }).fill('Figures of the wrong report.')
  await rollBack.getByRole('button', { name: 'Roll back' }).click()
  await expect(rollBack).toBeHidden()
  await expect(row).toContainText('Rolled back')

  await switchAccount(page, /data admin/i, 'Analyst', /analyst/i)
  await page.goto('/eco')
  await expect(tile(page, 'Government debt / GDP')).toContainText('series not published')
  await expect(tile(page, 'GDP growth')).toContainText(/3\.6%\s*2025/)
})
