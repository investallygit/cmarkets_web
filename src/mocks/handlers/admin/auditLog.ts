import { http, HttpResponse } from 'msw'
import { AUDIT_ACTIONS, type AuditEntryDto, type Paged } from '@/shared/api/contracts'
import { toMarketDay } from '@/shared/lib/format'
import { auditStore } from '../../db'
import { importStore } from '../../imports'
import { api, latency, paginate } from '../../lib/http'
import { isIsoDate } from '../../lib/validation'
import { allowed, forbidden, invalid, pick } from './common'

/** The Douala day of a log entry, for the date filters. */
const dayOf = (entry: AuditEntryDto) => toMarketDay(entry.at)

/** AUDT: every action of a Data admin or an Admin, by user, action and period. */
export const auditLogHandlers = [
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
