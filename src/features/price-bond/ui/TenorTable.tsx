import { useTranslation } from 'react-i18next'
import { TENOR_YEARS } from '@/entities/bond'
import { STANDARD_TENORS, type StandardTenor } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { NumberInput } from '@/shared/ui/form/NumberInput'

interface TenorTableProps {
  tenors: Readonly<Record<StandardTenor, number | null>>
  onEdit: (tenor: StandardTenor, rate: number | null) => void
}

/**
 * Rates by standard tenor (3 and 6 months, 1, 2, 3, 5, 7 and 10 years), which CMarket interpolates
 * to the cash-flow dates; a tenor left empty is not used.
 */
export function TenorTable({ tenors, onEdit }: TenorTableProps) {
  const { t } = useTranslation()
  const format = useFormat()
  return (
    <fieldset className="grid grid-cols-2 gap-x-2 gap-y-1">
      <legend className="sr-only">{t('bondPricing.discount.byTenor')}</legend>
      {STANDARD_TENORS.map((tenor) => (
        <label key={tenor} className="flex items-center gap-1.5">
          <span className="w-9 shrink-0 font-mono text-data text-secondary">
            {t(`bondPricing.discount.tenors.${tenor}`)}
          </span>
          <NumberInput
            value={tenors[tenor]}
            onChange={(value) => onEdit(tenor, value)}
            decimals={3}
            highlight
            aria-label={t('bondPricing.discount.rateAt', {
              tenor: t(`bondPricing.discount.tenors.${tenor}`),
              years: format.number(TENOR_YEARS[tenor], 2),
            })}
            className="min-w-0 flex-1"
          />
        </label>
      ))}
    </fieldset>
  )
}
