import { clsx } from 'clsx'
import { useFormat } from '@/shared/i18n'
import { ChangeText } from '@/shared/ui/ChangeText'
import { Flash } from '@/shared/ui/Flash'
import { useLiveQuote } from '../model/hooks'

interface LivePriceProps {
  symbol: string
  /** Value from the REST snapshot, used until a real-time quote arrives. */
  value: number
  decimals: number
  /** Delayed or cached data is shown in yellow (spec section 11). */
  isDelayed?: boolean
}

export function LivePrice({ symbol, value, decimals, isDelayed = false }: LivePriceProps) {
  const format = useFormat()
  const last = useLiveQuote(symbol)?.last ?? value
  return (
    <Flash value={last} className={clsx(isDelayed && 'text-warning')}>
      {format.number(last, decimals)}
    </Flash>
  )
}

/** Change since the previous close, with its sign and arrow: "▲ +600". */
export function LiveChange({
  symbol,
  value,
  decimals,
}: {
  symbol: string
  value: number
  decimals: number
}) {
  const change = useLiveQuote(symbol)?.change ?? value
  return <ChangeText value={change} decimals={decimals} showIcon />
}

export function LiveChangePct({ symbol, value }: { symbol: string; value: number }) {
  const changePct = useLiveQuote(symbol)?.changePct ?? value
  return <ChangeText value={changePct} percent />
}

export function LiveVolume({ symbol, value }: { symbol: string; value: number }) {
  const format = useFormat()
  const volume = useLiveQuote(symbol)?.volume ?? value
  return <>{format.number(volume, 0)}</>
}
