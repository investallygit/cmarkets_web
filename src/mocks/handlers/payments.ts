import { http, HttpResponse } from 'msw'
import { currentAccount } from '../db'
import { api, latency, problem } from '../lib/http'
import { paymentOf } from '../payments'

/** GET /payments/{id}: research bought in the library, or a plan chosen in CFG. */
export const paymentHandlers = [
  http.get(api('/payments/:id'), async ({ params }) => {
    await latency()
    const payment = paymentOf(String(params.id), currentAccount().id)
    if (!payment) return problem(404, 'Payment not found', `No payment ${String(params.id)}.`)
    return HttpResponse.json(payment)
  }),
]
