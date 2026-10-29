import type { IndexQuoteDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { ChangeText } from '@/shared/ui/ChangeText'
import { Flash } from '@/shared/ui/Flash'
import { useLiveIndex } from '../live/hooks'
import { INDEX_DECIMALS } from '../price'

export function LiveIndexValue({ index }: { index: IndexQuoteDto }) {
  const format = useFormat()
  const value = useLiveIndex(index.code)?.value ?? index.value
  return <Flash value={value}>{format.number(value, INDEX_DECIMALS)}</Flash>
}

export function LiveIndexChange({ index }: { index: IndexQuoteDto }) {
  const value = useLiveIndex(index.code)?.value ?? index.value
  return <ChangeText value={value - index.previousClose} plusSign={false} />
}

export function LiveIndexChangePct({ index }: { index: IndexQuoteDto }) {
  const changePct = useLiveIndex(index.code)?.changePct ?? index.changePct
  return <ChangeText value={changePct} percent />
}
