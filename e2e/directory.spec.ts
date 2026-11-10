import { expect, test, type Locator, type Page } from '@playwright/test'
import { analystId, demoId } from './demoIds.js'
import { logIn, NO_SESSION } from './session.js'

// NET, the professional directory of screen 10 (step 15 of ROADMAP.md): the search kept in the
// URL, the profile with its buttons, the rules of contact, the reports; the public page.

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section', { has: page.getByRole('heading', { name: title, exact: true }) })

async function tick(filters: Locator, name: string) {
  const box = filters.getByRole('checkbox', { name })
  await filters.getByText(name.replace(/ \d[\d,]*$/, ''), { exact: true }).click()
  await expect(box).toBeChecked()
}

// @fresh-db: the directory's counts as seeded, which other flows change.
test(
  'the Analyst finds the search of the mockup from the menu, and keeps it in the URL',
  { tag: '@fresh-db' },
  async ({ page }) => {
    await page.goto('/mkt')
    await page
      .getByRole('navigation', { name: 'Main menu' })
      .getByRole('link', { name: /NET/ })
      .click()
    await expect(page).toHaveURL(/\/net$/)

    const filters = panel(page, 'Filters')
    // The counters of the mockup: most Students hide their profile.
    await expect(filters.getByRole('checkbox', { name: /^Student/ })).toHaveAccessibleName(/412/)
    await expect(filters.getByRole('checkbox', { name: /^CEO/ })).toHaveAccessibleName(/58/)
    await expect(filters.getByRole('checkbox', { name: /^News provider/ })).toHaveAccessibleName(
      /14/,
    )
    await expect(panel(page, /^Professionals: 1,177 results$/)).toBeVisible()

    // The URL holds the filters: a box shows ticked once the address changed.
    await tick(filters, 'Analyst 96')
    await tick(filters, 'Manager 212')
    await filters.getByLabel('Specialty', { exact: true }).selectOption('sovereign-bonds')
    await tick(filters, 'Only profiles I can contact')
    const results = panel(page, 'Professionals: 64 results')
    await expect(results).toBeVisible()
    await expect(page).toHaveURL(/types=analyst%2Cmanager/)
    await expect(page).toHaveURL(/specialty=sovereign-bonds/)

    // The first result opens; the user is not among those they can contact.
    const profile = panel(page, 'Profile')
    await expect(profile.getByRole('heading', { name: 'M. Ndong' })).toBeVisible()
    await expect(results.getByRole('heading', { name: 'K. Atangana' })).toHaveCount(0)

    await page.reload()
    await expect(panel(page, 'Professionals: 64 results')).toBeVisible()
    await expect(
      panel(page, 'Filters').getByRole('checkbox', { name: 'Only profiles I can contact' }),
    ).toBeChecked()

    // Without the filter, the user's own card leads to NET ME.
    await page.goto('/net?q=atangana')
    await expect(profile.getByRole('heading', { name: 'K. Atangana' })).toBeVisible()
    await expect(profile.getByRole('link', { name: 'Edit my profile' })).toHaveAttribute(
      'href',
      '/net/me',
    )
  },
)

// @fresh-db: the contact rules as seeded, whose defaults the Admin's flow changes.
test(
  'a profile shows its publications, is followed, and opens them in PUB',
  { tag: '@fresh-db' },
  async ({ page }) => {
    await page.goto('/net?q=ndong')
    await page.getByRole('button', { name: 'View profile: M. Ndong' }).click()
    const profile = panel(page, 'Profile')
    await expect(profile.getByRole('heading', { name: 'M. Ndong' })).toBeVisible()
    await expect(profile).toContainText('Economist, public debt')
    await expect(profile.getByRole('link', { name: /^Gabon: oil supports revenue/ })).toBeVisible()
    await expect(profile).toContainText('Student: contact request to approve')
    await expect(profile).toContainText('E-mail and phone: hidden')
    await expect(profile.getByRole('button', { name: 'Send a message' })).toBeEnabled()

    // K. Atangana follows M. Ndong in the library already: unfollow, then follow again.
    await expect(profile).toContainText('268 followers')
    await profile.getByRole('button', { name: 'Following' }).click()
    await expect(profile.getByRole('button', { name: 'Follow analyst' })).toBeVisible()
    await expect(profile).toContainText('267 followers')
    await profile.getByRole('button', { name: 'Follow analyst' }).click()
    await expect(profile.getByRole('button', { name: 'Following' })).toBeVisible()

    await profile.getByRole('link', { name: 'View their publications (PUB)' }).click()
    await expect(page).toHaveURL(
      new RegExp(`/pub\\?analyst=${analystId('analyst-ndong', 'user-ndong')}`),
    )
    await expect(page.getByText('Publications of M. Ndong')).toBeVisible()
    await expect(panel(page, /^Publications: 26 results$/i)).toBeVisible()
    await page.getByRole('button', { name: 'All the analysts' }).click()
    await expect(page).toHaveURL(/\/pub$/)
  },
)

test('each card follows the rules of its profile: a request, a closed door, an approval', async ({
  page,
}) => {
  await page.goto('/net?q=tchakounte')
  const tchakounte = page.getByRole('listitem').filter({ hasText: 'A. Tchakounté' })
  await expect(tchakounte.getByRole('button', { name: 'Send a contact request' })).toBeVisible()

  // D. Moussavou waits for an Admin's approval: the messaging is not open yet.
  await page.goto('/net?q=moussavou')
  const moussavou = page.getByRole('listitem').filter({ hasText: 'D. Moussavou' })
  await expect(moussavou.getByRole('button', { name: 'Contact not open' })).toBeDisabled()
  await tick(panel(page, 'Filters'), 'Only profiles I can contact')
  await expect(page.getByText('No profile matches these filters.')).toBeVisible()

  // Contact opens the conversation in MSG.
  await page.goto('/net?q=fotso')
  await page
    .getByRole('listitem')
    .filter({ hasText: 'L. Fotso' })
    .getByRole('button', { name: 'Contact', exact: true })
    .click()
  await expect(page).toHaveURL(new RegExp(`/msg\\?to=${demoId('user-fotso')}$`))
  await expect(page.getByRole('heading', { name: 'New conversation with L. Fotso' })).toBeVisible()
})

test('a profile is reported once', async ({ page }) => {
  await page.goto(`/net?q=ngoma&profile=${demoId('user-ngoma')}`)
  const profile = panel(page, 'Profile')
  await expect(profile.getByRole('heading', { name: 'B. Ngoma' })).toBeVisible()

  await profile.getByRole('button', { name: 'Report this profile' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Send the report' }).click()
  await expect(dialog.getByText('Choose a reason.')).toBeVisible()
  await dialog.getByLabel('Reason').selectOption('fake')
  await dialog.getByRole('button', { name: 'Send the report' }).click()
  await expect(page.getByText('Report sent: the CMarket team will review it.')).toBeVisible()
  await expect(dialog).toBeHidden()

  await profile.getByRole('button', { name: 'Report this profile' }).click()
  await page.getByRole('dialog').getByLabel('Reason').selectOption('spam')
  await page.getByRole('dialog').getByRole('button', { name: 'Send the report' }).click()
  await expect(page.getByText('You already reported this profile.')).toBeVisible()
})

test.describe('a visitor', () => {
  test.use({ storageState: NO_SESSION })

  // @fresh-db: P. Owona's password as seeded, which the reset flow of auth.spec.ts changes.
  test(
    'reads a public profile without its contact details, then logs in to contact',
    { tag: '@fresh-db' },
    async ({ page }) => {
      await page.goto('/p/k-atangana')
      await expect(page.getByText('This profile is not public, or no longer exists.')).toBeVisible()
      await expect(page).toHaveTitle('This profile is not public, or no longer exists. · CMarket')

      await page.goto('/p/m-ndong')
      await expect(page.getByRole('heading', { level: 1, name: 'M. Ndong' })).toBeVisible()
      await expect(page.getByText('Economist, public debt')).toBeVisible()
      await expect(page.getByText(/ndong-research\.example/)).toHaveCount(0)
      await page.getByRole('link', { name: 'Log in to contact' }).click()

      await expect(page).toHaveURL(/\/login\?next=/)
      await logIn(page, 'p.owona@asset-manager.example')
      await expect(page).toHaveURL(new RegExp(`/net\\?profile=${demoId('user-ndong')}$`))
      await expect(panel(page, 'Profile').getByRole('heading', { name: 'M. Ndong' })).toBeVisible()
    },
  )
})
