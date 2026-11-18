// What the sweep opens: every screen of shared/routes/screens.ts with what gives access to it, the
// demo accounts, and each account's pages beyond its menu (tabs, addresses that name an item).

/** The 45 screens: [path, audience, permission, module], as `SCREENS` declares them. */
export const SCREENS = [
  ['/mkt', 'client', 'market:read', 'monitoring'],
  ['/cmdty', 'client', 'market:read', 'monitoring'],
  ['/eco', 'client', 'market:read', 'monitoring'],
  ['/fx', 'client', 'market:read', 'monitoring'],
  ['/eqs', 'client', 'analysis:read', 'analysis'],
  ['/etfs', 'client', 'analysis:read', 'analysis'],
  ['/ycrv', 'client', 'analysis:read', 'analysis'],
  ['/bp', 'client', 'analysis:read', 'analysis'],
  ['/bs', 'client', 'analysis:read', 'analysis'],
  ['/rfq', 'client', 'rfq:read'],
  ['/svt', 'client', 'svt:approve'],
  ['/svt/traders', 'client', 'svt:approve'],
  ['/rfq/agreements', 'client', 'rfq:read'],
  ['/svt/agreements', 'client', 'svt:approve'],
  ['/port', 'client', 'portfolios:read', 'portfolio'],
  ['/opt', 'client', 'portfolios:optimize', 'portfolio'],
  ['/opt/result', 'client', 'portfolios:optimize', 'portfolio'],
  ['/pub', 'client', 'research:read'],
  ['/pub/new', 'client', 'publications:write'],
  ['/net', 'client', 'directory:list'],
  ['/net/me', 'client', 'directory:profile'],
  ['/msg', 'client', 'messages:write'],
  ['/n', 'client', 'market:read', 'monitoring'],
  ['/n/new', 'client', 'news:write'],
  ['/alrt', 'client', 'alerts:write', 'monitoring'],
  ['/cal', 'client', 'market:read', 'monitoring'],
  ['/cfg', 'client'],
  ['/securities/SEMC/des', 'client', 'market:read', 'monitoring'],
  ['/data/session', 'backoffice', 'data:import'],
  ['/imp', 'backoffice', 'data:import'],
  ['/data/corrections', 'backoffice', 'data:import'],
  ['/data/content', 'backoffice', 'content:publish'],
  ['/data/eodhd', 'backoffice', 'data:import'],
  ['/data/history', 'backoffice', 'data:import'],
  ['/admin/users', 'backoffice', 'users:manage'],
  ['/admin/subscriptions', 'backoffice', 'subscriptions:manage'],
  ['/admin/media-payments', 'backoffice', 'news:payments'],
  ['/admin/sources', 'backoffice', 'news:payments'],
  ['/admin/analysts', 'backoffice', 'moderation:manage'],
  ['/admin/moderation', 'backoffice', 'moderation:manage'],
  ['/admin/payouts', 'backoffice', 'payouts:manage'],
  ['/admin/rfq', 'backoffice', 'rfq:report'],
  ['/admin/rfq/reports', 'backoffice', 'rfq:report'],
  ['/admin/settings', 'backoffice', 'settings:manage'],
  ['/admin/audit', 'backoffice', 'audit:read'],
].map(([path, audience, permission, module]) => ({ path, audience, permission, module }))

/** What a screen shows the user of `/me`: entities/session's canAccessScreen and lockedModule. */
export function expectedFor(me, screen) {
  const audience = ['dataAdmin', 'admin'].includes(me.accountType) ? 'backoffice' : 'client'
  if (audience !== screen.audience) return 'forbidden'
  if (screen.permission && !me.permissions.includes(screen.permission)) return 'forbidden'
  if (screen.module && !me.modules.includes(screen.module)) return 'locked'
  return 'page'
}

/** In this order: the first account to open a page is its main account (the extra widths). */
export const ACCOUNTS = [
  { key: 'analyst', email: 'k.atangana@analyst.example', neutral: '/cfg' },
  { key: 'manager', email: 'p.owona@asset-manager.example', neutral: '/cfg' },
  { key: 'trader', email: 't.bekale@bank.example', neutral: '/cfg' },
  { key: 'student', email: 's.mvondo@university.example', neutral: '/cfg' },
  { key: 'journalist', email: 'r.tamba@press.example', neutral: '/cfg' },
  { key: 'ceo', email: 'e.fouda@asset-manager.example', neutral: '/cfg' },
  { key: 'newsProvider', email: 'l.mballa@media-i.example', neutral: '/cfg' },
  { key: 'svt', email: 'b.sima@bank-e.example', neutral: '/cfg' },
  { key: 'dataAdmin', email: 'a.mbarga@cmarket.example', neutral: '/data/history' },
  { key: 'admin', email: 'l.mvogo@cmarket.example', neutral: '/admin/audit' },
  { key: 'waiting', email: 'f.biyong@mail.example', neutral: '/cfg' },
]

/** The visitor's pages, before any login. */
export const VISITOR = [
  { path: '/' },
  { path: '/login' },
  { path: '/signup' },
  { path: '/signup?type=analyst' },
  { path: '/reset-password' },
  { path: '/p/m-ndong' },
  // Not public: "This profile is not public, or no longer exists." (e2e/directory.spec.ts).
  { path: '/p/k-atangana', expect: 'missing' },
  { path: '/p/nobody-at-all', expect: 'missing' },
  { path: '/app', expect: 'redirect' },
  { path: '/mkt', expect: 'redirect' },
]

const NONE = '00000000-0000-0000-0000-000000000000'
const tabs = (id, fns) => fns.map((fn) => ({ path: `/securities/${id}/${fn}` }))
const missing = (path) => ({ path, expect: 'missing' })

const PROFILES = [
  ...tabs('SEMC', ['des', 'gp', 'fa', 'dvd', 'n', 'doc', 'hds', 'ana']),
  ...tabs('ECMR-6.25-2029', ['des', 'gp', 'bp', 'cf', 'rat', 'doc', 'n', 'ana']),
  ...tabs('IWDA.LSE', ['des', 'gp', 'hld', 'perf', 'dist', 'doc', 'n', 'ana']),
  ...tabs('BRENT', ['des', 'gp', 'cmp', 'n']),
  ...tabs('COMPANY-X-7.00-2028', ['des', 'cf']),
  ...tabs('VUSA.LSE', ['dist']),
  ...tabs('OKOUME', ['des']),
]

const portfolioTabs = (id) =>
  id
    ? ['', '/transactions', '/performance', '/risk', '/income', '/reports'].map((tab) => ({
        path: `/port/${id}${tab}`,
      }))
    : []

/** The ids of demo items an account's addresses name, read through the API as that account. */
export async function discoverIds(key, get) {
  const first = async (path, pick) => {
    try {
      return pick(await get(path)) ?? undefined
    } catch {
      return undefined
    }
  }
  const ids = {}
  if (['analyst', 'manager', 'student', 'ceo'].includes(key)) {
    ids.portfolio = await first('/portfolios', (list) => list[0]?.id)
  }
  if (key === 'analyst') {
    ids.news = await first('/news?pageSize=1', (page) => page.items[0]?.id)
    const library = await first('/library?pageSize=1', (page) => page.items[0])
    ids.publication = library?.id
    ids.analyst = library?.analyst?.id
    ids.conversation = await first('/conversations', (list) => list[0]?.id)
    ids.profile = await first('/directory?pageSize=1', (page) => page.items[0]?.userId)
    ids.scenario = await first('/optimizer/scenarios', (list) => list[0]?.id)
  }
  if (key === 'manager') {
    ids.agreement = await first('/rfq/agreements?pageSize=1', (page) => page.items[0]?.id)
  }
  if (key === 'dataAdmin') {
    ids.import = await first('/data/imports?pageSize=1', (page) => page.items[0]?.id)
  }
  if (key === 'admin') {
    ids.user = await first('/admin/users?pageSize=1', (page) => page.items[0]?.id)
    ids.request = await first('/admin/analyst-requests', (list) => list[0]?.id)
  }
  return ids
}

/**
 * What an account opens beyond its menu and the screens: the profiles' tabs, the portfolio's tabs,
 * the addresses that name an item, and the same with an id that does not exist.
 */
export function extrasFor(key, ids) {
  const named = (path, id) => (id ? [{ path: `${path}${encodeURIComponent(id)}` }] : [])
  switch (key) {
    case 'analyst':
      return [
        ...PROFILES,
        { path: '/securities/SEMC/hld', expect: 'redirect' },
        missing('/securities/NO-SUCH-SECURITY/des'),
        ...portfolioTabs(ids.portfolio),
        missing(`/port/${NONE}`),
        { path: '/n/documents' },
        { path: '/ycrv/ECMR-6.25-2029' },
        { path: '/bp/ECMR-6.25-2029' },
        { path: '/yas/ECMR-6.25-2029', expect: 'redirect' },
        { path: '/eco?country=CMR' },
        missing('/eco?country=XYZ'),
        { path: '/fx?currency=USD' },
        missing('/fx?currency=XYZ'),
        ...named('/n?article=', ids.news),
        missing(`/n?article=${NONE}`),
        ...named('/pub?id=', ids.publication),
        missing(`/pub?id=${NONE}`),
        ...named('/pub?analyst=', ids.analyst),
        ...named('/msg?c=', ids.conversation),
        missing(`/msg?c=${NONE}`),
        ...named('/net?profile=', ids.profile),
        missing(`/net?profile=${NONE}`),
        { path: '/p/m-ndong' },
        missing('/p/k-atangana'),
        ...named('/opt?scenario=', ids.scenario),
        missing(`/opt?scenario=${NONE}`),
        ...named('/opt?portfolio=', ids.portfolio),
        { path: '/no-such-screen', expect: 'notFound' },
      ]
    case 'manager':
      return [
        ...portfolioTabs(ids.portfolio),
        ...named('/rfq/agreements?id=', ids.agreement),
        { path: '/securities/ECMR-6.25-2029/des' },
      ]
    case 'trader':
      return [{ path: '/securities/ECMR-6.25-2029/des' }, { path: '/securities/SEMC/gp' }]
    case 'student':
    case 'ceo':
      return [...portfolioTabs(ids.portfolio).slice(0, 2), { path: '/securities/SEMC/gp' }]
    case 'journalist':
      return [{ path: '/securities/SEMC/gp' }, { path: '/securities/IWDA.LSE/des' }]
    case 'newsProvider':
      return [{ path: '/securities/SEMC/n' }]
    case 'svt':
      return [{ path: '/securities/BRENT/des' }, { path: '/securities/ECMR-6.25-2029/des' }]
    case 'dataAdmin':
      return [
        ...named('/imp?import=', ids.import),
        missing(`/imp?import=${NONE}`),
        { path: '/data/corrections?security=SEMC' },
        { path: '/data/corrections?security=BRENT' },
      ]
    case 'admin':
      return [
        ...named('/admin/users?id=', ids.user),
        missing(`/admin/users?id=${NONE}`),
        ...named('/admin/analysts?id=', ids.request),
        ...named('/admin/audit?userId=', ids.user),
      ]
    default:
      return []
  }
}

/** The routes of the app, to tell a link to a page that does not exist (paths.ts). */
export const ROUTES = [
  '/',
  '/login',
  '/signup',
  '/reset-password',
  '/p/[^/]+',
  '/app',
  '/_kit',
  '/securities/[^/]+/(des|gp|fa|dvd|n|doc|hds|ana|bp|cf|rat|hld|perf|dist|cmp)',
  '/(ycrv|bp|yas)(/[^/]+)?',
  '/port(/[^/]+(/(transactions|performance|risk|income|reports))?)?',
  '/n(/(documents|new))?',
  '/(mkt|cmdty|eco|fx|eqs|bs|etfs|rfq|svt|opt|pub|cal|alrt|cfg|net|msg|imp)',
  '/(rfq|svt)/agreements',
  '/svt/traders',
  '/opt/result',
  '/pub/new',
  '/net/me',
  '/data/(session|corrections|content|eodhd|history)',
  '/admin/(users|subscriptions|sources|media-payments|analysts|moderation|payouts|settings|audit|rfq)',
  '/admin/rfq/reports',
  '/api/v1/.+',
].map((source) => `^${source}/?$`)
