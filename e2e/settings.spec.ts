import { expect, test, type Page } from '@playwright/test'

// CFG of step 7 (ROADMAP.md): profile, security, subscription, organisation and invoices.

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section', { has: page.getByRole('heading', { name: title, exact: true }) })

/** The prototype's account switch reloads the app: wait for the new account's badge. */
async function switchAccount(page: Page, account: string, badge: RegExp) {
  await page.goto('/mkt')
  await page.getByRole('button', { name: /analyst/i }).click()
  await page.getByRole('menuitem', { name: account }).click()
  await expect(page.getByRole('button', { name: badge })).toBeVisible()
}

test('the profile keeps the language and the time zone of the user', async ({ page }) => {
  await page.goto('/cfg')
  const profile = panel(page, 'Profile')
  await expect(profile).toContainText('k.atangana@analyst.example')
  await expect(profile).toContainText('Analyst · approved')
  await profile.getByLabel('Time zone').selectOption('Europe/Paris')
  // Segmented choices are radio buttons hidden behind their labels.
  await profile.getByText('Français', { exact: true }).click()
  await profile.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('heading', { name: 'Profil', exact: true })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Menu principal' })).toContainText('Réglages')

  // The profile, not the browser, carries them to the next session.
  await page.reload()
  await expect(panel(page, 'Profil').getByLabel('Fuseau horaire')).toHaveValue('Europe/Paris')
  await expect(page.getByRole('banner')).toContainText(/Douala \d{2}:\d{2}:\d{2}/)
})

test('codes by SMS go to the phone of the profile', async ({ page }) => {
  await page.goto('/cfg')
  const security = panel(page, 'Security')
  await security.getByText('By SMS', { exact: true }).click()
  await expect(security).toContainText(
    'Each login asks for a code sent by SMS to +237 6 77 41 20 18.',
  )

  await page.getByRole('button', { name: /K\. Analyst/i }).click()
  await page.getByRole('menuitem', { name: 'Log out' }).click()
  await page.getByLabel('E-mail address').fill('k.atangana@analyst.example')
  await page.getByLabel('Password', { exact: true }).fill('cmarket2026')
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page.getByText('A code was sent by SMS to +237 ••• ••• 18.')).toBeVisible()
})

test('a Trader without the Portfolio module upgrades by mobile money', async ({ page }) => {
  await switchAccount(page, 'Trader', /trader/i)
  await page.getByRole('link', { name: /PORT/ }).click()
  await expect(page.getByText('The Portfolio module is not in your plan.')).toBeVisible()
  await page.getByRole('link', { name: 'See the plans' }).click()

  const subscription = panel(page, 'Subscription')
  await expect(subscription).toContainText('Paid by your organisation for 3 users')
  await subscription.getByRole('button', { name: 'Choose Professional' }).click()
  const dialog = page.getByRole('dialog', { name: 'Professional plan' })
  await expect(dialog).toContainText('3 users × XAF 700,000, yearly')
  await expect(dialog).toContainText('XAF 2,504,250')
  await dialog.getByText('Mobile money', { exact: true }).click()
  await dialog.getByLabel('Mobile money number').fill('+241 06 12 34 56')
  await dialog.getByRole('button', { name: 'Pay XAF 2,504,250' }).click()
  await expect(dialog.getByRole('status')).toContainText('Approve the payment of XAF 2,504,250')
  await expect(dialog.getByRole('status')).toHaveText(
    'Payment confirmed: your new plan is active.',
    { timeout: 10_000 },
  )
  // The footer's Close, after the title bar's.
  await dialog.getByRole('button', { name: 'Close' }).last().click()
  await expect(subscription.getByRole('row', { name: /Professional/ })).toContainText('Current')
  await expect(
    panel(page, 'Invoices')
      .getByRole('row', { name: /Professional/ })
      .first(),
  ).toContainText('Paid')

  await page.getByRole('link', { name: /PORT/ }).click()
  await expect(page.getByText('The Portfolio module is not in your plan.')).toHaveCount(0)
  await expect(
    page
      .getByRole('heading', { name: 'Model portfolio' })
      .or(page.getByRole('heading', { name: 'Valued positions' }))
      .first(),
  ).toBeVisible()
})

test('a bank transfer gives the invoice to pay, and the new plan at once', async ({ page }) => {
  await page.goto('/cfg')
  const subscription = panel(page, 'Subscription')
  await subscription.getByRole('tab', { name: 'Monthly' }).click()
  await subscription.getByRole('button', { name: 'Choose Analysis' }).click()
  const dialog = page.getByRole('dialog', { name: 'Analysis plan' })
  await dialog.getByText('Bank transfer', { exact: true }).click()
  await dialog.getByRole('button', { name: 'Get the invoice' }).click()
  await expect(dialog).toContainText('Pay the invoice by transfer, with its reference')
  await expect(dialog).toContainText('CM21 10005 00001 01234567890 12')
  // The footer's Close, after the title bar's.
  await dialog.getByRole('button', { name: 'Close' }).last().click()

  await expect(subscription).toContainText('An invoice is due by bank transfer')
  await expect(subscription).toContainText('Monitoring, Analysis')
  await expect(panel(page, 'Invoices').getByRole('row', { name: /Analysis/ })).toContainText(
    /Due \d{2}\/\d{2}/,
  )
  // The plan has no Portfolio module any more.
  await expect(page.getByRole('link', { name: /PORT/ })).toHaveAttribute(
    'title',
    /not in your plan/,
  )

  const download = page.waitForEvent('download')
  await panel(page, 'Invoices')
    .getByRole('button', { name: /Download invoice CM-2025/ })
    .click()
  expect((await download).suggestedFilename()).toMatch(/^CM-2025-\d{6}\.pdf$/)
})

test('an administrator invites a colleague, then withdraws the invitation', async ({ page }) => {
  await switchAccount(page, 'Portfolio manager', /manager/i)
  await page.goto('/cfg')
  const organization = panel(page, 'Organisation')
  await expect(organization).toContainText('Asset manager A · 3 members · you are an administrator')
  await organization.getByLabel('Invite by e-mail').fill('k.ndzi@asset-manager.example')
  await organization.getByRole('button', { name: 'Invite' }).click()
  const row = organization.getByRole('row', { name: /k\.ndzi@asset-manager\.example/ })
  await expect(row).toContainText(/Invited \d{2}\/\d{2}/)

  await row.click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Make administrator' }).click()
  await expect(row).toContainText('Administrator')
  await row.click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Withdraw the invitation' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Withdraw the invitation' }).click()
  await expect(row).toHaveCount(0)
})

test('a member of an organisation reads its plan without changing it', async ({ page }) => {
  await switchAccount(page, 'Student', /student/i)
  await page.goto('/cfg')
  const subscription = panel(page, 'Subscription')
  await expect(subscription).toContainText("Your organisation's administrators choose its plan.")
  await expect(panel(page, 'Organisation')).toContainText(
    "The organisation's administrators invite and remove members.",
  )
  await expect(panel(page, 'Invoices')).toContainText('No invoice yet.')
})

test('a new Analyst gets the trial and waits for the approval to publish', async ({ page }) => {
  // Logged out first: the sign-up page sends a logged-in user home.
  await page.goto('/mkt')
  await page.getByRole('button', { name: /K\. Analyst/i }).click()
  await page.getByRole('menuitem', { name: 'Log out' }).click()
  await page.goto('/signup')
  await page.getByText('Analyst', { exact: true }).click()
  await page.getByLabel('Full name').fill('R. Mintsa')
  await page.getByLabel('E-mail address').fill('r.mintsa@research.example')
  await page.getByLabel('Password', { exact: true }).fill('analyste2026')
  await page.getByLabel('Confirm the password').fill('analyste2026')
  await page.getByText('I accept the terms of use').click()
  await page.getByRole('button', { name: 'Create the account' }).click()
  await expect(page.getByText('Identity document', { exact: true }).locator('..')).toContainText(
    'Required.',
  )

  const pdf = { name: 'document.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') }
  await page.locator('input[type=file]').nth(0).setInputFiles(pdf)
  await page
    .locator('input[type=file]')
    .nth(1)
    .setInputFiles({ ...pdf, name: 'cv.pdf' })
  await page.getByRole('button', { name: 'Create the account' }).click()
  await page.getByRole('button', { name: 'Fill in' }).click()
  await page.getByRole('button', { name: 'Verify' }).click()
  await expect(page.getByRole('link', { name: 'Trial · 14 days' })).toBeVisible()
  // The studio waits for an Admin's approval of the Analyst status.
  await page.goto('/pub/new')
  await expect(page.getByText(/approv/i).first()).toBeVisible()
  await page.goto('/cfg')
  await expect(panel(page, 'Profile')).toContainText('Analyst · awaiting approval')
})
