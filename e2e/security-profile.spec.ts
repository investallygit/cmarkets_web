import { expect, test, type Page } from '@playwright/test'
import { NO_SESSION, logIn } from './session.js'

// ROADMAP step 54: screen 2 at the BVMAC fixing (fifth version): the last fixing and its date, a
// line of the closes, the prices of recent sessions in place of the order book and the trades, the
// sessions with trades in the key data, and the description under the chart, which an Analyst of
// CMarket edits (ROADMAP decision 40).

async function switchAccount(page: Page, from: RegExp, account: string, badge: RegExp) {
  const topBar = page.getByRole('banner')
  await topBar.getByRole('button', { name: from }).click()
  await page.getByRole('menuitemradio', { name: account, exact: true }).click()
  await expect(topBar.getByRole('button', { name: badge })).toBeVisible()
}

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section', { has: page.getByRole('heading', { name: title, exact: true }) })

test('DES shows a BVMAC equity at its fixing, with its recent sessions', async ({ page }) => {
  await page.goto('/securities/SEMC/des')
  const header = page.getByRole('region', { name: 'Société des Eaux Minérales du Cameroun' })
  await expect(header).toContainText('fixing auction')
  await expect(header).toContainText(/Fixing of \d{2}\/\d{2}\/\d{4}/)
  for (const figure of ['Previous price', 'Volume', 'Value traded', 'Market cap', 'P/E', 'Yield'])
    await expect(header.getByText(figure, { exact: true })).toBeVisible()

  // A line of the closes, without intraday periods nor candles.
  const chart = panel(page, 'Closing price (fixing)')
  await expect(chart.getByText('Line', { exact: true })).toBeVisible()
  await expect(chart.getByRole('tab', { name: /^1D$|^5D$/ })).toHaveCount(0)

  // The recent sessions: 20 first, then 10; the note names a session without trades or says none.
  const sessions = panel(page, 'Prices of recent sessions')
  await expect(sessions.getByRole('tab', { name: '[20]' })).toHaveAttribute('aria-selected', 'true')
  await expect(sessions.getByRole('row')).toHaveCount(21)
  await sessions.getByRole('tab', { name: '10' }).click()
  await expect(sessions.getByRole('row')).toHaveCount(11)
  await expect(sessions).toContainText('One price per session, set by BVMAC.')
  const download = page.waitForEvent('download')
  await sessions.getByRole('button', { name: 'CSV' }).click()
  expect((await download).suggestedFilename()).toMatch(/^SEMC-sessions.*\.csv$/)

  await expect(panel(page, 'Key data')).toContainText(
    /Sessions with trades \(3 months\)\s*\d+ of \d+/,
  )
  await expect(panel(page, 'Description')).toContainText('notably under the Tangui brand')
  // The description is read, not written, by an Analyst of another organisation.
  await expect(
    panel(page, 'Description').getByRole('button', { name: /Edit the description/ }),
  ).toHaveCount(0)

  await sessions.getByRole('link', { name: 'Full history in GP' }).click()
  await expect(page).toHaveURL(/\/securities\/SEMC\/gp$/)
  const full = panel(page, 'Closing price (fixing)')
  await expect(full.getByRole('tab', { name: 'Candles' })).toHaveCount(0)
  await expect(full.getByRole('tab', { name: /^1D$/ })).toHaveCount(0)
})

test.describe('an Analyst of CMarket', () => {
  test.use({ storageState: NO_SESSION })

  test('edits a description from DES, a new version the readers see at once', async ({ page }) => {
    await page.goto('/login')
    await logIn(page, 'r.biyiti@cmarket.example')
    await page.goto('/securities/SIAT/des')
    const description = panel(page, 'Description')
    await expect(description).toContainText('Source:')
    const before = (await description.locator('p[lang="en"]').textContent()) ?? ''

    await description.getByRole('button', { name: 'Edit the description of SIAT' }).click()
    const dialog = page.getByRole('dialog', { name: 'SIAT — Description' })
    const english = dialog.getByRole('textbox', { name: 'English', exact: true })
    await expect(english).toHaveValue(before)
    await english.fill('SIAT Gabon grows rubber and oil palm and runs a cattle ranch.')
    await dialog
      .getByRole('textbox', { name: 'Source of the English text' })
      .fill('Annual report 2025')
    await dialog.getByRole('button', { name: 'Save the description' }).click()
    await expect(page.getByText('SIAT: description saved.')).toBeVisible()
    await expect(dialog).toBeHidden()
    await expect(description).toContainText(
      'SIAT Gabon grows rubber and oil palm and runs a cattle ranch.',
    )
    await expect(description).toContainText('Source: Annual report 2025 · written by CMarket')

    // Back to the demo's text, a third version; the earlier ones listed.
    await description.getByRole('button', { name: 'Edit the description of SIAT' }).click()
    await english.fill(before)
    await dialog
      .getByRole('textbox', { name: 'Source of the English text' })
      .fill("Issuer's 2025 annual report")
    await expect(dialog.getByText(/earlier versions?$/i)).toBeVisible()
    await dialog.getByRole('button', { name: 'Save the description' }).click()
    await expect(page.getByText('SIAT: description saved.')).toBeVisible()
    await expect(description).toContainText(before.slice(0, 40))
  })
})

test('IMP loads descriptions by the DESCRIPTIONS file, which a rollback takes back', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await page.goto('/cfg')
  await switchAccount(page, /analyst/i, 'Data admin', /data admin/i)
  await page.goto('/imp?import=new')
  const form = panel(page, 'New upload')
  await form.getByRole('combobox', { name: 'File type' }).selectOption('descriptions')
  const csv = [
    'code;language;text;source;date',
    "SCG-RE;fr;La SCG-Ré réassure les compagnies d'assurances du Gabon.;Rapport annuel 2025;2026-11-02",
  ].join('\r\n')
  await form.locator('input[type=file]').setInputFiles({
    name: 'descriptions_e2e.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csv),
  })
  await form.getByRole('button', { name: 'Upload and check' }).click()
  const upload = panel(page, 'Current upload: descriptions_e2e.csv')
  await upload.getByRole('button', { name: /^Publish 1 row/ }).click()
  await expect(upload.getByText(/^Published .* 1 row\.$/)).toBeVisible()

  await switchAccount(page, /data admin/i, 'Analyst', /analyst/i)
  await page.goto('/securities/SCG-RE/des')
  const description = panel(page, 'Description')
  await description.getByRole('tab', { name: 'FR' }).click()
  await expect(description).toContainText(
    "La SCG-Ré réassure les compagnies d'assurances du Gabon.",
  )
  await expect(description).toContainText(
    'Source: Rapport annuel 2025 · written by CMarket · updated 02/11/2026',
  )

  await switchAccount(page, /analyst/i, 'Data admin', /data admin/i)
  await page.goto('/data/history')
  const history = panel(page, 'Upload history')
  await history.getByRole('combobox', { name: 'File type' }).selectOption('descriptions')
  const row = history.getByRole('row', { name: /descriptions_e2e\.csv/ })
  await row.click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Roll back…' }).click()
  const rollBack = page.getByRole('dialog', { name: 'Roll back the publication' })
  await rollBack.getByRole('textbox', { name: 'Reason' }).fill('The French of last year.')
  await rollBack.getByRole('button', { name: 'Roll back' }).click()
  await expect(row).toContainText('Rolled back')

  await switchAccount(page, /data admin/i, 'Analyst', /analyst/i)
  await page.goto('/securities/SCG-RE/des')
  await expect(panel(page, 'Description').getByRole('tab')).toHaveCount(0)
})
