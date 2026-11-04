import { http, HttpResponse } from 'msw'
import {
  ACCOUNT_LIST_STATUSES,
  ACCOUNT_TYPES,
  ADMIN_USER_SORTS,
  type AccountTypeChangeDto,
  type AdminUserCreateDto,
} from '@/shared/api/contracts'
import { toCsv } from '@/shared/lib/csv'
import { isPhoneNumber } from '@/shared/lib/phone'
import {
  accountCounts,
  adminUserDetails,
  adminUserDto,
  allOrganizations,
  directory,
  directoryAccount,
  editableAccount,
  ensureAnalystProfile,
  isEmployee,
  listStatus,
  matchesSearch,
  organizationName,
  sortUsers,
} from '../../admin'
import { accountStore, currentAccount, recordAudit, revokeSessions, saveAccounts } from '../../db'
import {
  DEMO_PASSWORD_HASH,
  DEMO_SALT,
  isVerifiedType,
  type StoredAccount,
} from '../../fixtures/accounts'
import { isEmail } from '../../lib/auth'
import { api, latency, paginate, problem } from '../../lib/http'
import { newId } from '../../lib/ids'
import {
  allowed,
  decision,
  forbidden,
  invalid,
  notFound,
  pick,
  readReason,
  TYPE_NAMES,
  userTarget,
  type Errors,
} from './common'

const BYTE_ORDER_MARK = String.fromCharCode(0xfeff)

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

/**
 * USER (screen 9): the accounts of every type, their counters and export, and what the Admin
 * changes of them: creation, type, suspension, reactivation, two-factor reset.
 */
export const userHandlers = [
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
        user.verificationStatus === 'pending' && user.status === 'active' ? 'review' : user.status,
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
    const verified = isVerifiedType(accountType)
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
      // Created by an Admin: the status needs no other approval.
      verificationStatus: verified ? 'approved' : null,
      status: 'active',
      createdAt: new Date().toISOString(),
      documents: [],
      failedLogins: 0,
      lockedUntil: null,
      lastLoginAt: null,
      verificationDecision: verified ? decision() : null,
      suspension: null,
    }
    accountStore.write([...accountStore.read(), account])
    if (accountType === 'analyst') ensureAnalystProfile(account)
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
    if (isVerifiedType(accountType)) {
      // Changed by an Admin: the status of the new type comes approved.
      account.verificationStatus = 'approved'
      account.verificationDecision = decision()
      if (accountType === 'analyst') ensureAnalystProfile(account)
    } else {
      account.verificationStatus = null
      account.verificationDecision = null
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
]
