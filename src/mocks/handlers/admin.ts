import { http, HttpResponse } from 'msw'
import {
  ACCOUNT_LIST_STATUSES,
  ACCOUNT_TYPES,
  ADMIN_USER_SORTS,
  AUDIT_ACTIONS,
  PERMISSIONS,
  type AccountType,
  type AccountTypeChangeDto,
  type AdminReasonDto,
  type AdminUserCreateDto,
  type AnalystStatus,
  type AuditChangeDto,
  type AuditEntryDto,
  type Paged,
  type PayoutStatus,
  type Permission,
  type PlatformSettingsDto,
  type PlatformSettingsUpdateDto,
  type QuotaDto,
  type RolePermissionsDto,
} from '@/shared/api/contracts'
import { toCsv } from '@/shared/lib/csv'
import { toMarketDay } from '@/shared/lib/format'
import { isPhoneNumber } from '@/shared/lib/phone'
import {
  accountCounts,
  adminPayouts,
  adminUserDetails,
  adminUserDto,
  allOrganizations,
  analystRequestDto,
  analystRequests,
  directory,
  directoryAccount,
  editableAccount,
  ensureAnalystProfile,
  isEmployee,
  listStatus,
  matchesSearch,
  moderationQueue,
  moderationView,
  organizationName,
  payoutStore,
  sortUsers,
} from '../admin'
import {
  accountStore,
  auditStore,
  contentReportStore,
  currentAccount,
  currentUser,
  publicationStore,
  recordAudit,
  revokeSessions,
  roleStore,
  saveAccounts,
  settingsStore,
} from '../db'
import { DEMO_PASSWORD_HASH, DEMO_SALT, type StoredAccount } from '../fixtures/accounts'
import { importStore } from '../imports'
import { isEmail } from '../lib/auth'
import { api, latency, noContent, paginate, problem } from '../lib/http'
import { newId } from '../lib/ids'
import { createPdf } from '../lib/pdf'
import { latestVersion } from '../lib/research'
import { isIsoDate } from '../lib/validation'
import { publish } from '../publications'

type Errors = Record<string, string[]>

const allowed = (permission: Permission) => currentUser().permissions.includes(permission)
const forbidden = () => problem(403, 'Forbidden', 'The administration is for the Admin.')
const invalid = (title: string, errors: Errors) => problem(400, title, undefined, errors)
const notFound = (what: string, id: unknown) =>
  problem(404, `${what} not found`, `No ${what.toLowerCase()} ${String(id)}.`)
const pick = <T extends string>(values: readonly T[], value: unknown): T | undefined =>
  values.find((candidate) => candidate === value)

const BYTE_ORDER_MARK = String.fromCharCode(0xfeff)
const MIN_REASON = 5
const MAX_REASON = 500
const ANALYST_STATUSES: readonly AnalystStatus[] = ['pending', 'approved', 'rejected']
const PAYOUT_STATUSES: readonly PayoutStatus[] = ['accruing', 'due', 'paid']
const TYPE_NAMES: Record<AccountType, string> = {
  student: 'Student',
  analyst: 'Analyst',
  manager: 'Portfolio manager',
  trader: 'Trader',
  dataAdmin: 'Data admin',
  admin: 'Admin',
}

/** A reason the log keeps: suspension, reactivation, rejection, takedown. */
async function readReason(request: Request): Promise<string | Errors> {
  const body = (await request.json()) as Partial<AdminReasonDto>
  const reason = String(body.reason ?? '').trim()
  return reason.length < MIN_REASON || reason.length > MAX_REASON
    ? { reason: [`Say why, in ${MIN_REASON} to ${MAX_REASON} characters: the log keeps it.`] }
    : reason
}

const userTarget = (account: StoredAccount) =>
  ({ type: 'user', id: account.id, label: account.displayName }) as const

function decision(reason: string | null = null) {
  return { at: new Date().toISOString(), by: currentAccount().displayName, reason }
}

/** The accounts of the list and of its export: type, status and search, sorted. */
function filteredUsers(query: URLSearchParams) {
  const type = pick(ACCOUNT_TYPES, query.get('type'))
  const status = pick(ACCOUNT_LIST_STATUSES, query.get('status'))
  const q = query.get('q') ?? ''
  const sortParam = query.get('sort') ?? '-lastLoginAt'
  const sort = pick(ADMIN_USER_SORTS, sortParam.replace(/^-/, '')) ?? 'lastLoginAt'
  const users = directory()
    .filter(
      (account) =>
        (!type || account.accountType === type) && (!status || listStatus(account) === status),
    )
    .map(adminUserDto)
    .filter((user) => matchesSearch(user, q))
  return sortUsers(users, sort, sortParam.startsWith('-'))
}

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

/** The Douala day of a log entry, for the date filters. */
const dayOf = (entry: AuditEntryDto) => toMarketDay(entry.at)

/**
 * Screen 9 and the Admin's screens (USER, ANLY, MOD, PAY, ADMCFG, AUDT): accounts, Analyst
 * status requests, moderation, settings and permissions, payouts and the audit log (spec
 * sections 10 and 12). Every change is written to the audit log.
 */
export const adminHandlers = [
  http.get(api('/admin/users'), async ({ request }) => {
    await latency()
    if (!allowed('users:manage')) return forbidden()
    const query = new URL(request.url).searchParams
    return HttpResponse.json(paginate(filteredUsers(query), query))
  }),

  // Prototype: the counters of screen 9 have no endpoint in the spec.
  http.get(api('/admin/users/counts'), async () => {
    await latency()
    if (!allowed('users:manage')) return forbidden()
    return HttpResponse.json(accountCounts())
  }),

  // Prototype: every account of the filters, not only the page shown.
  http.get(api('/admin/users/export'), async ({ request }) => {
    await latency()
    if (!allowed('users:manage')) return forbidden()
    const users = filteredUsers(new URL(request.url).searchParams)
    const rows = [
      ['Name', 'E-mail', 'Type', 'Organisation', 'Status', 'Joined', 'Last login'],
      ...users.map((user) => [
        user.displayName,
        user.email,
        TYPE_NAMES[user.accountType],
        user.organization?.name ?? '',
        user.analystStatus === 'pending' && user.status === 'active' ? 'review' : user.status,
        user.createdAt.slice(0, 10),
        user.lastLoginAt ?? '',
      ]),
    ]
    return new HttpResponse(`${BYTE_ORDER_MARK}${toCsv(rows)}\r\n`, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="cmarket-accounts.csv"',
      },
    })
  }),

  // Prototype: the organisations an account can be put in.
  http.get(api('/admin/organizations'), async () => {
    await latency()
    if (!allowed('users:manage')) return forbidden()
    return HttpResponse.json(allOrganizations())
  }),

  http.get(api('/admin/users/:id'), async ({ params }) => {
    await latency()
    if (!allowed('users:manage')) return forbidden()
    const account = directoryAccount(String(params.id))
    return account ? HttpResponse.json(adminUserDetails(account)) : notFound('Account', params.id)
  }),

  http.post(api('/admin/users'), async ({ request }) => {
    await latency()
    if (!allowed('users:manage')) return forbidden()
    const body = (await request.json()) as Partial<AdminUserCreateDto>
    const displayName = String(body.displayName ?? '').trim()
    const email = String(body.email ?? '')
      .trim()
      .toLowerCase()
    const accountType = pick(ACCOUNT_TYPES, body.accountType)
    const phone = String(body.phone ?? '').trim() || null
    const errors: Errors = {}
    if (displayName.length < 2 || displayName.length > 80) {
      errors.displayName = ['2 to 80 characters.']
    }
    if (!isEmail(email)) errors.email = ['An e-mail address.']
    else if (directory().some((account) => account.email.toLowerCase() === email)) {
      errors.email = ['An account uses this address already.']
    }
    if (!accountType) errors.accountType = ['Choose a type.']
    if (phone && !isPhoneNumber(phone)) errors.phone = ['A number with its country code.']
    const employee = accountType === 'dataAdmin' || accountType === 'admin'
    // Employees belong to CMarket (spec section 12).
    const organizationId = employee ? 'org-cmarket' : (body.organizationId ?? null)
    if (organizationId && !organizationName(organizationId)) {
      errors.organizationId = ['Unknown organisation.']
    }
    if (Object.keys(errors).length > 0 || !accountType) {
      return invalid('Invalid account', errors)
    }
    const analyst = accountType === 'analyst'
    const account: StoredAccount = {
      id: newId('user'),
      email,
      // The prototype gives the demo password; the real one sends an invitation to choose one.
      salt: DEMO_SALT,
      passwordHash: DEMO_PASSWORD_HASH,
      displayName,
      accountType,
      organizationId,
      organizationRole: organizationId ? 'member' : null,
      language: body.language === 'fr' ? 'fr' : 'en',
      timeZone: 'Africa/Douala',
      phone,
      twoFactorChannel: 'email',
      // Created by an Admin: the Analyst status needs no other approval.
      analystStatus: analyst ? 'approved' : null,
      status: 'active',
      createdAt: new Date().toISOString(),
      documents: [],
      failedLogins: 0,
      lockedUntil: null,
      lastLoginAt: null,
      analystDecision: analyst ? decision() : null,
      suspension: null,
    }
    accountStore.write([...accountStore.read(), account])
    if (analyst) ensureAnalystProfile(account)
    recordAudit('user-create', userTarget(account), {
      changes: [
        { field: 'accountType', scope: null, before: null, after: accountType },
        ...(organizationId
          ? [
              {
                field: 'organization',
                scope: null,
                before: null,
                after: organizationName(organizationId),
              } as const,
            ]
          : []),
      ],
    })
    return HttpResponse.json(adminUserDetails(account), { status: 201 })
  }),

  http.put(api('/admin/users/:id/type'), async ({ params, request }) => {
    await latency()
    if (!allowed('users:manage')) return forbidden()
    const account = editableAccount(String(params.id))
    if (!account) return notFound('Account', params.id)
    const body = (await request.json()) as Partial<AccountTypeChangeDto>
    const accountType = pick(ACCOUNT_TYPES, body.accountType)
    if (!accountType) return invalid('Invalid type', { accountType: ['Choose a type.'] })
    if (account.id === currentAccount().id) {
      return problem(409, 'Own account', 'Another Admin changes your type.')
    }
    if (isEmployee(account) !== isEmployee({ accountType })) {
      return problem(
        422,
        'Client or employee',
        'A client stays a client and an employee an employee: create a new account instead.',
      )
    }
    const before = account.accountType
    if (before === accountType) return HttpResponse.json(adminUserDetails(account))
    account.accountType = accountType
    if (accountType === 'analyst') {
      account.analystStatus = 'approved'
      account.analystDecision = decision()
      ensureAnalystProfile(account)
    } else {
      account.analystStatus = null
    }
    saveAccounts()
    recordAudit('user-type', userTarget(account), {
      changes: [{ field: 'accountType', scope: null, before, after: accountType }],
    })
    return HttpResponse.json(adminUserDetails(account))
  }),

  http.post(api('/admin/users/:id/suspend'), async ({ params, request }) => {
    await latency()
    if (!allowed('users:manage')) return forbidden()
    const account = editableAccount(String(params.id))
    if (!account) return notFound('Account', params.id)
    const reason = await readReason(request)
    if (typeof reason !== 'string') return invalid('Invalid suspension', reason)
    if (account.id === currentAccount().id) {
      return problem(409, 'Own account', 'You cannot suspend your own account.')
    }
    if (account.status === 'suspended') return problem(409, 'Already suspended')
    account.status = 'suspended'
    account.suspension = decision(reason)
    saveAccounts()
    // Logged out at once, everywhere.
    revokeSessions(account.id, { keepCurrent: false })
    recordAudit('user-suspend', userTarget(account), {
      changes: [{ field: 'status', scope: null, before: 'active', after: 'suspended' }],
      reason,
    })
    return HttpResponse.json(adminUserDetails(account))
  }),

  http.post(api('/admin/users/:id/reactivate'), async ({ params, request }) => {
    await latency()
    if (!allowed('users:manage')) return forbidden()
    const account = editableAccount(String(params.id))
    if (!account) return notFound('Account', params.id)
    const reason = await readReason(request)
    if (typeof reason !== 'string') return invalid('Invalid reactivation', reason)
    if (account.status !== 'suspended') return problem(409, 'Not suspended')
    account.status = 'active'
    account.suspension = null
    saveAccounts()
    recordAudit('user-reactivate', userTarget(account), {
      changes: [{ field: 'status', scope: null, before: 'suspended', after: 'active' }],
      reason,
    })
    return HttpResponse.json(adminUserDetails(account))
  }),

  // Codes go back to the e-mail address and every session ends: the user logs in again.
  http.post(api('/admin/users/:id/reset-mfa'), async ({ params }) => {
    await latency()
    if (!allowed('users:manage')) return forbidden()
    const account = editableAccount(String(params.id))
    if (!account) return notFound('Account', params.id)
    const before = account.twoFactorChannel
    account.twoFactorChannel = 'email'
    saveAccounts()
    revokeSessions(account.id, { keepCurrent: account.id === currentAccount().id })
    recordAudit('user-reset-mfa', userTarget(account), {
      changes: [{ field: 'twoFactorChannel', scope: null, before, after: 'email' }],
    })
    return HttpResponse.json(adminUserDetails(account))
  }),

  http.get(api('/admin/analyst-requests'), async ({ request }) => {
    await latency()
    if (!allowed('moderation:manage')) return forbidden()
    const status =
      pick(ANALYST_STATUSES, new URL(request.url).searchParams.get('status')) ?? 'pending'
    return HttpResponse.json(analystRequests(status))
  }),

  // The documents sent at sign-up; the prototype keeps their names only, a page stands in.
  http.get(api('/admin/analyst-requests/:id/documents/:kind'), async ({ params }) => {
    await latency()
    if (!allowed('moderation:manage')) return forbidden()
    const account = directoryAccount(String(params.id))
    const document = account?.documents.find((candidate) => candidate.kind === params.kind)
    if (!account || !document) return notFound('Document', params.kind)
    const pdf = createPdf(document.fileName, [
      `Sent with the Analyst sign-up of ${account.displayName} (${account.email}),`,
      `on ${account.createdAt.slice(0, 10)}, ${Math.round(document.size / 1024)} KB.`,
      '',
      'The prototype keeps the name of the files sent at sign-up, not the files:',
      'this page stands in for the document the user sent.',
    ])
    return new HttpResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${document.fileName}"`,
      },
    })
  }),

  http.post(api('/admin/analyst-requests/:id/approve'), async ({ params }) => {
    await latency()
    if (!allowed('moderation:manage')) return forbidden()
    const account = editableAccount(String(params.id))
    if (!account || account.accountType !== 'analyst') return notFound('Request', params.id)
    if (account.analystStatus !== 'pending') return problem(409, 'Already decided')
    account.analystStatus = 'approved'
    account.analystDecision = decision()
    saveAccounts()
    ensureAnalystProfile(account)
    recordAudit('analyst-approve', userTarget(account), {
      changes: [{ field: 'analystStatus', scope: null, before: 'pending', after: 'approved' }],
    })
    return HttpResponse.json(analystRequestDto(account))
  }),

  http.post(api('/admin/analyst-requests/:id/reject'), async ({ params, request }) => {
    await latency()
    if (!allowed('moderation:manage')) return forbidden()
    const account = editableAccount(String(params.id))
    if (!account || account.accountType !== 'analyst') return notFound('Request', params.id)
    const reason = await readReason(request)
    if (typeof reason !== 'string') return invalid('Invalid rejection', reason)
    if (account.analystStatus !== 'pending') return problem(409, 'Already decided')
    account.analystStatus = 'rejected'
    account.analystDecision = decision(reason)
    saveAccounts()
    recordAudit('analyst-reject', userTarget(account), {
      changes: [{ field: 'analystStatus', scope: null, before: 'pending', after: 'rejected' }],
      reason,
    })
    return HttpResponse.json(analystRequestDto(account))
  }),

  http.get(api('/admin/publications'), async ({ request }) => {
    await latency()
    if (!allowed('moderation:manage')) return forbidden()
    const status = new URL(request.url).searchParams.get('status')
    const kind = status === 'pending' ? 'pending' : status === 'reported' ? 'reported' : null
    return HttpResponse.json(
      moderationQueue().filter((item) => kind === null || item.kind === kind),
    )
  }),

  // Prototype: the moderator reads the publication, or the draft submitted, as readers will.
  http.get(api('/admin/publications/:id'), async ({ params }) => {
    await latency()
    if (!allowed('moderation:manage')) return forbidden()
    const publication = publicationStore.read().find((candidate) => candidate.id === params.id)
    const view = publication && moderationView(publication)
    return view ? HttpResponse.json(view) : notFound('Publication', params.id)
  }),

  // A publication waiting goes live; a reported one stays, its reports closed.
  http.post(api('/admin/publications/:id/approve'), async ({ params }) => {
    await latency()
    if (!allowed('moderation:manage')) return forbidden()
    const publications = publicationStore.read()
    const publication = publications.find((candidate) => candidate.id === params.id)
    if (!publication) return notFound('Publication', params.id)
    const target = {
      type: 'publication',
      id: publication.id,
      label: latestVersion(publication)?.content.title ?? publication.draft.title,
    } as const
    if (publication.status === 'pending') {
      publish(publication)
      publication.savedAt = new Date().toISOString()
      publicationStore.write(publications)
      recordAudit('publication-approve', target, {
        changes: [
          { field: 'publicationStatus', scope: null, before: 'pending', after: 'published' },
        ],
      })
      return noContent()
    }
    const reports = contentReportStore.read()
    const open = reports.filter(
      (report) => report.publicationId === publication.id && report.status === 'open',
    )
    if (open.length === 0) return problem(409, 'Nothing to moderate')
    const closed = decision()
    open.forEach((report) =>
      Object.assign(report, {
        status: 'closed',
        closedAt: closed.at,
        closedBy: closed.by,
        outcome: 'kept',
      }),
    )
    contentReportStore.write(reports)
    recordAudit('publication-keep', target)
    return noContent()
  }),

  http.post(api('/admin/publications/:id/takedown'), async ({ params, request }) => {
    await latency()
    if (!allowed('moderation:manage')) return forbidden()
    const publications = publicationStore.read()
    const publication = publications.find((candidate) => candidate.id === params.id)
    if (!publication) return notFound('Publication', params.id)
    const reason = await readReason(request)
    if (typeof reason !== 'string') return invalid('Invalid takedown', reason)
    if (publication.status !== 'published' && publication.status !== 'pending') {
      return problem(409, 'Not online', 'Only a publication online or waiting is taken down.')
    }
    const before = publication.status
    // Buyers keep the version they bought (spec section 13).
    publication.status = 'archived'
    publication.archiveReason = reason
    publication.savedAt = new Date().toISOString()
    publicationStore.write(publications)
    const reports = contentReportStore.read()
    const closed = decision()
    reports
      .filter((report) => report.publicationId === publication.id && report.status === 'open')
      .forEach((report) =>
        Object.assign(report, {
          status: 'closed',
          closedAt: closed.at,
          closedBy: closed.by,
          outcome: 'takenDown',
        }),
      )
    contentReportStore.write(reports)
    recordAudit(
      'publication-takedown',
      {
        type: 'publication',
        id: publication.id,
        label: latestVersion(publication)?.content.title ?? publication.draft.title,
      },
      {
        changes: [{ field: 'publicationStatus', scope: null, before, after: 'archived' }],
        reason,
      },
    )
    return noContent()
  }),

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

  http.get(api('/admin/payouts'), async ({ request }) => {
    await latency()
    if (!allowed('payouts:manage')) return forbidden()
    const query = new URL(request.url).searchParams
    const month = query.get('month')
    const status = pick(PAYOUT_STATUSES, query.get('status'))
    const analystId = query.get('analystId')
    return HttpResponse.json(
      adminPayouts().filter(
        (payout) =>
          (!month || payout.month === month) &&
          (!status || payout.status === status) &&
          (!analystId || payout.analyst.id === analystId),
      ),
    )
  }),

  http.post(api('/admin/payouts/:id/mark-paid'), async ({ params }) => {
    await latency()
    if (!allowed('payouts:manage')) return forbidden()
    const payout = adminPayouts().find((candidate) => candidate.id === params.id)
    if (!payout) return notFound('Payout', params.id)
    if (payout.status !== 'due') {
      return problem(409, 'Not due', 'Only a closed month not paid yet is marked paid.')
    }
    const paidAt = toMarketDay(Date.now())
    const paidBy = currentAccount().displayName
    payoutStore.write([
      ...payoutStore.read(),
      { id: payout.id, analystId: payout.analyst.id, month: payout.month, paidAt, paidBy },
    ])
    recordAudit(
      'payout-paid',
      { type: 'payout', id: payout.id, label: `${payout.analyst.displayName}, ${payout.month}` },
      { changes: [{ field: 'payout', scope: null, before: 'due', after: 'paid' }] },
    )
    return HttpResponse.json({ ...payout, status: 'paid', paidAt, paidBy })
  }),

  http.get(api('/admin/audit-log'), async ({ request }) => {
    await latency()
    if (!allowed('audit:read')) return forbidden()
    // The seeded uploads write their entries when the uploads are first read.
    importStore.read()
    const query = new URL(request.url).searchParams
    const userId = query.get('userId')
    const actions = (query.get('action') ?? '')
      .split(',')
      .flatMap((action) => pick(AUDIT_ACTIONS, action) ?? [])
    const from = query.get('from')
    const to = query.get('to')
    if ((from && !isIsoDate(from)) || (to && !isIsoDate(to))) {
      return invalid('Invalid period', { from: ['Dates as YYYY-MM-DD.'] })
    }
    const entries = auditStore
      .read()
      .filter(
        (entry) =>
          (!userId ||
            entry.actor.id === userId ||
            (entry.target.type === 'user' && entry.target.id === userId)) &&
          (actions.length === 0 || actions.includes(entry.action)) &&
          (!from || dayOf(entry) >= from) &&
          (!to || dayOf(entry) <= to),
      )
      .sort((a, b) => b.at.localeCompare(a.at))
    return HttpResponse.json<Paged<AuditEntryDto>>(paginate(entries, query))
  }),
]
