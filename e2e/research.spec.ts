import { expect, test, type Page } from '@playwright/test'

// Research library and publishing studio of step 6 (ROADMAP.md): PUB and PUB NEW.

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section', { has: page.getByRole('heading', { name: title, exact: true }) })

const DISCLOSURES = [
  /shares held \(declared\)|No conflict of interest/,
  'Disclaimer: not personal advice',
  'Sources and dates of data cited',
]

/** The prototype's account switch reloads the app: wait for the new account's badge. */
async function switchAccount(page: Page, account: string, badge: RegExp) {
  await page.goto('/mkt')
  await page.getByRole('button', { name: /analyst/i }).click()
  await page.getByRole('menuitem', { name: account }).click()
  await expect(page.getByRole('button', { name: badge })).toBeVisible()
}

test('the library lists the publications of the screen 8 mockup', async ({ page }) => {
  await switchAccount(page, 'Portfolio manager', /manager/i)
  await page.goto('/pub')
  const first = panel(page, 'Publications: 128 results').getByRole('listitem').first()
  await expect(first).toContainText('SEMC: volume growth supports the dividend')
  await expect(first).toContainText('15,000 XAF')
  await expect(first).toContainText('Buy · target 58,000')
  await expect(first).toContainText('4.6')
  const preview = panel(page, 'Preview')
  await expect(preview.getByText('Before purchase')).toBeVisible()
  await expect(preview.getByText('Reference price 52,500 · upside +10.5%')).toBeVisible()
  await expect(
    preview.getByRole('listitem').filter({ hasText: '1. Growth driven by volumes' }),
  ).toContainText('locked')
  const analyst = panel(page, 'Analyst')
  for (const [label, value] of [
    ['Publications', '42'],
    ['Average rating', '4.4 / 5'],
    ['Followers', '412'],
    ['Ratings confirmed at 12 months', '68%'],
  ]) {
    await expect(analyst.locator('div', { hasText: label }).last()).toContainText(value)
  }
})

test('a manager buys a note by mobile money and reads it watermarked', async ({ page }) => {
  await switchAccount(page, 'Portfolio manager', /manager/i)
  await page.goto('/pub')
  const preview = panel(page, 'Preview')
  await preview.getByRole('button', { name: 'Buy this report — XAF 15,000' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Pay XAF 15,000' }).click()
  await expect(dialog.getByText('A mobile money number, e.g. +237 6 70 12 34 56.')).toBeVisible()
  await dialog.getByRole('textbox', { name: 'Mobile money number' }).fill('+237 6 70 12 34 56')
  await dialog.getByRole('button', { name: 'Pay XAF 15,000' }).click()
  await expect(dialog.getByText(/^Approve the payment of XAF 15,000 on your phone/)).toBeVisible()
  // The payment is followed with the dialog closed; once confirmed, the content opens.
  await dialog.getByRole('button', { name: 'Close and wait' }).click()
  await expect(page.getByText(/^Payment confirmed: SEMC: volume growth/)).toBeVisible({
    timeout: 10_000,
  })
  await expect(preview.getByText('Purchased')).toBeVisible()
  await expect(preview.getByRole('heading', { name: '2. Valuation and rating' })).toBeVisible()
  await expect(preview.getByTestId('watermark')).toBeAttached()
  const download = page.waitForEvent('download')
  await preview.getByRole('button', { name: 'Download the PDF' }).click()
  expect((await download).suggestedFilename()).toBe('pub-semc-volumes.pdf')

  // A number with no money left: the operator declines the payment.
  await panel(page, 'Publications: 128 results')
    .getByRole('button', { name: /Cameroon: debt trajectory/ })
    .click()
  await preview.getByRole('button', { name: 'Buy this report — XAF 25,000' }).click()
  await dialog.getByRole('textbox', { name: 'Mobile money number' }).fill('+237 6 99 99 00 00')
  await dialog.getByRole('button', { name: 'Pay XAF 25,000' }).click()
  await expect(dialog.getByText(/declined the payment/)).toBeVisible({ timeout: 10_000 })
})

test('a Student pays the student price', async ({ page }) => {
  await switchAccount(page, 'Student', /student/i)
  await page.goto('/pub')
  const preview = panel(page, 'Preview')
  await expect(preview.getByText('Student price, instead of XAF 15,000')).toBeVisible()
  await expect(preview.getByRole('button', { name: 'Buy this report — XAF 5,000' })).toBeVisible()
})

test('a reader rates a free note, reports it and follows its analyst', async ({ page }) => {
  await switchAccount(page, 'Portfolio manager', /manager/i)
  await page.goto('/pub?access=free')
  const preview = panel(page, 'Preview')
  await expect(
    preview.getByRole('heading', { name: /^BANGE: margins under pressure/ }),
  ).toBeVisible()
  await preview.getByRole('radio', { name: '5 stars' }).click()
  await expect(page.getByText('Thank you for your rating.')).toBeVisible()
  await expect(preview.getByText('Your rating')).toBeVisible()

  await preview.getByRole('button', { name: 'Report content' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Send the report' }).click()
  await expect(dialog.getByText('Choose a reason.')).toBeVisible()
  await dialog.getByRole('combobox').selectOption({ label: 'Undisclosed conflict of interest' })
  await dialog.getByRole('button', { name: 'Send the report' }).click()
  await expect(page.getByText('Report sent to the moderators.')).toBeVisible()

  const analyst = panel(page, 'Analyst')
  await analyst.getByRole('button', { name: 'Follow +' }).click()
  await expect(analyst.getByRole('button', { name: 'Following ✓' })).toBeVisible()
  await expect(analyst.locator('div', { hasText: 'Followers' }).last()).toContainText('413')
  await page.getByRole('tab', { name: 'Followed analysts' }).click()
  await expect(page.getByRole('tab', { name: '[Followed analysts]' })).toBeVisible()
  await expect(
    panel(page, /^Publications: \d+ results$/)
      .getByText('by K. Atangana')
      .first(),
  ).toBeVisible()
})

test('the analyst publishes the SEMC update once every disclosure is ticked', async ({ page }) => {
  await page.goto('/pub/new')
  const settings = panel(page, 'Publication settings')
  const publish = settings.getByRole('button', { name: 'Publish update' })
  await expect(publish).toBeDisabled()
  await expect(
    settings.getByText('Publishing enabled once all 3 disclosures are ticked.'),
  ).toBeVisible()
  // The box is drawn over the native checkbox: the user clicks its label.
  await settings.getByText('Sources and dates of data cited').click()
  await publish.click()
  await expect(
    page.getByText(/^SEMC: volume growth supports the dividend: the new version is published/),
  ).toBeVisible()
  await expect(settings.getByText(/^Published · version 2 of/)).toBeVisible()

  await page.goto('/pub')
  const first = panel(page, 'Publications: 128 results').getByRole('listitem').first()
  await expect(first).toContainText('SEMC: volume growth supports the dividend')
  await expect(first).toContainText('Updated')
})

test('a new note is saved, checked, then submitted to the library', async ({ page }) => {
  await page.goto('/pub/new')
  await panel(page, 'My publications').getByRole('button', { name: '+ New' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('combobox').fill('SOCAPALM')
  await dialog
    .getByRole('option', { name: /SOCAPALM/ })
    .first()
    .click()
  await dialog.getByRole('button', { name: 'Create the draft' }).click()
  await expect(page).toHaveURL(/\/pub\/new\?id=pub-/)

  const editor = panel(page, 'Editor')
  await editor.getByRole('textbox', { name: 'Title' }).fill('SOCAPALM: palm oil holds the margin')
  await expect(editor.getByText('Unsaved changes')).toBeVisible()
  // The autosave runs every 10 seconds.
  await expect(editor.getByText(/^Saved at \d\d:\d\d$/)).toBeVisible({ timeout: 12_000 })

  const settings = panel(page, 'Publication settings')
  for (const label of DISCLOSURES) await settings.getByText(label).click()
  await settings.getByRole('button', { name: 'Submit' }).click()
  await expect(editor.getByText('Write the summary readers see before purchase.')).toBeVisible()
  await expect(editor.getByText('Write the publication.')).toBeVisible()
  await expect(settings.getByText('Choose a rating.')).toBeVisible()

  await editor
    .getByRole('textbox', { name: 'Summary (always visible for free)' })
    .fill('Prices hold up and the replanting pays off.')
  await editor.getByRole('textbox', { name: 'Text of the publication' }).click()
  await page.keyboard.type('Palm oil prices held up in the third quarter.')
  await settings.getByText('Buy', { exact: true }).click()
  await settings.getByRole('button', { name: 'Submit' }).click()
  await expect(page.getByText('SOCAPALM: palm oil holds the margin is published.')).toBeVisible()

  await page.goto('/pub')
  const first = panel(page, 'Publications: 129 results').getByRole('listitem').first()
  await expect(first).toContainText('SOCAPALM: palm oil holds the margin')
  await expect(first).toContainText('Free')
})

test('a CMarket chart is frozen into the text and the reader preview shows the draft', async ({
  page,
}) => {
  await page.goto('/pub/new')
  const editor = panel(page, 'Editor')
  await editor.getByRole('textbox', { name: 'Text of the publication' }).click()
  await editor.getByRole('button', { name: /Insert a CMarket chart/ }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByText('6M', { exact: true }).click()
  await dialog.getByRole('button', { name: 'Insert the chart' }).click()
  await expect(dialog).toBeHidden()
  await expect(editor.getByText(/^CMarket chart · SEMC · 6M price · frozen at/)).toBeVisible()

  await editor.getByRole('button', { name: 'Reader preview' }).click()
  await expect(
    dialog.getByRole('listitem').filter({ hasText: '1. Growth driven by volumes' }),
  ).toContainText('locked')
  await dialog.getByText('After purchase', { exact: true }).click()
  await expect(dialog.getByText(/^CMarket chart · SEMC · 6M price/)).toBeVisible()
  await expect(dialog.getByTestId('watermark')).toBeAttached()
})

test('a draft on a country takes an outlook, then is archived with a reason', async ({ page }) => {
  await page.goto('/pub/new')
  await panel(page, 'My publications').getByRole('button', { name: '+ New' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByText('Country', { exact: true }).click()
  await dialog.getByRole('combobox').selectOption({ label: 'Gabon' })
  await dialog.getByRole('button', { name: 'Create the draft' }).click()

  const settings = panel(page, 'Publication settings')
  await expect(settings.getByText('Outlook', { exact: true })).toBeVisible()
  for (const outlook of ['Positive', 'Stable', 'Negative']) {
    await expect(settings.getByText(outlook, { exact: true })).toBeVisible()
  }
  await expect(settings.getByText('Date of the data used')).toBeVisible()
  await expect(settings.getByText('No conflict of interest (declared)')).toBeVisible()

  await settings.getByRole('button', { name: 'Archive…' }).click()
  await page.getByRole('dialog').getByRole('textbox').fill('Replaced by the budget note.')
  await page.getByRole('dialog').getByRole('button', { name: 'Archive…' }).click()
  await expect(settings.getByText('Archived: Replaced by the budget note.')).toBeVisible()
  await expect(
    panel(page, 'My publications').getByRole('button', { name: /^Untitled Archived/ }),
  ).toBeVisible()
})
