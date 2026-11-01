import { http, HttpResponse } from 'msw'
import type { PayoutStatus } from '@/shared/api/contracts'
import { toMarketDay } from '@/shared/lib/format'
import { adminPayouts, payoutStore } from '../../admin'
import { currentAccount, recordAudit } from '../../db'
import { api, latency, problem } from '../../lib/http'
import { allowed, forbidden, notFound, pick } from './common'

const PAYOUT_STATUSES: readonly PayoutStatus[] = ['accruing', 'due', 'paid']

/** PAY: what each analyst is owed by month, marked paid once settled. */
export const payoutHandlers = [
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
]
