import { expect, test, type Page } from '@playwright/test'

// NET ME, screen 12 (step 14 of ROADMAP.md): the professional profile, who sees it and who may
// write, and the card as the directory shows it.

const panel = (page: Page, title: string) =>
  page.locator('section', { has: page.getByRole('heading', { name: title, exact: true }) })

test('the Analyst opens NET ME from the command bar on the profile of the mockup', async ({
  page,
}) => {
  await page.goto('/mkt')
  await expect(page.getByRole('heading', { name: 'Indices' })).toBeVisible()
  await page.keyboard.press('Control+K')
  await page.keyboard.type('NET ME')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/net\/me$/)

  const profile = panel(page, 'My profile')
  await expect(profile.getByLabel('Job title')).toHaveValue('CEMAC equity & sovereign analyst')
  await expect(profile.getByRole('button', { name: 'Remove Agribusiness' })).toBeVisible()
  await expect(profile.getByText('Credit analyst, Bank H')).toBeVisible()
  const preview = panel(page, 'My card preview')
  await expect(preview).toContainText('42 publications · ★ 4.4 · 412 followers')
  await expect(preview.getByText('Contact', { exact: true })).toBeVisible()
  await expect(preview.getByRole('button', { name: 'Save' })).toBeDisabled()
})

test('a contact rule shows in the preview, and SAVE keeps it with the new job', async ({
  page,
}) => {
  await page.goto('/net/me')
  const profile = panel(page, 'My profile')
  const visibility = panel(page, 'Visibility and contact')
  const preview = panel(page, 'My card preview')

  await visibility.getByRole('radio', { name: 'Student: No' }).check({ force: true })
  await preview.getByRole('button', { name: 'Student', exact: true }).click()
  await expect(preview.getByText('Contact not open', { exact: true })).toBeVisible()
  await expect(profile).toContainText('Not saved')

  // A job is required; then the new one shows on the card at once.
  await profile.getByLabel('Job title').fill('')
  await preview.getByRole('button', { name: 'Save' }).click()
  await expect(profile.getByText('Required.')).toBeVisible()
  await profile.getByLabel('Job title').fill('Sovereign and equity analyst')
  await expect(preview).toContainText('Sovereign and equity analyst')
  await preview.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Profile saved.')).toBeVisible()
  await expect(profile).toContainText(/Saved at/i)

  await page.reload()
  await expect(panel(page, 'My profile').getByLabel('Job title')).toHaveValue(
    'Sovereign and equity analyst',
  )
  await expect(
    panel(page, 'Visibility and contact').getByRole('radio', { name: 'Student: No' }),
  ).toBeChecked()
})

test('an experience is added to the profile, then deleted', async ({ page }) => {
  await page.goto('/net/me')
  const profile = panel(page, 'My profile')
  await profile.getByRole('button', { name: 'Add experience or a certification' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('textbox', { name: 'Title' }).fill('Head of research')
  await dialog.getByRole('textbox', { name: 'Organisation' }).fill('Research house M')
  await dialog.getByRole('textbox', { name: 'From (year)' }).fill('2026')
  await dialog.getByRole('button', { name: 'Add' }).click()
  await expect(dialog).toBeHidden()
  const entry = profile.getByRole('listitem').filter({ hasText: 'Head of research' })
  await expect(entry).toContainText('2026 – now')

  await entry.getByRole('button', { name: 'Delete Head of research' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
  await expect(entry).toHaveCount(0)
})

test('the CMarket employees have no professional profile', async ({ page }) => {
  await page.goto('/cfg')
  await page.getByRole('button', { name: /analyst/i }).click()
  await page.getByRole('menuitem', { name: 'Admin', exact: true }).click()
  await expect(page.getByRole('button', { name: /^admin$/i })).toBeVisible()
  await page.goto('/net/me')
  await expect(page.getByText('This screen is not available for your account type.')).toBeVisible()
})
