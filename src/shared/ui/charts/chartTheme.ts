import { useMemo } from 'react'
import { cssVar } from '@/shared/lib/theme'

/** Axis text of every chart (spec section 8): the monospaced font at 11 px. */
export const CHART_FONT = "'JetBrains Mono Variable', monospace"

const SERIES_TOKENS = [
  '--chart-1',
  '--chart-2',
  '--chart-3',
  '--chart-4',
  '--chart-5',
  '--chart-6',
  '--chart-7',
  '--chart-8',
] as const

/** Series a chart can tell apart by colour; more fold into "Other". */
export const MAX_SERIES = SERIES_TOKENS.length

const ORDINAL_TOKENS = [
  '--chart-ordinal-1',
  '--chart-ordinal-2',
  '--chart-ordinal-3',
  '--chart-ordinal-4',
  '--chart-ordinal-5',
] as const

/** Colours of the Recharts charts, read once from the section 8 tokens (SVG needs plain values). */
export function useChartTheme() {
  return useMemo(() => {
    const secondary = cssVar('--text-secondary')
    return {
      primary: cssVar('--text-primary'),
      secondary,
      grid: cssVar('--border'),
      panel: cssVar('--bg-panel'),
      amber: cssVar('--accent-amber'),
      info: cssVar('--info'),
      warning: cssVar('--warning'),
      /** Categorical series, assigned in this order. */
      series: SERIES_TOKENS.map((token) => cssVar(token)),
      /** Ordered classes, first to last. */
      ordinal: ORDINAL_TOKENS.map((token) => cssVar(token)),
      tick: { fill: secondary, fontFamily: CHART_FONT, fontSize: 11 },
    }
  }, [])
}
