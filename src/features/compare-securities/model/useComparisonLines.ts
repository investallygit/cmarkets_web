import { useQueries } from '@tanstack/react-query'
import { indexHistoryQuery } from '@/entities/market'
import { securityHistoryQuery } from '@/entities/security'
import type { HistoryPointDto } from '@/shared/api/contracts'
import type { ChartPeriod } from '@/shared/lib/chartPeriods'
import type { PriceChartLine } from '@/shared/ui/charts/PriceChart'
import { COMPARISON_COLORS, comparedKey, type ComparedItem } from './comparison'

/** History of each compared security or index over the chart period, as lines of the chart. */
export function useComparisonLines(
  items: readonly ComparedItem[],
  period: ChartPeriod,
): PriceChartLine[] {
  return useQueries({
    queries: items.map((item) =>
      item.kind === 'index'
        ? indexHistoryQuery(item.id, period)
        : {
            ...securityHistoryQuery(item.id, period),
            select: ({ bars }: { bars: { time: string; close: number }[] }): HistoryPointDto[] =>
              bars.map((bar) => ({ time: bar.time, value: bar.close })),
          },
    ),
    // The result is structurally shared: a refetch with the same data keeps the same lines.
    combine: (results) =>
      results.flatMap((result, index): PriceChartLine[] => {
        const item = items[index]
        if (!item || !result.data) return []
        const color = COMPARISON_COLORS[index % COMPARISON_COLORS.length]
        return [{ id: comparedKey(item), label: item.label, color, points: result.data }]
      }),
  })
}
