import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FX_PERIODS, useFxHistory, type FxPeriod } from '@/entities/rate'
import type { FxYearDto, HistoryPointDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { AreaChart } from '@/shared/ui/charts/AreaChart'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import { QueryView } from '@/shared/ui/QueryView'
import { PanelEmpty, PanelLoading } from '@/shared/ui/StatusViews'
import { crossDecimals } from '../lib/fxDecimals'

const PERIOD_OPTIONS = FX_PERIODS.map((period) => ({ value: period, label: period }))
const NO_POINTS: readonly HistoryPointDto[] = []
const MISSING = '—'

/**
 * Screen 26, the chart (spec section 9): the selected currency against the XAF, from 1 month to
 * MAX (the year by default, as the mockup), in the amber of the mockup; below it the last rate,
 * the 1-year high and low and the 1-year volatility, whatever the period shown. API
 * /fx/{ccy}/history.
 */
export function FxChartPanel({
  currency,
  pending = false,
}: {
  /** The currency drawn; none while the table loads (pending) or once it is empty. */
  currency: string | undefined
  pending?: boolean
}) {
  const { t } = useTranslation()
  const [period, setPeriod] = useState<FxPeriod>('1Y')
  const history = useFxHistory(currency, period)
  const points = useMemo<readonly HistoryPointDto[]>(
    () =>
      history.data?.points.map((point) => ({ time: point.date, value: point.value })) ?? NO_POINTS,
    [history.data],
  )

  return (
    <Panel
      title={currency ? t('fx.pair', { currency }) : t('panels.fxChart')}
      code="FX"
      options={<PanelTabs value={period} options={PERIOD_OPTIONS} onChange={setPeriod} />}
    >
      {currency === undefined ? (
        pending ? (
          <PanelLoading />
        ) : (
          <PanelEmpty message={t('fx.noRates')} />
        )
      ) : (
        <QueryView
          query={history}
          isEmpty={(data) => data.points.length === 0}
          emptyMessage={t('fx.noRates')}
        >
          {(data) => (
            <div className="flex h-full flex-col">
              <div className="min-h-40 flex-1">
                <AreaChart
                  points={points}
                  label={t('fx.chartLabel', { currency, period: t(`fx.periods.${period}`) })}
                  intraday={false}
                  decimals={2}
                  color="--accent-amber"
                />
              </div>
              <YearFigures year={data.year} />
              <p className="shrink-0 px-3 pb-2 font-sans text-label text-secondary">
                {t('fx.chartHint')}
              </p>
            </div>
          )}
        </QueryView>
      )}
    </Panel>
  )
}

/** The mockup's line under the chart: last, 1-year high and low, 1-year volatility. */
function YearFigures({ year }: { year: FxYearDto | null }) {
  const { t } = useTranslation()
  const format = useFormat()
  const value = (figure: number | undefined) =>
    figure === undefined ? MISSING : format.number(figure, crossDecimals(figure))
  const figures = [
    { label: t('fx.last'), value: value(year?.last) },
    { label: t('fx.high'), value: value(year?.high) },
    { label: t('fx.low'), value: value(year?.low) },
    {
      label: t('fx.volatility'),
      value: year?.volatility == null ? MISSING : format.percent(year.volatility, 1, false),
    },
  ]
  return (
    <dl className="grid shrink-0 grid-cols-2 gap-x-4 gap-y-2 border-t px-3 py-2 sm:grid-cols-4">
      {figures.map((figure) => (
        <div key={figure.label} className="flex flex-col gap-0.5">
          <dt className="font-sans text-label text-secondary">{figure.label}</dt>
          <dd className="font-mono text-data font-semibold text-primary tabular-nums">
            {figure.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
