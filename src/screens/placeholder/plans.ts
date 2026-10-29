import type { WorkspaceItem } from '@/shared/ui/Workspace'

/** A panel of a screen not built yet: its place in the mockup and the API it will consume. */
export interface PanelPlan {
  id: string
  title: string
  code: string
  api: string[]
  x: number
  y: number
  w: number
  h: number
}

function fullScreen(title: string, code: string, api: string[]): PanelPlan[] {
  return [{ id: 'main', title, code, api, x: 0, y: 0, w: 12, h: 26 }]
}

// prettier-ignore
const YIELD_CURVES: PanelPlan[] = [
  { id: 'curves', title: 'CEMAC sovereign yield curves', code: 'YCRV', api: ['GET /yield-curves?country=&date='], x: 0, y: 0, w: 8, h: 15 },
  { id: 'calculator', title: 'Bond calculator', code: 'YAS', api: ['GET /bonds/{id}', 'POST /bonds/{id}/calculate'], x: 8, y: 0, w: 4, h: 15 },
  { id: 'auctions', title: 'Latest government securities auctions (BEAC)', code: 'CAL', api: ['GET /auctions?country=&from=&to='], x: 0, y: 15, w: 12, h: 11 },
]

/** Panel layouts of the mockups in spec section 9 (screens 2 to 9), keyed by screen id. */
// prettier-ignore
export const SCREEN_PLANS: Partial<Record<string, PanelPlan[]>> = {
  DES: [
    { id: 'header', title: 'Security header', code: 'DES', api: ['GET /securities/{id}', 'GET /securities/{id}/quote'], x: 0, y: 0, w: 12, h: 3 },
    { id: 'chart', title: 'Price chart', code: 'GP', api: ['GET /securities/{id}/history', 'GET /indicators/{id}'], x: 0, y: 3, w: 8, h: 14 },
    { id: 'orderbook', title: 'Order book', code: 'DES', api: ['GET /securities/{id}/orderbook'], x: 8, y: 3, w: 4, h: 7 },
    { id: 'trades', title: 'Latest trades', code: 'DES', api: ['GET /securities/{id}/trades'], x: 8, y: 10, w: 4, h: 7 },
    { id: 'keydata', title: 'Key data', code: 'DES', api: ['GET /securities/{id}'], x: 0, y: 17, w: 4, h: 9 },
    { id: 'dividends', title: 'Dividends', code: 'DVD', api: ['GET /securities/{id}/dividends'], x: 4, y: 17, w: 4, h: 9 },
    { id: 'documents', title: 'Documents and news', code: 'DOC', api: ['GET /documents?securityId=', 'GET /news?securityId='], x: 8, y: 17, w: 4, h: 9 },
  ],
  EQS: [
    { id: 'criteria', title: 'Criteria', code: 'EQS', api: ['POST /analysis/screener', 'GET /analysis/screens'], x: 0, y: 0, w: 3, h: 26 },
    { id: 'results', title: 'Results', code: 'EQS', api: ['POST /analysis/screener'], x: 3, y: 0, w: 9, h: 8 },
    { id: 'comparison', title: 'Comparison', code: 'FA', api: ['GET /analysis/compare?ids=', 'GET /securities/{id}/ratios'], x: 3, y: 8, w: 4, h: 18 },
    { id: 'income', title: 'Income statement', code: 'FA', api: ['GET /securities/{id}/financials?statement=income'], x: 7, y: 8, w: 5, h: 10 },
    { id: 'balance', title: 'Balance sheet & cash flow', code: 'FA', api: ['GET /securities/{id}/financials?statement=balance|cashflow'], x: 7, y: 18, w: 5, h: 8 },
  ],
  YCRV: YIELD_CURVES,
  YAS: YIELD_CURVES,
  PORT: [
    { id: 'header', title: 'Portfolio', code: 'PORT', api: ['GET /portfolios', 'GET /portfolios/{id}'], x: 0, y: 0, w: 12, h: 3 },
    { id: 'positions', title: 'Valued positions', code: 'PORT', api: ['GET /portfolios/{id}/positions'], x: 0, y: 3, w: 7, h: 13 },
    { id: 'performance', title: 'Performance vs benchmark', code: 'PORT', api: ['GET /portfolios/{id}/performance'], x: 7, y: 3, w: 5, h: 13 },
    { id: 'allocation', title: 'Allocation', code: 'PORT', api: ['GET /portfolios/{id}/allocation?by='], x: 0, y: 16, w: 3, h: 10 },
    { id: 'risk', title: 'Risk metrics', code: 'PORT', api: ['GET /portfolios/{id}/risk'], x: 3, y: 16, w: 4, h: 10 },
    { id: 'income', title: 'Upcoming income', code: 'PORT', api: ['GET /portfolios/{id}/income', 'POST /portfolios/{id}/reports'], x: 7, y: 16, w: 5, h: 10 },
  ],
  PUB: [
    { id: 'filters', title: 'Filters', code: 'PUB', api: ['GET /library?subjectType=&country=&sector=&access=&rating=&sort='], x: 0, y: 0, w: 12, h: 3 },
    { id: 'list', title: 'Publications', code: 'PUB', api: ['GET /library'], x: 0, y: 3, w: 7, h: 23 },
    { id: 'preview', title: 'Preview', code: 'PUB', api: ['GET /library/{id}', 'POST /library/{id}/purchase', 'GET /payments/{id}'], x: 7, y: 3, w: 5, h: 14 },
    { id: 'analyst', title: 'Analyst', code: 'PUB', api: ['GET /analysts/{id}', 'POST /analysts/{id}/follow'], x: 7, y: 17, w: 5, h: 9 },
  ],
  PUBNEW: [
    { id: 'mine', title: 'My publications', code: 'PUB', api: ['GET /me/publications?status='], x: 0, y: 0, w: 3, h: 15 },
    { id: 'earnings', title: 'My earnings', code: 'PUB', api: ['GET /me/publications/stats', 'GET /me/payouts'], x: 0, y: 15, w: 3, h: 11 },
    { id: 'editor', title: 'Editor', code: 'PUB', api: ['POST /publications', 'PUT /publications/{id}', 'POST /publications/{id}/charts'], x: 3, y: 0, w: 6, h: 26 },
    { id: 'settings', title: 'Publication settings', code: 'PUB', api: ['PUT /publications/{id}/pricing', 'POST /publications/{id}/attachments', 'POST /publications/{id}/submit'], x: 9, y: 0, w: 3, h: 26 },
  ],
  N: fullScreen('News', 'N', ['GET /news?securityId=&country=&topic=', 'GET /news/{id}', 'GET /documents?q=']),
  CAL: fullScreen('Market calendar', 'CAL', ['GET /calendar?from=&to=&type=']),
  ALRT: fullScreen('Alerts', 'ALRT', ['GET /alerts', 'POST /alerts', 'GET /notifications']),
  CFG: fullScreen('Settings', 'CFG', ['GET /me', 'GET /organization', 'GET /subscription', 'GET /invoices']),
  DATA: fullScreen('Session coverage', 'DATA', ['GET /data/coverage?date=', 'GET /data/import-types/{type}/template']),
  IMP: [
    { id: 'coverage', title: 'Session coverage', code: 'DATA', api: ['GET /data/coverage', 'GET /data/import-types/{type}/template'], x: 0, y: 0, w: 3, h: 12 },
    { id: 'eodhd', title: 'EODHD connector', code: 'EODH', api: ['GET /data/providers/eodhd/status'], x: 0, y: 12, w: 3, h: 14 },
    { id: 'upload', title: 'Current upload', code: 'IMP', api: ['POST /data/imports', 'GET /data/imports/{id}/rows', 'POST /data/imports/{id}/publish'], x: 3, y: 0, w: 9, h: 15 },
    { id: 'history', title: 'Upload history', code: 'HIST', api: ['GET /data/imports', 'POST /data/imports/{id}/rollback'], x: 3, y: 15, w: 9, h: 11 },
  ],
  CORR: fullScreen('Data corrections', 'CORR', ['PUT /data/securities/{id}/prices/{date}']),
  NEWS: fullScreen('News and documents', 'NEWS', ['POST /data/news', 'POST /data/documents']),
  EODH: fullScreen('EODHD connector', 'EODH', ['GET /data/providers/eodhd/status']),
  HIST: fullScreen('Upload history', 'HIST', ['GET /data/imports?status=&type=&from=&to=', 'POST /data/imports/{id}/rollback']),
  USER: [
    { id: 'counters', title: 'Active accounts', code: 'USER', api: ['GET /admin/users'], x: 0, y: 0, w: 12, h: 3 },
    { id: 'accounts', title: 'Accounts', code: 'USER', api: ['GET /admin/users?type=&status=&q=', 'POST /admin/users'], x: 0, y: 3, w: 7, h: 13 },
    { id: 'details', title: 'Account details', code: 'USER', api: ['GET /admin/users/{id}', 'PUT /admin/users/{id}/type', 'POST /admin/users/{id}/suspend'], x: 7, y: 3, w: 5, h: 13 },
    { id: 'requests', title: 'Analyst status requests', code: 'ANLY', api: ['GET /admin/analyst-requests'], x: 0, y: 16, w: 5, h: 10 },
    { id: 'moderation', title: 'Moderation queue', code: 'MOD', api: ['GET /admin/publications?status=pending|reported'], x: 5, y: 16, w: 7, h: 10 },
  ],
  ANLY: fullScreen('Analyst status requests', 'ANLY', ['GET /admin/analyst-requests', 'POST /admin/analyst-requests/{id}/approve']),
  MOD: fullScreen('Moderation queue', 'MOD', ['GET /admin/publications?status=', 'POST /admin/publications/{id}/takedown']),
  PAY: fullScreen('Analyst payouts', 'PAY', ['GET /admin/payouts', 'POST /admin/payouts/{id}/mark-paid']),
  ADMCFG: fullScreen('Platform settings', 'CFG', ['GET /admin/settings', 'GET /admin/roles/{role}/permissions']),
  AUDT: fullScreen('Audit log', 'AUDT', ['GET /admin/audit-log?userId=&action=&from=&to=']),
}

export const DEFAULT_PLAN: PanelPlan[] = fullScreen('Screen', '', [])

export function planLayout(plans: readonly PanelPlan[]): WorkspaceItem[] {
  return plans.map(({ id, x, y, w, h }) => ({ i: id, x, y, w, h, minW: 2, minH: 2 }))
}

/** Computed once so each screen gets a stable default layout. */
export const PLAN_LAYOUTS: Partial<Record<string, WorkspaceItem[]>> = Object.fromEntries(
  Object.entries(SCREEN_PLANS).map(([screenId, plans]) => [screenId, planLayout(plans ?? [])]),
)
