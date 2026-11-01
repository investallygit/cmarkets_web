import { http, HttpResponse } from 'msw'
import {
  ACCOUNT_TYPES,
  PERMISSIONS,
  type AccountType,
  type AuditChangeDto,
  type PlatformSettingsDto,
  type PlatformSettingsUpdateDto,
  type QuotaDto,
  type RolePermissionsDto,
} from '@/shared/api/contracts'
import { currentAccount, recordAudit, roleStore, settingsStore } from '../../db'
import { api, latency, problem } from '../../lib/http'
import { allowed, forbidden, invalid, notFound, pick, TYPE_NAMES, type Errors } from './common'

function readQuota(value: unknown): number | null | undefined {
  if (value === null) return null
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 10_000
    ? value
    : undefined
}

function readSettings(
  body: Partial<PlatformSettingsUpdateDto>,
): { settings: PlatformSettingsUpdateDto } | { errors: Errors } {
  const errors: Errors = {}
  const quotas = {} as Record<AccountType, QuotaDto>
  for (const type of ACCOUNT_TYPES) {
    const portfolios = readQuota(body.quotas?.[type]?.portfolios)
    const alerts = readQuota(body.quotas?.[type]?.alerts)
    if (portfolios === undefined || alerts === undefined) {
      errors[`quotas.${type}`] = ['A whole number from 0 to 10,000, or unlimited.']
    }
    quotas[type] = { portfolios: portfolios ?? null, alerts: alerts ?? null }
  }
  const { minPrice, maxPrice, commissionPct, riskFreeRatePct } = body
  if (typeof minPrice !== 'number' || !Number.isInteger(minPrice) || minPrice < 0) {
    errors.minPrice = ['A whole number of XAF, zero or more.']
  }
  if (typeof maxPrice !== 'number' || !Number.isInteger(maxPrice) || maxPrice <= (minPrice ?? 0)) {
    errors.maxPrice = ['Above the minimum price.']
  }
  if (typeof commissionPct !== 'number' || commissionPct < 0 || commissionPct > 50) {
    errors.commissionPct = ['From 0 to 50%.']
  }
  const moderation = pick(['before', 'after'] as const, body.moderation)
  if (!moderation) errors.moderation = ['Before or after publication.']
  if (typeof riskFreeRatePct !== 'number' || riskFreeRatePct < 0 || riskFreeRatePct > 30) {
    errors.riskFreeRatePct = ['From 0 to 30%.']
  }
  if (Object.keys(errors).length > 0 || !moderation) return { errors }
  return {
    settings: {
      quotas,
      minPrice: minPrice as number,
      maxPrice: maxPrice as number,
      commissionPct: commissionPct as number,
      moderation,
      riskFreeRatePct: riskFreeRatePct as number,
    },
  }
}

/** Each value the Admin changed, for the log. */
function settingsChanges(
  before: PlatformSettingsDto,
  after: PlatformSettingsUpdateDto,
): AuditChangeDto[] {
  const changes: AuditChangeDto[] = []
  for (const type of ACCOUNT_TYPES) {
    for (const field of ['portfolios', 'alerts'] as const) {
      if (before.quotas[type][field] !== after.quotas[type][field]) {
        changes.push({
          field,
          scope: type,
          before: before.quotas[type][field],
          after: after.quotas[type][field],
        })
      }
    }
  }
  for (const field of [
    'minPrice',
    'maxPrice',
    'commissionPct',
    'moderation',
    'riskFreeRatePct',
  ] as const) {
    if (before[field] !== after[field]) {
      changes.push({ field, scope: null, before: before[field], after: after[field] })
    }
  }
  return changes
}

/**
 * ADMCFG: quotas, research pricing and moderation, the risk-free rate, and the permissions of
 * each account type.
 */
export const settingsHandlers = [
  http.get(api('/admin/settings'), async () => {
    await latency()
    if (!allowed('settings:manage')) return forbidden()
    return HttpResponse.json(settingsStore.read())
  }),

  http.put(api('/admin/settings'), async ({ request }) => {
    await latency()
    if (!allowed('settings:manage')) return forbidden()
    const read = readSettings((await request.json()) as Partial<PlatformSettingsUpdateDto>)
    if ('errors' in read) return invalid('Invalid settings', read.errors)
    const before = settingsStore.read()
    const changes = settingsChanges(before, read.settings)
    if (changes.length === 0) return HttpResponse.json(before)
    const saved: PlatformSettingsDto = {
      ...read.settings,
      updatedAt: new Date().toISOString(),
      updatedBy: currentAccount().displayName,
    }
    settingsStore.write(saved)
    recordAudit(
      'settings-update',
      { type: 'settings', id: 'platform', label: 'Platform settings' },
      { changes },
    )
    return HttpResponse.json(saved)
  }),

  http.get(api('/admin/roles/:role/permissions'), async ({ params }) => {
    await latency()
    if (!allowed('settings:manage')) return forbidden()
    const role = pick(ACCOUNT_TYPES, params.role)
    if (!role) return notFound('Role', params.role)
    return HttpResponse.json<RolePermissionsDto>({
      role,
      permissions: [...(roleStore.read().find((entry) => entry.role === role)?.permissions ?? [])],
    })
  }),

  http.put(api('/admin/roles/:role/permissions'), async ({ params, request }) => {
    await latency()
    if (!allowed('settings:manage')) return forbidden()
    const role = pick(ACCOUNT_TYPES, params.role)
    if (!role) return notFound('Role', params.role)
    const body = (await request.json()) as Partial<RolePermissionsDto>
    const asked = Array.isArray(body.permissions) ? body.permissions : []
    if (asked.some((permission) => !pick(PERMISSIONS, permission))) {
      return invalid('Invalid permissions', { permissions: ['Unknown permission.'] })
    }
    if (role === 'admin' && !asked.includes('settings:manage')) {
      return problem(
        422,
        'The Admin keeps the settings',
        'Without settings:manage, nobody could give a permission back.',
      )
    }
    const permissions = PERMISSIONS.filter((permission) => asked.includes(permission))
    const roles = roleStore.read()
    const entry = roles.find((candidate) => candidate.role === role)
    const before = new Set(entry?.permissions ?? [])
    const changes: AuditChangeDto[] = PERMISSIONS.filter(
      (permission) => before.has(permission) !== permissions.includes(permission),
    ).map((permission) => ({
      field: 'permission',
      scope: permission,
      before: before.has(permission),
      after: !before.has(permission),
    }))
    if (changes.length > 0) {
      roleStore.write(
        roles.map((candidate) => (candidate.role === role ? { role, permissions } : candidate)),
      )
      recordAudit(
        'permissions-update',
        { type: 'role', id: role, label: TYPE_NAMES[role] },
        {
          changes,
        },
      )
    }
    return HttpResponse.json<RolePermissionsDto>({ role, permissions })
  }),
]
