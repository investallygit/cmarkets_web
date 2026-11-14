import { clsx } from 'clsx'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  COMMODITY_INTERVALS,
  COMMODITY_PERIODS,
  commodityDecimals,
  periodStart,
  useCommodity,
  useCommodityHistory,
  useCommodityNames,
  type CommodityPeriod,
} from '@/entities/commodity'
import type { CommodityFrequency } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { useMarketDay } from '@/shared/lib/useMarketDay'
import { TwoAxisChart, type TwoAxisLine, type TwoAxisPoint } from '@/shared/ui/charts/TwoAxisChart'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs, PanelToggle } from '@/shared/ui/PanelTabs'
import { PanelEmpty, PanelError, PanelLoading } from '@/shared/ui/StatusViews'

/**
 * Screen 21, the history (spec section 9): the value in amber over its filled area and its
 * 50-value moving average in blue, by day, week or month (an interval the series does not offer
 * greyed out), over 1 year to MAX (5 years by default, as the mockup), the date and the value
 * under the cursor; no volume nor candles, the source publishing one value a period. API
 * /commodities/{code}/history.
 */
export function CommodityHistoryPanel({ code }: { code: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const names = useCommodityNames()
  const profile = useCommodity(code).data
  const [chosen, setChosen] = useState<CommodityFrequency | null>(null)
  const [period, setPeriod] = useState<CommodityPeriod>('5Y')
  const [average, setAverage] = useState(true)
  const today = useMarketDay()
  const interval = chosen ?? profile?.frequency ?? 'daily'
  // The period's values only: Brent's whole daily history is ten thousand of them.
  const history = useCommodityHistory(
    code,
    interval,
    periodStart(period, today),
    profile !== undefined,
  )
  const unit = profile?.unit ?? 'USD/bbl'
  const shown = useMemo(() => history.data?.points ?? [], [history.data])
  const chartPoints = useMemo(
    (): TwoAxisPoint[] =>
      shown.map((point) => ({
        time: point.date,
        primary: point.value,
        secondary: average ? point.average : null,
        faint: false,
        volume: null,
      })),
    [shown, average],
  )
  const lines = useMemo((): { primary: TwoAxisLine; secondary: TwoAxisLine } => {
    const value = (figure: number) => format.number(figure, commodityDecimals(figure, unit))
    return {
      primary: {
        label: profile ? `${names.name(profile, true)} (${names.unit(unit)})` : code,
        format: value,
        color: '--accent-amber',
        axis: 'right',
        fill: true,
      },
      secondary: {
        label: t('commodities.history.average'),
        format: value,
        color: '--info',
        axis: 'right',
      },
    }
  }, [format, unit, profile, names, code, t])

  const first = shown.at(0)
  const last = shown.at(-1)
  const label =
    first && last
      ? t('commodities.history.summary', {
          name: lines.primary.label,
          from: format.isoDate(first.date),
          to: format.isoDate(last.date),
          first: lines.primary.format(first.value),
          last: lines.primary.format(last.value),
        })
      : t('commodities.history.empty')

  const options = (
    <>
      <PanelTabs
        value={interval}
        options={COMMODITY_INTERVALS.map((value) => {
          const offered = profile?.intervals.includes(value) ?? value === interval
          return {
            value,
            label: t(`commodities.frequencies.${value}`),
            disabled: !offered,
            title: offered ? undefined : t('commodities.history.notOffered'),
          }
        })}
        onChange={setChosen}
      />
      <span aria-hidden>·</span>
      <PanelTabs
        value={period}
        options={COMMODITY_PERIODS.map((value) => ({
          value,
          label: t(`commodities.periods.${value}`),
        }))}
        onChange={setPeriod}
      />
      <span aria-hidden>·</span>
      <PanelToggle active={average} onChange={setAverage}>
        {t('commodities.history.averageToggle')}
      </PanelToggle>
    </>
  )

  let body
  if (history.isPending) body = <PanelLoading />
  else if (history.isError) {
    body = <PanelError error={history.error} onRetry={() => void history.refetch()} />
  } else if (chartPoints.length === 0)
    body = <PanelEmpty message={t('commodities.history.empty')} />
  else {
    body = (
      <div className={clsx('h-full min-h-0', history.isPlaceholderData && 'opacity-60')}>
        <TwoAxisChart
          points={chartPoints}
          primary={lines.primary}
          secondary={average ? lines.secondary : undefined}
          label={label}
        />
      </div>
    )
  }

  return (
    <Panel
      title={t('panels.commodityHistory')}
      code="GP"
      options={options}
      bodyClassName="flex min-h-0 flex-col"
    >
      <div className="min-h-0 flex-1">{body}</div>
      <p className="shrink-0 px-2 py-1 font-sans text-title text-secondary">
        {t('commodities.history.note')}
      </p>
    </Panel>
  )
}
