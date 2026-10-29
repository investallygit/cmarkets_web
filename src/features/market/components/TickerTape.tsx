import type { TickerItemDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { useSymbolSubscription } from '@/shared/realtime'
import { ChangeText } from '@/shared/ui/ChangeText'
import { Flash } from '@/shared/ui/Flash'
import { useTicker } from '../api'
import { useLiveIndex, useLiveQuote } from '../live/hooks'
import { priceDecimals } from '../price'

/** Ticker tape under the top bar: indices and main securities with coloured change. */
export function TickerTape() {
  const { data } = useTicker()
  useSymbolSubscription(
    data?.filter((item) => item.kind === 'security').map((item) => item.symbol) ?? [],
  )

  return (
    <div className="flex h-full items-center gap-8 overflow-hidden px-4 font-mono text-data whitespace-nowrap">
      {data?.map((item) => (
        <TickerEntry key={item.symbol} item={item} />
      ))}
    </div>
  )
}

function TickerEntry({ item }: { item: TickerItemDto }) {
  const format = useFormat()
  const quote = useLiveQuote(item.symbol)
  const index = useLiveIndex(item.symbol)
  const live =
    item.kind === 'index' ? index && { last: index.value, changePct: index.changePct } : quote
  const last = live?.last ?? item.last
  const changePct = live?.changePct ?? item.changePct

  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-semibold text-accent-amber">{item.label}</span>
      <Flash value={last}>{format.number(last, priceDecimals(item.type, item.currency))}</Flash>
      <ChangeText value={changePct} percent showIcon />
    </span>
  )
}
