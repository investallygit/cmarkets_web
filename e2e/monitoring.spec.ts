import { expect, test, type Page } from '@playwright/test'

// Monitoring screens of step 3 (ROADMAP.md): watchlists, alerts, news and calendar.

const panel = (page: Page, title: string) =>
  page.locator('section', { has: page.getByRole('heading', { name: title, exact: true }) })

test('a watchlist is created from the right-click menu with the security in it', async ({
  page,
}) => {
  await page.goto('/mkt')
  const movers = panel(page, 'Top movers')
  await movers.getByRole('row', { name: /BANGE/ }).click({ button: 'right' })
  await expect(page.getByRole('menuitem', { name: 'W1 · My picks' })).toBeVisible()
  await page.getByRole('menuitem', { name: 'New list…' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('textbox', { name: 'Name' }).fill('Banks')
  await dialog.getByRole('button', { name: 'Create' }).click()
  await expect(dialog).toBeHidden()

  const watchlist = page.locator('section', {
    has: page.getByRole('heading', { name: /^Watchlist:/ }),
  })
  await watchlist.getByRole('tab', { name: 'W3' }).click()
  await expect(watchlist.getByRole('heading')).toHaveText('Watchlist: Banks')
  await expect(watchlist.getByRole('row', { name: /BANGE/ })).toBeVisible()
})

test('an alert set from the right-click menu is listed on the ALRT screen', async ({ page }) => {
  await page.goto('/mkt')
  await panel(page, 'Top movers').getByRole('row', { name: /SEMC/ }).click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Create an alert' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('combobox', { name: 'Security' })).toHaveValue('SEMC')
  await dialog.getByRole('textbox', { name: 'Threshold' }).fill('60000')
  await dialog.getByRole('button', { name: 'Create' }).click()
  await expect(dialog).toBeHidden()

  await page.getByRole('link', { name: /ALRT/ }).click()
  const alerts = panel(page, 'My alerts')
  await expect(alerts.getByRole('row', { name: /Price above 60,000/ })).toBeVisible()
  // The 8 sample alerts and the new one, of the 50 an Analyst may set.
  await expect(alerts.getByText('9 / 50')).toBeVisible()
})

test('the N screen filters the news and searches the documents', async ({ page }) => {
  await page.goto('/n')
  const news = panel(page, 'News')
  await news.getByRole('combobox', { name: 'Category' }).selectOption('regulation')
  await expect(news.getByRole('link', { name: /Annual results: revenue up/ })).toHaveCount(0)
  await news.getByRole('link', { name: /Approval granted for a bond issue/ }).click()
  // CMarket.Api keys its news by deterministic ids: any id there.
  await expect(page).toHaveURL(/category=regulation&article=[\w-]+$/)
  await expect(
    panel(page, 'Article').getByRole('heading', { name: 'Approval granted for a bond issue' }),
  ).toBeVisible()

  await page.getByRole('link', { name: 'DOC Documents' }).click()
  const documents = panel(page, 'Documents')
  await documents.getByRole('searchbox', { name: 'Search the documents' }).fill('annual report')
  await expect(documents.getByRole('listitem')).toHaveCount(3)
  await expect(page).toHaveURL(/\/n\/documents\?q=annual\+report$/)
})

test('each item shows its two tags, which filter the feed, and its content counts a unique click', async ({
  page,
}) => {
  await page.goto('/mkt')
  const panelNews = panel(page, 'News')
  // Screen 1: time, type and newspaper tags, subject in amber, headline. The demo market publishes
  // an item every 45 seconds: rows are found by their headline.
  const results = panelNews.getByRole('listitem').filter({ hasText: 'Annual results: revenue up' })
  await expect(results).toContainText(/FLASH\s*MEDIA I\s*SEMC\s*Annual results: revenue up/)
  // The newspaper's card on hover: its name, channel and original link.
  await panelNews
    .getByRole('listitem')
    .filter({ hasText: 'Approval granted for a bond issue' })
    .getByRole('link', { name: "DAILY Z: show this newspaper's news" })
    .hover()
  const card = page.getByRole('tooltip')
  await expect(card).toContainText('Daily Z')
  await expect(card).toContainText('Processed by CMarket AI')
  await expect(card).toContainText('daily-z.example/article/12345')

  // A click on a tag filters the N screen on that newspaper, then on the type.
  await results.getByRole('link', { name: "MEDIA I: show this newspaper's news" }).click()
  await expect(page).toHaveURL(/\/n\?source=[\w-]+$/)
  const news = panel(page, 'News')
  const rows = news.getByRole('listitem')
  await expect(rows.filter({ hasText: 'Annual results: revenue up' })).toHaveCount(1)
  await expect(rows.filter({ hasNotText: 'MEDIA I' })).toHaveCount(0)
  await rows
    .filter({ hasText: 'Annual results: revenue up' })
    .getByRole('link', { name: 'FLASH: show these items' })
    .click()
  await expect(page).toHaveURL(/\/n\?type=flash$/)
  await expect(rows.filter({ hasText: 'Brent crude above $90' })).toHaveCount(1)
  await expect(rows.filter({ hasNotText: 'FLASH' })).toHaveCount(0)

  // The content shown 3 seconds in this tab sends its view, once; the server answers 204.
  const view = page.waitForResponse(
    (response) => /\/api\/v1\/news\/[\w-]+\/view$/.test(response.url()),
    { timeout: 10_000 },
  )
  await news.getByRole('link', { name: /Annual results: revenue up/ }).click()
  const article = panel(page, 'Article')
  await expect(article).toContainText('SEMC reports annual revenue up 9%')
  await expect(article).toContainText('Media I · Partner newspaper')
  expect((await view).status()).toBe(204)
})

// @fresh-db: a message to P. Owona, whose conversation MSG's flows find as seeded.
test(
  'a news item has its own address, which a member copies, opens and shares in MSG',
  { tag: '@fresh-db' },
  async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    const headline = 'Approval granted for a bond issue'
    await page.goto('/mkt')
    await panel(page, 'News')
      .getByRole('link', { name: new RegExp(headline) })
      .click()
    await expect(page).toHaveURL(/\/n\?article=[\w-]+$/)
    const address = page.url()
    const article = panel(page, 'Article')
    await expect(article.getByRole('heading', { name: headline })).toBeVisible()

    await article.getByRole('button', { name: 'Copy link' }).click()
    await expect(page.getByText(/^Link copied/)).toBeVisible()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(address)

    // The address alone opens the article, as in a colleague's browser.
    const colleague = await context.newPage()
    await colleague.goto(address)
    await expect(panel(colleague, 'Article').getByRole('heading', { name: headline })).toBeVisible()
    await colleague.close()

    await article.getByRole('button', { name: 'Share' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: /P\. Owona/ }).click()
    await dialog.getByRole('textbox', { name: 'Message (optional)' }).fill('COSUMAF approves it.')
    await dialog.getByRole('button', { name: 'Send' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByText('Shared with P. Owona.')).toBeVisible()

    // In MSG the article comes as a card, which opens it at its address.
    await page.goto('/msg')
    const sent = panel(page, 'P. Owona · Manager')
      .getByRole('listitem')
      .filter({ hasText: 'COSUMAF approves it.' })
    await expect(sent).toContainText(headline)
    await sent.getByRole('link', { name: 'Read the article' }).click()
    await expect(page).toHaveURL(address)
    await expect(panel(page, 'Article').getByRole('heading', { name: headline })).toBeVisible()
  },
)

// @fresh-db: the auctions as seeded, to which the Data admin's flows add.
test(
  'the CAL screen shows the week and the BEAC auctions',
  { tag: '@fresh-db' },
  async ({ page }) => {
    await page.goto('/cal')
    await expect(page.getByRole('region', { name: /^Monday / })).toBeVisible()
    await expect(page.getByRole('region', { name: /^Sunday / })).toContainText('No session')

    const auctions = panel(page, 'Latest government securities auctions (BEAC)')
    // The nine auctions of the screen 4 mockup and an older one, under the header row.
    await expect(auctions.getByRole('row')).toHaveCount(11)
    await auctions.getByRole('combobox', { name: 'Country' }).selectOption('CM')
    await expect(auctions.getByRole('row')).toHaveCount(4)

    await panel(page, 'Market calendar').getByRole('tab', { name: 'Day' }).click()
    await expect(page).toHaveURL(/\/cal\?view=day$/)
  },
)
