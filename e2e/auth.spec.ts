import { expect, test } from '@playwright/test'
import { logIn, NO_SESSION } from './session.js'

// Login, one-time code, sign-up, password reset and logout of step 7 (ROADMAP.md).

test.use({ storageState: NO_SESSION })

test(
  'a login needs the password, then the code, and goes back to the page asked for',
  { tag: '@api' },
  async ({ page }) => {
    await page.goto('/port/portfolio-cemac/risk')
    await expect(page).toHaveURL(/\/login\?next=%2Fport%2Fportfolio-cemac%2Frisk$/)
    await page.getByLabel('E-mail address').fill('k.atangana@analyst.example')
    await page.getByLabel('Password', { exact: true }).fill('wrong-password-1')
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page.getByRole('alert')).toHaveText('Wrong e-mail address or password.')

    await page.getByLabel('Password', { exact: true }).fill('cmarket2026')
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page.getByText('A code was sent by e-mail to k•••@analyst.example.')).toBeVisible()
    const sent = (await page.getByText(/^\d{6}$/).textContent()) ?? ''
    const wrong = sent === '111111' ? '222222' : '111111'
    await page.getByLabel('Code').fill(wrong)
    await page.getByRole('button', { name: 'Verify' }).click()
    await expect(page.getByText('Wrong code: 4 attempts left.')).toBeVisible()
    await page.getByLabel('Code').fill(sent)
    await page.getByRole('button', { name: 'Verify' }).click()
    await expect(page).toHaveURL(/\/port\/portfolio-cemac\/risk$/)

    // The refresh cookie restores the session after a reload.
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Risk metrics' })).toBeVisible()
  },
)

test('a Student signs up with a school address and starts the free trial', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('link', { name: 'Create an account' }).click()
  await expect(page.getByRole('heading', { name: 'Create an account' })).toBeVisible()
  await page.getByText('Student', { exact: true }).click()
  await page.getByLabel('Full name').fill('N. Ewane')
  await page.getByLabel('E-mail address').fill('n.ewane@mail.example')
  await page.getByLabel('Password', { exact: true }).fill('etudiant2026')
  await page.getByLabel('Confirm the password').fill('etudiant2026')
  await page.getByText('I accept the terms of use').click()
  await page.getByRole('button', { name: 'Create the account' }).click()
  // Without a school address, the server asks for a proof of enrolment.
  await expect(
    page.getByText('Use your school e-mail address or add a proof of enrolment.'),
  ).toBeVisible()

  await page.getByLabel('E-mail address').fill('n.ewane@univ-douala.cm')
  await page.getByRole('button', { name: 'Create the account' }).click()
  await expect(page.getByText('A code was sent by e-mail to n•••@univ-douala.cm.')).toBeVisible()
  await page.getByRole('button', { name: 'Fill in' }).click()
  await page.getByRole('button', { name: 'Verify' }).click()
  await expect(page).toHaveURL(/\/mkt$/)
  await expect(page.getByRole('link', { name: 'Trial · 14 days' })).toBeVisible()
  await expect(page.getByRole('button', { name: /N\. Student/i })).toBeVisible()

  await page.getByRole('link', { name: 'Trial · 14 days' }).click()
  await expect(page.getByText(/^Free trial until \d{2}\/\d{2}\/\d{4}$/)).toBeVisible()
  const plans = page.getByRole('table', { name: 'Plans' })
  await expect(plans.getByRole('row', { name: /Student/ })).toContainText('XAF 50,000')
  await expect(page.getByText('No invoice yet.')).toBeVisible()
})

test('a password is reset with the code sent by e-mail', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('link', { name: 'Forgot your password?' }).click()
  await expect(page.getByRole('heading', { name: 'Reset the password' })).toBeVisible()
  await page.getByLabel('E-mail address').fill('p.owona@asset-manager.example')
  await page.getByRole('button', { name: 'Send the code' }).click()
  await expect(page.getByText(/If an account uses p\.owona@asset-manager\.example/)).toBeVisible()
  await page.getByRole('button', { name: 'Fill in' }).click()
  await page.getByLabel('New password').fill('nouveau2026')
  await page.getByLabel('Confirm the password').fill('nouveau2026')
  await page.getByRole('button', { name: 'Set the password' }).click()
  await expect(page.getByText('Your password is changed')).toBeVisible()

  await page.getByRole('link', { name: 'Back to the login' }).click()
  await expect(page.getByRole('heading', { name: 'Log in to CMarket' })).toBeVisible()
  await page.getByLabel('E-mail address').fill('p.owona@asset-manager.example')
  await page.getByLabel('Password', { exact: true }).fill('cmarket2026')
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page.getByRole('alert')).toHaveText('Wrong e-mail address or password.')
  await logIn(page, 'p.owona@asset-manager.example', 'nouveau2026')
  await expect(page.getByRole('button', { name: /P\. Manager/i })).toBeVisible()
})

test('logging out closes every tab of the browser', async ({ page, context }) => {
  await page.goto('/login')
  await logIn(page, 'k.atangana@analyst.example')
  const other = await context.newPage()
  await other.goto('/eqs')
  await expect(other.getByRole('heading', { name: /^Results/ })).toBeVisible()

  await page.getByRole('button', { name: /K\. Analyst/i }).click()
  await page.getByRole('menuitem', { name: 'Log out' }).click()
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByText('You are logged out.')).toBeVisible()
  await expect(other).toHaveURL(/\/login\?next=%2Feqs$/)
  await page.goto('/mkt')
  await expect(page).toHaveURL(/\/login\?next=%2Fmkt$/)
})

test('30 minutes without activity log the user out, after a warning', async ({ page }) => {
  await page.clock.install()
  await page.goto('/login')
  await logIn(page, 't.bekale@bank.example')
  await expect(page.getByRole('heading', { name: 'Indices' })).toBeVisible()

  await page.clock.fastForward('29:15')
  const warning = page.getByRole('dialog', { name: 'Still there?' })
  await expect(warning).toBeVisible()
  await expect(warning).toContainText(/logged out in \d+ seconds/)
  await page.clock.fastForward('01:00')
  await expect(page).toHaveURL(/\/login\?next=%2Fmkt$/)
  await expect(
    page.getByText('You were logged out after 30 minutes without activity.'),
  ).toBeVisible()
})
