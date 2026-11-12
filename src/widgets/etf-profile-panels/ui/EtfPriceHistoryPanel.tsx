import { clsx } from 'clsx'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEtf, useEtfHistory } from '@/entities/etf'
import { useFormat } from '@/shared/i18n'
import { useMarketDay } from '@/shared/lib/useMarketDay'
import { TwoAxisChart, type TwoAxisLine } from '@/shared/ui/charts/TwoAxisChart'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs, PanelToggle } from '@/shared/ui/PanelTabs'
import { PanelEmpty, PanelError, PanelLoading } from '@/shared/ui/StatusViews'
import {
  historyQuery,
  lineSummary,
  PRICE_PERIODS,
  pricePoints,
  type PriceLines,
  type PricePeriod,
} from '../lib/history'

/**
 * Screen 19, price history (the DES tab): the market price in amber over its filled area and the
 * NAV dotted in blue on one price axis, 1M to MAX (1Y by default, by week past three years); the
 * volume below; the price, the NAV and the premium or discount of the day under the cursor.
 * PRICE, NAV and VOLUME switch their line, one of the two prices kept. API
 * /etfs/{id}/history?with=nav.
 */
export function EtfPriceHistoryPanel({ etfId }: { etfId: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const today = useMarketDay()
  const etf = useEtf(etfId).data
  const [period, setPeriod] = useState<PricePeriod>('1Y')
  const [lines, setLines] = useState<PriceLines>({ price: true, nav: true, volume: true })
  // MAX waits for the fund's inception; the other periods count back from today.
  const query =
    period === 'MAX' && !etf
      ? null
      : historyQuery(period, today, etf?.inceptionDate ?? null, ['nav'])
  const history = useEtfHistory(etfId, query)
  const currency = etf?.identification.currency
  const decimals = 2

  const points = useMemo(() => pricePoints(history.data ?? [], lines), [history.data, lines])
  const premiums = useMemo(
    () => new Map((history.data ?? []).map((day) => [day.date, day.premiumDiscountPct])),
    [history.data],
  )
  const chartLines = useMemo((): { primary: TwoAxisLine; secondary?: TwoAxisLine } => {
    const price = (value: number) => format.number(value, decimals)
    const nav: TwoAxisLine = {
      label: t('etfProfile.history.series.nav'),
      format: price,
      color: '--info',
      axis: 'right',
      dotted: true,
    }
    if (!lines.price) return { primary: { ...nav, dotted: false } }
    return {
      primary: {
        label: t('etfProfile.history.series.price'),
        format: price,
        color: '--accent-amber',
        axis: 'right',
        fill: true,
      },
      secondary: lines.nav ? nav : undefined,
    }
  }, [lines.price, lines.nav, t, format])

  const summary = lineSummary(points)
  const label = summary
    ? t('etfProfile.history.summary', {
        what: chartLines.primary.label,
        from: format.isoDate(summary.from),
        to: format.isoDate(summary.to),
        first: chartLines.primary.format(summary.first),
        last: chartLines.primary.format(summary.last),
        low: chartLines.primary.format(summary.low),
        high: chartLines.primary.format(summary.high),
      })
    : t('etfProfile.history.empty')

  const toggle = (line: keyof PriceLines) => (active: boolean) =>
    setLines((current) => ({ ...current, [line]: active }))
  const options = (
    <>
      <PanelTabs
        value={period}
        options={PRICE_PERIODS.map((value) => ({ value, label: t(`etfProfile.periods.${value}`) }))}
        onChange={setPeriod}
      />
      <span aria-hidden>·</span>
      <div
        role="group"
        aria-label={t('etfProfile.history.seriesLabel')}
        className="flex items-center gap-x-1"
      >
        {/* One of the two prices stays drawn. */}
        <PanelToggle
          active={lines.price}
          onChange={toggle('price')}
          disabled={lines.price && !lines.nav}
        >
          {t('etfProfile.history.series.price')}
        </PanelToggle>
        <span aria-hidden>·</span>
        <PanelToggle
          active={lines.nav}
          onChange={toggle('nav')}
          disabled={lines.nav && !lines.price}
        >
          {t('etfProfile.history.series.nav')}
        </PanelToggle>
        <span aria-hidden>·</span>
        <PanelToggle active={lines.volume} onChange={toggle('volume')}>
          {t('etfProfile.history.series.volume')}
        </PanelToggle>
      </div>
    </>
  )

  let body
  if (history.isPending) body = <PanelLoading />
  else if (history.isError) {
    body = <PanelError error={history.error} onRetry={() => void history.refetch()} />
  } else if (!summary) body = <PanelEmpty message={t('etfProfile.history.empty')} />
  else {
    body = (
      <div className={clsx('h-full min-h-0', history.isPlaceholderData && 'opacity-60')}>
        <TwoAxisChart
          points={points}
          primary={chartLines.primary}
          secondary={chartLines.secondary}
          volumeLabel={lines.volume ? t('etfProfile.history.series.volume') : undefined}
          label={currency ? `${label} (${currency})` : label}
          note={(date) => {
            const premium = premiums.get(date)
            return premium === null || premium === undefined
              ? null
              : t('etfProfile.history.premium', { value: format.percent(premium, 2) })
          }}
        />
      </div>
    )
  }

  return (
    <Panel
      title={t('panels.etfPriceHistory')}
      code="GP"
      options={options}
      bodyClassName="flex min-h-0 flex-col"
    >
      {body}
    </Panel>
  )
}
