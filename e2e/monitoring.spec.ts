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
  await news.getByRole('combobox', { name: 'Topic' }).selectOption('regulator')
  await expect(news.getByRole('button', { name: /Annual results: revenue up/ })).toHaveCount(0)
  await news.getByRole('button', { name: /Approval granted for a bond issue/ }).click()
  // CMarket.Api keys its news by their source and age: any id there.
  await expect(page).toHaveURL(/topic=regulator&article=[\w-]+$/)
  await expect(
    panel(page, 'Article').getByRole('heading', { name: 'Approval granted for a bond issue' }),
  ).toBeVisible()

  await page.getByRole('link', { name: 'DOC Documents' }).click()
  const documents = panel(page, 'Documents')
  await documents.getByRole('searchbox', { name: 'Search the documents' }).fill('annual report')
  await expect(documents.getByRole('listitem')).toHaveCount(3)
  await expect(page).toHaveURL(/\/n\/documents\?q=annual\+report$/)
})

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
