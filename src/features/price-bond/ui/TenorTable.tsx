import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { TENOR_YEARS } from '@/entities/bond'
import { STANDARD_TENORS, type StandardTenor } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { rateOutOfRange } from '../model/discountForm'
import { cellsPasted } from '../model/rateEntry'
import { SpreadCell } from './SpreadCell'

interface TenorTableProps {
  tenors: Readonly<Record<StandardTenor, number | null>>
  /** The reference curve's rate at each tenor. */
  references: Readonly<Record<StandardTenor, number | null>>
  onEdit: (tenor: StandardTenor, rate: number | null) => void
  /** Several cells pasted into a tenor's rate: the tenors fill from it down. */
  onPasteAt: (index: number, text: string) => void
}

/**
 * Rates by standard tenor (3 and 6 months, 1, 2, 3, 5, 7 and 10 years), which CMarket interpolates
 * to the cash-flow dates; a tenor left empty is not used. Each beside the reference curve's rate
 * and the spread to it in bp (ROADMAP decision 46).
 */
export function TenorTable({ tenors, references, onEdit, onPasteAt }: TenorTableProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const header = 'h-row px-1 font-sans text-data font-normal leading-tight text-secondary'
  return (
    <table className="w-full table-fixed border-collapse font-mono text-data tabular-nums">
      <caption className="sr-only">{t('bondPricing.discount.byTenor')}</caption>
      <colgroup>
        <col className="w-[20%]" />
        <col className="w-[22%]" />
        <col className="w-[34%]" />
        <col className="w-[24%]" />
      </colgroup>
      <thead className="bg-panel-header">
        <tr>
          <th scope="col" className={clsx(header, 'text-left')}>
            {t('bondPricing.discount.columns.tenor')}
          </th>
          <th scope="col" className={clsx(header, 'text-right')}>
            {t('bondPricing.discount.columns.reference')}
          </th>
          <th scope="col" className={clsx(header, 'text-right')}>
            {t('bondPricing.discount.columns.rate')}
          </th>
          <th scope="col" className={clsx(header, 'text-right')}>
            {t('bondPricing.discount.columns.spread')}
          </th>
        </tr>
      </thead>
      <tbody>
        {STANDARD_TENORS.map((tenor, index) => {
          const label = t(`bondPricing.discount.tenors.${tenor}`)
          const reference = references[tenor]
          return (
            <tr key={tenor} className="h-8 focus-within:bg-selected">
              <th scope="row" className="px-1 text-left font-normal">
                {label}
              </th>
              <td className="px-1 text-right text-secondary">
                {reference === null ? '—' : format.number(reference, 3)}
              </td>
              <td className="py-0.5 pl-1.5">
                <NumberInput
                  value={tenors[tenor]}
                  onChange={(value) => onEdit(tenor, value)}
                  onPaste={(event) => {
                    const text = cellsPasted(event.clipboardData.getData('text'))
                    if (!text) return
                    event.preventDefault()
                    onPasteAt(index, text)
                  }}
                  decimals={3}
                  highlight
                  invalid={rateOutOfRange(tenors[tenor])}
                  aria-label={t('bondPricing.discount.rateAt', {
                    tenor: label,
                    years: format.number(TENOR_YEARS[tenor], 2),
                  })}
                />
              </td>
              <SpreadCell rate={tenors[tenor]} reference={reference} />
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
