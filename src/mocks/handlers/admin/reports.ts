import { http, HttpResponse } from 'msw'
import type { ReportedItemType } from '@/shared/api/contracts'
import { currentAccount, recordAudit } from '../../db'
import { api, latency, noContent, problem } from '../../lib/http'
import {
  adminConversationDto,
  dismissReports,
  reportedConversation,
  reportedItems,
} from '../../reports'
import { allowed, forbidden, notFound, pick } from './common'

const TYPES: readonly ReportedItemType[] = ['profile', 'conversation']

/**
 * MOD: the profiles and the conversations reported (spec sections 10 and 15). The Admin reads a
 * conversation once reported only, and each reading is written to the audit log; dismissing the
 * reports is the prototype's endpoint, a suspension of the account closes them too.
 */
export const reportHandlers = [
  http.get(api('/admin/reports'), async ({ request }) => {
    await latency()
    if (!allowed('moderation:manage')) return forbidden()
    const type = pick(TYPES, new URL(request.url).searchParams.get('type')) ?? null
    return HttpResponse.json(reportedItems(type))
  }),

  http.post(api('/admin/reports/:type/:id/dismiss'), async ({ params }) => {
    await latency()
    if (!allowed('moderation:manage')) return forbidden()
    const type = pick(TYPES, params.type)
    if (!type) return notFound('Report type', params.type)
    const item = reportedItems(type).find((candidate) => candidate.id === params.id)
    if (!item) return problem(409, 'Nothing to dismiss', 'No open report is about it.')
    dismissReports(type, item.id, currentAccount().displayName)
    recordAudit(
      'report-dismiss',
      { type, id: item.id, label: item.title },
      {
        changes: [{ field: 'reports', scope: null, before: item.reports.length, after: 0 }],
      },
    )
    return noContent()
  }),

  http.get(api('/admin/conversations/:id'), async ({ params }) => {
    await latency()
    if (!allowed('moderation:manage')) return forbidden()
    const conversation = reportedConversation(String(params.id))
    // Only a reported conversation: the others are none of the Admin's business.
    if (!conversation) return notFound('Reported conversation', params.id)
    const admin = currentAccount()
    const dto = adminConversationDto(conversation, admin.id)
    recordAudit('conversation-read', { type: 'conversation', id: dto.id, label: dto.title })
    return HttpResponse.json(dto)
  }),
]
