import { expect, test, type Page } from '@playwright/test'
import { demoId } from './demoIds.js'
import { DEMO_PASSWORD } from './session.js'

// The Admin's screens, step 9 (ROADMAP.md): USER with ANLY and MOD, then ADMCFG, AUDT and PAY.
// Step 18: the reports of the directory and the messaging in MOD, their settings in ADMCFG.

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section', { has: page.getByRole('heading', { name: title, exact: true }) })

/**
 * The prototype's account switch reloads the app: wait for the new account's badge, in the top
 * bar, as a button of a screen may hold the same word ("...the notes of another analyst").
 */
async function switchAccount(page: Page, from: RegExp, account: string, badge: RegExp) {
  const topBar = page.getByRole('banner')
  await topBar.getByRole('button', { name: from }).click()
  await page.getByRole('menuitem', { name: account, exact: true }).click()
  await expect(topBar.getByRole('button', { name: badge })).toBeVisible()
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
    ['Journalist', '37'],
    ['CEO', '58'],
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
  await expect(page).toHaveURL(new RegExp(`/admin/audit\\?userId=${demoId('user-mba')}$`))
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

test('status requests are approved or rejected with a reason, ANLY keeps them', async ({
  page,
}) => {
  await asAdmin(page)
  const requests = panel(page, 'Status requests')
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
  const list = panel(page, 'Status requests')
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
  await expect(page).toHaveURL(new RegExp(`/admin/moderation\\?id=${demoId('pub-chad-budget')}$`))
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

test('MOD reads a reported conversation, logged, suspends the referred account and dismisses a report', async ({
  page,
}) => {
  await asAdmin(page)
  await page.getByRole('link', { name: /MOD/ }).click()
  const reports = panel(page, 'Reported profiles and conversations')
  await expect(reports).toContainText('2 profiles · 1 conversation')

  // Y. Abessolo: 3 reports on the profile and 1 in a conversation, beyond the threshold of 3.
  await reports
    .getByRole('button', { name: /^Conversation Referred Y\. Abessolo · T\. Bekale/ })
    .click()
  await expect(page).toHaveURL(
    new RegExp(`report=conversation(%3A|:)${demoId('conversation-abessolo')}`),
  )
  const reader = panel(page, 'Reported conversation')
  await expect(reader).toContainText('Referred to the Admin: 4 open reports about Y. Abessolo')
  await expect(reader).toContainText('Scam or market manipulation')
  await reader.getByRole('button', { name: 'Read the conversation' }).click()
  await expect(reader.getByRole('list', { name: 'Messages' })).toContainText(
    'Send me 2,000,000 XAF by mobile money today',
  )
  await expect(reader).toContainText('This reading was written to the audit log.')
  await reader.getByRole('button', { name: 'Suspend account' }).click()
  const suspend = page.getByRole('dialog', { name: 'Suspend Y. Abessolo' })
  await suspend
    .getByRole('textbox', { name: 'Reason' })
    .fill('Asks members for money and promises guaranteed returns.')
  await suspend.getByRole('button', { name: 'Suspend account' }).click()
  await expect(page.getByText('Y. Abessolo: account suspended.')).toBeVisible()
  // Suspended, the account's reports are dealt with.
  await expect(reports).toContainText('1 profile · 0 conversations')

  await reports.getByRole('button', { name: /R\. Ondo/ }).click()
  const profile = panel(page, 'Reported profile')
  await expect(profile).toContainText('Presents the notes of another analyst as his own.')
  await profile.getByRole('button', { name: 'Dismiss the reports' }).click()
  await page
    .getByRole('dialog', { name: 'Dismiss the reports about R. Ondo' })
    .getByRole('button', { name: 'Dismiss the reports' })
    .click()
  await expect(page.getByText('Reports dismissed; written to the audit log.')).toBeVisible()
  await expect(reports).toContainText('No profile or conversation is reported.')

  await page.getByRole('link', { name: /AUDT/ }).click()
  const log = panel(page, 'Audit log')
  await expect(log.getByRole('row').nth(1)).toContainText('Reports dismissed')
  await expect(log.getByRole('row').nth(2)).toContainText('Account suspended')
  await expect(log.getByRole('row').nth(3)).toContainText('Reported conversation read')
})

test('ADMCFG sets the defaults and limits of the directory and edits its specialties', async ({
  page,
}) => {
  await asAdmin(page)
  await page.goto('/admin/settings')
  const directory = panel(page, 'Directory and messaging')
  await directory.getByRole('radio', { name: 'Student: Direct' }).check({ force: true })
  await directory.getByRole('textbox', { name: 'Student, new conversations a day' }).fill('8')
  await directory.getByRole('textbox', { name: 'Report threshold' }).fill('5')
  await directory.getByRole('button', { name: 'Save the directory settings' }).click()
  await expect(
    page.getByText('Directory settings saved; each change is written to the audit log.'),
  ).toBeVisible()

  const specialties = panel(page, 'Specialties')
  // Listed by profiles: renamed, not removed.
  await expect(specialties.getByRole('button', { name: 'Remove Sovereign bonds' })).toBeDisabled()
  await specialties
    .getByRole('textbox', { name: 'A new specialty, Name in English' })
    .fill('Islamic finance')
  await specialties
    .getByRole('textbox', { name: 'A new specialty, Name in French' })
    .fill('Finance islamique')
  await specialties.getByRole('button', { name: 'Add' }).click()
  await expect(page.getByText('Specialty added.')).toBeVisible()
  await expect(specialties.getByRole('row', { name: /Islamic finance/ })).toContainText(
    'No profile',
  )
  await specialties.getByRole('button', { name: 'Rename Islamic finance' }).click()
  await specialties
    .getByRole('textbox', { name: 'Rename Islamic finance, Name in English' })
    .fill('Islamic finance and sukuk')
  await specialties.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByText('Specialty renamed.')).toBeVisible()
  await specialties.getByRole('button', { name: 'Remove Islamic finance and sukuk' }).click()
  await page
    .getByRole('dialog', { name: 'Remove the specialty Islamic finance and sukuk' })
    .getByRole('button', { name: 'Remove Islamic finance and sukuk' })
    .click()
  await expect(page.getByText('Specialty removed.')).toBeVisible()
  await expect(specialties).not.toContainText('Islamic finance')

  await page.getByRole('link', { name: /AUDT/ }).click()
  const log = panel(page, 'Audit log')
  await expect(log.getByRole('row').nth(1)).toContainText('Specialty removed')
  await expect(log.getByRole('row').nth(2)).toContainText('Specialty renamed')
  await expect(log.getByRole('row').nth(3)).toContainText('Specialty added')
  const settings = log.getByRole('row').nth(4)
  await expect(settings).toContainText('Directory and messaging settings')
  await expect(settings).toContainText('Default contact rule, Student: Request → Direct')
  await expect(settings).toContainText('New conversations a day, Student: 5 → 8')
  await expect(settings).toContainText('Report threshold: 3 → 5')
})

test('PAY marks a September payout paid', async ({ page }) => {
  await asAdmin(page)
  await page.goto('/admin/payouts?month=2026-09&status=due')
  const payouts = panel(page, 'Analyst payouts')
  const ndong = payouts.getByRole('row', { name: /M\. Ndong/ })
  // The sample sales follow the date (a new month draws more of them), so the amount to pay is
  // the net of the row, not a figure of a given day.
  await expect(ndong).toBeVisible()
  const headers = await payouts.getByRole('columnheader').allTextContents()
  const net = (
    await ndong.getByRole('cell').nth(headers.indexOf('Net payable')).textContent()
  )?.trim()
  expect(net).toMatch(/^\d{1,3}(,\d{3})*$/)
  // The title bar's button marks the payout selected.
  await expect(payouts.getByRole('button', { name: 'Mark paid' })).toBeDisabled()
  await ndong.click()
  await payouts.getByRole('button', { name: 'Mark paid' }).click()
  const dialog = page.getByRole('dialog', { name: 'Mark the payout paid' })
  await expect(dialog).toContainText(`The transfer of XAF ${net} to M. Ndong for September 2026`)
  await dialog.getByRole('button', { name: 'Mark paid' }).click()
  await expect(page.getByText('M. Ndong, September 2026: marked paid.')).toBeVisible()
  await expect(ndong).toHaveCount(0)

  await payouts.getByRole('combobox', { name: 'Status' }).selectOption('paid')
  await expect(payouts.getByRole('row', { name: /M\. Ndong/ })).toContainText(/Paid.*L\. Mvogo/)
})
