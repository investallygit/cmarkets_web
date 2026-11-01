import { http, HttpResponse } from 'msw'
import type { AnalystStatus } from '@/shared/api/contracts'
import {
  analystRequestDto,
  analystRequests,
  directoryAccount,
  editableAccount,
  ensureAnalystProfile,
} from '../../admin'
import { recordAudit, saveAccounts } from '../../db'
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
  userTarget,
} from './common'

const ANALYST_STATUSES: readonly AnalystStatus[] = ['pending', 'approved', 'rejected']

/** ANLY: the Analyst status asked for at sign-up, its documents, approval or rejection. */
export const analystRequestHandlers = [
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
]
