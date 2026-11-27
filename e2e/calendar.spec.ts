import { expect, test, type Page } from '@playwright/test'

// CAL (screen 32, sixth version), ROADMAP step 67: the Analyst opens CAL from the command bar,
// reads the agenda by day with its filters and counts, picks an auction for its detail and its
// ICS, narrows the types and the states, keeps only their securities, exports the list and opens
// AUC from an auction. The Data admin enters an announced statistic in CORR, which CAL shows;
// the Analyst sets an alert on Cameroon's auctions, listed in "My calendar alerts".

async function switchAccount(page: Page, from: RegExp, account: string, badge: RegExp) {
  const topBar = page.getByRole('banner')
  await topBar.getByRole('button', { name: from }).click()
  await page.getByRole('menuitemradio', { name: account, exact: true }).click()
  await expect(topBar.getByRole('button', { name: badge })).toBeVisible()
}

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section').filter({ has: page.getByRole('heading', { name: title }) })

test('CAL shows the agenda by day with its filters, an event’s detail and ICS, the exports', async ({
  page,
}) => {
  await page.goto('/mkt')
  const command = page.getByRole('combobox', { name: 'Command bar' })
  await command.fill('CAL')
  await command.press('Enter')
  await expect(page).toHaveURL(/\/cal$/)

  const filters = panel(page, 'Filters')
  await expect(filters.getByRole('checkbox', { name: 'BTA / OTA auctions' })).toBeChecked()
  await expect(filters.getByRole('checkbox', { name: 'International (EODHD)' })).not.toBeChecked()
  await expect(
    filters.getByRole('group', { name: 'Countries' }).getByRole('button', { name: 'CMR' }),
  ).toHaveAttribute('aria-pressed', 'true')

  // The agenda by day, in Douala time: BANGE's extraordinary GM with its agenda, the coming auctions.
  const agenda = panel(page, 'Agenda')
  await expect(agenda).toContainText(/\d+ events · Douala time/)
  const meeting = agenda.getByRole('button', {
    name: /11:00\s*AGM\s*GNQ\s*BANGE · extraordinary GM/,
  })
  await expect(meeting).toContainText('Agenda: capital increase')
  const auction = agenda
    .getByRole('button', { name: /10:00\s*Auction\s*CMR\s*BTA 26 weeks/ })
    .first()
  await expect(auction).toContainText(/Offered 25 bn/)

  // Its detail: the amount offered, the results around 15:00, the previous comparable; its ICS.
  await auction.click()
  await expect(page).toHaveURL(/event=planned-/)
  const detail = panel(page, 'Event')
  await expect(detail).toContainText(/Auction · CMR BTA 26 weeks/)
  await expect(detail).toContainText('Results around 15:00')
  await expect(detail).toContainText(/Amount offered\s*XAF 25,000 M/)
  await expect(detail).toContainText(/Previous comparable\s*\d{2}\/\d{2}\/\d{4} · \d\.\d\d%/)
  const ics = page.waitForEvent('download')
  await detail.getByRole('button', { name: 'Add to my calendar (ICS)' }).click()
  expect((await ics).suggestedFilename()).toMatch(/^cmarket-auction-\d{4}-\d{2}-\d{2}\.ics$/)

  // The types and the states narrow the agenda; the counts stay those of every type.
  await filters.getByText('BTA / OTA auctions', { exact: true }).click()
  await expect(page).toHaveURL(/types=/)
  // The auctions' results stay: a type of their own.
  await expect(agenda.getByRole('button', { name: /Auction\s*CMR\s*BTA 26 weeks/ })).toHaveCount(0)
  await filters.getByRole('button', { name: 'GNQ' }).click()
  await expect(agenda.getByRole('button', { name: /BANGE · extraordinary GM/ })).toHaveCount(0)
  await filters.getByRole('button', { name: 'Reset' }).click()
  await expect(page).toHaveURL(/\/cal$/)

  // Only my securities: those of the Analyst's watchlists and portfolios.
  await filters.getByText('Only my securities (portfolios, watchlists)').click()
  await expect(page).toHaveURL(/mine=1/)
  await expect(
    agenda.getByRole('button', { name: /CEMAC\s*Monetary Policy Committee/ }),
  ).toHaveCount(0)
  await filters.getByText('Only my securities (portfolios, watchlists)').click()

  const xlsx = page.waitForEvent('download')
  await filters.getByRole('button', { name: 'Export the events shown as XLSX' }).click()
  expect((await xlsx).suggestedFilename()).toMatch(/^cmarket-calendar-.*\.xlsx$/)

  // The month view; an auction opens AUC on its state with a double click.
  await filters.getByText('Month', { exact: true }).click()
  await expect(page).toHaveURL(/view=month/)
  await agenda
    .getByRole('button', { name: /10:00\s*Auction\s*CMR\s*BTA 26 weeks/ })
    .first()
    .dblclick()
  await expect(page).toHaveURL(/\/auc\?country=CM$/)
})

test('The Data admin enters an announced statistic; an alert on Cameroon’s auctions is listed @fresh-db', async ({
  page,
}) => {
  await page.goto('/mkt')
  await switchAccount(page, /analyst/i, 'Data admin', /data admin/i)
  await page.goto('/data/corrections')
  const corr = panel(page, 'Calendar events')
  await corr.getByRole('button', { name: 'Enter an event' }).click()
  const form = page.getByRole('dialog', { name: 'A new event of the calendar' })
  await form.getByRole('textbox', { name: 'Event' }).fill('GDP growth (Q3)')
  await form.getByRole('textbox', { name: 'Detail' }).fill('Previous 2.9% year on year')
  await form.getByRole('textbox', { name: 'Time' }).fill('9h30')
  await form.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('GDP growth (Q3) saved.')).toBeVisible()
  await expect(corr).toContainText(/GDP growth \(Q3\) · announced date · Entered by the Data admin/)

  await switchAccount(page, /data admin/i, 'Analyst', /analyst/i)
  await page.goto('/cal')
  const agenda = panel(page, 'Agenda')
  await expect(
    agenda.getByRole('button', { name: /09:30\s*Statistic\s*CEMAC\s*GDP growth \(Q3\)/ }),
  ).toContainText('Previous 2.9% year on year · announced date')

  // The bell of a Cameroonian auction: a calendar alert on Cameroon's auctions, the day before.
  const auction = agenda
    .getByRole('listitem')
    .filter({ hasText: /10:00\s*Auction\s*CMR\s*BTA 26 weeks/ })
    .first()
  await auction
    .getByRole('button', { name: 'Create an alert on BTA 26 weeks', exact: true })
    .click()
  const dialog = page.getByRole('dialog', { name: 'New alert' })
  await expect(dialog.getByRole('combobox', { name: 'Type' })).toHaveValue('calendar')
  await expect(dialog.getByRole('combobox', { name: 'Event' })).toHaveValue('auction')
  await expect(dialog.getByRole('combobox', { name: 'Country' })).toHaveValue('CM')
  await dialog.getByRole('button', { name: 'Create', exact: true }).click()
  const mine = panel(page, 'My calendar alerts')
  await expect(mine.getByRole('button', { name: /BTA \/ OTA auctions — Cameroon/ })).toContainText(
    'D−1 · screen',
  )
})
