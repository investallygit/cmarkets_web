import { X } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { CEMAC_COUNTRIES } from '@/shared/config/countries'
import { useFormat } from '@/shared/i18n'
import { Field } from '@/shared/ui/form/Field'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { Select, type SelectOption } from '@/shared/ui/form/Select'
import {
  DEFAULT_MARKET,
  hasInvertedBounds,
  isActive,
  RANGE_FIELDS,
  type CriterionState,
  type RangeCriterionState,
  type RangeOperator,
} from '../model/criteria'

const OPERATORS: readonly RangeOperator[] = ['any', 'above', 'below', 'between']

interface CriterionFieldProps {
  criterion: CriterionState
  /** Sectors of the market's equities. */
  sectors: readonly string[]
  onChange: (criterion: CriterionState) => void
  /** Criteria added with "+ Add a criterion" can be removed. */
  onRemove?: () => void
}

/** One criterion of the screen 3 mockup: a drop-down, or a range in the figure's unit. */
export function CriterionField({ criterion, sectors, onChange, onRemove }: CriterionFieldProps) {
  const { t } = useTranslation()
  const label = t(`screener.fields.${criterion.field}`)
  return (
    <div className="relative">
      {'operator' in criterion ? (
        <RangeCriterion label={label} criterion={criterion} onChange={onChange} />
      ) : (
        <Field label={label}>
          <ListCriterion criterion={criterion} sectors={sectors} onChange={onChange} />
        </Field>
      )}
      {onRemove && (
        <button
          type="button"
          aria-label={t('screener.removeCriterion', { label })}
          onClick={onRemove}
          className="absolute top-0 right-0 text-secondary hover:text-primary"
        >
          <X aria-hidden className="size-3.5" />
        </button>
      )}
    </div>
  )
}

function ListCriterion({
  criterion,
  sectors,
  onChange,
}: {
  criterion: Exclude<CriterionState, RangeCriterionState>
  sectors: readonly string[]
  onChange: (criterion: CriterionState) => void
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const options: SelectOption<string>[] =
    criterion.field === 'market'
      ? [
          { value: '', label: t('screener.allMarkets') },
          { value: DEFAULT_MARKET, label: t('screener.markets.BVMAC') },
        ]
      : criterion.field === 'country'
        ? [
            { value: '', label: t('screener.allCountries', { count: CEMAC_COUNTRIES.length }) },
            ...CEMAC_COUNTRIES.map((code) => ({ value: code, label: format.country(code) })),
          ]
        : [
            { value: '', label: t('screener.allSectors') },
            // A saved screen may name a sector the market no longer has.
            ...[...new Set([...sectors, criterion.value].filter(Boolean))].map((sector) => ({
              value: sector,
              label: sector,
            })),
          ]
  return (
    <Select
      value={criterion.value}
      options={options}
      onChange={(value) => onChange({ ...criterion, value })}
      highlight={isActive(criterion)}
    />
  )
}

function RangeCriterion({
  label,
  criterion,
  onChange,
}: {
  label: string
  criterion: RangeCriterionState
  onChange: (criterion: CriterionState) => void
}) {
  const { t } = useTranslation()
  const labelId = useId()
  const { unit, decimals } = RANGE_FIELDS[criterion.field]
  const { operator, min, max } = criterion
  const active = isActive(criterion)
  const suffix =
    unit === 'multiple'
      ? 'x'
      : unit === 'percent'
        ? '%'
        : unit === 'billions'
          ? t('screener.billions')
          : undefined
  const bound = (side: 'min' | 'max') => (
    <NumberInput
      value={side === 'min' ? min : max}
      onChange={(value) => onChange({ ...criterion, [side]: value })}
      decimals={decimals}
      suffix={suffix}
      highlight={active}
      aria-label={t(side === 'min' ? 'screener.minOf' : 'screener.maxOf', { label })}
      className={operator === 'between' ? undefined : 'col-span-2'}
    />
  )

  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-col gap-1">
      <span id={labelId} className="font-sans text-data text-secondary">
        {label}
      </span>
      <div className="grid grid-cols-3 gap-1.5">
        <Select
          value={operator}
          options={OPERATORS.map((value) => ({
            value,
            label: t(`screener.operators.${value}`),
          }))}
          onChange={(next) => onChange({ ...criterion, operator: next })}
          highlight={active}
          aria-label={t('screener.operatorOf', { label })}
          className={operator === 'any' ? 'col-span-3' : undefined}
        />
        {(operator === 'above' || operator === 'between') && bound('min')}
        {(operator === 'below' || operator === 'between') && bound('max')}
      </div>
      {hasInvertedBounds(criterion) && (
        <p className="font-sans text-title text-down">{t('screener.invertedBounds')}</p>
      )}
    </div>
  )
}
