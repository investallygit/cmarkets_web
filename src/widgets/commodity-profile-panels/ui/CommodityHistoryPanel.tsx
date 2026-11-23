import { clsx } from 'clsx'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  COMMODITY_INTERVALS,
  COMMODITY_PERIODS,
  commodityDecimals,
  DEFAULT_COMMODITY_PERIOD,
  periodStart,
  useCommodity,
  useCommodityHistory,
  useCommodityItem,
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
import { DownloadDataLink } from '@/features/download-data'

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
  const item = useCommodityItem(code)
  const [chosen, setChosen] = useState<CommodityFrequency | null>(null)
  const [period, setPeriod] = useState<CommodityPeriod>(DEFAULT_COMMODITY_PERIOD)
  const [average, setAverage] = useState(true)
  const today = useMarketDay()
  const intervals = profile?.intervals
  // The interval chosen on the series before stays where this one offers it. Without a choice, the
  // list's frequency tells the interval before the profile comes.
  const kept = chosen && intervals?.includes(chosen) ? chosen : null
  const interval = kept ?? profile?.frequency ?? item?.frequency ?? 'daily'
  // The period's values only: Brent's whole daily history is ten thousand of them.
  const history = useCommodityHistory(
    code,
    interval,
    periodStart(period, today),
    profile !== undefined || (chosen === null && item !== undefined),
  )
  const named = profile ?? item
  const unit = named?.unit ?? 'USD/bbl'
  const name = named ? `${names.name(named, true)} (${names.unit(unit)})` : code
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
        label: name,
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
  }, [format, unit, name, t])

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
      <DownloadDataLink dataset="commodities" items={[code]} what={code} />
      <PanelTabs
        value={interval}
        options={COMMODITY_INTERVALS.map((value) => {
          const offered = intervals?.includes(value) ?? value === interval
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
