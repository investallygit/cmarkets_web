import { clsx } from 'clsx'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEtf, useEtfHistory } from '@/entities/etf'
import { useFormat } from '@/shared/i18n'
import { useMarketDay } from '@/shared/lib/useMarketDay'
import { TwoAxisChart, type TwoAxisLine } from '@/shared/ui/charts/TwoAxisChart'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import { PanelEmpty, PanelError, PanelLoading } from '@/shared/ui/StatusViews'
import {
  GROWTH_PERIODS,
  growthPoints,
  historyQuery,
  lineSummary,
  type GrowthPeriod,
} from '../lib/history'

/**
 * PERF, the ETF against its index: 100 invested on the period's first day, distributions
 * reinvested, in amber; the benchmark dotted in blue on the same scale, from its first close on the
 * fund's line. API /etfs/{id}/history?with=total,index.
 */
export function EtfGrowthPanel({ etfId }: { etfId: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const today = useMarketDay()
  const etf = useEtf(etfId).data
  const [period, setPeriod] = useState<GrowthPeriod>('3Y')
  const query =
    period === 'MAX' && !etf
      ? null
      : historyQuery(period, today, etf?.inceptionDate ?? null, ['total', 'index'])
  const history = useEtfHistory(etfId, query)
  const code = etf?.identification.code ?? etfId

  const points = useMemo(() => growthPoints(history.data ?? []), [history.data])
  const hasIndex = points.some((point) => point.secondary !== null)
  const lines = useMemo((): { primary: TwoAxisLine; secondary: TwoAxisLine } => {
    const level = (value: number) => format.number(value, 2)
    return {
      primary: {
        label: t('etfProfile.growth.fund', { code }),
        format: level,
        color: '--accent-amber',
        axis: 'right',
      },
      secondary: {
        label: etf?.benchmark ?? t('etfProfile.growth.index'),
        format: level,
        color: '--info',
        axis: 'right',
        dotted: true,
      },
    }
  }, [code, etf?.benchmark, t, format])

  const summary = lineSummary(points)
  let body
  if (history.isPending) body = <PanelLoading />
  else if (history.isError) {
    body = <PanelError error={history.error} onRetry={() => void history.refetch()} />
  } else if (!summary) body = <PanelEmpty message={t('etfProfile.growth.empty')} />
  else {
    const words = {
      fund: lines.primary.label,
      from: format.isoDate(summary.from),
      to: format.isoDate(summary.to),
      last: format.number(summary.last, 2),
    }
    const label =
      hasIndex && summary.otherLast !== null
        ? t('etfProfile.growth.summary', {
            ...words,
            index: lines.secondary.label,
            indexLast: format.number(summary.otherLast, 2),
          })
        : t('etfProfile.growth.summaryAlone', words)
    body = (
      <div
        className={clsx('flex min-h-0 flex-1 flex-col', history.isPlaceholderData && 'opacity-60')}
      >
        <div className="min-h-0 flex-1">
          <TwoAxisChart
            points={points}
            primary={lines.primary}
            secondary={hasIndex ? lines.secondary : undefined}
            label={label}
          />
        </div>
        <p className="shrink-0 px-2 pb-1 font-sans text-title text-secondary">
          {t('etfProfile.growth.hint')}
        </p>
      </div>
    )
  }

  return (
    <Panel
      title={t('panels.etfGrowth')}
      code="PERF"
      options={
        <PanelTabs
          value={period}
          options={GROWTH_PERIODS.map((value) => ({
            value,
            label: t(`etfProfile.periods.${value}`),
          }))}
          onChange={setPeriod}
        />
      }
      bodyClassName="flex min-h-0 flex-col"
    >
      {body}
    </Panel>
  )
}
