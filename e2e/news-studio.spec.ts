import { expect, test, type Page } from '@playwright/test'

// NEWS NEW, the news studio of a partner newspaper (screen 13, ROADMAP step 26), as L. Mballa of
// Media I: its items and earnings, a draft published, a FLASH scheduled then withdrawn, the last
// import's row fixed and published. The demo market publishes a news item every 45 seconds,
// Media I's FLASH first: rows are found by headline, never counted.

const panel = (page: Page, title: string) =>
  page.locator('section', { has: page.getByRole('heading', { name: title, exact: true }) })

/** The prototype's account switch, from the Analyst's badge: wait for the new account's badge. */
async function asMediaI(page: Page) {
  await page.goto('/mkt')
  await page.getByRole('button', { name: /analyst/i }).click()
  await page.getByRole('menuitem', { name: 'News provider', exact: true }).click()
  await expect(page.getByRole('button', { name: /news provider/i })).toBeVisible()
}

/** A new item of the type chosen, from + New, opened in the editor. */
async function newItem(page: Page, type: 'Article' | 'Flash') {
  await panel(page, 'My news').getByRole('button', { name: '+ New' }).click()
  const dialog = page.getByRole('dialog', { name: 'A new item' })
  await dialog.getByRole('radio', { name: type }).check({ force: true })
  await dialog.getByRole('button', { name: 'Write it' }).click()
  await expect(dialog).toHaveCount(0)
}

test('the studio of Media I shows its news, its earnings and its last import', async ({ page }) => {
  await asMediaI(page)
  const menu = page.getByRole('navigation', { name: 'Main menu' })
  await menu.getByRole('link', { name: /^NEWS/ }).click()
  await expect(page).toHaveURL(/\/n\/new/)
  await expect(page.getByRole('banner')).toContainText('News studio — Media I')

  // The draft of the mockup opens first; the published items count their unique clicks.
  const mine = panel(page, 'My news')
  const draft = mine.getByRole('button', { name: /BEAC: monetary policy committee holds rates/ })
  await expect(draft).toHaveAttribute('aria-current', 'true')
  await expect(draft).toContainText('Draft')
  await expect(mine.getByRole('button', { name: /SEMC: net income up 9%/ })).toContainText(
    /Published.*FLASH.*412 clicks/,
  )
  await expect(mine.getByRole('button', { name: /Gabon: new 5-year OTA issue/ })).toContainText(
    /Scheduled.*Tomorrow 08:00/,
  )
  await mine.getByRole('tab', { name: 'Withdrawn' }).click()
  await expect(mine.getByRole('button', { name: /BVMAC: new trading procedure/ })).toContainText(
    'withdrawn',
  )

  // The month's earnings: the payable clicks at XAF 20.
  const earnings = panel(page, 'Earnings')
  await expect(earnings).toContainText('Rate per unique clickXAF 20')
  const payable = Number((await earnings.locator('dd').first().innerText()).replace(/[^\d]/g, ''))
  expect(payable).toBeGreaterThan(2_000)
  await expect(earnings.locator('dd').nth(2)).toHaveText(
    `XAF ${(payable * 20).toLocaleString('en-GB')}`,
  )

  // The editor holds the draft's body and its CMarket security card.
  const editor = panel(page, 'Editor')
  await expect(editor.getByRole('textbox', { name: 'Body of the article' })).toContainText(
    'What the committee watches',
  )
  await expect(editor.getByRole('complementary', { name: /CMarket security ECMR/ })).toContainText(
    'Republic of Cameroon',
  )

  const imports = panel(page, 'File import')
  await expect(imports).toContainText(/actus_media_i_\d{8}\.zip/)
  await expect(imports).toContainText('Rows read')
  await expect(imports).toContainText('Updates (known external_id)')
})

test('a draft publishes once complete and its rights stated, and reaches N', async ({ page }) => {
  await asMediaI(page)
  await page.goto('/n/new')
  await newItem(page, 'Article')
  const headline = `Douala port: traffic up 6% (${Date.now()})`

  const editor = panel(page, 'Editor')
  const publishing = panel(page, 'Publishing')
  const publish = publishing.getByRole('button', { name: 'Publish', exact: true })
  await expect(publish).toBeDisabled()
  await expect(publishing).toContainText(
    'To publish: the headline, the standfirst, the body, a category, a country, the rights box.',
  )

  await editor.getByLabel('Headline (150 characters max.)').fill(headline)
  await expect(editor).toContainText(`${headline.length}/150`)
  await editor
    .getByLabel('Standfirst (400 characters max.)')
    .fill('The port of Douala handled 6% more containers over the quarter.')
  await editor
    .getByRole('textbox', { name: 'Body of the article' })
    .fill('Traffic rose on the new terminal, the port authority said.')
  await publishing.getByLabel('Category').selectOption({ label: 'Markets' })
  await publishing.getByRole('checkbox', { name: 'Cameroon' }).check({ force: true })
  await expect(publish).toBeDisabled()
  await editor
    .getByRole('checkbox', { name: 'I certify I hold the rights to this text and its images' })
    .check({ force: true })
  await expect(publish).toBeEnabled()
  await publish.click()
  await expect(page.getByText('Published: the feed shows it.')).toBeVisible()

  // Published: its row says so, Update replaces Publish, and the feed shows it with Media I's tag.
  await expect(panel(page, 'My news').getByRole('button', { name: headline })).toContainText(
    'Published',
  )
  await expect(publishing.getByRole('button', { name: 'Update' })).toBeVisible()
  await page.goto('/n')
  const row = page.getByRole('listitem').filter({ hasText: headline })
  await expect(row).toContainText('MEDIA I')
  await expect(row).toContainText('ARTICLE')
})

test('a FLASH is scheduled at a time of Douala, then withdrawn with its reason', async ({
  page,
}) => {
  await asMediaI(page)
  await page.goto('/n/new')
  await newItem(page, 'Flash')
  const headline = `SEMC: board meets on Friday (${Date.now()})`

  const editor = panel(page, 'Editor')
  await editor.getByLabel('Headline (150 characters max.)').fill(headline)
  await editor
    .getByLabel('Text of the FLASH (500 characters max.)')
    .fill('SEMC’s board meets on Friday to approve the half-year accounts.')
  await expect(editor.getByRole('textbox', { name: 'Body of the article' })).toHaveCount(0)
  const publishing = panel(page, 'Publishing')
  await publishing.getByLabel('Category').selectOption({ label: 'Issuers' })
  await publishing.getByRole('checkbox', { name: 'Cameroon' }).check({ force: true })
  await editor
    .getByRole('checkbox', { name: 'I certify I hold the rights to this text and its images' })
    .check({ force: true })

  // Scheduled: tomorrow at 08:00 in Douala by default; the button reads Schedule.
  await publishing.getByRole('radio', { name: 'Scheduled' }).check({ force: true })
  await expect(publishing.getByLabel('Time (Douala)')).toHaveValue('08:00')
  await publishing.getByRole('button', { name: 'Schedule' }).click()
  await expect(page.getByText(/^Scheduled for .* 08:00 \(Douala\)\.$/)).toBeVisible()
  const row = panel(page, 'My news').getByRole('button', { name: headline })
  await expect(row).toContainText(/Scheduled.*Tomorrow 08:00/)

  await publishing.getByRole('button', { name: 'Withdraw' }).click()
  const dialog = page.getByRole('dialog', { name: /^Withdraw/ })
  await dialog.getByLabel('Reason').fill('The board meeting moved to next week.')
  await dialog.getByRole('button', { name: 'Withdraw the item' }).click()
  await expect(page.getByText('Withdrawn: the item left the feed.')).toBeVisible()
  await expect(row).toContainText('Withdrawn')
  await expect(editor).toContainText(/Withdrawn on .*: The board meeting moved to next week\./)
  await expect(publishing.getByRole('button', { name: 'Schedule' })).toHaveCount(0)
})

// @fresh-db: the demo's last import, its row 5 in error as seeded.
test(
  'the last import’s row in error is fixed, then the valid rows are published',
  { tag: '@fresh-db' },
  async ({ page }) => {
    await asMediaI(page)
    await page.goto('/n/new')
    const imports = panel(page, 'File import')
    await imports.getByRole('button', { name: 'Fix row 5' }).click()

    const dialog = page.getByRole('dialog', { name: 'Fix row 5' })
    await expect(dialog.getByLabel('securities')).toHaveValue('SEMCX')
    await expect(dialog).toContainText('Unknown security code “SEMCX”.')
    await dialog.getByLabel('securities').fill('SEMC')
    await dialog.getByRole('button', { name: 'Check the row again' }).click()
    await expect(page.getByText('Row 5 is valid.')).toBeVisible()

    await imports.getByRole('button', { name: 'Publish 1 row' }).click()
    await expect(page.getByText('The valid rows are published or scheduled.')).toBeVisible()
    await expect(imports.locator('dd').nth(1)).toHaveText('3')
    await expect(imports.locator('dd').last()).toHaveText('0')
    await expect(
      panel(page, 'My news').getByRole('button', { name: 'SEMC: dividend payment date set' }),
    ).toContainText(/Published.*FLASH/)
  },
)
