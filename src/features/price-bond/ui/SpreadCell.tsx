import { clsx } from 'clsx'
import { useFormat } from '@/shared/i18n'
import { spreadBp } from '../model/rateEntry'

/** A spread in bp, green above its reference and red below. */
export function SpreadCell({ rate, reference }: { rate: number | null; reference: number | null }) {
  const format = useFormat()
  const spread = spreadBp(rate, reference)
  return (
    <td
      className={clsx(
        'px-1 text-right',
        spread === null || spread === 0 ? 'text-secondary' : spread > 0 ? 'text-up' : 'text-down',
      )}
    >
      {spread === null ? '—' : spread === 0 ? format.number(0, 1) : format.signed(spread, 1)}
    </td>
  )
}
