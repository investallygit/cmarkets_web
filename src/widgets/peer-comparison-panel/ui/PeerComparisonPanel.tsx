import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
  type YAxisTickContentProps,
} from 'recharts'
import { useComparison, useFormatRatio, useRatios } from '@/entities/fundamentals'
import type { ComparisonItemDto, RatioKey } from '@/shared/api/contracts'
import { withAlpha } from '@/shared/lib/theme'
import { CHART_FONT, useChartTheme } from '@/shared/ui/charts/chartTheme'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import { QueryView } from '@/shared/ui/QueryView'
import { PanelEmpty } from '@/shared/ui/StatusViews'

/** The tabs of the screen 3 mockup: P/E · Yield · ROE · Margin. */
const METRICS = ['pe', 'dividendYield', 'roe', 'netMargin'] as const
type ComparisonMetric = (typeof METRICS)[number]

/** Bars shown at most: the security and its first peers. */
const MAX_BARS = 10

interface PeerComparisonPanelProps {
  securityId: string | undefined
  /** Securities to compare with, in the order to show them. */
  peerIds: readonly string[]
  /** A click on a bar picks that security (screener only). */
  onSelect?: (securityId: string) => void
}

/**
 * Screen 3, comparison: horizontal bars, the security in amber, its sector's average as a dashed
 * yellow line. API /analysis/compare and /securities/{id}/ratios.
 */
export function PeerComparisonPanel({ securityId, peerIds, onSelect }: PeerComparisonPanelProps) {
  const { t } = useTranslation()
  const [metric, setMetric] = useState<ComparisonMetric>('dividendYield')
  const ids = useMemo(
    () =>
      securityId
        ? [securityId, ...peerIds.filter((id) => id !== securityId)].slice(0, MAX_BARS)
        : [],
    [securityId, peerIds],
  )
  const comparison = useComparison(ids)
  const ratios = useRatios(securityId)
  const tabs = useMemo(
    () => METRICS.map((value) => ({ value, label: t(`comparison.tabs.${value}`) })),
    [t],
  )

  return (
    <Panel
      title={t('comparison.title', { metric: t(`comparison.metrics.${metric}`) })}
      code="FA"
      options={<PanelTabs value={metric} options={tabs} onChange={setMetric} />}
    >
      {!securityId ? (
        <PanelEmpty message={t('comparison.noSecurity')} />
      ) : (
        <QueryView query={comparison}>
          {(items) => (
            <ComparisonChart
              items={items}
              order={ids}
              securityId={securityId}
              metric={metric}
              sectorAverage={ratios.data?.sectorAverages[metric] ?? null}
              onSelect={onSelect}
            />
          )}
        </QueryView>
      )}
    </Panel>
  )
}

interface ComparisonChartProps {
  items: ComparisonItemDto[]
  order: readonly string[]
  securityId: string
  metric: RatioKey
  sectorAverage: number | null
  onSelect?: (securityId: string) => void
}

function ComparisonChart({
  items,
  order,
  securityId,
  metric,
  sectorAverage,
  onSelect,
}: ComparisonChartProps) {
  const { t } = useTranslation()
  const theme = useChartTheme()
  const formatRatio = useFormatRatio()
  const rows = order.flatMap((id) => {
    const item = items.find((candidate) => candidate.securityId === id)
    return item ? [{ securityId: id, code: item.code, value: item.ratios[metric] }] : []
  })
  const values = [...rows.map((row) => row.value ?? 0), sectorAverage ?? 0]
  const domain = [Math.min(0, ...values), Math.max(0, ...values) * 1.15]
  const average =
    sectorAverage === null
      ? null
      : t('comparison.sectorAverage', { value: formatRatio(metric, sectorAverage) })

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 12, right: 56, bottom: average ? 24 : 8, left: 4 }}
            barCategoryGap="35%"
          >
            <XAxis type="number" hide domain={domain} />
            <YAxis
              type="category"
              dataKey="code"
              width={88}
              axisLine={false}
              tickLine={false}
              tick={(props: YAxisTickContentProps) => (
                <text
                  x={Number(props.x) - 8}
                  y={Number(props.y)}
                  textAnchor="end"
                  dominantBaseline="central"
                  fontFamily={CHART_FONT}
                  fontSize={11}
                  fontWeight={rows[props.index]?.securityId === securityId ? 600 : 400}
                  fill={rows[props.index]?.securityId === securityId ? theme.amber : theme.primary}
                >
                  {String(props.payload.value)}
                </text>
              )}
            />
            <Bar
              dataKey="value"
              isAnimationActive={false}
              cursor={onSelect ? 'pointer' : undefined}
              onClick={(_bar, index) => onSelect?.(rows[index].securityId)}
            >
              {rows.map((row) => (
                <Cell
                  key={row.securityId}
                  fill={row.securityId === securityId ? theme.amber : withAlpha(theme.info, 0.45)}
                />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                fill={theme.primary}
                fontFamily={CHART_FONT}
                fontSize={11}
                formatter={(value) => formatRatio(metric, typeof value === 'number' ? value : null)}
              />
            </Bar>
            {sectorAverage !== null && (
              <ReferenceLine
                x={sectorAverage}
                stroke={theme.warning}
                strokeDasharray="4 3"
                label={{
                  value: average ?? '',
                  position: 'bottom',
                  fill: theme.warning,
                  fontFamily: CHART_FONT,
                  fontSize: 11,
                }}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* The values as text, for screen readers. */}
      <ul className="sr-only">
        {rows.map((row) => (
          <li key={row.securityId}>
            {row.code}: {formatRatio(metric, row.value)}
          </li>
        ))}
        {average && <li>{average}</li>}
      </ul>
    </div>
  )
}
