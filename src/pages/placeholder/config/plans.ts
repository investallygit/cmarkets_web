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

/** Panel layouts of the mockups in spec section 9 (screens 5 to 9), keyed by screen id. */
// prettier-ignore
export const SCREEN_PLANS: Partial<Record<string, PanelPlan[]>> = {
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
