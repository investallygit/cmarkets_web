import { clsx } from 'clsx'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useBondAnalytics, useBondHistory } from '@/entities/bond'
import { useFormat } from '@/shared/i18n'
import { useMarketDay } from '@/shared/lib/useMarketDay'
import { TwoAxisChart, type TwoAxisLine } from '@/shared/ui/charts/TwoAxisChart'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import { PanelEmpty, PanelError, PanelLoading } from '@/shared/ui/StatusViews'
import {
  HISTORY_PERIODS,
  HISTORY_SERIES,
  historyPoints,
  historySummary,
  periodStart,
  type HistoryPeriod,
  type HistorySeries,
} from '../lib/history'

/**
 * Screen 20, price and yield history (the DES tab, and alone on the GP tab): the clean price of
 * each daily calculation in amber on the left axis, lighter on a model price's days, and the YTM
 * dotted in blue on the right; the yields or the spread instead; 6M to MAX; the volume of the
 * traded sessions below. API /bonds/{id}/analytics/history.
 */
export function PriceYieldHistoryPanel({ bondId }: { bondId: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const today = useMarketDay()
  const [period, setPeriod] = useState<HistoryPeriod>('1Y')
  const [series, setSeries] = useState<HistorySeries>('price')
  const issueDate = useBondAnalytics(bondId).data?.structure.issueDate
  // MAX waits for the issue date; the other periods count back from today.
  const from =
    period === 'MAX' && !issueDate ? null : periodStart(period, today, issueDate ?? today)
  const history = useBondHistory(bondId, from)

  const points = useMemo(() => historyPoints(history.data ?? [], series), [history.data, series])
  const lines = useMemo((): { primary: TwoAxisLine; secondary?: TwoAxisLine } => {
    const price = (value: number) => format.number(value, 2)
    const percent = (value: number) => format.percent(value, 2, false)
    if (series === 'price') {
      return {
        primary: {
          label: t('bondProfile.history.legend.price'),
          format: price,
          color: '--accent-amber',
          axis: 'left',
        },
        secondary: {
          label: t('bondProfile.history.legend.ytm'),
          format: percent,
          color: '--info',
          axis: 'right',
          dotted: true,
        },
      }
    }
    if (series === 'yield') {
      return {
        primary: {
          label: t('bondProfile.history.legend.ytmLeft'),
          format: percent,
          color: '--accent-amber',
          axis: 'left',
        },
        secondary: {
          label: t('bondProfile.history.legend.ytw'),
          format: percent,
          color: '--info',
          axis: 'left',
          dotted: true,
        },
      }
    }
    return {
      primary: {
        label: t('bondProfile.history.legend.spread'),
        format: (value: number) => format.number(value, 0),
        color: '--accent-amber',
        axis: 'left',
      },
    }
  }, [series, t, format])

  const summary = historySummary(points)
  const label = summary
    ? t('bondProfile.history.summary', {
        what: lines.primary.label,
        from: format.isoDate(summary.from),
        to: format.isoDate(summary.to),
        first: lines.primary.format(summary.first),
        last: lines.primary.format(summary.last),
        low: lines.primary.format(summary.low),
        high: lines.primary.format(summary.high),
        traded: summary.traded,
        model: summary.model,
      })
    : t('bondProfile.history.empty')

  const options = (
    <>
      <PanelTabs
        value={period}
        options={HISTORY_PERIODS.map((value) => ({
          value,
          label: t(`bondProfile.history.periods.${value}`),
        }))}
        onChange={setPeriod}
      />
      <span aria-hidden>·</span>
      <PanelTabs
        value={series}
        options={HISTORY_SERIES.map((value) => ({
          value,
          label: t(`bondProfile.history.series.${value}`),
        }))}
        onChange={setSeries}
      />
    </>
  )

  let body
  if (history.isPending) body = <PanelLoading />
  else if (history.isError) {
    body = <PanelError error={history.error} onRetry={() => void history.refetch()} />
  } else if (!summary) body = <PanelEmpty message={t('bondProfile.history.empty')} />
  else {
    body = (
      <div
        className={clsx('flex min-h-0 flex-1 flex-col', history.isPlaceholderData && 'opacity-60')}
      >
        <div className="min-h-0 flex-1">
          <TwoAxisChart
            points={points}
            primary={lines.primary}
            secondary={lines.secondary}
            volumeLabel={t('bondProfile.history.legend.volume')}
            label={label}
          />
        </div>
        {summary.model > 0 && (
          <p className="shrink-0 px-2 pb-1 font-sans text-title text-secondary">
            {t('bondProfile.history.legend.model')}
          </p>
        )}
      </div>
    )
  }

  return (
    <Panel
      title={t('panels.priceYieldHistory')}
      code="GP"
      options={options}
      bodyClassName="flex min-h-0 flex-col"
    >
      {body}
    </Panel>
  )
}
