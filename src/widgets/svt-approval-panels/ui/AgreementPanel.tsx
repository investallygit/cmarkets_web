import { clsx } from 'clsx'
import { AlertTriangle, Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  APPROVAL_TONES,
  formatCountdown,
  formatFace,
  formatQuote,
  limitLeft,
  quoteDecimals,
  timeLeft,
  useServerNow,
  useSvtApproval,
  useSvtApprovals,
} from '@/entities/rfq'
import { DecisionActions } from '@/features/decide-svt-approval'
import type {
  AgreementApprovalDto,
  ClientCheckDto,
  SvtApprovalDetailDto,
} from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { reasonText } from '../lib/reasonText'

/**
 * Screen 27's agreement detail, on the right (spec section 9; API /svt/approvals/{agreementId}):
 * its parties and SVTs, the security and its CRCT code, the face, price, amount and DvP date; the
 * checks on the bank's client ("before display, CMarket checks that the client's link is still
 * confirmed and computes the amount already used against the client's daily limit"); both
 * approvals; Approve and Reject. The first agreement to approve when none is picked.
 */
export function AgreementPanel({ agreementId }: { agreementId: string | null }) {
  const { t } = useTranslation()
  const pending = useSvtApprovals({ status: 'pending' })
  const id = agreementId ?? pending.data?.[0]?.agreementId ?? null
  const detail = useSvtApproval(id)

  return (
    <Panel
      title={
        detail.data
          ? `${t('panels.svtAgreement')} ${detail.data.agreement.number}`
          : t('panels.svtAgreement')
      }
      code="SVT"
    >
      {id === null ? (
        <p className="p-3 font-sans text-data text-secondary">{t('svt.detail.empty')}</p>
      ) : (
        <QueryView query={detail}>{(data) => <AgreementDetail detail={data} />}</QueryView>
      )}
    </Panel>
  )
}

function AgreementDetail({ detail }: { detail: SvtApprovalDetailDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const { agreement, mine, security } = detail
  const mySides = new Set(mine.clients.map((client) => client.side))
  const svtName = (name: string, mineToo: boolean) =>
    mineToo ? t('svt.detail.you', { name }) : name
  const rate = security.instrument === 'BTA' ? 'svt.detail.rate' : 'svt.detail.yield'

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-3">
      <p className="font-sans text-data text-secondary">
        {t('svt.detail.confirmed', { time: format.time(agreement.createdAt) })}
      </p>
      <Banner detail={detail} />
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-sans text-data">
        <Row label={t('svt.detail.request')}>
          {t('svt.detail.requestValue', {
            number: detail.requestNumber,
            rank: agreement.rank,
            count: detail.agreementCount,
          })}
        </Row>
        <Row label={t(mySides.has('buy') ? 'svt.detail.buyerClient' : 'svt.detail.buyer')}>
          {agreement.buyer.name} · {agreement.buyer.organization}
        </Row>
        <Row label={t('svt.detail.buyerSvt')}>
          {svtName(agreement.buyerSvt.name, mine.side !== 'seller')}
        </Row>
        <Row label={t(mySides.has('sell') ? 'svt.detail.sellerClient' : 'svt.detail.seller')}>
          {agreement.seller.name} · {agreement.seller.organization}
        </Row>
        <Row label={t('svt.detail.sellerSvt')}>
          {svtName(agreement.sellerSvt.name, mine.side !== 'buyer')}
        </Row>
        <Row label={t('svt.detail.security')}>
          <span className="text-accent-amber">{security.code}</span> · {security.isin ?? '—'}
        </Row>
        <Row label={t('svt.detail.facePrice')}>
          {format.number(agreement.faceAmount, 0)} · {formatQuote(agreement.price, format.locale)} ·{' '}
          {t(rate, { rate: format.number(agreement.ratePct, quoteDecimals(agreement.ratePct)) })}
        </Row>
        <Row label={t('svt.detail.settlementAmount')}>
          XAF {format.number(agreement.settlementAmount, 0)}
        </Row>
        <Row label={t('svt.detail.dvpDate')}>{format.isoDate(agreement.settlementDate)}</Row>
      </dl>

      {mine.clients.map((client) => (
        <Checks key={client.side} client={client} titled={mine.clients.length > 1} />
      ))}

      <section aria-labelledby="svt-approvals-title" className="flex flex-col gap-1">
        <h3 id="svt-approvals-title" className={HEADING}>
          {t('svt.detail.approvals')}
        </h3>
        <ul className="flex flex-col gap-1 font-sans text-data">
          {detail.approvals.map((approval) => (
            <ApprovalLine
              key={approval.svt.id}
              approval={approval}
              mine={
                approval.svt.id ===
                (mine.side === 'seller' ? agreement.sellerSvt.id : agreement.buyerSvt.id)
              }
              ended={agreement.status !== 'awaitingSvt'}
            />
          ))}
        </ul>
      </section>

      <DecisionActions detail={detail} />
      <p className="font-sans text-data text-secondary">{t('svt.detail.note')}</p>
    </div>
  )
}

const HEADING = 'font-sans text-label font-semibold tracking-title text-accent-amber uppercase'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-secondary">{label}</dt>
      <dd className="text-right text-primary">{children}</dd>
    </>
  )
}

/** "Awaiting your approval", or where the agreement stands. */
function Banner({ detail }: { detail: SvtApprovalDetailDto }) {
  const { t } = useTranslation()
  const { agreement, mine } = detail
  const key =
    agreement.status !== 'awaitingSvt'
      ? agreement.status
      : mine.status === 'approved'
        ? 'other'
        : mine.firstApprover
          ? 'second'
          : 'yours'
  const tone =
    agreement.status === 'concluded'
      ? 'up'
      : agreement.status === 'awaitingSvt'
        ? 'warning'
        : 'down'
  return (
    <p
      role="status"
      className={clsx(
        'border px-3 py-1 text-center font-sans text-label font-semibold tracking-title uppercase',
        tone === 'up' && 'border-up text-up',
        tone === 'warning' && 'border-warning text-warning',
        tone === 'down' && 'border-down text-down',
      )}
    >
      {t(`svt.detail.banner.${key}`)}
    </p>
  )
}

/** The checks on one client of the bank: its link, its daily limit and what it used, its day's trades. */
function Checks({ client, titled }: { client: ClientCheckDto; titled: boolean }) {
  const { t } = useTranslation()
  const format = useFormat()
  const face = (amount: number) => formatFace(amount, format.locale)
  const left = limitLeft(client)
  const id = `svt-checks-${client.side}`
  return (
    <section aria-labelledby={id} className="flex flex-col gap-1">
      <h3 id={id} className={HEADING}>
        {titled
          ? t('svt.detail.checksOf', {
              name: client.client.name,
              side: t(`rfqTrading.side.${client.side}`),
            })
          : t('svt.detail.checks')}
      </h3>
      <ul className="flex flex-col gap-1 font-sans text-data">
        <CheckLine ok={client.linkConfirmed} label={t('svt.detail.linkConfirmed')}>
          {client.linkConfirmed && client.linkedSince
            ? t('svt.detail.linkSince', { date: format.date(client.linkedSince) })
            : t('svt.detail.noLink')}
        </CheckLine>
        <CheckLine ok={!client.overLimit} label={t('svt.detail.dailyLimit')}>
          {client.dailyLimit === null || left === null
            ? t('svt.detail.noLimit', { used: face(client.usedToday) })
            : client.overLimit
              ? t('svt.detail.overLimit', {
                  limit: face(client.dailyLimit),
                  used: face(client.usedToday),
                  over: face(-left),
                })
              : t('svt.detail.limitValue', {
                  limit: face(client.dailyLimit),
                  used: face(client.usedToday),
                  left: face(left),
                })}
        </CheckLine>
        <CheckLine ok label={t('svt.detail.todaysTrades')}>
          {t('svt.detail.tradesValue', {
            count: client.tradesToday,
            amount: face(client.usedToday),
          })}
        </CheckLine>
      </ul>
    </section>
  )
}

function CheckLine({ ok, label, children }: { ok: boolean; label: string; children: ReactNode }) {
  const Icon = ok ? Check : AlertTriangle
  return (
    <li className="flex items-baseline gap-2">
      <Icon
        aria-hidden
        size={14}
        className={clsx('shrink-0 self-center', ok ? 'text-up' : 'text-down')}
      />
      <span className={ok ? 'text-primary' : 'text-down'}>{label}</span>
      <span className="ml-auto text-right font-mono text-secondary">{children}</span>
    </li>
  )
}

/** "Bank D (buyer's SVT) · Approved 10:47 · A. Okala", "Bank E (seller's SVT, you) · Pending · 52:10 left". */
function ApprovalLine({
  approval,
  mine,
  ended,
}: {
  approval: AgreementApprovalDto
  mine: boolean
  ended: boolean
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const now = useServerNow(approval.status === 'pending' && !ended)
  const side = t(`svt.side.${approval.side}`)
  const name = t(mine ? 'svt.detail.approvalOfMine' : 'svt.detail.approvalOf', {
    svt: approval.svt.name,
    side,
  })
  const decision = approval.decision
  const status = (() => {
    if (approval.status === 'pending')
      return ended
        ? t('svt.approvalStatus.none')
        : approval.firstApprover && approval.firstApprovedAt
          ? t('svt.detail.firstApproval', {
              time: format.time(approval.firstApprovedAt),
              name: approval.firstApprover,
            })
          : t('svt.detail.pendingLeft', { left: formatCountdown(timeLeft(approval.deadline, now)) })
    if (approval.status === 'expired' || !decision?.decidedAt)
      return t('svt.detail.expiredAt', {
        time: format.time(decision?.decidedAt ?? approval.deadline),
      })
    const by = decision.decidedBy ?? ''
    const text = t('svt.detail.decidedBy', {
      status: t(`svt.approvalStatus.${approval.status}`),
      time: format.time(decision.decidedAt),
      name: by,
    })
    return decision.reason ? `${text} · ${reasonText(t, decision)}` : text
  })()
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-3">
      <span className="text-primary">{name}</span>
      <span
        className={clsx(
          'font-mono',
          APPROVAL_TONES[approval.status] === 'up' && 'text-up',
          APPROVAL_TONES[approval.status] === 'down' && 'text-down',
          APPROVAL_TONES[approval.status] === 'warning' && !ended && 'text-warning',
          (APPROVAL_TONES[approval.status] === 'neutral' ||
            (approval.status === 'pending' && ended)) &&
            'text-secondary',
        )}
      >
        {status}
      </span>
    </li>
  )
}
