import { useCallback } from 'react'
import type { RatioKey } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { RATIO_FORMATS } from '../config/ratios'

const MISSING = '—'

/** "11.4x", "6.2%" ("11,4x", "6,2 %" in French); a dash when the ratio is not available. */
export function useFormatRatio(): (key: RatioKey, value: number | null) => string {
  const format = useFormat()
  return useCallback(
    (key, value) => {
      if (value === null) return MISSING
      const { kind, decimals } = RATIO_FORMATS[key]
      return kind === 'multiple'
        ? `${format.number(value, decimals)}x`
        : format.percent(value, decimals, false)
    },
    [format],
  )
}
