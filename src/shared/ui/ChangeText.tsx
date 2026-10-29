import { clsx } from 'clsx'
import { useFormat } from '@/shared/i18n'
import { TREND_TEXT, trendOf } from './trend'
import { TrendIcon } from './TrendIcon'

interface ChangeTextProps {
  value: number
  percent?: boolean
  decimals?: number
  /** Absolute changes are shown without "+" in the mockups (5.39, -3.42). */
  plusSign?: boolean
  showIcon?: boolean
  className?: string
}

export function ChangeText({
  value,
  percent = false,
  decimals = 2,
  plusSign = true,
  showIcon = false,
  className,
}: ChangeTextProps) {
  const format = useFormat()
  const direction = trendOf(Number(value.toFixed(decimals)))
  return (
    <span className={clsx('inline-flex items-center gap-1', TREND_TEXT[direction], className)}>
      {showIcon && <TrendIcon direction={direction} />}
      {percent ? format.percent(value, decimals) : format.signed(value, decimals, plusSign)}
    </span>
  )
}
