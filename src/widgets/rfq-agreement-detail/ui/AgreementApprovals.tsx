import clsx from 'clsx'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { APPROVAL_TONES } from '@/entities/rfq'
import type { AgreementApprovalDto, RfqAgreementDetailsDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { SECTION, SECTION_HEADING } from './detailStyles'

/**
 * Each SVT's approval (spec, screen 23: "Awaiting SVT (with the state of each approval)"), as
 * screen 27 writes it: "Bank D (buyer's SVT) · Approved 29/10 10:47 · A. Okala"; a rejection with
 * its reason, which goes to both traders.
 */
export function AgreementApprovals({ details }: { details: RfqAgreementDetailsDto }) {
  const { t } = useTranslation()
  const id = useId()
  if (details.approvals.length === 0) return null
  // An approval left pending once the other SVT ended the agreement has no decision to take.
  const ended = details.agreement.status !== 'awaitingSvt'
  return (
    <section aria-labelledby={id} className={SECTION}>
      <h3 id={id} className={SECTION_HEADING}>
        {t('rfqAgreements.detail.approvals')}
      </h3>
      <ul className="flex flex-col gap-1">
        {details.approvals.map((approval) => (
          <ApprovalLine key={approval.svt.id} approval={approval} ended={ended} />
        ))}
      </ul>
    </section>
  )
}

function ApprovalLine({ approval, ended }: { approval: AgreementApprovalDto; ended: boolean }) {
  const { t } = useTranslation()
  const format = useFormat()
  const when = (at: string) => `${format.dayMonth(at)} ${format.time(at)}`
  const decision = approval.decision
  const status = (() => {
    if (approval.status === 'pending') {
      if (ended) return t('rfqAgreements.detail.approvalNone')
      return approval.firstApprover && approval.firstApprovedAt
        ? t('rfqAgreements.detail.approvalFirst', {
            date: when(approval.firstApprovedAt),
            name: approval.firstApprover,
          })
        : t('rfqAgreements.detail.approvalPending', { date: when(approval.deadline) })
    }
    if (approval.status === 'expired' || !decision?.decidedAt)
      return t('rfqAgreements.detail.approvalExpired', {
        date: when(decision?.decidedAt ?? approval.deadline),
      })
    const text = t('rfqAgreements.detail.approvalDecided', {
      status: t(`svt.approvalStatus.${approval.status}`),
      date: when(decision.decidedAt),
      name: decision.decidedBy ?? '',
    })
    if (!decision.reason) return text
    const reason =
      decision.reason === 'other'
        ? (decision.comment ?? t('svt.reasons.other'))
        : t(`svt.reasons.${decision.reason}`)
    return `${text} · ${reason}`
  })()
  const tone = APPROVAL_TONES[approval.status]
  const quiet = tone === 'neutral' || (approval.status === 'pending' && ended)
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-3">
      <span className="text-primary">
        {t('rfqAgreements.detail.approvalOf', {
          svt: approval.svt.name,
          side: t(`svt.side.${approval.side}`),
        })}
      </span>
      <span
        className={clsx(
          'font-mono text-data',
          quiet && 'text-secondary',
          !quiet && tone === 'up' && 'text-up',
          !quiet && tone === 'down' && 'text-down',
          !quiet && tone === 'warning' && 'text-warning',
        )}
      >
        {status}
      </span>
    </li>
  )
}
