import type { Page } from '@playwright/test'
import { panel } from './msg.js'
import { expect, test } from './people.js'

// The completion ratio (screen 22, sixth version), ROADMAP step 62: T. Bekale reads "My
// completion" in the blotter, opens its detail and disputes a failure; its request asks a
// responder completion of 99 %, which B. Ngoma's organisation (96 %, in French) does not meet;
// the Admin neutralises the disputed case on RFQ CPL.

const NGOMA = 'b.ngoma@pension-g.example'

async function switchAccount(page: Page, from: RegExp, account: string, badge: RegExp) {
  const topBar = page.getByRole('banner')
  await topBar.getByRole('button', { name: from }).click()
  await page.getByRole('menuitemradio', { name: account, exact: true }).click()
  await expect(topBar.getByRole('button', { name: badge })).toBeVisible()
}

test('T. Bekale disputes a failure, its threshold keeps B. Ngoma out, the Admin neutralises the case', async ({
  page,
  person,
}) => {
  await page.goto('/mkt')
  await switchAccount(page, /analyst/i, 'Trader', /trader/i)
  await page.goto('/rfq')

  // "My completion" as requester and as responder, from the demo's six months of cases.
  const blotter = panel(page, "Today's blotter")
  await expect(blotter).toContainText(/My completion · requester\s*\d+% \(\d+\)/)
  await expect(blotter).toContainText(/My completion · responder\s*\d+% \(\d+\)/)
  await blotter.getByRole('button', { name: /^My completion · requester \d+% \(\d+\)$/ }).click()
  const detail = page.getByRole('dialog', { name: 'Completion ratio' })
  await expect(detail).toContainText(/T\. Bekale · .+, over the last 6 months\./)
  await expect(detail.getByRole('region', { name: 'As requester' })).toContainText(/Failures\s*\d+/)
  await expect(detail).toContainText(/Answers withdrawn before the confirmation:/)

  // A failure disputed with the Admin, a reason given.
  await detail.getByRole('button', { name: 'Dispute' }).first().click()
  const dispute = page.getByRole('dialog', { name: /^Dispute (ACC|RFQ)-\d{6}-\d{4}$/ })
  const number = /(ACC|RFQ)-\d{6}-\d{4}/.exec(
    (await dispute.getByRole('heading').first().textContent()) ?? '',
  )![0]
  await dispute.getByRole('button', { name: 'Send to the Admin' }).click()
  await expect(dispute).toContainText('Say why this failure is not yours.')
  await dispute.getByRole('textbox', { name: 'Reason' }).fill('Bank D was down that afternoon.')
  await dispute.getByRole('button', { name: 'Send to the Admin' }).click()
  await expect(page.getByText('Dispute sent to the Admin.')).toBeVisible()
  // Back on the detail, the case marked disputed; closed.
  await expect(detail).toContainText('Disputed')
  await page.keyboard.press('Escape')
  await expect(detail).toBeHidden()

  // A request open to responders of 99 % completion at least.
  const form = panel(page, 'New request')
  await form.getByRole('textbox', { name: 'Face amount requested (XAF)' }).fill('300000000')
  await form.getByRole('textbox', { name: /^Minimum responder completion/ }).fill('99')
  await form.getByRole('button', { name: 'Publish request' }).click()
  const toast = page.getByText(/RFQ-\d{6}-\d{4} published/)
  await expect(toast).toBeVisible()
  const request = /RFQ-\d{6}-\d{4}/.exec((await toast.textContent()) ?? '')![0]
  await expect(panel(page, `My request · ${request}`)).toContainText(
    'responders from 99% completion',
  )

  // B. Ngoma reads the requester's ratio on the board, anonymous, and cannot answer.
  const ngoma = await person(NGOMA)
  await ngoma.goto('/rfq')
  const board = panel(ngoma, 'Demandes ouvertes sur la plateforme')
  const row = board.getByRole('row', { name: new RegExp(request.replace(/-\d{6}-/, '-')) })
  await expect(row).toContainText(/Anonyme\s*·\s*(\d+ %|Nouveau \(\d+\))/)
  await row.click()
  const answer = ngoma.getByRole('form', { name: `Ma réponse à ${request}` })
  await expect(answer).toContainText(
    'Cette demande accepte les répondants à partir de 99 % de complétion',
  )
  await expect(answer.getByRole('button', { name: 'Envoyer ma réponse' })).toBeDisabled()
  await expect(panel(ngoma, 'Blotter du jour')).toContainText(
    /Ma complétion · répondant\s*\d+ % \(\d+\)/,
  )

  // The Admin neutralises the disputed case on RFQ CPL, with a reason.
  await switchAccount(page, /trader/i, 'Admin', /^admin$/i)
  await page.goto('/admin/rfq/completion')
  const disputes = panel(page, 'Completion disputes')
  const item = disputes.getByRole('listitem').filter({ hasText: number })
  await expect(item).toContainText('Bank D was down that afternoon.')
  await item.getByRole('button', { name: 'Neutralise' }).click()
  const decide = page.getByRole('dialog', { name: `Neutralise ${number}` })
  await decide.getByRole('textbox', { name: /^Reason/ }).fill('Bank D confirmed its outage.')
  await decide.getByRole('button', { name: 'Neutralise' }).click()
  await expect(page.getByText(`${number} neutralised.`)).toBeVisible()
  await expect(item).toContainText('Dispute upheld')
  await expect(panel(page, "Participants' completion").getByRole('row')).not.toHaveCount(1)
})
