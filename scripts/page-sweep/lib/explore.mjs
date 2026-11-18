// The explorer (--explore): on a page, every tab, button, menu, drop-down and right-click menu
// opened and closed again, each table sorted by each column, bad values typed in each field of the
// page and of each dialog it opens. An action that would change data for good (a deletion, a
// send, a logout…) is never clicked, and nothing typed is ever sent: a dialog is looked at, its
// fields tried, then closed with Escape. What the page throws or logs meanwhile is recorded
// against the control.

/** Buttons never clicked: they change data at once, or leave the session. */
const NEVER =
  /log ?out|déconnex|delete|supprim|remove|retir|suspend|reactivat|réactiv|roll ?back|discard|abandon|publish|publier|submit|soumettre|send|envoy|resend|renvoy|approve|approuv|reject|rejet|take down|mark (as )?paid|marquer|confirm|withdraw|archiv|buy|achet|pay\b|payer|extend|prolong|change plan|invalidat|keep|conserv|release|libér|recalcul|block|bloqu|report|signal|follow|suivre|accept|declin|refus|revok|révoqu|reset|réinitialis|save|enregistr|sauvegard|generate|génér|answer|répond|improve|amélior|dispute|contest|retype|fix row|alert checked|leave|quitter|unblock|débloqu|unfollow|stop|close the|clôtur|lock|verrou|default|défaut|restore|restaur|cancel|annul/i

/** Values typed in each field, then taken back. */
const BAD_TEXT = ['', ' ', 'x'.repeat(5000), '😀🚀', '<img src=x onerror="window.__xss=1">']
const BAD_NUMBER = ['', '-1', '0', '1e309', 'abc', '1,5', '1.5', '99999999999999999999']

// The app's own bars: its menu, and a header or footer outside any panel (a panel's title bar is a
// header inside its section, with the panel's own buttons).
const SHELL = 'nav, [role="navigation"]'
const DIALOG = '[role="dialog"], [role="alertdialog"], dialog[open]'

/**
 * In the page: the controls, fields and table rows of the page's own content (`inDialog` false)
 * or of the dialog open (`inDialog` true), each given a stable mark.
 */
function markControls({ shell, dialog, inDialog }) {
  const shown = (element) => {
    const box = element.getBoundingClientRect()
    return box.width > 4 && box.height > 4 && getComputedStyle(element).visibility !== 'hidden'
  }
  let next = Number(document.body.dataset.sweepNext ?? 0)
  const mark = (element) => {
    if (!element.dataset.sweep) element.dataset.sweep = String(next++)
    return element.dataset.sweep
  }
  const own = (element) =>
    inDialog
      ? Boolean(element.closest(dialog))
      : !element.closest(shell) &&
        !element.closest(dialog) &&
        !['header', 'footer'].some(
          (tag) => element.closest(tag) && !element.closest(tag).closest('section'),
        )
  const name = (element) =>
    (
      element.labels?.[0]?.textContent ??
      element.getAttribute('aria-label') ??
      element.textContent ??
      ''
    )
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 60)
  const usable = (element) =>
    own(element) &&
    shown(element) &&
    !element.disabled &&
    element.getAttribute('aria-disabled') !== 'true'
  const controls = []
  for (const element of document.querySelectorAll(
    '[role="tab"], button, select, [role="combobox"]',
  )) {
    if (!usable(element)) continue
    const role = element.getAttribute('role')
    const kind = role === 'tab' ? 'tab' : element.tagName === 'SELECT' ? 'select' : 'button'
    const header = element.closest('th, [role="columnheader"]')
    controls.push({ id: mark(element), kind: header ? 'sort' : kind, name: name(element) })
  }
  const fields = []
  const typed = ['text', 'number', 'search', 'email', 'tel', 'url', 'password']
  for (const element of document.querySelectorAll('input, textarea')) {
    const type = (element.getAttribute('type') ?? 'text').toLowerCase()
    if (element.tagName !== 'TEXTAREA' && !typed.includes(type)) continue
    if (!usable(element) || element.readOnly) continue
    fields.push({
      id: mark(element),
      numeric: type === 'number' || ['decimal', 'numeric'].includes(element.inputMode),
      name: name(element) || element.getAttribute('placeholder') || element.name || type,
    })
  }
  const rows = []
  for (const table of document.querySelectorAll('table, [role="grid"]')) {
    if (!own(table) || !shown(table)) continue
    const row = table.querySelector('tbody tr, [role="row"]:not(:first-child)')
    if (row && shown(row)) rows.push({ id: mark(row), name: name(row).slice(0, 40) })
  }
  document.body.dataset.sweepNext = String(next)
  return { controls, fields, rows }
}

/** What is open: a dialog, a menu or a listbox. */
async function opened(page) {
  return page.evaluate((dialog) => {
    const shown = (element) => {
      const box = element.getBoundingClientRect()
      return box.width > 4 && box.height > 4
    }
    const any = (selector) => [...document.querySelectorAll(selector)].some(shown)
    return { dialog: any(dialog), menu: any('[role="menu"], [role="listbox"]') }
  }, DIALOG)
}

/** Closes what a control opened (Escape), then goes back to the page's address. */
async function close(page, address) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const now = await opened(page)
    if (!now.dialog && !now.menu) break
    await page.keyboard.press('Escape')
    await page.waitForTimeout(150)
  }
  const current = new URL(page.url())
  if (current.pathname + current.search !== address) {
    await page.evaluate((target) => {
      window.history.pushState(null, '', target)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }, address)
    await page.waitForTimeout(600)
  }
}

/** Each field given each bad value (then Tab, so that it checks itself), then its own back. */
async function tryFields(page, fields, check, where) {
  for (const field of fields.slice(0, 15)) {
    const element = page.locator(`[data-sweep="${field.id}"]`)
    if (!(await element.isVisible().catch(() => false))) continue
    const original = await element.inputValue().catch(() => null)
    if (original === null) continue
    for (const value of field.numeric ? BAD_NUMBER : BAD_TEXT) {
      try {
        await element.fill(value, { timeout: 1500 })
        await element.press('Tab', { timeout: 1500 })
        const shown = value.length > 20 ? `${value.slice(0, 12)}… (${value.length})` : value
        await check(`${where}field "${field.name}"`, `typed ${JSON.stringify(shown)}`)
      } catch {
        // A field that refuses the value as typed (letters in a number field) is right to.
      }
    }
    await element.fill(original).catch(() => {})
    await element.press('Tab').catch(() => {})
  }
}

/**
 * Explores the page now open: `ears` hears what goes wrong, `scan` (with `scanArgs`) reads the
 * page for what should never show. Returns one finding per control that broke something.
 */
export async function explore(page, ears, scan, scanArgs, { limit = 45 } = {}) {
  const findings = []
  const here = new URL(page.url())
  const address = here.pathname + here.search
  const check = async (control, action) => {
    await page.waitForTimeout(250)
    const heard = ears.heard()
    const problems = [
      ...heard.errors.map((error) => `page error: ${error.split('\n')[0]}`),
      // The browser's line for a refused request: a 4xx answers a bad value, which the page says.
      ...heard.console
        .filter((line) => line.type === 'error' && !/status of 4\d\d/.test(line.text))
        .map((line) => `console: ${line.text.slice(0, 200)}`),
      ...heard.responses
        .filter((response) => response.status >= 500)
        .map((response) => `${response.status} ${response.method} ${response.url}`),
      ...heard.dialogs.map((dialog) => `browser dialog: ${dialog}`),
    ]
    const seen = await page.evaluate(scan, scanArgs).catch(() => null)
    if (seen) {
      for (const item of seen.bad) problems.push(`shows ${item.name}: ${item.context}`)
      for (const key of seen.keys) problems.push(`shows the key ${key}`)
      if (seen.status === 'crash') problems.push('error boundary')
      if (seen.overflowX > 0) problems.push(`page wider than the window by ${seen.overflowX} px`)
    }
    if (await page.evaluate(() => window.__xss === 1).catch(() => false)) {
      problems.push('a typed script ran')
    }
    if (problems.length > 0)
      findings.push({ control, action, problems: [...new Set(problems)].slice(0, 6) })
    ears.reset()
  }

  ears.reset()
  const own = await page.evaluate(markControls, { shell: SHELL, dialog: DIALOG, inDialog: false })
  const known = new Set(own.fields.map((field) => field.id))
  let clicked = 0
  let dialogs = 0
  for (const control of own.controls) {
    if (clicked >= limit) break
    if (control.kind === 'button' && NEVER.test(control.name)) continue
    const element = page.locator(`[data-sweep="${control.id}"]`)
    if (!(await element.isVisible().catch(() => false))) continue
    // Disabled by an earlier click, and rightly: ECO's sixth economy, BP's form left incomplete.
    if (await element.isDisabled().catch(() => false)) continue
    clicked += 1
    const label = `${control.kind} "${control.name}"`
    try {
      await element.click({ timeout: 2000 })
      await page.waitForTimeout(300)
      const now = await opened(page)
      await check(label, now.dialog ? 'opened a dialog' : now.menu ? 'opened a menu' : 'clicked')
      if (now.dialog) {
        dialogs += 1
        const inside = await page.evaluate(markControls, {
          shell: SHELL,
          dialog: DIALOG,
          inDialog: true,
        })
        await tryFields(page, inside.fields, check, `${label} › `)
      } else {
        // A side form the control opened in the page: its fields are new.
        const after = await page.evaluate(markControls, {
          shell: SHELL,
          dialog: DIALOG,
          inDialog: false,
        })
        const added = after.fields.filter((field) => !known.has(field.id))
        added.forEach((field) => known.add(field.id))
        if (added.length > 0) {
          dialogs += 1
          await tryFields(page, added, check, `${label} › `)
        }
      }
    } catch (error) {
      findings.push({
        control: label,
        action: 'click',
        problems: [`not clickable: ${String(error.message).split('\n')[0]}`],
      })
    }
    await close(page, address)
  }
  for (const row of own.rows) {
    const element = page.locator(`[data-sweep="${row.id}"]`)
    if (!(await element.isVisible().catch(() => false))) continue
    try {
      await element.click({ button: 'right', timeout: 2000 })
      await page.waitForTimeout(300)
      await check(`row "${row.name}"`, 'right-click menu')
    } catch (error) {
      findings.push({
        control: `row "${row.name}"`,
        action: 'right click',
        problems: [String(error.message).split('\n')[0]],
      })
    }
    await close(page, address)
  }
  await tryFields(page, own.fields, check, '')
  await close(page, address)
  return {
    clicked,
    dialogs,
    fields: Math.min(own.fields.length, 15),
    rows: own.rows.length,
    findings,
  }
}
