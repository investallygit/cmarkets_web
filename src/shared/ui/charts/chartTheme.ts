import { useMemo } from 'react'
import { cssVar } from '@/shared/lib/theme'

/** Axis text of every chart (spec section 8): the monospaced font at 11 px. */
export const CHART_FONT = "'JetBrains Mono Variable', monospace"

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
      tick: { fill: secondary, fontFamily: CHART_FONT, fontSize: 11 },
    }
  }, [])
}
