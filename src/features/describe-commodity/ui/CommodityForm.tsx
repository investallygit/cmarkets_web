import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDescribeCommodity } from '@/entities/commodity'
import { SecurityListField } from '@/entities/security'
import { isApiError } from '@/shared/api'
import type {
  CommodityProfileDto,
  CommodityRelatedDto,
  CommodityWriteDto,
} from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Button } from '@/shared/ui/form/Button'
import { Checkbox } from '@/shared/ui/form/Checkbox'
import { Field } from '@/shared/ui/form/Field'
import { Textarea } from '@/shared/ui/form/Textarea'
import { TextInput } from '@/shared/ui/form/TextInput'
import { toast } from '@/shared/ui/toast'
import {
  CEMAC_COUNTRIES,
  COMMODITY_TEXT_MAX_LENGTH,
  initialCommodityForm,
  MAX_RELATED_SECURITIES,
  namesValid,
  toggleCountry,
} from '../lib/commodityForm'

type NameField = 'nameEn' | 'nameFr' | 'shortNameEn' | 'shortNameFr'
type TextField = 'descriptionEn' | 'descriptionFr'

const NAMES: readonly NameField[] = ['nameEn', 'nameFr', 'shortNameEn', 'shortNameFr']
const TEXTS: readonly { field: TextField; lang: 'en' | 'fr' }[] = [
  { field: 'descriptionEn', lang: 'en' },
  { field: 'descriptionFr', lang: 'fr' },
]

interface CommodityFormProps {
  profile: CommodityProfileDto
  related: CommodityRelatedDto
}

/**
 * CORR on a commodity (spec section 10, PUT /data/commodities/{code}): its names in English and
 * French, the list's too, its texts (2,000 characters each, an empty one removed), the CEMAC
 * countries it weighs on and its related bonds and equities, ten at most; screen 21 shows them.
 */
export function CommodityForm({ profile, related }: CommodityFormProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const describe = useDescribeCommodity()
  const [form, setForm] = useState<CommodityWriteDto>(() => initialCommodityForm(profile, related))
  const [submitted, setSubmitted] = useState(false)
  const set = (change: Partial<CommodityWriteDto>) => {
    describe.reset()
    setForm((current) => ({ ...current, ...change }))
  }
  const tooLong = TEXTS.filter(({ field }) => form[field].trim().length > COMMODITY_TEXT_MAX_LENGTH)
  const invalid = !namesValid(form) || tooLong.length > 0
  const serverErrors = isApiError(describe.error, 400) ? (describe.error.problem.errors ?? {}) : {}
  const max = format.number(COMMODITY_TEXT_MAX_LENGTH, 0)

  return (
    <form
      noValidate
      className="grid gap-3 p-3"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (invalid) return
        describe.mutate(
          { code: profile.code, commodity: form },
          {
            onSuccess: () => {
              setSubmitted(false)
              toast.success(t('commodities.edit.saved', { code: profile.code }))
            },
            onError: (error) =>
              toast.error(t('commodities.edit.failed', { message: error.message })),
          },
        )
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {NAMES.map((field) => (
          <Field
            key={field}
            label={t(`commodities.edit.${field}`)}
            error={
              (submitted && form[field].trim().length === 0 && t('commodities.edit.required')) ||
              serverErrors[field]?.[0]
            }
          >
            <TextInput
              value={form[field]}
              onChange={(value) => set({ [field]: value })}
              maxLength={field.startsWith('short') ? 32 : 80}
              highlight
            />
          </Field>
        ))}
      </div>
      {TEXTS.map(({ field, lang }) => (
        <Field
          key={field}
          label={t(`commodities.edit.${field}`)}
          hint={t('corrections.description.count', {
            count: format.number(form[field].trim().length, 0),
            max,
          })}
          error={
            (submitted &&
              tooLong.some((entry) => entry.field === field) &&
              t('corrections.description.tooLong', { max })) ||
            serverErrors[field]?.[0]
          }
        >
          <Textarea
            lang={lang}
            value={form[field]}
            onChange={(value) => set({ [field]: value })}
            rows={5}
            highlight
          />
        </Field>
      ))}
      <Field label={t('commodities.edit.countries')} group>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {CEMAC_COUNTRIES.map((country) => (
            <Checkbox
              key={country}
              checked={form.countries.includes(country)}
              onChange={() => set({ countries: toggleCountry(form.countries, country) })}
              label={format.country(country)}
            />
          ))}
        </div>
      </Field>
      <Field
        label={t('commodities.edit.securities', { count: MAX_RELATED_SECURITIES })}
        group
        error={serverErrors.securityIds?.[0]}
      >
        <SecurityListField
          value={form.securityIds}
          onChange={(securityIds) => set({ securityIds })}
          addLabel={t('commodities.edit.addSecurity')}
          removeLabel={(code) => t('commodities.edit.removeSecurity', { code })}
          max={MAX_RELATED_SECURITIES}
        />
      </Field>
      <div>
        <Button type="submit" variant="primary" busy={describe.isPending}>
          {t('commodities.edit.save')}
        </Button>
      </div>
    </form>
  )
}
