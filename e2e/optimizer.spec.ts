import { expect, test, type Page } from '@playwright/test'

// OPT and OPT RES, portfolio optimisation (screens 28 and 29), ROADMAP step 42: the demo's scenario
// of the mockups (spec section 14.6's test case) opened and optimised again, PORT's "Optimise", a
// conflict the check names, a point of the frontier, a model portfolio made of the allocation.

const panel = (page: Page, title: string | RegExp) =>
  page.locator('section', { has: page.getByRole('heading', { name: title }) })

/** The demo's scenario of the screen 28 mockup, opened from the scenario list. */
async function openDemoScenario(page: Page) {
  await page.goto('/opt')
  const scenarios = page.getByRole('combobox', { name: 'Scenario' })
  await expect(scenarios.getByRole('option', { name: 'CEMAC balanced' })).toHaveCount(1)
  await scenarios.selectOption({ label: 'CEMAC balanced' })
  await expect(page).toHaveURL(/\/opt\?scenario=/)
  await expect(panel(page, /Investment universe/).getByRole('row')).toHaveCount(9)
}

test('OPT opens the mockup’s scenario and optimises it into the mockup’s result', async ({
  page,
}) => {
  await page.goto('/mkt')
  const menu = page.getByRole('navigation', { name: 'Main menu' })
  await menu.getByRole('link', { name: /^OPT/ }).click()
  await expect(page).toHaveURL(/\/opt$/)
  await openDemoScenario(page)

  const universe = panel(page, /Investment universe/)
  await expect(universe.getByRole('rowheader', { name: 'SEMC' })).toBeVisible()
  await expect(universe.getByRole('textbox', { name: 'Max weight % of SEMC' })).toHaveValue('15.00')
  const checks = panel(page, 'Pre-run checks')
  await expect(checks.getByText('Constraints are compatible')).toBeVisible()
  await expect(checks.getByText('Minimum return is reachable')).toBeVisible()
  await expect(
    panel(page, /Correlations/).getByRole('button', {
      name: /Correlation of SEMC and SAFACAM: 0\.35/,
    }),
  ).toBeVisible()

  const optimise = page.getByRole('button', { name: 'Optimise' })
  await expect(optimise).toBeEnabled()
  await optimise.click()
  await expect(page).toHaveURL(/\/opt\/result$/)
  const tiles = page.getByRole('definition')
  await expect(
    page.getByText(
      /Objective: lowest risk for a return of at least 8\.00% · 8 securities · 7 constraints/,
    ),
  ).toBeVisible()
  await expect(tiles.filter({ hasText: /^8\.0\d%$/ }).first()).toBeVisible()
  await expect(tiles.filter({ hasText: /^5\.[34]\d%$/ }).first()).toBeVisible()
  await expect(tiles.filter({ hasText: /^0\.6[45]$/ })).toHaveCount(1)
  const allocation = panel(page, 'Optimal allocation')
  await expect(allocation.getByRole('row').filter({ hasText: 'GAB' })).toContainText('max')
  await expect(
    panel(page, 'Constraints and comparison').getByText(/Minimum return of 8\.00%: met exactly/),
  ).toBeVisible()
  await expect(
    panel(page, 'Constraints and comparison').getByRole('rowheader', {
      name: 'CEMAC Equity Fund (current)',
    }),
  ).toBeVisible()
})

test('a point of the frontier is computed, then saved as a model portfolio that PORT opens', async ({
  page,
}) => {
  await openDemoScenario(page)
  await page.getByRole('link', { name: /OPT RES/ }).click()
  // The saved scenario's id stays in the address: a reload shows its result again (B60).
  await expect(page).toHaveURL(/\/opt\/result\?scenario=/)
  await page.reload()
  const frontier = panel(page, 'Efficient frontier')
  await expect(frontier).toBeVisible()
  await expect(page.getByText('No result yet')).toHaveCount(0)

  const points = frontier.getByRole('combobox', { name: 'Another point of the frontier' })
  const last = points.getByRole('option').last()
  const label = (await last.textContent()) ?? ''
  await points.selectOption({ label })
  const target = label.split(' / ')[0]
  await expect(
    page.getByText(`Objective: lowest risk for a return of at least ${target}`),
  ).toBeVisible()

  await panel(page, 'Next steps').getByRole('button', { name: 'Save as model portfolio' }).click()
  const dialog = page.getByRole('dialog', { name: 'Save as a model portfolio' })
  await dialog.getByRole('textbox', { name: 'Scenario name' }).fill('Frontier top')
  await dialog.getByRole('textbox', { name: 'Portfolio name' }).fill('Optimal top')
  await dialog.getByRole('button', { name: 'Create' }).click()
  await expect(page).toHaveURL(/\/port\/[0-9a-f-]{36}/)
  await expect(page.getByRole('button', { name: /Optimal top/ })).toBeVisible()
})

test('PORT’s Optimise takes the portfolio’s lines; a conflict stops OPTIMISE and is named', async ({
  page,
}) => {
  await page.goto('/port')
  await page.getByRole('link', { name: 'Optimise' }).click()
  await expect(page).toHaveURL(/\/opt$/)
  const universe = panel(page, /Investment universe/)
  await expect(universe.getByRole('rowheader', { name: 'SEMC' })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Compare with' })).toHaveValue(/[0-9a-f-]{36}/)

  const objective = panel(page, /Objective and constraints/)
  for (const [key, bound, value] of [
    ['Equities', 'Minimum', '70'],
    ['Bonds', 'Minimum', '40'],
  ] as const) {
    await objective.getByRole('button', { name: /Add a constraint/ }).click()
    await objective
      .getByRole('combobox', { name: 'On', exact: true })
      .selectOption({ label: 'Asset class' })
    await objective
      .getByRole('combobox', { name: 'Which', exact: true })
      .selectOption({ label: key })
    await objective
      .getByRole('combobox', { name: 'Limit', exact: true })
      .selectOption({ label: bound })
    await objective.getByRole('textbox', { name: 'Value %' }).fill(value)
    await objective.getByRole('button', { name: 'Add', exact: true }).click()
  }
  const checks = panel(page, 'Pre-run checks')
  await expect(checks.getByText('Constraints conflict')).toBeVisible()
  await expect(
    checks.getByText(/Involved: .*(Equities: at least 70\.00%|Bonds: at least 40\.00%)/),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Optimise' })).toBeDisabled()
})
