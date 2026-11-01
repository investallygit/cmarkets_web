import { expect, test, type Page } from '@playwright/test'

// Back-office of the Data admin, step 8 (ROADMAP.md): IMP with DATA, HIST and EODH, then CORR and
// NEWS.

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section', { has: page.getByRole('heading', { name: title, exact: true }) })

/** The prototype's account switch reloads the app: wait for the new account's badge. */
async function switchAccount(page: Page, from: RegExp, account: string, badge: RegExp) {
  await page.getByRole('button', { name: from }).click()
  await page.getByRole('menuitem', { name: account }).click()
  await expect(page.getByRole('button', { name: badge })).toBeVisible()
}

async function asDataAdmin(page: Page) {
  await page.goto('/cfg')
  await switchAccount(page, /analyst/i, 'Data admin', /data admin/i)
}

/** Ticks "Alert checked" on every alert of the upload: a change above its threshold here. */
async function checkAlerts(page: Page) {
  const upload = panel(page, /^Current upload:/)
  const alerts = upload.getByRole('row', { name: /vs previous|No volume/ })
  for (let index = 0; index < (await alerts.count()); index++) {
    await alerts.nth(index).click()
    await upload.getByText('Alert checked', { exact: true }).click()
    await expect(upload.getByRole('checkbox', { name: 'Alert checked' })).toBeChecked()
  }
}

test('the BEAC auctions of the session are checked, published and reach the terminals', async ({
  page,
}) => {
  await asDataAdmin(page)
  await page.goto('/imp')
  const upload = panel(page, /^Current upload: adjudications_beac_/)
  await expect(upload.getByRole('button', { name: /^Alerts/ })).toContainText('1')
  // The alert row of the mockup is selected, and Publish waits for its tick.
  await expect(upload).toContainText(
    'Row 3 selected: check the rate against the BEAC release, fix it if needed, then tick “Alert checked”.',
  )
  await expect(upload.getByRole('row', { name: /Gabon/ })).toContainText(
    'Rate +1.40 pt vs previous (threshold 1.00)',
  )
  const publish = upload.getByRole('button', { name: 'Publish 6 rows' })
  await expect(publish).toBeDisabled()
  await upload.getByText('Alert checked', { exact: true }).click()
  await expect(publish).toBeEnabled()
  await publish.click()
  await expect(upload.getByText(/^Published .* 6 rows\.$/)).toBeVisible()
  await expect(panel(page, 'Session coverage')).toContainText('BEAC auctions1 file published')

  // The terminals get the new auctions.
  await switchAccount(page, /data admin/i, 'Analyst', /analyst/i)
  await page.goto('/cal')
  const auctions = panel(page, 'Latest government securities auctions (BEAC)')
  await auctions.getByRole('combobox', { name: 'Country' }).selectOption('GA')
  await expect(auctions.getByRole('row', { name: /7\.45%/ })).toBeVisible()
})

test('a daily prices file in error is fixed row by row, then published', async ({ page }) => {
  await asDataAdmin(page)
  await page.goto('/imp?import=new')
  const form = panel(page, 'New upload')
  // The session comes with the coverage: read it once there, not while the field is still empty.
  const sessionField = form.getByRole('textbox', { name: 'Session' })
  await expect(sessionField).toHaveValue(/^\d{2}\/\d{2}\/\d{4}$/)
  const session = await sessionField.inputValue()
  const [day, month, year] = session.split('/')
  const date = `${year}-${month}-${day}`
  const csv = [
    'date;code;open;high;low;close;volume;value',
    `${date};SEMC;52000;52800;51900;52500;96;5040000`,
    `${date};XYZ;1000;1000;1000;1000;10;10000`,
    `${date};SEMC;52000;52800;51900;52500;96;5040000`,
    `${date};SIAT;18500;25000;18500;25000;120;3000000`,
  ].join('\r\n')
  await form.locator('input[type=file]').setInputFiles({
    name: 'cours_e2e.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csv),
  })
  await form.getByRole('button', { name: 'Upload and check' }).click()

  const upload = panel(page, 'Current upload: cours_e2e.csv')
  await expect(upload.getByRole('button', { name: /^Errors/ })).toContainText('2')
  await expect(upload.getByRole('row', { name: /XYZ/ })).toContainText('Unknown security XYZ')
  await expect(upload.getByRole('row', { name: /Same data as row 1/ })).toBeVisible()
  await expect(upload.getByRole('row', { name: /SIAT/ })).toContainText(/Close \+3\d\.\d\d%/)
  await expect(upload.getByRole('button', { name: 'Publish 4 rows' })).toBeDisabled()

  // The unknown security was SOCAPALM, the duplicate BANGE.
  for (const [code, values] of [
    ['XYZ', ['SOCAPALM', '41200', '41300', '41100', '41200']],
    ['Same data as row 1', ['BANGE', '26200', '26800', '26100', '26750']],
  ] as const) {
    await upload.getByRole('row', { name: new RegExp(code) }).click()
    await upload.getByRole('button', { name: 'Fix row' }).click()
    const dialog = page.getByRole('dialog')
    for (const [index, field] of ['Code', 'Open', 'High', 'Low', 'Close'].entries()) {
      await dialog.getByRole('textbox', { name: field, exact: true }).fill(values[index])
    }
    await dialog.getByRole('button', { name: 'Save and check' }).click()
    await expect(dialog).toBeHidden()
  }
  await expect(upload.getByRole('button', { name: /^Errors/ })).toContainText('0')
  await checkAlerts(page)
  await upload.getByRole('button', { name: 'Publish 4 rows' }).click()
  await expect(upload.getByText(/^Published .* 4 rows\.$/)).toBeVisible()
  await expect(
    panel(page, 'Upload history').getByRole('row', { name: /cours_e2e\.csv/ }),
  ).toContainText('Published')
})

test('a publication is rolled back from the history, with a reason', async ({ page }) => {
  await asDataAdmin(page)
  await page.goto('/data/history')
  const history = panel(page, 'Upload history')
  await history.getByRole('combobox', { name: 'File type' }).selectOption('indices')
  const latest = history.getByRole('row', { name: /indices_\d{8}\.csv/ }).first()
  await latest.click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Roll back…' }).click()
  const dialog = page.getByRole('dialog', { name: 'Roll back the publication' })
  await dialog.getByRole('textbox', { name: 'Reason' }).fill('BVMAC-A of the wrong session.')
  await dialog.getByRole('button', { name: 'Roll back' }).click()
  await expect(dialog).toBeHidden()
  await expect(latest).toContainText('Rolled back')

  // The upload opens on IMP, back in its preview with the reason.
  await latest.click()
  await expect(page).toHaveURL(/\/imp\?import=/)
  await expect(panel(page, /^Current upload: indices_/)).toContainText(
    'BVMAC-A of the wrong session.',
  )
})

test('DATA shows any session, HIST filters, EODH follows the connector', async ({ page }) => {
  await asDataAdmin(page)
  await page.goto('/data/session')
  const coverage = panel(page, 'Session coverage')
  await expect(coverage).toContainText('BVMAC daily prices')
  const templates = panel(page, 'File templates')
  await expect(templates).toContainText('date ; code ; open ; high ; low ; close ; volume')
  const download = page.waitForEvent('download')
  await templates.getByRole('button', { name: 'BVMAC daily prices template, CSV' }).click()
  expect((await download).suggestedFilename()).toBe('cmarket_template_daily_prices.csv')

  await page.getByRole('link', { name: /EODH/ }).click()
  await expect(panel(page, 'EODHD connector')).toContainText('Daily quota used')
  const loads = panel(page, 'Bulk loads')
  await loads.getByRole('combobox', { name: 'Load' }).selectOption('fundamentals')
  await expect(loads.getByRole('row').nth(1)).toContainText('Fundamentals (bulk)')
})

test('CORR corrects a stored session with a reason, kept in the log', async ({ page }) => {
  await asDataAdmin(page)
  await page.goto('/data/corrections?security=SEMC')
  const sessions = panel(page, 'Stored sessions')
  // The session before the latest one.
  const previous = sessions.getByRole('row').nth(2)
  const date = (await previous.getByRole('cell').first().textContent()) ?? ''
  await previous.click()
  const correction = panel(page, 'Price correction')
  await expect(correction.getByRole('textbox', { name: 'Session' })).toHaveValue(date)
  await expect(correction).toContainText('Stored from:')
  const close = correction.getByRole('textbox', { name: 'Close', exact: true })
  const high = correction.getByRole('textbox', { name: 'High', exact: true })
  await high.fill('99000')
  await close.fill('99000')
  await correction.getByRole('button', { name: 'Correct the session' }).click()
  await expect(correction).toContainText('Say why the session is corrected.')
  await correction.getByRole('textbox', { name: 'Reason' }).fill('Close of the BVMAC bulletin.')
  await correction.getByRole('button', { name: 'Correct the session' }).click()
  await expect(page.getByText(/SEMC, session of .*: corrected\./)).toBeVisible()
  await expect(sessions.getByRole('row').nth(2)).toContainText(/99,000.*Corrected/)
  await expect(panel(page, 'Corrections log').getByRole('row').nth(1)).toContainText(
    'Close of the BVMAC bulletin.',
  )
})

test('NEWS publishes the news of an issuer, which the terminals show', async ({ page }) => {
  await asDataAdmin(page)
  await page.goto('/data/content')
  const editor = panel(page, 'New news item')
  await editor.getByRole('textbox', { name: 'Headline' }).fill('Interim dividend announced')
  await editor.getByRole('textbox', { name: 'Source' }).fill('semc')
  await editor.getByRole('combobox', { name: 'Add a security' }).fill('SEMC')
  await page.getByRole('option', { name: /SEMC/ }).first().click()
  await editor
    .getByRole('textbox', { name: 'Text' })
    .fill('The board declares an interim dividend.\n\nPayment on 15 December.')
  await editor.getByRole('button', { name: 'Publish' }).click()
  await expect(page.getByText('Published: the terminals show it now.')).toBeVisible()
  await expect(panel(page, 'Edit the news item')).toBeVisible()
  await expect(panel(page, 'Published').getByRole('row').nth(1)).toContainText(
    'Interim dividend announced',
  )

  await switchAccount(page, /data admin/i, 'Analyst', /analyst/i)
  await page.goto('/n')
  await panel(page, 'News')
    .getByRole('button', { name: /Interim dividend announced/ })
    .click()
  await expect(panel(page, 'Article')).toContainText('Payment on 15 December.')
})
