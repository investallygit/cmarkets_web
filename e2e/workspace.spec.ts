import { expect, test, type Locator, type Page } from '@playwright/test'

// The panels of a screen move by their title bar and resize by their corner, with the mouse, and
// the layout is saved per user (spec section 8). Below 1280 px wide they stack in one column
// (spec section 9), where their menu alone changes their order. Beyond the spec: a panel hides
// and comes back, a change is undone and redone, the layout locks, and a layout kept under a
// name comes back.

const panel = (page: Page, title: string) =>
  page.locator('section', { has: page.getByRole('heading', { name: title, exact: true }) })

const DRAG_HINT = /^Drag the title bar to move the panel/
const LOCKED_HINT = /^The layout of the screen is locked/

/** Where an element is, in whole pixels. */
async function place(target: Locator) {
  await target.waitFor()
  const box = await target.boundingBox()
  if (!box) throw new Error('Not on the screen.')
  return {
    x: Math.round(box.x),
    y: Math.round(box.y),
    width: Math.round(box.width),
    height: Math.round(box.height),
  }
}

/** Where a panel is once still: the grid slides it to its place, a transition of its item. */
async function restingPlace(target: Locator) {
  await expect
    .poll(() => target.evaluate((panel) => panel.parentElement?.getAnimations().length ?? 0))
    .toBe(0)
  return place(target)
}

/** Presses at a point and goes to another in steps, as a hand would, then lets go. */
async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(to.x, to.y, { steps: 20 })
  await page.mouse.up()
}

/** The next save of the layout of MKT, which waits 800 ms after the last drag. */
const layoutSaved = (page: Page) =>
  page.waitForResponse(
    (response) =>
      response.request().method() === 'PUT' && response.url().endsWith('/me/layouts/MKT'),
  )

/** The market dashboard, its rates table loaded. */
async function openDashboard(page: Page) {
  await page.goto('/mkt')
  const rates = panel(page, 'Rates and FX')
  await expect(rates.getByRole('row', { name: /^EUR \/ XAF/ })).toBeVisible()
  return rates
}

/** Picks an entry of a panel's layout menu, opened from its code. */
async function fromMenu(target: Locator, entry: string) {
  await target.getByRole('button', { name: /layout menu$/ }).click()
  await target.page().getByRole('menuitem', { name: entry }).click()
}

/** The titles of the panels, top to bottom. */
const stackedTitles = (page: Page) =>
  page.locator('[data-panel] section > header h2').allTextContents()

test('a panel moves by its title bar and resizes by its corner, and keeps both', async ({
  page,
}) => {
  const rates = await openDashboard(page)
  const indices = panel(page, 'Indices')
  // The grip, the pointer and the corner say so before the panel is touched.
  const bar = rates.locator('header')
  await expect(bar).toHaveCSS('cursor', 'move')
  await expect(rates.getByTitle(DRAG_HINT)).toBeVisible()
  const corner = page.locator('.react-grid-item', { has: rates }).locator('.react-resizable-handle')
  await expect(corner).toHaveCSS('opacity', '1')

  // Dropped on the place of Indices, it takes it, and Indices makes way below.
  const target = await place(indices)
  const start = await place(bar)
  let saved = layoutSaved(page)
  await drag(
    page,
    { x: start.x + 40, y: start.y + start.height / 2 },
    { x: target.x + 40, y: target.y + 8 },
  )
  await expect
    .poll(async () => {
      const { x, y } = await place(rates)
      return { x, y }
    })
    .toEqual({ x: target.x, y: target.y })
  await expect.poll(async () => (await place(indices)).y).toBeGreaterThan(target.y)
  await saved

  // Its corner, pulled down and to the right, makes it wider and taller.
  const before = await restingPlace(rates)
  const handle = await place(corner)
  saved = layoutSaved(page)
  await drag(
    page,
    { x: handle.x + handle.width / 2, y: handle.y + handle.height / 2 },
    { x: handle.x + 150, y: handle.y + 100 },
  )
  await expect.poll(async () => (await place(rates)).width).toBeGreaterThan(before.width)
  await expect.poll(async () => (await place(rates)).height).toBeGreaterThan(before.height)
  await saved
  const after = await restingPlace(rates)

  await page.reload()
  await expect(rates.getByRole('row', { name: /^EUR \/ XAF/ })).toBeVisible()
  await expect.poll(() => place(rates)).toEqual(after)
})

test('a hidden panel comes back at its place from the menu of another', async ({ page }) => {
  const rates = await openDashboard(page)
  const before = await place(rates)
  await fromMenu(rates, 'Hide the panel')
  await expect(rates).toHaveCount(0)
  await expect(page.getByText(/^The panel “Rates and FX” is hidden/)).toBeVisible()
  // Its menu is gone with it: the next panel's has the focus.
  await expect(page.locator('[data-panel-menu]:focus')).toHaveCount(1)

  await page.reload()
  await expect(panel(page, 'Indices').getByRole('row').first()).toBeVisible()
  await expect(rates).toHaveCount(0)
  await fromMenu(panel(page, 'Indices'), 'Show: Rates and FX')
  await expect.poll(() => place(rates)).toEqual(before)
})

test('Ctrl + Z undoes a change of the layout and Ctrl + Y redoes it, but not in a field', async ({
  page,
}) => {
  const rates = await openDashboard(page)
  const before = await place(rates)
  await fromMenu(rates, 'Move up')
  await expect.poll(async () => (await place(rates)).y).toBeLessThan(before.y)
  const moved = await restingPlace(rates)

  await page.keyboard.press('Control+z')
  await expect.poll(() => place(rates)).toEqual(before)
  await expect(page.getByText('Layout change undone.')).toBeVisible()
  await page.keyboard.press('Control+y')
  await expect.poll(() => place(rates)).toEqual(moved)

  // In a text field, Ctrl + Z is the field's own.
  await page.getByRole('combobox', { name: 'Command bar' }).fill('SEM')
  await page.keyboard.press('Control+z')
  await expect.poll(() => place(rates)).toEqual(moved)

  // The menu does the same, and the default layout is undone too.
  await fromMenu(rates, 'Default layout of the screen')
  await expect.poll(() => place(rates)).toEqual(before)
  await fromMenu(rates, 'Undo')
  await expect.poll(() => place(rates)).toEqual(moved)
})

test('a locked layout neither drags nor changes from the menu, until unlocked', async ({
  page,
}) => {
  const rates = await openDashboard(page)
  await fromMenu(rates, 'Lock the layout')
  await expect(rates.getByTitle(LOCKED_HINT)).toBeVisible()
  await expect(rates.getByTitle(DRAG_HINT)).toHaveCount(0)
  await expect(rates.locator('header')).not.toHaveCSS('cursor', 'move')
  await expect(page.locator('.react-resizable-handle:visible')).toHaveCount(0)

  const before = await place(rates)
  const bar = await place(rates.locator('header'))
  await drag(page, { x: bar.x + 40, y: bar.y + bar.height / 2 }, { x: 100, y: 80 })
  await expect.poll(() => place(rates)).toEqual(before)

  // Still locked on the next visit; the menu unlocks it, and offers nothing else that moves.
  await page.reload()
  await expect(rates.getByTitle(LOCKED_HINT)).toBeVisible()
  await rates.getByRole('button', { name: /layout menu$/ }).click()
  await expect(page.getByRole('menuitem', { name: 'Unlock the layout' })).toBeFocused()
  await expect(page.getByRole('menuitem', { name: 'Move up' })).toBeDisabled()
  await expect(page.getByRole('menuitem', { name: 'Hide the panel' })).toBeDisabled()
  await page.getByRole('menuitem', { name: 'Unlock the layout' }).click()
  await expect(rates.getByTitle(DRAG_HINT)).toBeVisible()
})

test('a layout saved under a name comes back after the default one', async ({ page }) => {
  const rates = await openDashboard(page)
  const before = await place(rates)
  await fromMenu(rates, 'Move up')
  await expect.poll(async () => (await place(rates)).y).toBeLessThan(before.y)
  const moved = await restingPlace(rates)

  await fromMenu(rates, 'Saved layouts…')
  const dialog = page.getByRole('dialog', { name: 'Saved layouts' })
  await dialog.getByRole('textbox', { name: 'Save the current layout as' }).fill('Morning')
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Layout saved as “Morning”.')).toBeVisible()

  await fromMenu(rates, 'Default layout of the screen')
  await expect.poll(() => place(rates)).toEqual(before)
  await page.reload()
  await fromMenu(rates, 'Saved layouts…')
  await dialog.getByRole('button', { name: 'Apply Morning' }).click()
  await expect.poll(() => place(rates)).toEqual(moved)

  await fromMenu(rates, 'Saved layouts…')
  await dialog.getByRole('button', { name: 'Delete Morning' }).click()
  await page
    .getByRole('dialog', { name: 'Delete a saved layout' })
    .getByRole('button', {
      name: 'Delete',
    })
    .click()
  await expect(dialog.getByText('No layout saved for this screen yet.')).toBeVisible()
})

test('a layout that could not be loaded is never saved over', async ({ page }) => {
  // The network fails for the layout of MKT, while the session says so.
  await page.addInitScript(() => {
    const original = window.fetch.bind(window)
    window.fetch = (input, init) => {
      const url = input instanceof Request ? input.url : String(input)
      const method = init?.method ?? (input instanceof Request ? input.method : 'GET')
      if (
        sessionStorage.getItem('fail-layout') &&
        method === 'GET' &&
        url.endsWith('/me/layouts/MKT')
      ) {
        return Promise.reject(new TypeError('Failed to fetch'))
      }
      return original(input, init)
    }
  })
  const rates = await openDashboard(page)
  await fromMenu(rates, 'Saved layouts…')
  const dialog = page.getByRole('dialog', { name: 'Saved layouts' })
  await dialog.getByRole('textbox', { name: 'Save the current layout as' }).fill('Morning')
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Layout saved as “Morning”.')).toBeVisible()

  await page.evaluate(() => sessionStorage.setItem('fail-layout', 'yes'))
  const saves: string[] = []
  page.on('request', (request) => {
    if (request.method() === 'PUT' && request.url().includes('/me/layouts/'))
      saves.push(request.url())
  })
  await page.reload()
  // After its retries, the screen says so, and shows its default.
  await expect(page.getByText(/^Your layout of this screen could not be loaded/)).toBeVisible({
    timeout: 15_000,
  })
  await fromMenu(rates, 'Move up')
  await fromMenu(rates, 'Saved layouts…')
  await expect(
    dialog.getByText(/^The saved layouts of this screen could not be loaded/),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  expect(saves).toEqual([])

  await page.evaluate(() => sessionStorage.removeItem('fail-layout'))
  await page.reload()
  await fromMenu(rates, 'Saved layouts…')
  await expect(dialog.getByRole('button', { name: 'Apply Morning' })).toBeVisible()
})

test('below 1280 px the panels stack and change places from their menu alone', async ({ page }) => {
  const rates = await openDashboard(page)
  const inGrid = await place(rates)
  await page.setViewportSize({ width: 1200, height: 800 })
  await expect(page.locator('.react-grid-layout')).toHaveCount(0)
  const indices = panel(page, 'Indices')
  const [one, other] = [await place(rates), await place(indices)]
  expect([one.x, one.width]).toEqual([other.x, other.width])
  // Nothing drags here.
  await expect(rates.locator('header')).not.toHaveCSS('cursor', 'move')
  await expect(rates.getByTitle(DRAG_HINT)).toHaveCount(0)

  const titles = await stackedTitles(page)
  const at = titles.indexOf('Rates and FX')
  // From the keyboard: the button keeps the focus as its panel goes up.
  const button = rates.getByRole('button', { name: 'FX: layout menu' })
  await button.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('menuitem', { name: 'Move left' })).toHaveCount(0)
  await page.getByRole('menuitem', { name: 'Move up' }).focus()
  await page.keyboard.press('Enter')
  const expected = [...titles]
  expected.splice(at - 1, 2, titles[at]!, titles[at - 1]!)
  await expect.poll(() => stackedTitles(page)).toEqual(expected)
  await expect(button).toBeFocused()

  await page.reload()
  await expect.poll(() => stackedTitles(page)).toEqual(expected)
  // The grid keeps its own layout.
  await page.setViewportSize({ width: 1600, height: 900 })
  await expect(rates.getByTitle(DRAG_HINT)).toBeVisible()
  await expect.poll(() => place(rates)).toEqual(inGrid)
})
