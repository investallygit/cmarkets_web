import type { Page } from '@playwright/test'
import { panel } from './msg.js'
import { expect, test } from './people.js'

// A request by criteria (screen 22, sixth version), ROADMAP step 61: T. Bekale (Bank C) buys an
// amount within criteria, the eligible securities beside it in the place of "My SVTs"; B. Ngoma
// (Pension fund G, in French) offers one of them from the board, a price whose yield is under the
// minimum refused first, then one that meets it; T. Bekale confirms, the agreement on the security
// offered. The flow counts nothing of the others'.

const NGOMA = 'b.ngoma@pension-g.example'

async function switchAccount(page: Page, from: RegExp, account: string, badge: RegExp) {
  const topBar = page.getByRole('banner')
  await topBar.getByRole('button', { name: from }).click()
  await page.getByRole('menuitemradio', { name: account, exact: true }).click()
  await expect(topBar.getByRole('button', { name: badge })).toBeVisible()
}

test('T. Bekale buys by criteria, B. Ngoma offers an eligible security, T. Bekale confirms', async ({
  page,
  person,
}) => {
  await page.goto('/mkt')
  await switchAccount(page, /analyst/i, 'Trader', /trader/i)
  await page.goto('/rfq')

  // By criteria: a purchase only; at least 6.00 %, at most 3 years, Cameroon, Gabon and Congo.
  const form = panel(page, 'New request')
  await form.getByRole('radio', { name: 'By criteria' }).check({ force: true })
  await expect(form.getByRole('radio', { name: 'Sell' })).toBeDisabled()
  await expect(form).toContainText('by criteria: buy only')
  await expect(form.getByRole('combobox', { name: 'Government security (BTA / OTA)' })).toHaveCount(
    0,
  )
  await form.getByRole('textbox', { name: 'Amount (face, XAF)' }).fill('400000000')
  await form.getByRole('textbox', { name: /^Minimum yield/ }).fill('6')
  await form.getByRole('textbox', { name: /^Maximum remaining maturity/ }).fill('3')
  for (const country of ['Cameroon', 'Gabon', 'Congo'])
    await form.getByRole('button', { name: new RegExp(`\\(${country}\\)`) }).click()
  await expect(form.getByRole('button', { name: 'GAB (Gabon)' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(form).toContainText(/\d+ eligible securit(y|ies) today/)
  await expect(form).toContainText('An empty field = no constraint.')

  // The preview takes the place of "My SVTs".
  const preview = panel(page, 'Eligible securities')
  await expect(preview).toContainText('Preview of the new request')
  await expect(preview.getByRole('row').nth(1)).toContainText(
    /(CMR|GAB|COG)\s*\d+\.\d\d\s*\d+\.\d\d%/,
  )

  // Highest yield first; none under the minimum nor past the maximum.
  await form.getByRole('combobox', { name: 'Request duration' }).selectOption('10')
  await form.getByRole('button', { name: 'Publish request' }).click()
  const toast = page.getByText(/RFQ-\d{6}-\d{4} published: on the board for 10 min\./)
  await expect(toast).toBeVisible()
  const number = /RFQ-\d{6}-\d{4}/.exec((await toast.textContent()) ?? '')![0]
  const short = number.replace(/-\d{6}-/, '-')
  const mine = panel(page, `My request · ${number}`)
  await expect(mine).toContainText(
    'BUY · XAF 400,000,000 · yield ≥ 6.00% · maturity ≤ 3 yrs · CMR, GAB, COG',
  )
  await expect(mine).toContainText(
    /0 answers · \d+ eligible securit(y|ies) today · ranked by yield/,
  )
  await expect(panel(page, `Eligible securities · ${number}`)).toBeVisible()

  // B. Ngoma reads its criteria on the board and offers the first eligible security.
  const ngoma = await person(NGOMA)
  await ngoma.goto('/rfq')
  const board = panel(ngoma, 'Demandes ouvertes sur la plateforme')
  const row = board.getByRole('row', { name: new RegExp(short) })
  await expect(row).toContainText(/Critères : ≥ 6,00 % · ≤ 3 ans · CMR, GAB, COG\s*400\sM/)
  await row.click()
  const answer = ngoma.getByRole('form', { name: `Ma réponse à ${number}` })
  await expect(answer).toContainText('demande par critères : rendement ≥ 6,00 %')
  await expect(panel(ngoma, `Titres éligibles · ${number}`)).toBeVisible()
  const offered = await answer
    .getByRole('combobox', { name: 'Titre proposé (éligibles seulement)' })
    .locator('option:checked')
    .textContent()
  const bill = offered!.startsWith('BTA')
  const value = answer.getByRole('textbox', { name: bill ? 'Taux (BTA)' : 'Prix' })
  await answer.getByRole('textbox', { name: /^Quantité/ }).fill('400000000')

  // Too dear: its yield under 6.00 %, shown in red and refused by CMarket.
  await value.fill(bill ? '1' : '115')
  const checks = answer.getByRole('list', { name: 'Contrôle des critères' })
  await expect(checks).toContainText(/✗ Rendement calculé : -?\d+,\d\d % < 6,00 %/)
  await answer.getByRole('button', { name: 'Envoyer ma réponse' }).click()
  await expect(answer).toContainText(
    /Le rendement, -?\d+,\d\d %, est inférieur au minimum de 6,00 %\./,
  )

  // A price that meets it: the three checks in green, the answer sent.
  await value.fill(bill ? '9' : '92')
  await expect(checks).toContainText(/✓ Rendement calculé : \d+,\d\d % ≥ 6,00 %/)
  await expect(checks).toContainText(/✓ Maturité résiduelle : \d+,\d\d ans ≤ 3,00 ans/)
  await expect(checks).toContainText(/✓ Pays : .+, accepté/)
  await answer.getByRole('button', { name: 'Envoyer ma réponse' }).click()
  await expect(ngoma.getByText(`Réponse envoyée à ${number}.`)).toBeVisible()

  // T. Bekale sees it ranked with its security and yield, the selection's averages, and confirms.
  const ranked = mine.getByRole('row', { name: /B\. Ngoma · Pension fund G/ })
  await expect(ranked).toContainText(
    new RegExp(
      `1\\s*B\\. Ngoma · Pension fund G\\s*\\d+% \\(\\d+\\)\\s*${offered!.replace(/[.()/]/g, '\\$&')}\\s*(CMR|GAB|COG)`,
    ),
  )
  await expect(mine).toContainText(
    /Selection: 400\sM \/ 400\sM · 1 agreement on 1 security · average yield \d+\.\d\d% · average maturity \d+\.\d yrs/,
  )
  await mine.getByRole('button', { name: 'Confirm selection (1 agreement)' }).click()
  await expect(page.getByText(`${number} confirmed: its agreement awaits the SVTs.`)).toBeVisible()
  await expect(
    mine.getByRole('region', { name: 'Agreements' }).getByRole('row', { name: /B\. Ngoma/ }),
  ).toContainText(/ACC-\d{4}\s*B\. Ngoma · Pension fund G\s*Bank E\s*400\sM/)
})
