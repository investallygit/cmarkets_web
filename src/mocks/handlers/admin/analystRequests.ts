import { http, HttpResponse } from 'msw'
import type { VerificationStatus } from '@/shared/api/contracts'
import { analystRequestDto, analystRequests, ensureAnalystProfile } from '../../admin'
import { anyAccount, editableAccount, recordAudit, saveAccounts } from '../../db'
import { isVerifiedType } from '../../fixtures/accounts'
import { api, latency, problem } from '../../lib/http'
import { createPdf } from '../../lib/pdf'
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
} from './common'

/** The status decided, with the account type it belongs to. */
const statusChange = (accountType: string, after: VerificationStatus) =>
  ({ field: 'verificationStatus', scope: accountType, before: 'pending', after }) as const

const STATUSES: readonly VerificationStatus[] = ['pending', 'approved', 'rejected']

/**
 * ANLY: the status of an Analyst, a Journalist or a CEO asked for at sign-up, its documents,
 * approval or rejection. The spec names these routes after the Analysts only.
 */
export const analystRequestHandlers = [
  http.get(api('/admin/analyst-requests'), async ({ request }) => {
    await latency()
    if (!allowed('moderation:manage')) return forbidden()
    const status = pick(STATUSES, new URL(request.url).searchParams.get('status')) ?? 'pending'
    return HttpResponse.json(analystRequests(status))
  }),

  // The documents sent at sign-up; the prototype keeps their names only, a page stands in.
  http.get(api('/admin/analyst-requests/:id/documents/:kind'), async ({ params }) => {
    await latency()
    if (!allowed('moderation:manage')) return forbidden()
    const account = anyAccount(String(params.id))
    const document = account?.documents.find((candidate) => candidate.kind === params.kind)
    if (!account || !document) return notFound('Document', params.kind)
    const type = TYPE_NAMES[account.accountType]
    const pdf = createPdf(document.fileName, [
      `Sent with the ${type} sign-up of ${account.displayName} (${account.email}),`,
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
    if (!account || !isVerifiedType(account.accountType)) return notFound('Request', params.id)
    if (account.verificationStatus !== 'pending') return problem(409, 'Already decided')
    account.verificationStatus = 'approved'
    account.verificationDecision = decision()
    saveAccounts()
    if (account.accountType === 'analyst') ensureAnalystProfile(account)
    recordAudit('status-approve', userTarget(account), {
      changes: [statusChange(account.accountType, 'approved')],
    })
    return HttpResponse.json(analystRequestDto(account))
  }),

  http.post(api('/admin/analyst-requests/:id/reject'), async ({ params, request }) => {
    await latency()
    if (!allowed('moderation:manage')) return forbidden()
    const account = editableAccount(String(params.id))
    if (!account || !isVerifiedType(account.accountType)) return notFound('Request', params.id)
    const reason = await readReason(request)
    if (typeof reason !== 'string') return invalid('Invalid rejection', reason)
    if (account.verificationStatus !== 'pending') return problem(409, 'Already decided')
    account.verificationStatus = 'rejected'
    account.verificationDecision = decision(reason)
    saveAccounts()
    recordAudit('status-reject', userTarget(account), {
      changes: [statusChange(account.accountType, 'rejected')],
      reason,
    })
    return HttpResponse.json(analystRequestDto(account))
  }),
]
