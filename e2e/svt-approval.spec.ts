import type { Page } from '@playwright/test'
import { panel } from './msg.js'
import { apiAs, expect, test } from './people.js'

// Screen 27, SVT approval (ROADMAP step 45): T. Bekale (Bank C) buys through Bank D from B. Ngoma
// and A. Tchakounté, who sell through Bank E; B. Sima, Bank E's SVT, approves the first agreement
// and rejects the second for a reason written out; A. Okala, Bank D's SVT (in French), completes
// the first; each side reads it live; T. Bekale reads both outcomes; B. Sima edits Bank E's
// settings.
// The flow makes agreements of its own: it counts none of the others'.

const BEKALE = 't.bekale@bank.example'
const NGOMA = 'b.ngoma@pension-g.example'
const TCHAKOUNTE = 'a.tchakounte@insurer-f.example'
const OKALA = 'a.okala@bank-d.example'

interface Setup {
  securities: { id: string; instrument: string }[]
  settlementDates: string[]
  svts: { id: string; name: string }[]
}

/** The prototype's account switch reloads the app: wait for the new account's badge. */
async function switchAccount(page: Page, from: RegExp, account: string, badge: RegExp) {
  const topBar = page.getByRole('banner')
  await topBar.getByRole('button', { name: from }).click()
  await page.getByRole('menuitem', { name: account, exact: true }).click()
  await expect(topBar.getByRole('button', { name: badge })).toBeVisible()
}

/** "ACC-0012" for "ACC-261115-0012", as the lists write it. */
const short = (number: string) => number.replace(/-\d{6}-/, '-')

test('B. Sima approves one agreement and rejects the other, A. Okala concludes the first', async ({
  page,
  person,
}) => {
  // T. Bekale's purchase of 500 million of the OTA through Bank D, answered through Bank E by
  // B. Ngoma (300 million at 100.20) and A. Tchakounté (200 million at 100.25), confirmed.
  const bekale = await person(BEKALE)
  const asBekale = await apiAs(bekale)
  const setup = await asBekale<Setup>('GET', '/rfq/setup')
  const request = await asBekale<{ id: string; number: string }>('POST', '/rfq', {
    securityId: setup.securities.find((security) => security.instrument === 'OTA')!.id,
    side: 'buy',
    faceAmount: 500_000_000,
    quoteType: 'price',
    settlementDate: setup.settlementDates[0],
    durationSeconds: 300,
    svtId: setup.svts.find((svt) => svt.name === 'Bank D')!.id,
    anonymous: false,
  })
  for (const [email, price, quantity] of [
    [NGOMA, 100.2, 300_000_000],
    [TCHAKOUNTE, 100.25, 200_000_000],
  ] as const) {
    const asSeller = await apiAs(await person(email))
    const theirs = await asSeller<Setup>('GET', '/rfq/setup')
    await asSeller('POST', `/rfq/${request.id}/responses`, {
      value: price,
      quantity,
      svtId: theirs.svts.find((svt) => svt.name === 'Bank E')!.id,
      validitySeconds: 600,
    })
  }
  const { version } = await asBekale<{ version: number }>('GET', `/rfq/${request.id}/allocation`)
  const confirmed = await asBekale<{ agreements: { number: string }[] }>(
    'POST',
    `/rfq/${request.id}/confirm`,
    { allocationVersion: version },
  )
  const [first, second] = confirmed.agreements.map((agreement) => agreement.number)

  // B. Sima on the SVT's home screen: both agreements to approve, the second within the client's
  // limit.
  await page.goto('/mkt')
  await switchAccount(page, /analyst/i, 'SVT', /svt/i)
  await expect(page).toHaveURL(/\/svt$/)
  const approvals = panel(page, 'Agreements to approve')
  await expect(approvals.getByRole('row', { name: new RegExp(short(first)) })).toContainText(
    /B\. Ngoma · Pension fund G\s*SELL\s*OTA CMR 3 yr \d{4}\s*300\sM\s*100\.20\s*Bank C · Bank D/,
  )
  await expect(approvals.getByRole('row', { name: new RegExp(short(second)) })).toContainText(
    /A\. Tchakounté · Insurer F\s*SELL\s*OTA CMR 3 yr \d{4}\s*200\sM\s*100\.25\s*Bank C · Bank D\s*OK/,
  )

  // The first, approved for Bank E: it waits for Bank D.
  await approvals.getByRole('row', { name: new RegExp(short(first)) }).click()
  const detail = panel(page, `Agreement ${first}`)
  await expect(detail.getByRole('status')).toHaveText('Awaiting your approval')
  await expect(detail).toContainText(/Bank D \(buyer's SVT\)\s*Pending · (\d+:)?\d\d:\d\d left/)
  await expect(detail).toContainText(/Seller \(your client\)\s*B\. Ngoma · Pension fund G/)
  await detail.getByRole('button', { name: 'Approve agreement' }).click()
  await expect(page.getByText(`${first} approved.`)).toBeVisible()
  await expect(detail.getByRole('status')).toHaveText('Approved · awaiting the other SVT')

  // The second, rejected: "other" needs its text, which both traders receive.
  await approvals.getByRole('row', { name: new RegExp(short(second)) }).click()
  await panel(page, `Agreement ${second}`)
    .getByRole('button', { name: 'Reject (reason required)' })
    .click()
  const reject = page.getByRole('dialog', { name: `Reject ${second}` })
  await reject.getByRole('combobox', { name: 'Reason' }).selectOption('other')
  await reject.getByRole('button', { name: 'Reject the agreement' }).click()
  await expect(reject.getByText('Say why: "other" needs its text.')).toBeVisible()
  await reject.getByRole('textbox', { name: 'Comment' }).fill('Settlement account under review')
  await reject.getByRole('button', { name: 'Reject the agreement' }).click()
  await expect(
    page.getByText(`${second} rejected: both traders are told the reason.`),
  ).toBeVisible()
  const decisions = page.getByRole('region', { name: 'Latest decisions' })
  await expect(decisions).toContainText(
    `${short(second)} rejected by B. Sima · reason: Settlement account under review`,
  )

  // A. Okala, Bank D's SVT, reads Bank E's approval and completes the first: concluded.
  const okala = await person(OKALA)
  await expect(okala).toHaveURL(/\/svt$/)
  await panel(okala, 'Accords à approuver')
    .getByRole('row', { name: new RegExp(short(first)) })
    .click()
  const okalaDetail = panel(okala, `Accord ${first}`)
  await expect(okalaDetail).toContainText(
    /Bank E \(SVT du vendeur\)\s*Approuvé à \d\d:\d\d · B\. Sima/,
  )
  await okalaDetail.getByRole('button', { name: "Approuver l'accord" }).click()
  await expect(
    okala.getByText(`${first} approuvé : l'accord est conclu, son ticket envoyé.`),
  ).toBeVisible()
  await expect(okalaDetail.getByRole('status')).toHaveText('Conclu')

  // B. Sima reads it at once; T. Bekale reads both outcomes on RFQ.
  await expect(decisions).toContainText(
    `${short(first)} approved by B. Sima · agreement concluded, PDF sent`,
  )
  await bekale.goto('/rfq')
  const agreements = panel(bekale, `My request · ${request.number}`).getByRole('region', {
    name: 'Agreements',
  })
  await expect(agreements.getByRole('row', { name: /B\. Ngoma/ })).toContainText('Concluded')
  await expect(agreements.getByRole('row', { name: /A\. Tchakounté/ })).toContainText(
    'Rejected by an SVT',
  )

  // Bank E's settings: four eyes above XAF 2 billion from now on.
  const settings = panel(page, 'Approval settings')
  await expect(settings).toContainText(/Approval window\s*\d+ minutes/)
  await settings.getByRole('button', { name: 'Edit the settings' }).click()
  await settings.getByRole('textbox', { name: 'Four eyes above (XAF)' }).fill('2000000000')
  await settings.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Approval settings saved.')).toBeVisible()
  await expect(settings).toContainText(/Four-eyes approval\s*above XAF 2\sBn/)
})
