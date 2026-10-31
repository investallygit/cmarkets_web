import { useTranslation } from 'react-i18next'
import { useFormat } from '@/shared/i18n'
import type { ChartPeriod } from '@/shared/lib/chartPeriods'

/** A value of the series: a bar's close and range, or a point's value as its close. */
interface ChartValue {
  close: number
  high?: number
  low?: number
}

/**
 * What a chart shows, in words, for screen readers (WCAG 1.1.1): its subject and period, the
 * first and last values with the change, and the range. The canvas itself says nothing. A live
 * value replaces the last one, as on the chart.
 */
export function useChartLabel(
  subject: string,
  period: ChartPeriod | null,
  values: readonly ChartValue[],
  decimals: number,
  live?: number,
): string {
  const { t } = useTranslation()
  const format = useFormat()
  const what = period
    ? t('chart.label.period', { subject, period: t(`chart.periods.${period}`) })
    : subject
  const first = values.at(0)?.close
  const last = live ?? values.at(-1)?.close
  if (first === undefined || last === undefined) return what
  const high = Math.max(last, ...values.map((value) => value.high ?? value.close))
  const low = Math.min(last, ...values.map((value) => value.low ?? value.close))
  return t('chart.label.summary', {
    what,
    first: format.number(first, decimals),
    last: format.number(last, decimals),
    change: format.percent(first === 0 ? 0 : (last / first - 1) * 100),
    high: format.number(high, decimals),
    low: format.number(low, decimals),
  })
}
