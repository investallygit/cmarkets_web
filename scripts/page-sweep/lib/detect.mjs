// The detectors that run inside the page (page.evaluate): each function stands alone, reading the
// app's strings from window.__SWEEP__ (texts.mjs).

/** Something still loading: a spinner, a skeleton, a region marked busy. */
export function hasLoading() {
  const shown = (element) => {
    const box = element.getBoundingClientRect()
    return box.width > 2 && box.height > 2 && getComputedStyle(element).visibility !== 'hidden'
  }
  return [...document.querySelectorAll('.animate-spin, .animate-pulse, [aria-busy="true"]')].some(
    shown,
  )
}

/**
 * D1 and D4 to D8 on the page as it shows: the status page shown, text that should never show,
 * numbers written the other language's way, strings of the other language, what overflows or is
 * cut, what is still loading or failed, broken images and links to no route.
 */
export function scanPage({ routes }) {
  const sweep = window.__SWEEP__
  const lang = document.documentElement.lang || ''
  const french = lang.startsWith('fr')
  const body = document.body
  const text = body.innerText ?? ''
  const flat = text.replace(/\s+/g, ' ')
  const shown = (element) => {
    if (!element || element.closest('[aria-hidden="true"], .sr-only')) return false
    const box = element.getBoundingClientRect()
    const style = getComputedStyle(element)
    return box.width > 2 && box.height > 2 && style.visibility !== 'hidden' && style.opacity !== '0'
  }
  const where = (element) => {
    const dialog = element.closest('[role="dialog"], dialog')
    const panel = element.closest('section')
    const heading = (node) => node?.querySelector('h1, h2, h3')?.textContent?.trim().slice(0, 50)
    const region = element.closest('header, nav, main, aside, footer')?.tagName.toLowerCase()
    return (
      [
        dialog && `dialog ${dialog.getAttribute('aria-label') ?? heading(dialog) ?? ''}`.trim(),
        panel && heading(panel) && `panel ${heading(panel)}`,
        region,
      ]
        .filter(Boolean)
        .join(' / ') || element.tagName.toLowerCase()
    )
  }
  const around = (source, index, length = 0) =>
    source.slice(Math.max(0, index - 40), index + length + 40).replace(/\s+/g, ' ')
  const matches = (patterns, value) => patterns.some((source) => new RegExp(source).test(value))

  // D1: the page shown.
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  let status = 'page'
  if (lines.some((line) => matches(sweep.status.crash, line))) status = 'crash'
  else if (lines.some((line) => matches(sweep.status.notFound, line))) status = 'notFound'
  else if (lines.some((line) => matches(sweep.status.forbidden, line))) status = 'forbidden'
  else if (lines.some((line) => matches(sweep.status.locked, line))) status = 'locked'

  // D4: what should never show, in the text and in the fields.
  const bad = []
  const never = [
    ['undefined', /\bundefined\b/],
    ['null', /(^|[\s(:])null(?=$|[\s),.;])/],
    ['NaN', /\bNaN\b/],
    ['Infinity', /\bInfinity\b/],
    ['Invalid Date', /Invalid Date/],
    ['[object Object]', /\[object Object\]/],
    ['negative zero', /(^|[\s(])[-−]0(?:[.,]0+)?(?:\s?%)?(?=$|[\s)])/],
    ['placeholder', /\{\{|\}\}/],
    ['epoch date', /\b(?:0?1[/.]0?1[/.](?:1970|0001)|1970-01-01|0001-01-01)\b/],
  ]
  for (const [name, pattern] of never) {
    const found = pattern.exec(flat)
    if (found) bad.push({ name, context: around(flat, found.index, found[0].length) })
  }
  for (const field of document.querySelectorAll('input, textarea')) {
    if (shown(field) && /\b(NaN|undefined|Infinity|null)\b/.test(field.value)) {
      bad.push({ name: 'field value', context: `${field.value} (${where(field)})` })
    }
  }
  const keys = new Set()
  const attributes = [...document.querySelectorAll('[aria-label], [title], [placeholder]')]
    .filter(shown)
    .flatMap((element) =>
      ['aria-label', 'title', 'placeholder'].map((name) => element.getAttribute(name) ?? ''),
    )
  for (const source of [flat, ...attributes]) {
    for (const found of source.matchAll(/[A-Za-z][\w-]*(?:\.[\w-]+)+/g)) {
      if (sweep.keys.has(found[0])) keys.add(found[0])
    }
  }

  // D5: figures written the other language's way: the app's figures, in its monospaced font (a
  // headline in its own language is data).
  const numbers = []
  const foreign = french
    ? [/\b\d{1,3}(?:,\d{3})+\.\d+\b/, /\b\d+\.\d+ ?%/]
    : [/\b\d{1,3}(?:[  ]\d{3})+,\d+\b/, /\b\d+,\d+[   ]?%/]
  const figures = document.createTreeWalker(body, NodeFilter.SHOW_TEXT)
  for (let node = figures.nextNode(); node && numbers.length < 8; node = figures.nextNode()) {
    const value = node.textContent
    if (!/\d/.test(value) || !node.parentElement || !shown(node.parentElement)) continue
    if (!getComputedStyle(node.parentElement).fontFamily.toLowerCase().includes('mono')) continue
    // A bond's short name keeps its coupon as written: "ECMR 6.25% 29".
    if (/\b[A-Z]{2,}[\w-]*\s+\d+(?:[.,]\d+)?%\s*\d{2,4}\b/.test(value)) continue
    if (foreign.some((pattern) => pattern.test(value))) {
      numbers.push(`${value.trim().slice(0, 60)} (${where(node.parentElement)})`)
    }
  }

  // Strings of the other language, as a whole text on screen (a language's own name aside).
  const mixed = []
  const others = french ? sweep.enOnly : sweep.frOnly
  // A language's own name, and the logo's "Market" (C + Market).
  const names = new Set(['Français', 'English', 'Market'])
  const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const value = node.textContent.trim()
    if (
      value.length >= 4 &&
      others.has(value) &&
      !names.has(value) &&
      shown(node.parentElement) &&
      mixed.length < 12
    ) {
      mixed.push({ text: value, where: where(node.parentElement) })
    }
  }
  for (const element of document.querySelectorAll('[aria-label], [placeholder], [title]')) {
    for (const name of ['aria-label', 'placeholder', 'title']) {
      const value = element.getAttribute(name)?.trim()
      if (value && others.has(value) && !names.has(value) && shown(element) && mixed.length < 12) {
        mixed.push({ text: value, where: `${name} of ${where(element)}` })
      }
    }
  }

  // D6: wider than the window; text cut by its box.
  const overflowX = Math.max(0, document.documentElement.scrollWidth - window.innerWidth)
  const cuts = []
  const figure = /^[-+−]?[\d\s  .,:/%]+[\s  ]?[A-Z$€£¥%]{0,4}$/
  // A figure, its currency first or not ("XAF 1 269 100").
  const isFigure = (value) =>
    figure.test(value) || figure.test(value.replace(/^(?:XAF|XOF|EUR|USD|GBP|CHF|NGN)[\s  ]+/, ''))
  // What crosses a box's end edge where the box shows: its own text, on which an ellipsis is
  // drawn, or text inside a box of its own (an inline-block, an inline-flex), cut with none (a
  // name ending "GAB 6.50"); nothing when the overflow lies in lines it hides (a two-line clamp).
  const crossing = (box) => {
    const edge = box.getBoundingClientRect()
    const texts = document.createTreeWalker(box, NodeFilter.SHOW_TEXT)
    for (let node = texts.nextNode(); node; node = texts.nextNode()) {
      if (!node.textContent.trim()) continue
      const range = document.createRange()
      range.selectNodeContents(node)
      const over = [...range.getClientRects()].some(
        (rect) =>
          rect.right > edge.right + 1 && rect.top < edge.bottom - 1 && rect.bottom > edge.top + 1,
      )
      if (!over) continue
      for (let parent = node.parentElement; parent && parent !== box; parent = parent.parentElement)
        if (getComputedStyle(parent).display !== 'inline') return 'box'
      return 'text'
    }
    return null
  }
  for (const element of body.querySelectorAll('*')) {
    if (cuts.length >= 40) break
    const style = getComputedStyle(element)
    const clipsX = style.overflowX === 'hidden' || style.overflowX === 'clip'
    const clipsY = style.overflowY === 'hidden' || style.overflowY === 'clip'
    if (!clipsX && !clipsY) continue
    const value = (element.innerText ?? '').trim()
    if (!value || !shown(element) || element.closest('[data-sweep-ignore], [role="marquee"]'))
      continue
    const cutX = clipsX && element.scrollWidth > element.clientWidth + 1
    const cutY =
      clipsY &&
      element.scrollHeight > element.clientHeight + 2 &&
      style.webkitLineClamp === 'none' &&
      element.clientHeight > 0
    if (!cutX && !cutY) continue
    const ellipsis = style.textOverflow === 'ellipsis'
    let kind = null
    if (cutX) {
      const across = crossing(element)
      if (across === 'box') kind = ellipsis ? 'cut with no ellipsis drawn' : 'cut sideways'
      else if (across === 'text' && !ellipsis) kind = 'cut sideways'
      else if (across === 'text' && isFigure(value)) kind = 'figure ends in an ellipsis'
    }
    if (!kind && cutY) kind = 'cut at the bottom'
    if (!kind) continue
    cuts.push({
      kind,
      text: value.replace(/\s+/g, ' ').slice(0, 70),
      by:
        kind === 'cut at the bottom'
          ? element.scrollHeight - element.clientHeight
          : element.scrollWidth - element.clientWidth,
      where: where(element),
    })
  }
  // A figure wider than its field: a price in a narrow input reads "51 82".
  for (const field of document.querySelectorAll('input')) {
    if (cuts.length >= 40) break
    const value = field.value.trim()
    if (!value || !shown(field) || field.scrollWidth <= field.clientWidth + 1) continue
    if (!isFigure(value)) continue
    cuts.push({
      kind: 'figure cut in its field',
      text: value.slice(0, 70),
      by: field.scrollWidth - field.clientWidth,
      where: where(field),
    })
  }

  // Controls out of reach: tabs out of their list's view, a control past a box that clips it
  // (one that scrolls lets the user reach it).
  const unreachable = []
  for (const list of document.querySelectorAll('[role="tablist"]')) {
    if (!shown(list)) continue
    const box = list.getBoundingClientRect()
    const tabs = [...list.querySelectorAll('[role="tab"]')]
    const inView = tabs.filter((tab) => {
      const edge = tab.getBoundingClientRect()
      return edge.left >= box.left - 1 && edge.right <= box.right + 1
    })
    if (tabs.length > 1 && inView.length < tabs.length) {
      unreachable.push({
        kind: `${inView.length} of ${tabs.length} tabs in view (${getComputedStyle(list).overflowX})`,
        name: tabs
          .map((tab) => tab.textContent.trim())
          .join(' | ')
          .slice(0, 80),
        where: where(list),
      })
    }
  }
  const controls = 'button, a[href], [role="tab"], input, select, textarea'
  for (const control of document.querySelectorAll(controls)) {
    if (unreachable.length >= 30 || !shown(control)) continue
    const edge = control.getBoundingClientRect()
    for (let box = control.parentElement; box && box !== body; box = box.parentElement) {
      const overflow = getComputedStyle(box).overflowX
      if (overflow === 'visible') continue
      if (overflow === 'hidden' || overflow === 'clip') {
        const limit = box.getBoundingClientRect()
        if (edge.right > limit.right + 2 || edge.left < limit.left - 2) {
          unreachable.push({
            kind:
              edge.left >= limit.right ? 'control hidden past its box' : 'control cut by its box',
            name: (control.getAttribute('aria-label') ?? control.textContent ?? '')
              .trim()
              .slice(0, 40),
            where: where(control),
          })
        }
      }
      break
    }
  }

  // D7: still loading, a panel that failed, the empty panels.
  const loading = [
    ...document.querySelectorAll('.animate-spin, .animate-pulse, [aria-busy="true"]'),
  ]
    .filter(shown)
    .map(where)
  const failed = [...document.querySelectorAll('button')]
    .filter((button) => shown(button) && sweep.retry.includes(button.textContent.trim()))
    .map((button) => ({
      where: where(button),
      text: (button.parentElement?.innerText ?? '').replace(/\s+/g, ' ').slice(0, 160),
    }))
  const empty = []
  const emptyWalker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT)
  for (let node = emptyWalker.nextNode(); node; node = emptyWalker.nextNode()) {
    if (sweep.noData.includes(node.textContent.trim()) && shown(node.parentElement)) {
      empty.push(where(node.parentElement))
    }
  }

  // D8: broken images, links to no route.
  const images = [...document.images]
    .filter((image) => image.complete && image.naturalWidth === 0 && shown(image))
    .map((image) => image.currentSrc || image.src)
  const known = routes.map((source) => new RegExp(source))
  const links = []
  for (const anchor of document.querySelectorAll('a[href]')) {
    const href = anchor.getAttribute('href') ?? ''
    const path = href.split(/[?#]/)[0]
    const broken =
      href === '#' || href === '' || (href.startsWith('/') && !known.some((re) => re.test(path)))
    if (broken && links.length < 10) {
      links.push({ href, text: anchor.innerText.trim().slice(0, 40), where: where(anchor) })
    }
  }

  return {
    lang,
    title: document.title,
    status,
    blank: text.trim().length < 10,
    bad,
    keys: [...keys],
    numbers,
    mixed,
    overflowX,
    cuts,
    unreachable,
    loading,
    failed,
    empty,
    images,
    links,
  }
}

/** D9: axe-core's WCAG 2.2 AA rules on the page (axe injected before). */
export async function runAxe() {
  const result = await window.axe.run(document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    resultTypes: ['violations'],
  })
  return result.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    nodes: violation.nodes.length,
    targets: violation.nodes.slice(0, 3).map((node) => node.target.join(' ')),
    html: violation.nodes.slice(0, 2).map((node) => node.html.slice(0, 160)),
    summary: violation.nodes[0]?.failureSummary?.slice(0, 240),
  }))
}
