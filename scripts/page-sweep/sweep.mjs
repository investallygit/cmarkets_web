// npm run sweep: every page of the app as each demo account, in English and in French, at the
// widths of ROADMAP step 50, recording what should never show (its detectors D1 to D11). It needs
// the front end running (BASE_URL, http://localhost:5173 by default) on a CMarket.Api with its
// development tools and demo data, started on a fresh database. Against the live site, --readonly
// blocks every write, keeps each profile's language and types SWEEP_CODE as the login code.
//
//   npm run sweep -- [--accounts analyst,svt,visitor] [--langs en,fr] [--widths 1600,390]
//                    [--extra-widths 1280,1279,1024,768,320] [--no-axe] [--no-reload] [--readonly]
//                    [--browser chromium|firefox|webkit] [--out <folder>]
//
// It writes <out>/results.jsonl (a line per page visit), <out>/summary.md (the findings by kind
// and cause), and <out>/shots (each page at 1600 px in English and 390 px in French).
import { appendFile, mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { hasLoading, runAxe, scanPage } from './lib/detect.mjs'
import { explore } from './lib/explore.mjs'
import { summarize } from './lib/report.mjs'
import {
  ACCOUNTS,
  discoverIds,
  expectedFor,
  extrasFor,
  ROUTES,
  SCREENS,
  VISITOR,
} from './lib/screens.mjs'
import { loadTexts } from './lib/texts.mjs'
import { watch } from './lib/watch.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const webRoot = process.env.WEB_ROOT ?? path.resolve(here, '../..')
const require = createRequire(path.join(webRoot, 'package.json'))
const engines = require('@playwright/test')
const axeSource = require.resolve('axe-core/axe.min.js')

const args = process.argv.slice(2)
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`)
  return index >= 0 && args[index + 1] && !args[index + 1].startsWith('--')
    ? args[index + 1]
    : fallback
}
const flag = (name) => args.includes(`--${name}`)
const list = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

const BASE = process.env.BASE_URL ?? 'http://localhost:5173'
const TIMEZONE = process.env.SWEEP_TZ ?? 'Europe/Paris'
const PASSWORD = process.env.SWEEP_PASSWORD ?? 'cmarket2026'
const readonly = flag('readonly')
const engine = option('browser', 'chromium')
if (!['chromium', 'firefox', 'webkit'].includes(engine))
  throw new Error(`--browser ${engine}: chromium, firefox or webkit`)
const chosen = option('accounts')
  ? list(option('accounts'))
  : [...ACCOUNTS.map((a) => a.key), 'visitor']
const langs = readonly ? ['profile'] : list(option('langs', 'en,fr'))
const widths = list(option('widths', '1600,390')).map(Number).filter(Number.isFinite)
const extraWidths = list(option('extra-widths', '1280,1279,1024,768,320'))
  .map(Number)
  .filter(Number.isFinite)
const axe = !flag('no-axe')
const reloads = !flag('no-reload')
const exploring = flag('explore')
const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
const out = path.resolve(option('out', path.join(webRoot, 'test-results', 'page-sweep', stamp)))

const size = (width) => ({ width, height: width >= 1024 ? 900 : width >= 768 ? 1024 : 844 })
const slug = (value) =>
  value
    .replace(/^\//, '')
    .replace(/[^\w.-]+/g, '_')
    .slice(0, 80) || 'home'

async function write(record) {
  await appendFile(path.join(out, 'results.jsonl'), `${JSON.stringify(record)}\n`)
}

/** In the app: to another page as its links go, without loading the site again. */
async function navigate(page, target) {
  await page.evaluate((address) => {
    window.history.pushState(null, '', address)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, target)
}

/** Waits until no API request is waiting and nothing spins for half a second (12 s at most). */
async function settle(page, ears, limit = 12_000) {
  const start = Date.now()
  let quiet = Date.now()
  await page.waitForTimeout(200)
  while (Date.now() - start < limit) {
    if (ears.inflight() > 0) quiet = Date.now()
    else if (Date.now() - quiet >= 500) {
      const loading = await page.evaluate(hasLoading).catch(() => true)
      if (!loading) return Date.now() - start
    }
    await page.waitForTimeout(150)
  }
  return -1
}

/**
 * A new width, then the page settled: the layout it switches to mounts its panels again, and a
 * query that failed asks again, which the next page would otherwise hear.
 */
async function resize(page, ears, width) {
  await page.setViewportSize(size(width))
  await settle(page, ears)
}

async function logIn(page, email) {
  await page.goto('/login')
  await page.getByLabel('E-mail address').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Log in' }).click()
  if (process.env.SWEEP_CODE) await page.getByLabel('Code').fill(process.env.SWEEP_CODE)
  else await page.getByRole('button', { name: 'Fill in' }).click()
  await page.getByRole('button', { name: 'Verify' }).click()
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30_000 })
}

/** GET on CMarket.Api as the page's user: a token from the session's refresh cookie. */
async function apiAs(page) {
  const refresh = await page.request.post('/api/v1/auth/refresh')
  const { accessToken } = await refresh.json()
  return async (route) => {
    const response = await page.request.get(`/api/v1${route}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!response.ok()) throw new Error(`${response.status()} ${route}`)
    return response.json()
  }
}

/** The live site read only: every write refused, but the login and the computing POSTs. */
async function guard(context) {
  const reads =
    /\/auth\/(login|otp\/verify|refresh)$|\/analysis\/screener$|\/bonds\/[^/]+\/calculate$|\/bonds\/price$|\/optimizer\/(estimates|check|run|frontier-point)$/
  await context.route('**/api/v1/**', (route) => {
    const request = route.request()
    const allowed = request.method() === 'GET' || reads.test(new URL(request.url()).pathname)
    return allowed ? route.continue() : route.abort('blockedbyclient')
  })
}

/** The language of the profile, switched from the user menu as a user does (it writes /me). */
async function setLanguage(page, language) {
  if (language === 'profile') return
  const current = await page.evaluate(() => document.documentElement.lang)
  if (current.startsWith(language)) return
  await page.getByRole('banner').locator('button[aria-haspopup="menu"]').last().click()
  await page
    .getByRole('menuitem', { name: language === 'fr' ? 'Français' : 'English' })
    .click()
  await page.waitForFunction((code) => document.documentElement.lang.startsWith(code), language)
  await page.waitForTimeout(500)
}

async function axeOn(page) {
  // After the animations that end (the home page's fade-in, whose colours axe would read halfway),
  // 3 s at most; the pulse and the ticker run for ever.
  await page.evaluate(() =>
    Promise.race([
      Promise.all(
        document
          .getAnimations()
          .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
          .map((animation) => animation.finished.catch(() => {})),
      ),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]),
  )
  if (!(await page.evaluate(() => 'axe' in window))) await page.addScriptTag({ path: axeSource })
  return page.evaluate(runAxe)
}

/**
 * One page: opened (in the app, or by its address when `pass.load`), let settle, scanned, axe, a
 * screenshot, the API's answers and the console; on the hubs pass, the subscriptions it leaves.
 */
async function visit(page, ears, who, target, pass) {
  ears.reset()
  const started = Date.now()
  const record = {
    account: who.key,
    lang: pass.lang,
    width: pass.width,
    pass: pass.name,
    path: target.path,
    kind: target.kind,
    expect: target.expect,
    main: target.main,
  }
  try {
    if (pass.load) await page.goto(target.path, { waitUntil: 'load' })
    else await navigate(page, target.path)
    await page.mouse.move(40 + (started % 200), 400)
    record.settled = await settle(page, ears)
    const settledAt = Date.now()
    const address = new URL(page.url())
    record.final = address.pathname + address.search
    record.scan = await page.evaluate(scanPage, { routes: ROUTES })
    if (pass.axe && target.expect === 'page') record.axe = await axeOn(page)
    if (pass.shot) {
      record.shot = `${who.key}-${pass.lang}-${pass.width}-${slug(target.path)}.png`
      await page.screenshot({
        path: path.join(out, 'shots', record.shot),
        fullPage: pass.width < 768,
      })
    }
    await page.waitForTimeout(300)
    const heard = ears.heard()
    record.heard = {
      ...heard,
      responses: heard.responses.map(({ at, ...response }) => ({
        ...response,
        idle: at > settledAt + 300,
      })),
    }
    if (pass.hubs && who.neutral && target.path !== who.neutral && target.expect === 'page') {
      await navigate(page, who.neutral)
      await settle(page, ears, 6000)
      await page.waitForTimeout(500)
      record.leak = ears.subscriptions().filter((symbol) => !who.baseline.includes(symbol))
      record.conversations = ears.conversations()
    }
  } catch (error) {
    record.sweepError = String(error?.message ?? error).slice(0, 600)
  }
  record.ms = Date.now() - started
  await write(record)
  return record
}

/** The menu's addresses as the page lists them. */
async function menuPaths(page, texts) {
  const names = texts.mainMenu.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const nav = page.getByRole('navigation', { name: new RegExp(`^(${names.join('|')})$`) })
  return nav.locator('a[href]').evaluateAll((anchors) => anchors.map((a) => a.getAttribute('href')))
}

/** The account's pages: the screens with what each should show it, its menu, its extras. */
function plan(me, menu, extras) {
  const targets = new Map()
  const add = (target) => {
    if (!targets.has(target.path)) targets.set(target.path, { expect: 'page', ...target })
  }
  for (const screen of SCREENS) {
    add({
      path: screen.path,
      kind: menu.includes(screen.path) ? 'menu' : 'screen',
      expect: expectedFor(me, screen),
    })
  }
  for (const address of menu) add({ path: address, kind: 'menu' })
  for (const extra of extras) add({ kind: 'extra', ...extra })
  return [...targets.values()]
}

/**
 * WebKit keeps no Secure cookie over http, even on localhost: the session's refresh cookie then
 * comes without that flag, so that a page opened by its address keeps the session.
 */
async function keepSessionCookie(context) {
  if (engine !== 'webkit' || !BASE.startsWith('http:')) return
  await context.route('**/api/v1/auth/**', async (route) => {
    const response = await route.fetch()
    const headers = response.headers()
    if (headers['set-cookie']) {
      headers['set-cookie'] = headers['set-cookie'].replace(/;\s*secure/gi, '')
    }
    await route.fulfill({ response, headers })
  })
}

async function sweepAccount(browser, account, texts, seen) {
  const log = (line) => console.log(`[${account.key}] ${line}`)
  const context = await browser.newContext({
    baseURL: BASE,
    viewport: size(widths[0]),
    locale: 'en-US',
    timezoneId: TIMEZONE,
    bypassCSP: true,
  })
  await keepSessionCookie(context)
  await context.addInitScript({ content: texts.initScript })
  if (readonly) await guard(context)
  const page = await context.newPage()
  const ears = watch(page)
  try {
    await logIn(page, account.email)
  } catch (error) {
    await write({ account: account.key, path: '/login', sweepError: `login: ${error.message}` })
    await context.close()
    return
  }
  const get = await apiAs(page)
  const me = await get('/me')
  const ids = await discoverIds(account.key, get)
  await settle(page, ears)
  const menu = await menuPaths(page, texts)
  const targets = plan(me, menu, extrasFor(account.key, ids))
  // A page's main account is the first that may open it: an account shown the refusal first is
  // not (the Analyst on the SVT's, the Data admin's and the Admin's screens).
  for (const target of targets) {
    target.main = target.expect === 'page' && !seen.has(target.path)
    if (target.expect === 'page') seen.add(target.path)
  }
  const who = { key: account.key, neutral: account.neutral, baseline: [] }
  const first = await page.evaluate(() => document.documentElement.lang.slice(0, 2))
  log(
    `${me.accountType}, ${menu.length} menu entries, ${targets.length} pages, profile in ${first}`,
  )

  if (exploring) {
    const language = langs[0] === 'profile' ? first : langs[0]
    await setLanguage(page, language)
    const mains = targets.filter((target) => target.expect === 'page' && target.main)
    for (const target of mains) {
      const record = {
        account: account.key,
        lang: language,
        width: 1600,
        pass: 'explore',
        path: target.path,
        kind: target.kind,
      }
      const started = Date.now()
      try {
        await navigate(page, target.path)
        await settle(page, ears)
        record.explore = await explore(page, ears, scanPage, { routes: ROUTES })
      } catch (error) {
        record.sweepError = String(error?.message ?? error).slice(0, 600)
      }
      record.ms = Date.now() - started
      await write(record)
      log(
        `explored ${target.path}: ${record.explore?.clicked ?? 0} controls, ${record.explore?.findings.length ?? '?'} findings`,
      )
    }
    await setLanguage(page, first)
    await context.close()
    return
  }

  const pages = targets.filter((target) => target.expect === 'page')
  const others = targets.filter((target) => target.expect !== 'page')
  for (const [l, language] of langs.entries()) {
    await page.setViewportSize(size(1600))
    await setLanguage(page, language)
    for (const [w, width] of widths.entries()) {
      await resize(page, ears, width)
      const firstPass = l === 0 && w === 0
      const pass = {
        name: 'app',
        lang: language === 'profile' ? first : language,
        width,
        axe,
        shot: (language !== 'fr' && width === 1600) || (language === 'fr' && width === 390),
        hubs: firstPass,
      }
      if (firstPass) {
        await navigate(page, who.neutral)
        await settle(page, ears)
        await page.waitForTimeout(800)
        who.baseline = ears.subscriptions()
      }
      const chosenTargets = w === 0 ? [...pages, ...others] : pages
      for (const target of chosenTargets) await visit(page, ears, who, target, pass)
      log(`${pass.lang} ${width}: ${chosenTargets.length} pages`)
      if (firstPass && reloads) {
        for (const target of [...pages, ...others]) {
          await visit(page, ears, who, target, {
            ...pass,
            name: 'load',
            load: true,
            axe: false,
            shot: false,
            hubs: false,
          })
        }
        log(`${pass.lang} ${width}: ${pages.length + others.length} pages loaded by their address`)
      }
    }
    if (l === 0) {
      const mains = pages.filter((target) => target.main)
      for (const width of extraWidths) {
        await resize(page, ears, width)
        for (const target of mains) {
          await visit(page, ears, who, target, {
            name: 'width',
            lang: langs[0] === 'profile' ? first : langs[0],
            width,
            axe: false,
            shot: false,
          })
        }
      }
      if (extraWidths.length > 0)
        log(`extra widths ${extraWidths.join(', ')}: ${mains.length} pages each`)
    }
  }
  await page.setViewportSize(size(1600))
  await setLanguage(page, first)
  log(`done, opened hubs: ${JSON.stringify(ears.opened())}`)
  await context.close()
}

async function sweepVisitor(browser, texts) {
  for (const language of langs.map((value) => (value === 'profile' ? 'en' : value))) {
    const context = await browser.newContext({
      baseURL: BASE,
      viewport: size(widths[0]),
      locale: language === 'fr' ? 'fr-FR' : 'en-US',
      timezoneId: TIMEZONE,
      bypassCSP: true,
    })
    await context.addInitScript({ content: texts.initScript })
    if (readonly) await guard(context)
    const page = await context.newPage()
    const ears = watch(page)
    for (const width of widths) {
      await resize(page, ears, width)
      for (const target of VISITOR) {
        const pass = {
          name: 'load',
          load: true,
          lang: language,
          width,
          axe: axe && (target.expect ?? 'page') === 'page',
          shot: (language === 'en' && width === 1600) || (language === 'fr' && width === 390),
        }
        await visit(
          page,
          ears,
          { key: 'visitor' },
          { kind: 'visitor', expect: 'page', ...target },
          pass,
        )
      }
    }
    console.log(`[visitor] ${language}: ${VISITOR.length} pages at ${widths.join(', ')} px`)
    await context.close()
  }
}

await mkdir(path.join(out, 'shots'), { recursive: true })
const texts = await loadTexts(webRoot)
await writeFile(
  path.join(out, 'run.json'),
  JSON.stringify(
    {
      base: BASE,
      browser: engine,
      readonly,
      chosen,
      langs,
      widths,
      extraWidths,
      axe,
      started: new Date(),
    },
    null,
    1,
  ),
)
console.log(`Sweep of ${BASE} in ${engine} into ${out}`)
const browser = await engines[engine].launch()
const seen = new Set()
for (const account of ACCOUNTS.filter((candidate) => chosen.includes(candidate.key))) {
  await sweepAccount(browser, account, texts, seen)
}
if (chosen.includes('visitor')) await sweepVisitor(browser, texts)
await browser.close()
const summary = await summarize(out)
console.log(
  `${summary.visits} visits, ${summary.findings} findings in ${summary.groups} groups:`,
  Object.fromEntries(summary.byKind),
)
console.log(`Report: ${path.join(out, 'summary.md')}`)
