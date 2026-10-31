import { expect, test, type Page } from '@playwright/test'
import { DEMO_PASSWORD } from './session.js'

// The Admin's screens, step 9 (ROADMAP.md): USER with ANLY and MOD, then ADMCFG, AUDT and PAY.

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section', { has: page.getByRole('heading', { name: title, exact: true }) })

/** The prototype's account switch reloads the app: wait for the new account's badge. */
async function switchAccount(page: Page, from: RegExp, account: string, badge: RegExp) {
  await page.getByRole('button', { name: from }).click()
  await page.getByRole('menuitem', { name: account, exact: true }).click()
  await expect(page.getByRole('button', { name: badge })).toBeVisible()
}

async function asAdmin(page: Page) {
  await page.goto('/cfg')
  await switchAccount(page, /analyst/i, 'Admin', /^admin$/i)
}

/** Finds one account of the list by its e-mail address and shows its details. */
async function openAccount(page: Page, email: string) {
  const accounts = panel(page, 'Accounts')
  await accounts.getByRole('textbox', { name: 'Search the accounts' }).fill(email)
  await expect(accounts.getByRole('row')).toHaveCount(2)
  await accounts.getByRole('row').nth(1).click()
  return panel(page, 'Account details')
}

test('USER counts the accounts by type, filters them and opens the audit log of one', async ({
  page,
}) => {
  await asAdmin(page)
  await expect(page).toHaveURL(/\/admin\/users/)
  const counters = page.getByRole('group', { name: 'Active accounts by type' })
  for (const [type, count] of [
    ['Student', '1,284'],
    ['Analyst', '96'],
    ['Portfolio manager', '212'],
    ['Trader', '348'],
    ['Data admin', '4'],
    ['Admin', '2'],
  ]) {
    await expect(
      counters.getByRole('button', { name: new RegExp(`^${type}\\s*${count}\\s*active$`) }),
    ).toBeVisible()
  }
  // A counter filters the list on its type.
  await counters.getByRole('button', { name: /^Analyst/ }).click()
  const accounts = panel(page, 'Accounts')
  await expect(accounts).toContainText('96 accounts')
  await expect(accounts.getByRole('row', { name: /R\. Essomba/ })).toContainText('Under review')
  await counters.getByRole('button', { name: /^Analyst/ }).click()

  const details = await openAccount(page, 'f.mba@bank.example')
  await expect(details).toContainText('Suspended on 12/10/2026 by L. Mvogo')
  await expect(details.getByRole('button', { name: 'Reactivate account' })).toBeVisible()
  await details.getByRole('button', { name: 'View audit log' }).click()
  await expect(page).toHaveURL(/\/admin\/audit\?userId=user-mba$/)
  const log = panel(page, 'Audit log')
  await expect(log.getByRole('combobox', { name: 'User' })).toHaveValue('F. Mba')
  await expect(log.getByRole('row')).toHaveCount(2)
  await log.getByRole('row').nth(1).click()
  const entry = panel(page, 'Entry')
  await expect(entry).toContainText('Account suspended')
  await expect(entry).toContainText('Login shared outside Bank C')
  await expect(entry.getByRole('row', { name: /Status/ })).toContainText(/Active\s*Suspended/)
})

test('an Admin creates a Data admin, then suspends a trader, who can no longer log in', async ({
  page,
}) => {
  await asAdmin(page)
  await panel(page, 'Accounts').getByRole('button', { name: 'Create account' }).click()
  const dialog = page.getByRole('dialog', { name: 'Create an account' })
  await dialog.getByRole('textbox', { name: 'Name' }).fill('N. Abessolo')
  await dialog.getByRole('textbox', { name: 'E-mail (login)' }).fill('n.abessolo@cmarket.example')
  await dialog.getByRole('combobox', { name: 'Account type' }).selectOption('dataAdmin')
  await expect(dialog.getByRole('combobox', { name: 'Organisation' })).toBeDisabled()
  await dialog.getByRole('button', { name: 'Create the account' }).click()
  await expect(
    page.getByText('N. Abessolo: account created, an invitation was sent by e-mail.'),
  ).toBeVisible()
  const details = panel(page, 'Account details')
  await expect(details).toContainText('Mandatory · e-mail')
  await expect(
    page
      .getByRole('group', { name: 'Active accounts by type' })
      .getByRole('button', { name: /^Data admin\s*5\s/ }),
  ).toBeVisible()

  await openAccount(page, 'l.ella@bank.example')
  await details.getByRole('button', { name: 'Suspend account' }).click()
  const suspend = page.getByRole('dialog', { name: 'Suspend L. Ella' })
  await suspend.getByRole('textbox', { name: 'Reason' }).fill('Card payment disputed twice.')
  await suspend.getByRole('button', { name: 'Suspend account' }).click()
  await expect(page.getByText('L. Ella: account suspended.')).toBeVisible()
  await expect(panel(page, 'Accounts').getByRole('row', { name: /L\. Ella/ })).toContainText(
    'Suspended',
  )

  // The suspended trader is refused at login.
  await page.getByRole('button', { name: /^admin$/i }).click()
  await page.getByRole('menuitem', { name: 'Log out' }).click()
  await page.getByLabel('E-mail address').fill('l.ella@bank.example')
  await page.getByLabel('Password', { exact: true }).fill(DEMO_PASSWORD)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page.getByText('This account is suspended. Contact CMarket.')).toBeVisible()
})

test('Analyst status requests are approved or rejected with a reason, ANLY keeps them', async ({
  page,
}) => {
  await asAdmin(page)
  const requests = panel(page, 'Analyst status requests')
  await expect(requests).toContainText('3 pending')
  const essomba = requests.getByRole('listitem').filter({ hasText: 'R. Essomba' })
  await expect(essomba).toContainText('Documents: CV, ID, licence')
  await essomba.getByRole('button', { name: 'Approve' }).click()
  const approve = page.getByRole('dialog', { name: 'Approve R. Essomba' })
  await approve.getByRole('button', { name: 'Approve' }).click()
  await expect(page.getByText('R. Essomba: Analyst status approved.')).toBeVisible()
  await expect(requests).toContainText('2 pending')

  // A supporting document opens in the PDF viewer.
  const biyong = requests.getByRole('listitem').filter({ hasText: 'F. Biyong' })
  await biyong.getByRole('button', { name: 'CV' }).click()
  await expect(page.locator('iframe[title="Biyong_CV_2026.pdf"]')).toBeAttached()
  await page.keyboard.press('Escape')
  await biyong.getByRole('button', { name: 'Reject' }).click()
  const reject = page.getByRole('dialog', { name: 'Reject F. Biyong' })
  await reject
    .getByRole('textbox', { name: 'Reason' })
    .fill('No licence and no published research.')
  await reject.getByRole('button', { name: 'Reject' }).click()
  await expect(page.getByText('F. Biyong: request rejected.')).toBeVisible()

  await page.getByRole('link', { name: /ANLY/ }).click()
  const list = panel(page, 'Analyst status requests')
  await list.getByRole('tab', { name: 'Rejected' }).click()
  await list.getByRole('row', { name: /F\. Biyong/ }).click()
  await expect(panel(page, 'Request')).toContainText(
    /Rejected on .* by L\. Mvogo: No licence and no published research\./,
  )
  await list.getByRole('tab', { name: 'Approved' }).click()
  await expect(list.getByRole('row').nth(1)).toContainText('R. Essomba')
})

test('MOD approves a first publication, which readers then find, and takes a report down', async ({
  page,
}) => {
  await asAdmin(page)
  // "Open" in the queue of screen 9 goes to MOD.
  const queue = panel(page, 'Moderation queue')
  await queue
    .getByRole('listitem')
    .filter({ hasText: 'Chad: 2027 budget and financing needs' })
    .getByRole('button', { name: 'Open' })
    .click()
  await expect(page).toHaveURL(/\/admin\/moderation\?id=pub-chad-budget$/)
  const reader = panel(page, 'Publication')
  await expect(reader).toContainText('First publication: review before going live')
  await expect(
    reader.getByRole('heading', { name: 'Chad: 2027 budget and financing needs' }),
  ).toBeVisible()
  await reader.getByRole('button', { name: 'Approve' }).click()
  await page
    .getByRole('dialog', { name: 'Approve the publication' })
    .getByRole('button', { name: 'Approve' })
    .click()
  await expect(page.getByText('Publication approved: it is live.')).toBeVisible()

  // The SAFACAM note, reported for an undeclared conflict of interest.
  await queue.getByRole('button', { name: /SAFACAM: rubber prices and 2027 outlook/ }).click()
  await expect(reader).toContainText('Undisclosed conflict of interest')
  await reader.getByRole('button', { name: 'Take down' }).click()
  const takeDown = page.getByRole('dialog', { name: 'Take the publication down' })
  await takeDown.getByRole('textbox', { name: 'Reason' }).fill('Conflict of interest confirmed.')
  await takeDown.getByRole('button', { name: 'Take down' }).click()
  await expect(page.getByText('Publication taken down.')).toBeVisible()
  await expect(queue).not.toContainText('SAFACAM: rubber prices')
  await expect(queue).toContainText('1 report')

  await switchAccount(page, /^admin$/i, 'Analyst', /analyst/i)
  await page.goto('/pub')
  const library = panel(page, /^Publications: \d+ results$/)
  await expect(library.getByRole('listitem').first()).toContainText(
    'Chad: 2027 budget and financing needs',
  )
  await expect(library).not.toContainText('SAFACAM: rubber prices and 2027 outlook')
})

test('ADMCFG changes a quota and a permission, both written to the audit log', async ({ page }) => {
  await asAdmin(page)
  await page.getByRole('link', { name: /CFG/ }).click()
  const settings = panel(page, 'Platform settings')
  await settings.getByRole('textbox', { name: 'Student, Alerts' }).fill('15')
  await settings.getByRole('button', { name: 'Save the settings' }).click()
  await expect(
    page.getByText('Settings saved; each change is written to the audit log.'),
  ).toBeVisible()

  const permissions = panel(page, 'Permissions')
  await expect(
    permissions.getByRole('checkbox', { name: 'Settings and permissions, Admin' }),
  ).toBeDisabled()
  // The box is drawn over its hidden input: the click goes through the label.
  await permissions.getByRole('checkbox', { name: 'Client reports, Trader' }).check({ force: true })
  await expect(permissions).toContainText('1 change not saved')
  await permissions.getByRole('button', { name: 'Save the permissions' }).click()
  await expect(page.getByText('1 permission changed, written to the audit log.')).toBeVisible()

  await page.getByRole('link', { name: /AUDT/ }).click()
  const log = panel(page, 'Audit log')
  await expect(log.getByRole('row').nth(1)).toContainText('Permissions of Trader')
  await expect(log.getByRole('row').nth(1)).toContainText('Client reports: no → yes')
  await expect(log.getByRole('row').nth(2)).toContainText('Alerts, Student: 10 → 15')
})

test('PAY marks a September payout paid', async ({ page }) => {
  await asAdmin(page)
  await page.goto('/admin/payouts?month=2026-09&status=due')
  const payouts = panel(page, 'Analyst payouts')
  const ndong = payouts.getByRole('row', { name: /M\. Ndong/ })
  // The title bar's button marks the payout selected.
  await expect(payouts.getByRole('button', { name: 'Mark paid' })).toBeDisabled()
  await ndong.click()
  await payouts.getByRole('button', { name: 'Mark paid' }).click()
  const dialog = page.getByRole('dialog', { name: 'Mark the payout paid' })
  await expect(dialog).toContainText('The transfer of XAF 92,800 to M. Ndong for September 2026')
  await dialog.getByRole('button', { name: 'Mark paid' }).click()
  await expect(page.getByText('M. Ndong, September 2026: marked paid.')).toBeVisible()
  await expect(ndong).toHaveCount(0)

  await payouts.getByRole('combobox', { name: 'Status' }).selectOption('paid')
  await expect(payouts.getByRole('row', { name: /M\. Ndong/ })).toContainText(/Paid.*L\. Mvogo/)
})
