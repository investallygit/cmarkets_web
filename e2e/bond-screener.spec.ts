import { expect, test, type Page } from '@playwright/test'

// BS, the bond screener of ROADMAP step 29 (spec screen 17): the demo's bond list as the
// mockup's (ECMR, GAB, Cameroon's OTA and BTA on the BEAC's market at model prices, BDEAC,
// COMPANY X callable on 30/06/2027), the four blocks of a bond, the criteria, a saved screen, the
// export; then a bond list published in IMP, whose new bond BS lists. The last flow adds a bond:
// it runs last.

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section', { has: page.getByRole('heading', { name: title }) })

const results = (page: Page) => panel(page, /^Results/)

/** The prototype's account switch reloads the app: wait for the new account's badge. */
async function switchAccount(page: Page, from: RegExp, account: string, badge: RegExp) {
  await page.goto('/cfg')
  const topBar = page.getByRole('banner')
  await topBar.getByRole('button', { name: from }).click()
  await page.getByRole('menuitem', { name: account, exact: true }).click()
  await expect(topBar.getByRole('button', { name: badge })).toBeVisible()
}

test('BS lists the mockup’s bonds, model prices starred, and shows a callable bond’s four blocks', async ({
  page,
}) => {
  await page.goto('/mkt')
  await page.getByRole('combobox', { name: 'Command bar' }).fill('BS')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/bs$/)
  // Under YCRV in the menu, as the mockup lights it.
  await expect(
    page.getByRole('navigation', { name: 'Main menu' }).getByRole('link', { name: /^YCRV/ }),
  ).toHaveClass(/border-accent-amber/)

  const list = results(page)
  await expect(list.getByRole('heading')).toHaveText(/Results: 6 bonds/i)
  await expect(list.getByRole('row', { name: /ECMR 6\.25% 29/ })).toContainText(
    /Sovereign · CM\s*BVMAC\s*6\.25\s*04\/11\/2029/,
  )
  await expect(list.getByRole('row', { name: /GAB 6\.50% 28/ })).toContainText('B-')
  await expect(list.getByRole('row', { name: /OTA CMR 3 yr/ })).toContainText(/BEAC\s*6\.10/)
  await expect(list.getByRole('row', { name: /OTA CMR 3 yr/ })).toContainText('*')
  await expect(list.getByRole('row', { name: /BTA CMR 26 wk/ })).toContainText(/BEAC\s*Zero/)
  await expect(list.getByRole('row', { name: /BDEAC 5\.50% 2030/ })).toContainText(
    /Supranational\s*BVMAC/,
  )
  await expect(list).toContainText(/Computed \d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/)

  // COMPANY X: its yield to worst, to its call, in yellow; no OAS until a rate model.
  await list.getByRole('row', { name: /COMPANY X 7\.00% 2028/ }).click()
  const profile = panel(page, 'COMPANY X 7.00% 2028 · CM0000030019')
  await expect(profile.getByRole('region', { name: 'A. Identification and issuer' })).toContainText(
    'Company X · Corporate, industrials',
  )
  const pricing = profile.getByRole('region', { name: 'B. Pricing, yield and spreads' })
  await expect(pricing).toContainText('(to 30/06/2027)')
  await expect(pricing).toContainText('n/a (V2)')
  await expect(profile.getByRole('region', { name: 'C. Risk and ratings' })).toContainText(
    /NR · NR · NR\s*Credit bucket\s*Not rated/,
  )
  await expect(profile.getByRole('region', { name: 'D. Cash flow and structure' })).toContainText(
    '30/06/2028 · 30/06/2027 at 101.00',
  )

  // Gabon: rated B- by S&P, high yield.
  await list.getByRole('row', { name: /GAB 6\.50% 28/ }).click()
  await expect(
    panel(page, /^GAB 6\.50% 28/).getByRole('region', { name: 'C. Risk and ratings' }),
  ).toContainText(/B- · NR · NR\s*Credit bucket\s*High Yield/)

  // A double-click opens the bond's profile; "Open in BP" its pricing.
  await list.getByRole('row', { name: /GAB 6\.50% 28/ }).dblclick()
  await expect(page).toHaveURL(/\/securities\/GAB-6\.50-2028\/des$/)
  await page.goBack()
  await panel(page, /^GAB 6\.50% 28/)
    .getByRole('link', { name: 'Open in BP' })
    .click()
  await expect(page).toHaveURL(/\/yas\/GAB-6\.50-2028$/)
})

test('the criteria narrow the bonds, a screen is saved and the results export', async ({
  page,
}) => {
  await page.goto('/bs')
  const criteria = panel(page, 'Criteria')
  const list = results(page)
  await expect(list.getByRole('heading')).toHaveText(/Results: 6 bonds/i)

  // The BEAC's government securities only.
  for (const market of ['BVMAC (listed)', 'Other markets']) {
    await criteria.getByText(market, { exact: true }).click()
    await expect(criteria.getByRole('checkbox', { name: market })).not.toBeChecked()
  }
  await expect(criteria.getByText(/The criteria changed/)).toBeVisible()
  await criteria.getByRole('button', { name: 'Run' }).click()
  await expect(list.getByRole('heading')).toHaveText(/Results: 2 bonds/i)
  await expect(list.getByRole('row', { name: /BDEAC/ })).toHaveCount(0)

  // Saved, then loaded back after a reset.
  await criteria.getByRole('button', { name: 'Save', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('textbox', { name: 'Name' }).fill('BEAC bills')
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(dialog).toBeHidden()
  await criteria.getByRole('button', { name: 'Reset' }).click()
  await expect(list.getByRole('heading')).toHaveText(/Results: 6 bonds/i)
  await criteria.getByRole('button', { name: 'BEAC bills', exact: true }).click()
  await expect(list.getByRole('heading')).toHaveText(/Results: 2 bonds/i)

  // A rating as good as B- or better: Gabon's only.
  await criteria.getByRole('button', { name: 'Reset' }).click()
  await criteria.getByRole('combobox', { name: 'Minimum rating' }).selectOption('B-')
  await criteria.getByRole('button', { name: 'Run' }).click()
  await expect(list.getByRole('heading')).toHaveText(/Results: 1 bond$/i)

  const download = page.waitForEvent('download')
  await list.getByRole('button', { name: 'Export XLSX' }).click()
  expect((await download).suggestedFilename()).toMatch(/^bs-results.*\.xlsx$/)
})

test('a bond list published in IMP adds its bond to BS', async ({ page }) => {
  await switchAccount(page, /analyst/i, 'Data admin', /data admin/i)
  await page.goto('/imp?import=new')
  const form = panel(page, 'New upload')
  await form.getByRole('combobox', { name: 'File type' }).selectOption('bond-master')
  const csv = [
    'isin;ticker;name;issuer;issuer_category;sector;country;currency;market;seniority;coupon_type;coupon_rate;' +
      'float_index;float_margin;frequency;day_count;issue_date;first_coupon_date;maturity_date;redemption;' +
      'amortization_schedule;call_schedule;put_schedule;face_value;amount_outstanding;status',
    'CM0000040017;COMPANY Y 6.00% 2031;Company Y 6.00% 2026-2031;Company Y;CORPORATE;' +
      'INDUSTRIALS;CM;XAF;BVMAC;SENIOR_UNSECURED;FIXED;6;;;2;30/360;2026-06-15;;2031-06-15;AMORTIZING;' +
      '2030-06-15:50|2031-06-15:50;;2029-06-15:100;10000;25000000000;PERFORMING',
  ].join('\r\n')
  await form.locator('input[type=file]').setInputFiles({
    name: 'liste_obligations.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csv),
  })
  await form.getByRole('button', { name: 'Upload and check' }).click()
  const upload = panel(page, 'Current upload: liste_obligations.csv')
  await expect(upload.getByRole('button', { name: /^Errors/ })).toContainText('0')
  await upload.getByRole('button', { name: 'Publish 1 row' }).click()
  await expect(upload.getByText(/^Published .* 1 row\.$/)).toBeVisible()

  // The day's figures follow the publication: the new bond, without a quote yet, at a model price.
  await switchAccount(page, /data admin/i, 'Analyst', /analyst/i)
  await page.goto('/bs')
  const list = results(page)
  await expect(list.getByRole('heading')).toHaveText(/Results: 7 bonds/i, { timeout: 20_000 })
  await list.getByRole('row', { name: /COMPANY Y 6\.00% 2031/ }).click()
  const profile = panel(page, 'COMPANY Y 6.00% 2031 · CM0000040017')
  await expect(profile.getByRole('region', { name: 'D. Cash flow and structure' })).toContainText(
    'Semi-annual',
  )
  await expect(
    profile.getByRole('region', { name: 'B. Pricing, yield and spreads' }),
  ).toContainText('*')
})
