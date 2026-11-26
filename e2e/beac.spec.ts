import { expect, test, type Page } from '@playwright/test'

// BEAC (screen 34, sixth version), ROADMAP step 65: the Analyst reads the indicators, the rate
// corridor, the Monetary Policy Committee's decisions and a release, the injections, the interbank
// market and the aggregates; MKT's policy rates open it. The Data admin publishes a meeting, which
// BEAC and MKT's policy rates show.

async function switchAccount(page: Page, from: RegExp, account: string, badge: RegExp) {
  const topBar = page.getByRole('banner')
  await topBar.getByRole('button', { name: from }).click()
  await page.getByRole('menuitemradio', { name: account, exact: true }).click()
  await expect(topBar.getByRole('button', { name: badge })).toBeVisible()
}

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section').filter({ has: page.getByRole('heading', { name: title }) })

test('BEAC shows the indicators, the corridor, the decisions and a release, the liquidity and the aggregates', async ({
  page,
}) => {
  // ECO's sovereign rates open BEAC.
  await page.goto('/eco')
  await page.getByRole('link', { name: 'BEAC monetary policy (BEAC)' }).click()
  await expect(page).toHaveURL(/\/beac$/)

  const indicators = page.getByRole('region', { name: 'BEAC indicators' })
  await expect(indicators).toContainText(/Policy rate \(TIAO\)\s*4\.50%/)
  await expect(indicators).toContainText(/Marginal lending facility\s*6\.00%/)
  await expect(indicators).toContainText(/Reserve requirements\s*7\.00% \/ 4\.50%/)
  await expect(indicators).toContainText(/CEMAC inflation \(1 yr\)\s*3\.8%/)
  await expect(indicators).toContainText(/Next MPC\s*\d{2}\/\d{2}\/\d{4}/)

  const corridor = panel(page, 'BEAC interest rate corridor')
  await expect(corridor.getByRole('img', { name: /now 4\.50%/ })).toBeVisible()
  await expect(corridor).toContainText('Illustrative history')

  // The next meeting first, then the decisions; a meeting picked shows its release's summary.
  const decisions = panel(page, 'Monetary Policy Committee decisions')
  await expect(decisions.getByRole('row').nth(1)).toContainText('upcoming')
  await expect(decisions.getByRole('row', { name: /^24\/09\/2025/ })).toContainText('−25 bp')
  const latest = decisions.getByRole('row', { name: /^30\/09\/2026/ })
  await expect(latest).toContainText('Unchanged')
  await latest.click()
  await expect(decisions).toContainText('Meeting of 30/09/2026')
  await expect(decisions).toContainText('the demand for liquidity above the BEAC')
  await latest.getByRole('button', { name: 'PDF of the release of 30/09/2026' }).click()
  const release = page.getByRole('dialog', { name: 'MPC release of 30/09/2026' })
  await expect(release).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(release).toBeHidden()

  const operations = panel(page, 'Liquidity injection operations')
  await expect(operations.getByRole('row').nth(1)).toContainText(
    /7 days\s*250\.0\s*312\.4\s*250\.0\s*4\.50%/,
  )
  await expect(operations).toContainText('Demand above the offer: bank liquidity is tight.')

  const interbank = panel(page, 'CEMAC interbank market')
  await expect(interbank.getByRole('row', { name: /^Overnight/ })).toContainText(/5\.10%\s*\+3 bp/)
  await expect(interbank.getByRole('row', { name: /^Weekly volume/ })).toContainText(
    /182 bn\s*\+14%/,
  )

  const aggregates = panel(page, 'CEMAC monetary aggregates')
  await expect(aggregates).toContainText(/Money supply M2 \(1 yr\)\s*08\/2026\s*\+7\.2%/)
  await expect(aggregates).toContainText(/FX reserves\s*06\/2026\s*4\.9 months of imports/)

  // MKT's policy rates are the latest meeting's, and open BEAC.
  await page.goto('/mkt')
  const rate = panel(page, 'Rates and FX').getByRole('row', { name: /^BEAC main refinancing rate/ })
  await expect(rate).toContainText('4.50%')
  await rate.dblclick()
  await expect(page).toHaveURL(/\/beac$/)
})

test('A meeting the Data admin publishes moves BEAC and MKT’s policy rate @fresh-db', async ({
  page,
}) => {
  await page.goto('/mkt')
  await switchAccount(page, /analyst/i, 'Data admin', /data admin/i)
  await page.goto('/imp?import=new')
  const form = panel(page, 'New upload')
  await form.getByRole('combobox', { name: 'File type' }).selectOption('beac-policy')
  const session = form.getByRole('textbox', { name: 'Session' })
  await expect(session).toHaveValue(/^\d{2}\/\d{2}\/\d{4}$/)
  const day = await session.inputValue()
  const [dd, mm, yyyy] = day.split('/')
  await form.locator('input[type=file]').setInputFiles({
    name: 'cpm_beac_e2e.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(
      [
        'date;policy_rate;mlf_rate;df_rate;reserve_sight;reserve_term;release;summary',
        `${yyyy}-${mm}-${dd};4.25;5.75;0;7;4.5;;The Committee cut its rates by 25 bp.`,
      ].join('\r\n'),
    ),
  })
  await form.getByRole('button', { name: 'Upload and check' }).click()
  const current = panel(page, 'Current upload: cpm_beac_e2e.csv')
  await current.getByRole('button', { name: /^Publish 1 row/ }).click()
  await expect(current.getByText(/^Published .* 1 row\.$/)).toBeVisible()

  await switchAccount(page, /data admin/i, 'Analyst', /analyst/i)
  await page.goto('/beac')
  await expect(page.getByRole('region', { name: 'BEAC indicators' })).toContainText(
    /Policy rate \(TIAO\)\s*4\.25%/,
  )
  const meeting = panel(page, 'Monetary Policy Committee decisions').getByRole('row', {
    name: new RegExp(`^${day}`),
  })
  await expect(meeting).toContainText(/4\.25%\s*5\.75%\s*−25 bp/)
  await meeting.click()
  await expect(panel(page, 'Monetary Policy Committee decisions')).toContainText(
    'The Committee cut its rates by 25 bp.',
  )
  await page.goto('/mkt')
  await expect(
    panel(page, 'Rates and FX').getByRole('row', { name: /^BEAC main refinancing rate/ }),
  ).toContainText('4.25%')
})
