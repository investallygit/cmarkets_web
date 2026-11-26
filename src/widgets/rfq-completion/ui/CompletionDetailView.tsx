import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CompletionRatio } from '@/entities/rfq'
import type {
  RfqCompletionCaseDto,
  RfqCompletionDetailDto,
  RfqCompletionRoleDto,
} from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Badge } from '@/shared/ui/Badge'

/**
 * The ratio's detail (screen 22, sixth version; ROADMAP decisions 51 to 54): both roles over the
 * window, their successes, failures and neutral cases by cause, the withdrawal rate; the failures
 * and neutral cases of the organisation's own members (and the Admin), each with its dispute and
 * `action` (Dispute, Neutralise).
 */
export function CompletionDetailView({
  detail,
  action,
}: {
  detail: RfqCompletionDetailDto
  action?: (failure: RfqCompletionCaseDto) => ReactNode
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const { withdrawals } = detail
  return (
    <div className="flex flex-col gap-3">
      <p className="font-sans text-data text-secondary">
        {t('rfqCompletion.detail.window', {
          who: detail.trader
            ? `${detail.trader.name} · ${detail.organization}`
            : detail.organization,
          count: detail.months,
        })}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <RoleBlock title={t('rfqCompletion.roles.requester')} role={detail.requester} />
        <RoleBlock title={t('rfqCompletion.roles.responder')} role={detail.responder} />
      </div>
      <p className="font-sans text-data">
        <span className="text-secondary">{t('rfqCompletion.detail.withdrawals')} </span>
        <span className="font-mono tabular-nums text-primary">
          {withdrawals.percent === null
            ? '–'
            : t('rfqCompletion.detail.withdrawalRate', {
                percent: withdrawals.percent,
                withdrawn: withdrawals.withdrawn,
                sent: withdrawals.sent,
              })}
        </span>
      </p>
      {detail.cases && (
        <section aria-labelledby="rfq-completion-cases" className="flex flex-col gap-1">
          <h3
            id="rfq-completion-cases"
            className="font-sans text-label font-semibold tracking-title text-accent-amber uppercase"
          >
            {t('rfqCompletion.detail.cases')}
          </h3>
          {detail.cases.length === 0 ? (
            <p className="font-sans text-data text-secondary">{t('rfqCompletion.detail.noCase')}</p>
          ) : (
            <ul className="flex flex-col">
              {detail.cases.map((failure) => (
                <li
                  key={failure.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b py-1.5 last:border-b-0"
                >
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-label text-secondary tabular-nums">
                        {format.date(failure.occurredAt)}
                      </span>
                      <Badge
                        tone={
                          failure.neutralized || failure.outcome === 'neutral' ? 'neutral' : 'down'
                        }
                      >
                        {failure.neutralized
                          ? t('rfqCompletion.outcomes.neutralized')
                          : t(`rfqCompletion.outcomes.${failure.outcome}`)}
                      </Badge>
                      {failure.dispute && (
                        <Badge tone={failure.dispute.status === 'open' ? 'warning' : 'neutral'}>
                          {t(`rfqCompletion.disputeStatus.${failure.dispute.status}`)}
                        </Badge>
                      )}
                    </span>
                    <span className="font-sans text-data text-primary">
                      {[
                        failure.agreementNumber ?? failure.requestNumber,
                        t(`rfqCompletion.roles.${failure.role}`),
                        failure.trader.name,
                        t(`rfqCompletion.causes.${failure.cause}`),
                      ].join(' · ')}
                    </span>
                    {(failure.neutralizationReason ?? failure.dispute?.answer) && (
                      <span className="font-sans text-label text-secondary">
                        {failure.neutralizationReason ?? failure.dispute?.answer}
                      </span>
                    )}
                  </span>
                  {action?.(failure)}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}

function RoleBlock({ title, role }: { title: string; role: RfqCompletionRoleDto }) {
  const { t } = useTranslation()
  return (
    <section className="flex flex-col gap-1 border p-2" aria-label={title}>
      <h3 className="flex items-baseline justify-between gap-2 font-sans text-data font-semibold text-primary">
        {title}
        <CompletionRatio completion={role.ratio} />
      </h3>
      <dl className="grid grid-cols-[1fr_auto] gap-x-3 font-sans text-data">
        <dt className="text-secondary">{t('rfqCompletion.detail.successes')}</dt>
        <dd className="text-right font-mono tabular-nums">{role.successes}</dd>
        <dt className="text-secondary">{t('rfqCompletion.detail.failures')}</dt>
        <dd className="text-right font-mono tabular-nums">{role.failures}</dd>
        <dt className="text-secondary">{t('rfqCompletion.detail.neutral')}</dt>
        <dd className="text-right font-mono tabular-nums">{role.neutral}</dd>
      </dl>
      {role.causes.length > 0 && (
        <ul className="flex flex-col font-sans text-label text-secondary">
          {role.causes.map((cause) => (
            <li key={`${cause.outcome}-${cause.cause}`} className="flex justify-between gap-2">
              <span>
                {t(`rfqCompletion.outcomes.${cause.outcome}`)} ·{' '}
                {t(`rfqCompletion.causes.${cause.cause}`)}
              </span>
              <span className="font-mono tabular-nums">{cause.cases}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
