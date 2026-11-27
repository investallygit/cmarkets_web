import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { INFLATION_CEILING, periodLabel, useBeacSummary } from '@/entities/beac'
import { useFormat } from '@/shared/i18n'

/**
 * BEAC's indicators (screen 34, sixth version): the policy rate (TIAO), the marginal lending and
 * deposit facilities, the reserve requirements on sight and term deposits, the CEMAC's inflation
 * (amber above its 3% ceiling) and the next meeting of the Monetary Policy Committee. API
 * /beac/summary.
 */
export function BeacIndicators() {
  const { t } = useTranslation()
  const format = useFormat()
  const summary = useBeacSummary().data
  const none = t('beac.indicators.none')
  const rate = (value: number | undefined) =>
    value === undefined ? none : format.percent(value, 2, false)
  const rates = summary?.rates ?? undefined
  const reserves = summary?.reserves
  const inflation = summary?.inflation

  return (
    <section
      aria-label={t('beac.indicators.label')}
      className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-6"
    >
      <Tile title={t('beac.indicators.policy')}>
        <span className="text-accent-amber">{rate(rates?.policy)}</span>
      </Tile>
      <Tile title={t('beac.indicators.lending')}>{rate(rates?.marginalLending)}</Tile>
      <Tile title={t('beac.indicators.deposit')}>{rate(rates?.deposit)}</Tile>
      <Tile
        title={t('beac.indicators.reserves')}
        hint={
          reserves
            ? t('beac.indicators.reservesHint', {
                sight: format.percent(reserves.sight, 2, false),
                term: format.percent(reserves.term, 2, false),
              })
            : undefined
        }
      >
        {reserves
          ? t('beac.indicators.reservesValue', {
              sight: format.percent(reserves.sight, 2, false),
              term: format.percent(reserves.term, 2, false),
            })
          : none}
      </Tile>
      <Tile
        title={t('beac.indicators.inflation')}
        hint={
          inflation
            ? t('beac.indicators.inflationHint', {
                period: periodLabel(inflation.period, inflation.yearly),
              })
            : undefined
        }
      >
        {inflation ? (
          <span className={inflation.value > INFLATION_CEILING ? 'text-warning' : 'text-up'}>
            {format.percent(inflation.value, 1, false)}
          </span>
        ) : (
          none
        )}
      </Tile>
      <Tile title={t('beac.indicators.next')}>
        <span className="text-info">
          {summary?.nextMeeting ? format.isoDate(summary.nextMeeting) : none}
        </span>
      </Tile>
    </section>
  )
}

function Tile({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="min-w-0 border bg-panel px-3 py-2" title={hint}>
      <p className="truncate font-mono text-title font-semibold tracking-title text-secondary uppercase">
        {title}
      </p>
      <p className="font-mono text-figure break-words text-primary tabular-nums">{children}</p>
      {hint && <span className="sr-only">{hint}</span>}
    </div>
  )
}
