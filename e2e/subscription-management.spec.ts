import { expect, test, type Page } from '@playwright/test'

// SUBS, the subscription management of ROADMAP step 34 (spec screen 14): the counters of the
// mockup (1,871 active, 143 expiring within 30 days, 62 expired, 9 failed payments, 48.6 M XAF
// collected), the subscriptions sorted by expiry with a member's "via organisation", K. Atangana's
// plan, payments and invoices; Extend, Suspend and lift, Change plan prorated by the day, Resend
// last invoice and the CSV; Research house M's declined card tried again, Media I's plan by
// agreement.

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section', { has: page.getByRole('heading', { name: title, exact: true }) })

/** The prototype's account switch reloads the app: wait for the Admin's badge in the top bar. */
async function asAdmin(page: Page) {
  await page.goto('/cfg')
  const topBar = page.getByRole('banner')
  await topBar.getByRole('button', { name: /analyst/i }).click()
  await page.getByRole('menuitem', { name: 'Admin', exact: true }).click()
  await expect(topBar.getByRole('button', { name: /^admin$/i })).toBeVisible()
}

/** The account the list's search finds, its subscription shown on the right. */
async function open(page: Page, query: string, row: RegExp) {
  const list = panel(page, 'Subscriptions')
  await list.getByLabel('Search an account').fill(query)
  await list.getByRole('row', { name: row }).first().click()
}

/** dd/mm/yyyy, as the screens write a day. */
const day = (date: Date) =>
  `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`

test(
  'SUBS shows the mockup’s counters, the subscriptions soonest expiry first and K. Atangana’s plan and history',
  // @fresh-db: the counters and K. Atangana's plan as seeded, which CFG's flows change.
  { tag: '@fresh-db' },
  async ({ page }) => {
    await asAdmin(page)
    await page.getByRole('combobox', { name: 'Command bar' }).fill('SUBS')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/admin\/subscriptions$/)
    // Between USER and MPAY in the Admin's menu, as the spec orders them.
    await expect(
      page.getByRole('navigation', { name: 'Main menu' }).getByRole('link').first(),
    ).toHaveText(/^USER/)
    await expect(
      page.getByRole('navigation', { name: 'Main menu' }).getByRole('link').nth(1),
    ).toHaveText(/^SUBS/)

    const counters = page.getByRole('group', { name: 'Subscription counters' })
    await expect(counters).toContainText(/Active subscriptions\s*1,871/)
    await expect(counters).toContainText(/Expiring within 30 days\s*143/)
    await expect(counters).toContainText(/Expired, not renewed\s*62/)
    await expect(counters).toContainText(/Failed payments \(30 d\)\s*9/)
    await expect(counters).toContainText(/Collected this month\s*48\.6\sM XAF/)

    // The failed charges first: Research house M's card is tried again, its analysts with it.
    const list = panel(page, 'Subscriptions')
    await expect(list).toContainText('50 of 2,083 subscriptions · page 1 / 42 · sort: expiry date')
    await expect(list.getByRole('row', { name: /^Research house M/ })).toContainText(
      /Analyst ×11\s*Professional annual\s*Payment failed/,
    )
    await expect(list.getByRole('row').nth(1)).toContainText('Payment failed')

    await open(page, 'atangana', /K\. Atangana/)
    const account = panel(page, 'Account subscription')
    await expect(account).toContainText(/Account\s*K\. Atangana · k\.atangana@analyst\.example/)
    await expect(account).toContainText(/Plan\s*Professional annual · XAF 700,000 \/ yr/)
    await expect(account).toContainText(/Status\s*Active/)
    await expect(account).toContainText(/Start\s*15\/03\/\d{4}/)
    await expect(account).toContainText(/Auto-renewal\s*Yes · card •••• 4417/)
    await expect(account).toContainText(/Last payment\s*15\/03\/\d{4} · XAF 834,750/)
    const payments = account.getByRole('region', { name: 'Payments and invoices' })
    await expect(payments.getByRole('row')).toHaveCount(6)
    await expect(payments.getByRole('row').nth(1)).toContainText(/834,750\s*Card\s*Paid/)
    await expect(payments.getByRole('row').nth(4)).toContainText(
      /53,663\s*Mobile money\s*Failed, then paid/,
    )

    // Each invoice number opens its PDF.
    await payments
      .getByRole('button', { name: /^Open invoice CM-\d{4}-\d{6}$/ })
      .first()
      .click()
    const pdf = page.getByRole('dialog', { name: /^CM-\d{4}-\d{6}$/ })
    await expect(pdf.locator('iframe')).toBeVisible()
    await pdf.getByRole('button', { name: 'Close' }).last().click()
  },
)

test('The Admin extends a plan, suspends it and lifts the suspension, and changes a plan prorated by the day', async ({
  page,
}) => {
  await asAdmin(page)
  await page.goto('/admin/subscriptions')
  await open(page, 'fotso', /L\. Fotso/)
  const account = panel(page, 'Account subscription')
  await expect(account).toContainText(/Plan\s*Analysis monthly · XAF 45,000 \/ mo/)
  await expect(account).toContainText(/Status\s*Expiring soon/)
  await expect(account).toContainText(/Auto-renewal\s*No · card •••• 8810/)

  // Free of charge to a later day, with the reason the log keeps.
  const until = day(new Date(Date.now() + 75 * 86_400_000))
  await account.getByRole('button', { name: 'Extend subscription' }).click()
  const extend = page.getByRole('dialog', { name: 'Extend the subscription of L. Fotso' })
  await extend.getByLabel('Extend to').fill(until)
  await extend.getByLabel('Reason').fill('Two months for the October outage.')
  await extend.getByRole('button', { name: 'Extend subscription' }).click()
  await expect(page.getByText(`The subscription of L. Fotso now runs to ${until}.`)).toBeVisible()
  await expect(account).toContainText(new RegExp(`Expiry\\s*${until.replaceAll('/', '\\/')}`))
  await expect(account).toContainText(/Status\s*Active/)

  // Suspended at once, with a reason; the plan cannot change until the suspension is lifted.
  await account.getByRole('button', { name: 'Suspend subscription' }).click()
  const suspend = page.getByRole('dialog', { name: 'Suspend the subscription of L. Fotso' })
  await suspend.getByLabel('Reason').fill('Card disputed with the bank.')
  await suspend.getByRole('button', { name: 'Suspend subscription' }).click()
  await expect(account).toContainText(/Status\s*Suspended/)
  await expect(account).toContainText(
    /Suspended on \d{2}\/\d{2}\/\d{4} by L\. Mvogo: Card disputed with the bank\./,
  )
  await expect(account.getByRole('button', { name: 'Change plan' })).toBeDisabled()
  await account.getByRole('button', { name: 'Lift the suspension' }).click()
  const lift = page.getByRole('dialog', { name: 'Lift the suspension of L. Fotso' })
  await lift.getByLabel('Reason').fill('The bank confirmed the card.')
  await lift.getByRole('button', { name: 'Lift the suspension' }).click()
  await expect(account).toContainText(/Status\s*Active/)

  // M. Ndong to Professional by the year: the days left of his month buy days of it.
  await open(page, 'ndong', /M\. Ndong/)
  await expect(account).toContainText(/Auto-renewal\s*Yes · mobile money •••• 4112/)
  await account.getByRole('button', { name: 'Change plan' }).click()
  const change = page.getByRole('dialog', { name: 'Change the plan of M. Ndong' })
  await expect(change).toContainText(
    'This is the plan in force: choose another plan or billing cycle.',
  )
  await change.getByRole('combobox', { name: 'New plan' }).selectOption('professional')
  // The segment's label: its radio is hidden under it.
  await change.getByText('Yearly', { exact: true }).click()
  await expect(change).toContainText(
    /\d+ days left of Analysis monthly, worth XAF [\d,]+ excluding VAT/,
  )
  await expect(change).toContainText(
    /They buy \d+ days of Professional annual: it renews on \d{2}\/\d{2}\/\d{4}, at its full price\./,
  )
  await change.getByRole('button', { name: 'Change plan' }).click()
  await expect(account).toContainText(/Plan\s*Professional annual · XAF 700,000 \/ yr/)
})

test('The counters filter the list; a declined card tried again, a media by agreement, a resent invoice and the CSV', async ({
  page,
}) => {
  await asAdmin(page)
  await page.goto('/admin/subscriptions')
  const counters = page.getByRole('group', { name: 'Subscription counters' })
  await counters.getByRole('button', { name: /Failed payments/ }).click()
  await expect(page).toHaveURL(/status=paymentFailed/)
  const list = panel(page, 'Subscriptions')
  await expect(list).toContainText(/14 of 14 subscriptions/)

  await list.getByRole('row', { name: /^Research house M/ }).click()
  const account = panel(page, 'Account subscription')
  await expect(account).toContainText(/Status\s*Payment failed/)
  await expect(account).toContainText(/Auto-renewal\s*Yes · card •••• 0002/)
  await expect(account).toContainText(/Tried again until \d{2}\/\d{2}\/\d{4}/)
  const payments = account.getByRole('region', { name: 'Payments and invoices' })
  await expect(payments.getByRole('row').nth(1)).toContainText(/Card\s*Failed/)
  await account.getByRole('button', { name: 'Resend last invoice' }).click()
  await expect(page.getByText(/^Invoice CM-\d{4}-\d{6} sent to /)).toBeVisible()

  // A media's News providers share its plan, free by agreement.
  await counters.getByRole('button', { name: /Failed payments/ }).click()
  await open(page, 'media i', /^Media I/)
  await expect(account).toContainText(/Type\s*News provider ×3/)
  await expect(account).toContainText(/Auto-renewal\s*No · by agreement/)
  await expect(account.getByRole('region', { name: 'Payments and invoices' })).toContainText(
    /0\s*Agreement\s*Paid/,
  )

  const download = page.waitForEvent('download')
  await list.getByRole('button', { name: 'Export CSV' }).click()
  expect((await download).suggestedFilename()).toBe('cmarket-subscriptions.csv')
})
