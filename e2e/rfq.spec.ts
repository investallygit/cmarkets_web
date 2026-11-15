import { expect, test, type Page } from '@playwright/test'

// The traders' links to the SVTs (screens 22 and 27), ROADMAP step 43, on the demo's links of the
// mockups: T. Bekale's "My SVTs", the SVT B. Sima's trader links at Bank E (TRD), P. Owona's link
// confirmed with a limit, the RFQ's switch and licensed SVTs in ADMCFG, an SVT account in USER.

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section', { has: page.getByRole('heading', { name: title }) })

/** The prototype's account switch reloads the app: wait for the new account's badge. */
async function switchAccount(page: Page, from: RegExp, account: string, badge: RegExp) {
  const topBar = page.getByRole('banner')
  await topBar.getByRole('button', { name: from }).click()
  await page.getByRole('menuitem', { name: account, exact: true }).click()
  await expect(topBar.getByRole('button', { name: badge })).toBeVisible()
}

const svtRow = (page: Page, bank: string) =>
  panel(page, 'My SVTs')
    .getByRole('listitem')
    .filter({ hasText: `${bank} (SVT)` })

// @fresh-db: the demo's links as seeded, which the flow changes.
test(
  'a trader reads its SVTs, the SVT confirms a request on TRD, the manager reads it confirmed',
  { tag: '@fresh-db' },
  async ({ page }) => {
    await page.goto('/mkt')
    await switchAccount(page, /analyst/i, 'Trader', /trader/i)
    const menu = page.getByRole('navigation', { name: 'Main menu' })
    await menu.getByRole('link', { name: /^RFQ/ }).click()
    await expect(page).toHaveURL(/\/rfq$/)

    // The screen 22 mockup's "My SVTs" (a no-break space between an amount and its unit).
    await expect(svtRow(page, 'Bank D')).toContainText(
      /Confirmed on 12\/09\/2026 · 1\sBn \/ day\s*Confirmed/,
    )
    await expect(svtRow(page, 'Bank E')).toContainText(/Confirmed on 03\/10\/2026\s*Confirmed/)
    await expect(svtRow(page, 'Bank H')).toContainText(
      /Request sent \d\d\/\d\d · expires \d\d\/\d\d\s*Pending/,
    )
    await expect(svtRow(page, 'Bank G')).toContainText(
      /Link withdrawn by the SVT on 15\/10\s*Withdrawn/,
    )

    // Bank F asked, then removed.
    await panel(page, 'My SVTs')
      .getByRole('button', { name: 'Add an SVT (confirmation e-mail)' })
      .click()
    const dialog = page.getByRole('dialog', { name: 'Add an SVT' })
    await expect(dialog.getByRole('combobox')).toContainText('Bank F (SVT)')
    await expect(dialog.getByRole('option', { name: 'Bank D (SVT)' })).toHaveCount(0)
    await dialog.getByRole('combobox').selectOption({ label: 'Bank F (SVT)' })
    await dialog.getByRole('button', { name: 'Send the request' }).click()
    await expect(page.getByText('Request sent to Bank F.')).toBeVisible()
    await expect(svtRow(page, 'Bank F')).toContainText('Pending')
    await svtRow(page, 'Bank F').getByRole('button', { name: 'Remove Bank F' }).click()
    await page
      .getByRole('dialog', { name: 'Remove this SVT?' })
      .getByRole('button', { name: 'Remove Bank F' })
      .click()
    await expect(svtRow(page, 'Bank F')).toContainText(/Removed on \d\d\/\d\d\s*Withdrawn/)

    // B. Sima, Bank E's SVT: its menu, SVT its home (ROADMAP step 45), MSG with its linked traders
    // (step 48), its two requests on TRD, P. Owona confirmed with a limit.
    await switchAccount(page, /trader/i, 'SVT', /svt/i)
    await expect(page).toHaveURL(/\/svt$/)
    await expect(menu.getByRole('link')).toHaveText([/^SVT/, /^TRD/, /^AGR/, /^MSG/, /^N/, /^CFG/])
    await menu.getByRole('link', { name: /^TRD/ }).click()
    await expect(page).toHaveURL(/\/svt\/traders$/)
    const links = panel(page, /^Trader links/)
    await expect(links.getByText('2 requests')).toBeVisible()
    const requests = links.getByRole('region', { name: 'Link requests' })
    await expect(requests.getByRole('listitem')).toHaveText([
      /P\. Owona · Asset manager A/,
      /L\. Ella · Bank C/,
    ])
    await requests.getByRole('button', { name: 'Confirm · P. Owona' }).click()
    const confirm = page.getByRole('dialog', { name: "Confirm P. Owona's link" })
    // The bank's default client limit offered (screen 27's settings, XAF 500 million), set higher.
    const dailyLimit = confirm.getByRole('textbox', { name: 'Daily limit (XAF)' })
    await expect(confirm.getByRole('checkbox', { name: 'No limit' })).not.toBeChecked()
    await expect(dailyLimit).toHaveValue(/^500.000.000$/)
    await dailyLimit.fill('750000000')
    await confirm.getByRole('button', { name: 'Confirm the link' }).click()
    await expect(page.getByText("P. Owona's link confirmed.")).toBeVisible()
    await requests.getByRole('button', { name: 'Decline · L. Ella' }).click()
    await expect(page.getByText("L. Ella's request declined.")).toBeVisible()
    await expect(requests.getByText('No request waits.')).toBeVisible()
    const linked = links.getByRole('region', { name: 'Linked traders' })
    await expect(linked.getByRole('row', { name: /P\. Owona · Asset manager A/ })).toContainText(
      '750 M / day',
    )
    // A linked trader picked in the table gets its buttons under it.
    await linked.getByRole('row', { name: /A\. Tchakounté/ }).click()
    await linked.getByRole('button', { name: "Change A. Tchakounté's limit" }).click()
    const limit = page.getByRole('dialog', { name: "A. Tchakounté's daily limit" })
    await limit.getByRole('textbox', { name: 'Daily limit (XAF)' }).fill('600000000')
    await limit.getByRole('button', { name: 'Save the limit' }).click()
    await expect(page.getByText("A. Tchakounté's limit saved.")).toBeVisible()
    await expect(linked.getByRole('row', { name: /A\. Tchakounté/ })).toContainText('600 M / day')
    await linked.getByRole('row', { name: /C\. Abena/ }).click()
    await linked.getByRole('button', { name: "Remove C. Abena's link" }).click()
    await page
      .getByRole('dialog', { name: 'Remove this link?' })
      .getByRole('button', { name: "Remove C. Abena's link" })
      .click()
    await expect(page.getByText("C. Abena's link removed.")).toBeVisible()
    await expect(linked.getByRole('row', { name: /C\. Abena/ })).toHaveCount(0)

    // P. Owona, the demo's Portfolio manager, reads Bank E confirmed.
    await switchAccount(page, /svt/i, 'Portfolio manager', /manager/i)
    await page.goto('/rfq')
    await expect(svtRow(page, 'Bank E')).toContainText(
      /Confirmed on \d\d\/\d\d\/\d{4} · 750\sM \/ day/,
    )
  },
)

// @fresh-db: the RFQ's settings and the SVT accounts as seeded, which the flow changes.
test(
  'ADMCFG keeps the licensed SVTs and the switch, USER creates an SVT for a bank of the list',
  { tag: '@fresh-db' },
  async ({ page }) => {
    await page.goto('/mkt')
    await switchAccount(page, /analyst/i, 'Admin', /^admin$/i)

    await expect(page).toHaveURL(/\/admin\/users$/)
    await panel(page, /^Accounts$/)
      .getByRole('button', { name: 'Create account' })
      .click()
    const form = page.getByRole('dialog', { name: 'Create an account' })
    await form.getByRole('textbox', { name: 'Name' }).fill('C. Ndjock')
    await form.getByRole('textbox', { name: 'E-mail (login)' }).fill('c.ndjock@bank-f.example')
    await form.getByRole('combobox', { name: 'Account type' }).selectOption('svt')
    const bank = form.getByRole('combobox', { name: 'Organisation' })
    await expect(bank.getByRole('option')).toHaveText([
      'Choose its bank',
      'Bank D',
      'Bank E',
      'Bank F',
      'Bank G',
      'Bank H',
    ])
    await bank.selectOption({ label: 'Bank F' })
    await form.getByRole('button', { name: 'Create the account' }).click()
    await expect(
      page.getByText('C. Ndjock: account created, an invitation was sent by e-mail.'),
    ).toBeVisible()

    await page.goto('/admin/settings')
    const rfq = panel(page, /^RFQ$/)
    const open = rfq.getByRole('switch', { name: 'The RFQ is open' })
    await expect(open).toBeChecked()
    // Bank F's new SVT account, no link in force.
    const bankF = rfq.getByRole('row', { name: /^Bank F/ })
    await expect(bankF.getByRole('cell').nth(3)).toHaveText('1')
    await expect(bankF.getByRole('cell').nth(4)).toHaveText('0')
    await rfq.getByRole('textbox', { name: 'New bank' }).fill('Bank K')
    await rfq
      .getByRole('textbox', { name: "Back office's e-mail", exact: true })
      .fill('back-office@bank-k.example')
    await rfq.getByRole('button', { name: 'Add the bank' }).click()
    await rfq.getByRole('checkbox', { name: 'On the list · Bank H' }).uncheck({ force: true })
    // The SVTs' window (ROADMAP step 45): 45 minutes, the cut-off at 15:30, 09:30 the next day.
    await rfq.getByRole('textbox', { name: 'Window (minutes)' }).fill('45')
    await rfq.getByLabel('Cut-off', { exact: true }).fill('15:30')
    await rfq.getByLabel("Next business day's deadline").fill('09:30')
    await rfq.getByRole('button', { name: 'Save the RFQ settings' }).click()
    await expect(page.getByText('RFQ settings saved.')).toBeVisible()
    await expect(rfq.getByRole('textbox', { name: "Back office's e-mail · Bank K" })).toHaveValue(
      'back-office@bank-k.example',
    )
    await expect(rfq.getByRole('checkbox', { name: 'On the list · Bank H' })).not.toBeChecked()

    // Closed: the trader's menu loses RFQ; opened again after.
    await open.uncheck({ force: true })
    await rfq.getByRole('button', { name: 'Save the RFQ settings' }).click()
    await expect(page.getByText('RFQ settings saved.')).toBeVisible()
    await switchAccount(page, /^admin$/i, 'Trader', /trader/i)
    const menu = page.getByRole('navigation', { name: 'Main menu' })
    await expect(menu.getByRole('link', { name: /^BS/ })).toBeVisible()
    await expect(menu.getByRole('link', { name: /^RFQ/ })).toHaveCount(0)
    await switchAccount(page, /trader/i, 'Admin', /^admin$/i)
    await page.goto('/admin/settings')
    await open.check({ force: true })
    await rfq.getByRole('button', { name: 'Save the RFQ settings' }).click()
    await expect(page.getByText('RFQ settings saved.')).toBeVisible()

    // B. Sima reads the Admin's window beside her bank's settings.
    await switchAccount(page, /^admin$/i, 'SVT', /svt/i)
    const approval = panel(page, 'Approval settings')
    await expect(approval).toContainText(/Approval window\s*45 minutes/)
    await expect(approval).toContainText(
      /Cut-off time\s*15:30 \(else 09:30 the next business day\)/,
    )
  },
)
