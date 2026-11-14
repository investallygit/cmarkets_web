import { useTranslation } from 'react-i18next'
import type { OptIndicatorsDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'

/**
 * Screen 29's indicators (spec section 14.6): expected return, volatility, Sharpe ratio, 1-day 95%
 * VaR, the bonds' duration and their average yield.
 */
export function IndicatorTiles({ indicators }: { indicators: OptIndicatorsDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const pct = (value: number) => format.percent(value, 2, false)
  const tiles: { key: string; label: string; value: string; tone?: string; hint?: string }[] = [
    {
      key: 'return',
      label: t('opt.indicators.expectedReturn'),
      value: pct(indicators.expectedReturnPct),
      tone: 'text-up',
    },
    {
      key: 'volatility',
      label: t('opt.indicators.volatility'),
      value: pct(indicators.volatilityPct),
    },
    {
      key: 'sharpe',
      label: t('opt.indicators.sharpe'),
      value: indicators.sharpe === null ? '—' : format.number(indicators.sharpe, 2),
    },
    {
      key: 'var',
      label: t('opt.indicators.var'),
      value: pct(indicators.var95Pct),
      tone: 'text-accent-amber',
      hint: t('opt.indicators.varAmount', { amount: format.number(indicators.var95Amount, 0) }),
    },
    {
      key: 'duration',
      label: t('opt.indicators.duration'),
      value: indicators.durationYears === null ? '—' : format.number(indicators.durationYears, 2),
    },
    {
      key: 'yield',
      label: t('opt.indicators.bondYield'),
      value: indicators.bondYieldPct === null ? '—' : pct(indicators.bondYieldPct),
    },
  ]
  return (
    <dl
      aria-label={t('opt.indicators.label')}
      className="grid grid-cols-2 gap-1 sm:grid-cols-3 xl:grid-cols-6"
    >
      {tiles.map((tile) => (
        <div key={tile.key} className="border bg-panel px-3 py-2" title={tile.hint}>
          <dt className="font-sans text-label tracking-wide text-secondary uppercase">
            {tile.label}
          </dt>
          <dd
            className={`font-mono text-xl font-semibold tabular-nums ${tile.tone ?? 'text-primary'}`}
          >
            {tile.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
