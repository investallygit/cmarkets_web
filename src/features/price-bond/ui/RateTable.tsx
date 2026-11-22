import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { useFormat } from '@/shared/i18n'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import type { ScheduleRow } from '../model/discountForm'
import { cellsPasted } from '../model/rateEntry'
import { SpreadCell } from './SpreadCell'

interface RateTableProps {
  /** The bond's remaining cash-flow dates; null while they load or the bond is incomplete. */
  rows: readonly ScheduleRow[] | null
  /** The rate of each row, in percent. */
  rates: readonly (number | null)[]
  /** The reference curve's rate of each row, with its spread column; none with a single yield. */
  references?: readonly (number | null)[] | null
  /** The rates read on a curve or typed: inputs; the yield's and the tenors': greyed figures. */
  onEdit?: (date: string, rate: number | null) => void
  /** Several cells pasted into a row's rate (from Excel): the table fills from that row down. */
  onPasteAt?: (index: number, text: string) => void
  caption: string
}

/**
 * One row per remaining cash-flow date of the bond, from the next coupon to the redemption, with
 * its time in years and its rate (spec section 9, screen 16, fifth version); with a curve or rates
 * entered, the reference curve's rate and the spread to it in bp (ROADMAP decision 46).
 */
export function RateTable({ rows, rates, references, onEdit, onPasteAt, caption }: RateTableProps) {
  const { t } = useTranslation()
  const format = useFormat()
  if (rows === null) {
    return (
      <p className="font-sans text-title text-secondary">{t('bondPricing.discount.noDates')}</p>
    )
  }
  const header = 'h-row px-1 font-sans text-data font-normal leading-tight text-secondary'
  return (
    <table
      className={clsx(
        'w-full border-collapse font-mono text-data tabular-nums',
        references && 'table-fixed',
      )}
    >
      <caption className="sr-only">{caption}</caption>
      {/* Five columns fit the inputs panel's width only at set shares. */}
      {references && (
        <colgroup>
          <col className="w-[25%]" />
          <col className="w-[16%]" />
          <col className="w-[16%]" />
          <col className="w-[25%]" />
          <col className="w-[18%]" />
        </colgroup>
      )}
      <thead className="bg-panel-header">
        <tr>
          <th scope="col" className={clsx(header, 'text-left')}>
            {t('bondPricing.discount.columns.date')}
          </th>
          <th scope="col" className={clsx(header, 'text-right')}>
            {t('bondPricing.discount.columns.years')}
          </th>
          {references && (
            <th scope="col" className={clsx(header, 'text-right')}>
              {t('bondPricing.discount.columns.reference')}
            </th>
          )}
          <th scope="col" className={clsx(header, !references && 'w-24', 'text-right')}>
            {t('bondPricing.discount.columns.rate')}
          </th>
          {references && (
            <th scope="col" className={clsx(header, 'text-right')}>
              {t('bondPricing.discount.columns.spread')}
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => {
          const rate = rates[index] ?? null
          const reference = references?.[index] ?? null
          return (
            <tr key={row.date} className="h-8">
              <th scope="row" className="px-1 text-left font-normal">
                {format.isoDate(row.date)}
              </th>
              <td className="px-1 text-right text-secondary">{format.number(row.years, 4)}</td>
              {references && (
                <td className="px-1 text-right text-secondary">
                  {reference === null ? '—' : format.number(reference, 3)}
                </td>
              )}
              <td className="py-0.5 pl-1.5">
                {onEdit ? (
                  <NumberInput
                    value={rate}
                    onChange={(value) => onEdit(row.date, value)}
                    onPaste={(event) => {
                      const text = onPasteAt && cellsPasted(event.clipboardData.getData('text'))
                      if (!text) return
                      event.preventDefault()
                      onPasteAt(index, text)
                    }}
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
              {references && <SpreadCell rate={rate} reference={reference} />}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
