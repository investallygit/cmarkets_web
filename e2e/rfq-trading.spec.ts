import type { Page } from '@playwright/test'
import { panel } from './msg.js'
import { expect, test } from './people.js'

// The RFQ's trading (screen 22), ROADMAP step 44, on the demo's day: T. Bekale (Bank C) publishes,
// B. Ngoma (Pension fund G) answers on the board through Bank E and improves his price, T. Bekale
// confirms the selection, each side reading it in real time through /hubs/rfq; E. Fouda, CEO of
// Asset manager A, reads C. Abena's sale of the morning; "Request a price (RFQ)" from BS; the
// Admin's compliance export. The flows add requests and agreements of their own: they count
// nothing of the others'.

const NGOMA = 'b.ngoma@pension-g.example'

/** The prototype's account switch reloads the app: wait for the new account's badge. */
async function switchAccount(page: Page, from: RegExp, account: string, badge: RegExp) {
  const topBar = page.getByRole('banner')
  await topBar.getByRole('button', { name: from }).click()
  await page.getByRole('menuitemradio', { name: account, exact: true }).click()
  await expect(topBar.getByRole('button', { name: badge })).toBeVisible()
}

const openRfq = async (page: Page) => {
  await page
    .getByRole('navigation', { name: 'Main menu' })
    .getByRole('link', { name: /^RFQ/ })
    .click()
  await expect(page).toHaveURL(/\/rfq$/)
}

test('T. Bekale publishes, B. Ngoma answers on the board and improves, T. Bekale confirms', async ({
  page,
  person,
}) => {
  await page.goto('/mkt')
  await switchAccount(page, /analyst/i, 'Trader', /trader/i)
  await openRfq(page)
  await expect(page.getByRole('navigation', { name: 'RFQ screens' }).getByRole('link')).toHaveText([
    /RFQ\s*Trading/,
    /RFQ AGR\s*Agreements/,
  ])

  // A purchase of 300 million of the demo's OTA, quoted in clean price, open 10 minutes, anonymous.
  const form = panel(page, 'New request')
  const security = form.getByRole('combobox', { name: 'Government security (BTA / OTA)' })
  const ota = await security.locator('option', { hasText: 'OTA CMR 3 yr' }).getAttribute('value')
  await security.selectOption(ota!)
  await expect(form.getByRole('combobox', { name: 'Quote in' })).toHaveValue('price')
  await form.getByRole('textbox', { name: 'Face amount requested (XAF)' }).fill('300000000')
  await form.getByRole('combobox', { name: 'Request duration' }).selectOption('10')
  await expect(form.getByRole('combobox', { name: 'My SVT for this trade' })).toContainText(
    'Bank D (SVT)',
  )
  await expect(form).toContainText(/CMarket curve reference\s*\d+\.\d{2,4} · \d+\.\d\d%/)
  await form.getByRole('button', { name: 'Publish request' }).click()
  const toast = page.getByText(/RFQ-\d{6}-\d{4} published: on the board for 10 min\./)
  await expect(toast).toBeVisible()
  const number = /RFQ-\d{6}-\d{4}/.exec((await toast.textContent()) ?? '')![0]
  const short = number.replace(/-\d{6}-/, '-')
  const mine = panel(page, `My request · ${number}`)
  await expect(mine).toContainText(
    /BUY · XAF 300,000,000 · OTA CMR 3 yr \d{4} · DvP \d\d\/\d\d\/\d{4}/,
  )
  await expect(mine.getByRole('timer', { name: 'Time left' })).toContainText(/\d\d:\d\d/)
  await expect(mine).toContainText('Automatic selection: no answer in force yet.')

  // B. Ngoma, whose profile is in French, reads it on the board, its requester hidden, and answers
  // in clean price.
  const ngoma = await person(NGOMA)
  await ngoma.goto('/rfq')
  const board = panel(ngoma, 'Demandes ouvertes sur la plateforme')
  const row = board.getByRole('row', { name: new RegExp(short) })
  await expect(row).toContainText(/Anonyme\s*ACHAT\s*OTA CMR 3 yr \d{4}\s*300\sM/)
  await row.click()
  const answer = ngoma.getByRole('form', { name: `Ma réponse à ${number}` })
  await expect(answer).toContainText(/le demandeur achète 300\sM OTA CMR 3 yr/)
  await answer.getByRole('textbox', { name: 'Prix pied de coupon (vente)' }).fill('100,2')
  await expect(answer.getByRole('textbox', { name: 'Rendement' })).toHaveValue(/\d+,\d{4}/)
  await answer.getByRole('textbox', { name: /^Quantité/ }).fill('300000000')
  await answer.getByRole('button', { name: 'Envoyer ma réponse' }).click()
  await expect(ngoma.getByText(`Réponse envoyée à ${number}.`)).toBeVisible()
  await expect(row).toContainText('Envoyée')

  // On T. Bekale's screen at once: ranked, with its responder, and the selection.
  await expect(mine.getByRole('row', { name: /B\. Ngoma · Pension fund G/ })).toContainText(
    /1\s*B\. Ngoma · Pension fund G\s*Bank E\s*100\.20\s*\d+\.\d\d%\s*300\sM/,
  )
  await expect(mine).toContainText(
    /Automatic selection: 300\sM \/ 300\sM · 1 agreement · weighted average price 100\.20/,
  )

  // A better price: the selection follows.
  await answer.getByRole('textbox', { name: 'Prix pied de coupon (vente)' }).fill('100,15')
  await answer.getByRole('button', { name: 'Améliorer' }).click()
  await expect(ngoma.getByText(`Réponse à ${number} améliorée.`)).toBeVisible()
  await expect(mine).toContainText(/weighted average price 100\.15/)

  // The selection confirmed: an agreement awaiting both SVTs.
  await mine.getByRole('button', { name: 'Confirm selection (1 agreement)' }).click()
  await expect(page.getByText(`${number} confirmed: its agreement awaits the SVTs.`)).toBeVisible()
  await expect(mine).toContainText(/Confirmed at \d\d:\d\d/)
  await expect(
    mine.getByRole('region', { name: 'Agreements' }).getByRole('row', { name: /B\. Ngoma/ }),
  ).toContainText(
    /ACC-\d{4}\s*B\. Ngoma · Pension fund G\s*Bank E\s*300\sM\s*100\.15\s*[\d,]+\s*Awaiting SVT/,
  )

  // Off B. Ngoma's board; both blotters tell it.
  await expect(board.getByRole('row', { name: new RegExp(short) })).toHaveCount(0)
  await expect(panel(ngoma, 'Blotter du jour')).toContainText(
    new RegExp(`Retenue\\s*Votre réponse à ${short} : 300\\sM sur 300\\sM`),
  )
  await expect(panel(page, "Today's blotter")).toContainText(
    new RegExp(`Awaiting SVT\\s*${short} · 1 agreement sent to the SVTs`),
  )
})

test("the CEO reads its organisation's requests; BS asks a price; the Admin exports the trail", async ({
  page,
}) => {
  // E. Fouda reads C. Abena's sale of the morning, its answer and agreement, without acting on it.
  await page.goto('/mkt')
  await switchAccount(page, /analyst/i, 'CEO', /ceo/i)
  await openRfq(page)
  const organization = panel(page, "The organisation's requests")
  await expect(organization.getByRole('combobox', { name: 'Request' })).toContainText(
    /RFQ-\d{4} · C\. Abena · Sell 200\sM OTA CMR 3 yr \d{4} · Confirmed/,
  )
  // Its answer, ranked first, and the agreement it made, which Bank E approved (ROADMAP step 45).
  await expect(organization.getByRole('row', { name: /^1 T\. Bekale · Bank C/ })).toContainText(
    /Bank E\s*\d+\.\d{2,4}\s*6\.06%\s*200\sM/,
  )
  await expect(organization.getByRole('row', { name: /^ACC-\d{4} T\. Bekale/ })).toContainText(
    'Concluded',
  )
  await expect(organization.getByRole('button', { name: /Confirm selection/ })).toHaveCount(0)
  await expect(panel(page, 'New request')).toHaveCount(0)
  await expect(panel(page, "Today's blotter")).toContainText(/Requests published\s*1/)

  // T. Bekale asks a price on the BEAC's OTA from BS.
  await switchAccount(page, /ceo/i, 'Trader', /trader/i)
  await page.goto('/bs')
  await panel(page, /^Results/)
    .getByRole('row', { name: /OTA CMR 3 yr/ })
    .click()
  await page.getByRole('link', { name: 'Request a price (RFQ)' }).click()
  await expect(page).toHaveURL(/\/rfq\?security=OTA-CM-3Y-\d{8}$/)
  await expect(
    panel(page, 'New request').getByRole('combobox', { name: 'Government security (BTA / OTA)' }),
  ).toHaveValue(/^OTA-CM-3Y-\d{8}$/)

  // The Admin's compliance export of the day, beside the audit log.
  await switchAccount(page, /trader/i, 'Admin', /^admin$/i)
  await page.goto('/admin/audit')
  const download = page.waitForEvent('download')
  await panel(page, 'RFQ compliance export')
    .getByRole('button', { name: 'Download the CSV' })
    .click()
  expect((await download).suggestedFilename()).toMatch(
    /^cmarket-rfq-audit-\d{4}-\d\d-\d\d-\d{4}-\d\d-\d\d\.csv$/,
  )
})
