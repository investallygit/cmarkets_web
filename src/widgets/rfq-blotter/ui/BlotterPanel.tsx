import { useTranslation } from 'react-i18next'
import { formatFace, shortNumber, useRfqBlotter } from '@/entities/rfq'
import type { RfqBlotterEventDto, RfqBlotterEventKind } from '@/shared/api/contracts'
import type { RfqScope } from '@/shared/api/endpoints'
import { useFormat, useLocale } from '@/shared/i18n'
import { Badge, type BadgeTone } from '@/shared/ui/Badge'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { DownloadDataLink } from '@/features/download-data'

/** The mockup's colours: "AWAITING SVT" yellow, "SELECTED" and "CONCLUDED" green, "NOT SELECTED" grey. */
const TONES: Readonly<Record<RfqBlotterEventKind, BadgeTone>> = {
  requestConfirmed: 'warning',
  requestPartiallyFilled: 'warning',
  requestCancelled: 'neutral',
  requestExpired: 'neutral',
  answerSelected: 'up',
  answerPartiallySelected: 'up',
  answerNotSelected: 'neutral',
  agreementConcluded: 'up',
  agreementRejected: 'down',
  agreementExpired: 'neutral',
  agreementCancelled: 'neutral',
}

/**
 * Screen 22's "Today's blotter" (spec section 9; API /rfq/blotter): the day's requests published,
 * answers sent and selected, agreements made; then the latest events, newest first. The trader's
 * own, or its organisation's for its CEO.
 */
export function BlotterPanel({ scope }: { scope: RfqScope }) {
  const { t } = useTranslation()
  const blotter = useRfqBlotter(scope)
  const counts = [
    ['requestsPublished', 'rfqTrading.blotter.requestsPublished'],
    ['answersSent', 'rfqTrading.blotter.answersSent'],
    ['answersSelected', 'rfqTrading.blotter.answersSelected'],
    ['agreements', 'rfqTrading.blotter.agreements'],
  ] as const

  return (
    <Panel
      title={t('panels.rfqBlotter')}
      code="RFQ BLT"
      options={<DownloadDataLink dataset="rfq" what={t('panels.rfqBlotter')} />}
    >
      <QueryView query={blotter}>
        {(data) => (
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-2">
            <dl className="flex flex-col">
              {counts.map(([key, label]) => (
                <div
                  key={key}
                  className="flex items-baseline justify-between gap-2 py-0.5 font-sans text-data"
                >
                  <dt className="text-secondary">{t(label)}</dt>
                  <dd className="font-mono font-semibold text-primary tabular-nums">{data[key]}</dd>
                </div>
              ))}
            </dl>
            <section aria-labelledby={`rfq-blotter-${scope}`} className="flex flex-col gap-1">
              <h3
                id={`rfq-blotter-${scope}`}
                className="font-sans text-label font-semibold tracking-title text-accent-amber uppercase"
              >
                {t('rfqTrading.blotter.events')}
              </h3>
              {data.events.length === 0 ? (
                <p className="font-sans text-data text-secondary">
                  {t('rfqTrading.blotter.empty')}
                </p>
              ) : (
                <ul className="flex flex-col">
                  {data.events.map((entry) => (
                    <BlotterEvent
                      key={`${entry.kind}-${entry.requestId}-${entry.agreementNumber ?? ''}-${entry.at}`}
                      entry={entry}
                    />
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </QueryView>
    </Panel>
  )
}

function BlotterEvent({ entry }: { entry: RfqBlotterEventDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const locale = useLocale()
  return (
    <li className="flex flex-col gap-0.5 border-b py-1.5 last:border-b-0">
      <span className="flex items-center gap-2">
        <span className="font-mono text-label text-secondary tabular-nums">
          {format.time(entry.at)}
        </span>
        <Badge tone={TONES[entry.kind]}>{t(`rfqTrading.blotter.kinds.${entry.kind}`)}</Badge>
      </span>
      <span className="font-sans text-data text-primary">
        {t(`rfqTrading.blotter.text.${entry.kind}`, {
          number: shortNumber(entry.requestNumber),
          agreement: entry.agreementNumber ? shortNumber(entry.agreementNumber) : '',
          count: entry.agreements ?? 0,
          amount: entry.amount === null ? '' : formatFace(entry.amount, locale),
          of: entry.of === null ? '' : formatFace(entry.of, locale),
        })}
      </span>
    </li>
  )
}
