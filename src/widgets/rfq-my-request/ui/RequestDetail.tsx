import { useQueryClient } from '@tanstack/react-query'
import { clsx } from 'clsx'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  formatCountdown,
  formatFace,
  formatQuote,
  isRequestOpen,
  REQUEST_TONES,
  requestStatusAt,
  rfqKeys,
  useDescribeCriteria,
  useRfqPricing,
  useServerNow,
} from '@/entities/rfq'
import { CancelRfqButton, ConfirmSelectionButton } from '@/features/confirm-rfq'
import type { RfqRequestDto } from '@/shared/api/contracts'
import { useFormat, useLocale } from '@/shared/i18n'
import { Badge } from '@/shared/ui/Badge'
import { AgreementsTable } from './AgreementsTable'
import { AnswersTable } from './AnswersTable'

/**
 * One request as its organisation reads it: what it asks, its countdown (the answers until its
 * end, then the 10 minutes of its confirmation), the CMarket curve's reference and the latest
 * auction, the ranked answers and the selection; the requester's two buttons; its agreements. By
 * criteria (sixth version): its criteria and eligible count in place of the security and the
 * reference, the answers' securities and yields, the selection's average yield and maturity.
 */
export function RequestDetail({ request }: { request: RfqRequestDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const locale = useLocale()
  const queryClient = useQueryClient()
  const describe = useDescribeCriteria()
  const criteria = request.mode === 'criteria' ? request.criteria : null
  // The clock ticks while the request is open as written, until it reads as expired.
  const now = useServerNow(request.status === 'published' || request.status === 'answersReceived')
  const open = isRequestOpen(request, now)
  const status = requestStatusAt(request, now)
  const takingAnswers = open && now < Date.parse(request.closesAt)
  const pricing = useRfqPricing(
    open && request.security
      ? { securityId: request.security.id, settlementDate: request.settlementDate }
      : null,
  )
  const auction = pricing.data?.auction
  const responses = request.responses ?? []
  const allocation = request.allocation
  const rateLabel = request.security?.instrument === 'BTA' ? 'rate' : 'yield'

  // An answer that runs out of validity drops out of the selection: read again then.
  const nextExpiry = Math.min(
    ...responses
      .filter((response) => response.status === 'sent' || response.status === 'improved')
      .map((response) => Date.parse(response.validUntil))
      .filter((at) => at > now),
  )
  useEffect(() => {
    if (!open || !Number.isFinite(nextExpiry)) return
    const timer = window.setTimeout(
      () => void queryClient.invalidateQueries({ queryKey: rfqKeys.request(request.id) }),
      Math.max(0, nextExpiry - Date.now()) + 500,
    )
    return () => window.clearTimeout(timer)
  }, [open, nextExpiry, queryClient, request.id])

  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="font-mono text-data font-semibold text-primary">
            {criteria
              ? t('rfqCriteria.myRequest.summary', {
                  side: t(`rfqTrading.sideUpper.${request.side}`),
                  face: format.number(request.faceAmount, 0),
                  criteria: describe(criteria).long,
                })
              : t('rfqTrading.myRequest.summary', {
                  side: t(`rfqTrading.sideUpper.${request.side}`),
                  face: format.number(request.faceAmount, 0),
                  security: request.security?.code ?? '',
                  date: format.isoDate(request.settlementDate),
                })}
          </p>
          <p className="font-sans text-label text-secondary">
            {[
              t('rfqTrading.myRequest.answers', { count: responses.length }),
              criteria && t('rfqCriteria.eligible', { count: criteria.eligible }),
              criteria && t('rfqCriteria.myRequest.rankedByYield'),
              request.reference &&
                t('rfqTrading.myRequest.model', {
                  price: formatQuote(request.reference.price, locale),
                  rate: format.number(request.reference.ratePct, 2),
                }),
              auction &&
                t('rfqTrading.myRequest.auction', {
                  date: format.dayMonth(auction.date),
                  rate: format.number(auction.averageRatePct, 2),
                }),
              request.requester &&
                !request.mine &&
                t('rfqTrading.myRequest.by', { name: request.requester.name }),
              // The requester's filter on the responders (sixth version, ROADMAP decision 53).
              request.minResponderCompletion !== null &&
                t('rfqCompletion.myRequest.minimum', { percent: request.minResponderCompletion }),
              request.excludeNewcomers && t('rfqCompletion.myRequest.noNewcomers'),
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        {open ? (
          <div
            className={clsx(
              'flex shrink-0 flex-col items-end border px-3 py-1',
              takingAnswers ? 'border-accent-amber/60' : 'border-warning/60',
            )}
            role="timer"
            aria-label={
              takingAnswers
                ? t('rfqTrading.myRequest.timeLeft')
                : t('rfqTrading.myRequest.confirmBy')
            }
          >
            <span className="font-sans text-label text-secondary">
              {takingAnswers
                ? t('rfqTrading.myRequest.timeLeft')
                : t('rfqTrading.myRequest.confirmBy')}
            </span>
            <span className="font-mono text-title font-semibold text-accent-amber tabular-nums">
              {formatCountdown(
                Date.parse(takingAnswers ? request.closesAt : request.expiresAt) - now,
              )}
            </span>
          </div>
        ) : (
          <Badge tone={REQUEST_TONES[status]}>
            {request.closedAt
              ? t('rfqTrading.myRequest.closed', {
                  status: t(`rfqTrading.requestStatus.${status}`),
                  time: format.time(request.closedAt),
                })
              : t(`rfqTrading.requestStatus.${status}`)}
          </Badge>
        )}
      </div>

      <AnswersTable request={request} rateLabel={rateLabel} byCriteria={criteria !== null} />

      {allocation && (
        <p className="border border-info/40 bg-selected px-2 py-1 font-mono text-data text-info">
          {allocation.total > 0 && criteria
            ? t('rfqCriteria.myRequest.selection', {
                total: formatFace(allocation.total, locale),
                face: formatFace(request.faceAmount, locale),
                agreements: t('rfqTrading.myRequest.agreementsCount', {
                  count: allocation.agreements,
                }),
                securities: t('rfqCriteria.myRequest.securities', { count: allocation.securities }),
                yield: format.number(allocation.averageRatePct ?? 0, 2),
                maturity: format.number(allocation.averageMaturityYears ?? 0, 1),
              })
            : allocation.total > 0
              ? t('rfqTrading.myRequest.selection', {
                  total: formatFace(allocation.total, locale),
                  face: formatFace(request.faceAmount, locale),
                  agreements: t('rfqTrading.myRequest.agreementsCount', {
                    count: allocation.agreements,
                  }),
                  price: formatQuote(allocation.averagePrice ?? 0, locale),
                  rate: format.number(allocation.averageRatePct ?? 0, 2),
                })
              : t('rfqTrading.myRequest.noSelection')}
        </p>
      )}

      {request.mine && open && (
        <div className="flex flex-wrap items-center gap-2">
          <ConfirmSelectionButton request={request} />
          <CancelRfqButton request={request} />
        </div>
      )}
      {open && (
        <p className="font-sans text-label text-secondary">
          {criteria ? t('rfqCriteria.myRequest.note') : t('rfqTrading.myRequest.note')}{' '}
          {t('rfqCompletion.myRequest.note')}
        </p>
      )}

      {request.agreements.length > 0 && <AgreementsTable request={request} />}
    </div>
  )
}
