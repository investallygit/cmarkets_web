import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { useMarketSummary } from '@/entities/market'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

/** Screen 1, Session summary: advancers, decliners, unchanged, value traded, breadth bar. */
export function SessionSummaryPanel() {
  const { t } = useTranslation()
  const format = useFormat()
  const summary = useMarketSummary()

  return (
    <Panel title={t('panels.sessionSummary')} code="MKT">
      <QueryView query={summary}>
        {({ advancers, decliners, unchanged, valueTraded, currency }) => {
          const total = advancers + decliners + unchanged || 1
          return (
            <div className="flex h-full flex-col justify-center gap-3 px-3 py-2">
              <dl className="grid grid-cols-[1fr_1fr_1fr_1.6fr] gap-2">
                <Stat
                  label={t('market.summary.advancers')}
                  value={String(advancers)}
                  className="text-up"
                />
                <Stat
                  label={t('market.summary.decliners')}
                  value={String(decliners)}
                  className="text-down"
                />
                <Stat label={t('market.summary.unchanged')} value={String(unchanged)} />
                <Stat
                  label={t('market.summary.valueTraded')}
                  value={`${format.compact(valueTraded)} ${currency}`}
                />
              </dl>
              {/* Breadth bar: advancers in green, decliners in red, unchanged left grey. */}
              <div className="flex h-2 w-full bg-panel-header" aria-hidden>
                <span className="bg-up" style={{ width: `${(advancers / total) * 100}%` }} />
                <span className="bg-down" style={{ width: `${(decliners / total) * 100}%` }} />
              </div>
            </div>
          )
        }}
      </QueryView>
    </Panel>
  )
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="min-w-0">
      <dt className="truncate font-sans text-label text-secondary">{label}</dt>
      <dd className={clsx('truncate font-mono text-figure font-semibold', className)}>{value}</dd>
    </div>
  )
}
