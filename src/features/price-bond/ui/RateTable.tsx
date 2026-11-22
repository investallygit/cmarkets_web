import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { useFormat } from '@/shared/i18n'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import type { ScheduleRow } from '../model/discountForm'

interface RateTableProps {
  /** The bond's remaining cash-flow dates; null while they load or the bond is incomplete. */
  rows: readonly ScheduleRow[] | null
  /** The rate of each row, in percent. */
  rates: readonly (number | null)[]
  /** The rates read on a curve or typed: inputs; the yield's and the tenors': greyed figures. */
  onEdit?: (date: string, rate: number | null) => void
  caption: string
}

/**
 * One row per remaining cash-flow date of the bond, from the next coupon to the redemption, with
 * its time in years and its rate (spec section 9, screen 16, fifth version).
 */
export function RateTable({ rows, rates, onEdit, caption }: RateTableProps) {
  const { t } = useTranslation()
  const format = useFormat()
  if (rows === null) {
    return (
      <p className="font-sans text-title text-secondary">{t('bondPricing.discount.noDates')}</p>
    )
  }
  const header = 'h-row px-1.5 font-sans text-data font-normal text-secondary'
  return (
    <table className="w-full border-collapse font-mono text-data tabular-nums">
      <caption className="sr-only">{caption}</caption>
      <thead className="bg-panel-header">
        <tr>
          <th scope="col" className={clsx(header, 'text-left')}>
            {t('bondPricing.discount.columns.date')}
          </th>
          <th scope="col" className={clsx(header, 'text-right')}>
            {t('bondPricing.discount.columns.years')}
          </th>
          <th scope="col" className={clsx(header, 'w-24 text-right')}>
            {t('bondPricing.discount.columns.rate')}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => {
          const rate = rates[index] ?? null
          return (
            <tr key={row.date} className="h-8">
              <th scope="row" className="px-1.5 text-left font-normal">
                {format.isoDate(row.date)}
              </th>
              <td className="px-1.5 text-right text-secondary">{format.number(row.years, 4)}</td>
              <td className="py-0.5 pl-1.5">
                {onEdit ? (
                  <NumberInput
                    value={rate}
                    onChange={(value) => onEdit(row.date, value)}
                    decimals={3}
                    highlight
                    aria-label={t('bondPricing.discount.rateOn', {
                      date: format.isoDate(row.date),
                    })}
                  />
                ) : (
                  <span className="block border bg-panel-header px-2 py-1 text-right text-secondary">
                    {rate === null ? '—' : format.number(rate, 3)}
                  </span>
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
