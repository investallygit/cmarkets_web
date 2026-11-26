import { clsx } from 'clsx'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { countryCode3, type CriteriaDraft } from '@/entities/rfq'
import type { RfqInstrument } from '@/shared/api/contracts'
import { CEMAC_COUNTRIES } from '@/shared/config/countries'
import { useFormat } from '@/shared/i18n'
import { Field } from '@/shared/ui/form/Field'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { Select } from '@/shared/ui/form/Select'

type TypeChoice = 'both' | RfqInstrument

interface CriteriaFieldsProps {
  draft: CriteriaDraft
  onChange: (draft: CriteriaDraft) => void
  /** The server's word on a field, after a refused publication. */
  errors?: Partial<Record<'minYield' | 'maxMaturityYears' | 'countries' | 'securityTypes', string>>
}

/**
 * The criteria of a request by criteria (screen 22, sixth version; ROADMAP decision 49): the
 * minimum yield, the maximum remaining maturity, the issuing countries (none: the six) and the
 * security type, each optional, "an empty field imposes no constraint".
 */
export function CriteriaFields({ draft, onChange, errors }: CriteriaFieldsProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const countriesId = useId()
  const optional = <span className="text-label text-secondary">{t('rfqCriteria.optional')}</span>
  const type: TypeChoice = draft.securityTypes.length === 1 ? draft.securityTypes[0]! : 'both'

  const toggle = (code: string) =>
    onChange({
      ...draft,
      countries: draft.countries.includes(code)
        ? draft.countries.filter((country) => country !== code)
        : [...draft.countries, code],
    })

  return (
    <>
      <Field
        label={
          <span className="flex justify-between gap-2">
            {t('rfqCriteria.minYield')}
            {optional}
          </span>
        }
        error={errors?.minYield}
      >
        <NumberInput
          value={draft.minYield}
          onChange={(minYield) => onChange({ ...draft, minYield })}
          decimals={2}
          suffix="%"
        />
      </Field>
      <Field
        label={
          <span className="flex justify-between gap-2">
            {t('rfqCriteria.maxMaturity')}
            {optional}
          </span>
        }
        error={errors?.maxMaturityYears}
      >
        <NumberInput
          value={draft.maxMaturityYears}
          onChange={(maxMaturityYears) => onChange({ ...draft, maxMaturityYears })}
          decimals={2}
        />
      </Field>
      <div className="flex flex-col gap-1">
        <span
          id={countriesId}
          className="flex justify-between gap-2 font-sans text-data text-secondary"
        >
          {t('rfqCriteria.countries')}
          {optional}
        </span>
        <div role="group" aria-labelledby={countriesId} className="grid grid-cols-3 gap-1.5">
          {CEMAC_COUNTRIES.map((code) => {
            const pressed = draft.countries.includes(code)
            return (
              <button
                key={code}
                type="button"
                aria-pressed={pressed}
                title={format.country(code)}
                aria-label={`${countryCode3(code)} (${format.country(code)})`}
                onClick={() => toggle(code)}
                className={clsx(
                  'h-7 border font-mono text-data focus-visible:ring-1 focus-visible:ring-accent-amber focus-visible:outline-none',
                  pressed
                    ? 'border-accent-amber bg-selected font-semibold text-accent-amber'
                    : 'text-secondary hover:text-primary',
                )}
              >
                {countryCode3(code)}
              </button>
            )
          })}
        </div>
        {errors?.countries && (
          <p role="alert" className="font-sans text-label text-down">
            {errors.countries}
          </p>
        )}
      </div>
      <Field
        label={
          <span className="flex justify-between gap-2">
            {t('rfqCriteria.securityType')}
            {optional}
          </span>
        }
        error={errors?.securityTypes}
      >
        <Select<TypeChoice>
          value={type}
          onChange={(choice) =>
            onChange({ ...draft, securityTypes: choice === 'both' ? [] : [choice] })
          }
          options={(['both', 'BTA', 'OTA'] as const).map((choice) => ({
            value: choice,
            label: t(`rfqCriteria.securityTypes.${choice}`),
          }))}
        />
      </Field>
    </>
  )
}
