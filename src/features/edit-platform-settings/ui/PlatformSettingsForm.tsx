import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSavePlatformSettings } from '@/entities/platform-settings'
import { isApiError } from '@/shared/api'
import {
  CLIENT_ACCOUNT_TYPES,
  type ClientAccountType,
  type PlatformSettingsDto,
  type QuotaDto,
} from '@/shared/api/contracts'
import { CEMAC_COUNTRIES } from '@/shared/config/countries'
import { useFormat } from '@/shared/i18n'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { SegmentedControl } from '@/shared/ui/form/SegmentedControl'
import { Select } from '@/shared/ui/form/Select'
import { toast } from '@/shared/ui/toast'
import { Section } from './Section'

const MAX_QUOTA = 10_000

/** A point of a curve is stale after 1 day at least, ten years at most (CMarket.Api's PlatformSettings). */
const MAX_STALE_DAYS = 3_650

type Quotas = Record<ClientAccountType, QuotaDto>

const clientQuotas = (settings: PlatformSettingsDto): Quotas =>
  Object.fromEntries(
    CLIENT_ACCOUNT_TYPES.map((type) => [type, { ...settings.quotas[type] }]),
  ) as Quotas

/**
 * The Admin's settings (spec sections 12 to 14): the quotas of each client type, the price range,
 * CMarket's commission and the moderation mode of research, the risk-free rate of the Sharpe
 * ratio, the curve the XAF bonds' spreads are read on (spec section 14.4) and the age of a stale
 * curve point (spec section 11). Saved together; each change is written to the audit log.
 */
export function PlatformSettingsForm({ settings }: { settings: PlatformSettingsDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const save = useSavePlatformSettings()
  const [quotas, setQuotas] = useState(() => clientQuotas(settings))
  const [minPrice, setMinPrice] = useState<number | null>(settings.minPrice)
  const [maxPrice, setMaxPrice] = useState<number | null>(settings.maxPrice)
  const [commissionPct, setCommissionPct] = useState<number | null>(settings.commissionPct)
  const [moderation, setModeration] = useState(settings.moderation)
  const [riskFreeRatePct, setRiskFreeRatePct] = useState<number | null>(settings.riskFreeRatePct)
  const [xafReferenceCurve, setXafReferenceCurve] = useState(settings.xafReferenceCurve)
  const [curveStaleDays, setCurveStaleDays] = useState<number | null>(settings.curveStaleDays)
  // The ETFs' currencies (spec section 14.5): EUR, USD, GBP.
  const [rates, setRates] = useState<{ currency: string; ratePct: number | null }[]>(
    settings.riskFreeRates,
  )
  const [submitted, setSubmitted] = useState(false)

  const local: Record<string, string | null> = {
    quotas: CLIENT_ACCOUNT_TYPES.some((type) =>
      [quotas[type].portfolios, quotas[type].alerts].some(
        (quota) => quota !== null && quota > MAX_QUOTA,
      ),
    )
      ? t('platformSettings.errors.quota', { max: format.number(MAX_QUOTA, 0) })
      : null,
    minPrice: minPrice === null || minPrice < 0 ? t('platformSettings.errors.minPrice') : null,
    maxPrice:
      maxPrice === null || maxPrice <= (minPrice ?? 0)
        ? t('platformSettings.errors.maxPrice')
        : null,
    commissionPct:
      commissionPct === null || commissionPct < 0 || commissionPct > 50
        ? t('platformSettings.errors.commission')
        : null,
    riskFreeRatePct:
      riskFreeRatePct === null || riskFreeRatePct < 0 || riskFreeRatePct > 30
        ? t('platformSettings.errors.riskFreeRate')
        : null,
    riskFreeRates: rates.some(
      (rate) => rate.ratePct === null || rate.ratePct < 0 || rate.ratePct > 30,
    )
      ? t('platformSettings.errors.riskFreeRate')
      : null,
    curveStaleDays:
      curveStaleDays === null || curveStaleDays < 1 || curveStaleDays > MAX_STALE_DAYS
        ? t('platformSettings.errors.curveStaleDays')
        : null,
  }
  const server = isApiError(save.error, 400) ? (save.error.problem.errors ?? {}) : {}
  // A rate's error comes under riskFreeRates[0].ratePct: the list's own field shows it.
  const serverError = (field: string) =>
    server[field]?.[0] ??
    Object.entries(server).find(([key]) => key.startsWith(`${field}[`))?.[1]?.[0]
  const error = (field: string) => (submitted && local[field]) || serverError(field)

  const update = {
    quotas: { ...settings.quotas, ...quotas },
    minPrice: minPrice ?? 0,
    maxPrice: maxPrice ?? 0,
    commissionPct: commissionPct ?? 0,
    moderation,
    riskFreeRatePct: riskFreeRatePct ?? 0,
    riskFreeRates: rates.map((rate) => ({ currency: rate.currency, ratePct: rate.ratePct ?? 0 })),
    xafReferenceCurve,
    curveStaleDays: curveStaleDays ?? 0,
  }
  const changed =
    JSON.stringify(update) !==
    JSON.stringify({
      quotas: settings.quotas,
      minPrice: settings.minPrice,
      maxPrice: settings.maxPrice,
      commissionPct: settings.commissionPct,
      moderation: settings.moderation,
      riskFreeRatePct: settings.riskFreeRatePct,
      riskFreeRates: settings.riskFreeRates,
      xafReferenceCurve: settings.xafReferenceCurve,
      curveStaleDays: settings.curveStaleDays,
    })

  const reset = () => {
    save.reset()
    setSubmitted(false)
    setQuotas(clientQuotas(settings))
    setMinPrice(settings.minPrice)
    setMaxPrice(settings.maxPrice)
    setCommissionPct(settings.commissionPct)
    setModeration(settings.moderation)
    setRiskFreeRatePct(settings.riskFreeRatePct)
    setRates(settings.riskFreeRates)
    setXafReferenceCurve(settings.xafReferenceCurve)
    setCurveStaleDays(settings.curveStaleDays)
  }

  const quotaInput = (type: ClientAccountType, quota: keyof QuotaDto) => (
    <NumberInput
      value={quotas[type][quota]}
      onChange={(value) =>
        setQuotas((current) => ({ ...current, [type]: { ...current[type], [quota]: value } }))
      }
      decimals={0}
      placeholder={t('platformSettings.unlimited')}
      aria-label={`${t(`accountTypes.${type}`)}, ${t(`platformSettings.quotas.${quota}`)}`}
      highlight
      className="w-28"
    />
  )

  return (
    <form
      noValidate
      className="flex h-full flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (Object.values(local).some(Boolean) || !changed) return
        save.mutate(update, {
          onSuccess: () => {
            setSubmitted(false)
            toast.success(t('platformSettings.saved'))
          },
        })
      }}
    >
      <div className="min-h-0 flex-1 overflow-auto">
        <Section title={t('platformSettings.quotas.title')}>
          <table className="w-fit font-sans text-data">
            <thead>
              <tr className="text-secondary">
                <th scope="col" className="pr-6 text-left font-normal">
                  {t('settings.profile.accountType')}
                </th>
                <th scope="col" className="pr-3 text-left font-normal">
                  {t('platformSettings.quotas.portfolios')}
                </th>
                <th scope="col" className="text-left font-normal">
                  {t('platformSettings.quotas.alerts')}
                </th>
              </tr>
            </thead>
            <tbody>
              {CLIENT_ACCOUNT_TYPES.map((type) => (
                <tr key={type}>
                  <th scope="row" className="pr-6 text-left font-normal">
                    {t(`accountTypes.${type}`)}
                  </th>
                  <td className="py-0.5 pr-3">{quotaInput(type, 'portfolios')}</td>
                  <td className="py-0.5">{quotaInput(type, 'alerts')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="font-sans text-data text-secondary">{t('platformSettings.quotas.hint')}</p>
          {error('quotas') && (
            <p role="alert" className="font-sans text-data text-down">
              {error('quotas')}
            </p>
          )}
        </Section>

        <Section title={t('platformSettings.research')}>
          <div className="flex flex-wrap gap-3">
            <Field label={t('platformSettings.minPrice')} error={error('minPrice')}>
              <NumberInput
                value={minPrice}
                onChange={setMinPrice}
                decimals={0}
                suffix="XAF"
                highlight
                className="w-36"
              />
            </Field>
            <Field label={t('platformSettings.maxPrice')} error={error('maxPrice')}>
              <NumberInput
                value={maxPrice}
                onChange={setMaxPrice}
                decimals={0}
                suffix="XAF"
                highlight
                className="w-36"
              />
            </Field>
            <Field label={t('platformSettings.commission')} error={error('commissionPct')}>
              <NumberInput
                value={commissionPct}
                onChange={setCommissionPct}
                decimals={1}
                suffix="%"
                highlight
                className="w-24"
              />
            </Field>
          </div>
          <Field
            label={t('platformSettings.moderationMode')}
            hint={t(`platformSettings.moderationHints.${moderation}`)}
            group
          >
            <SegmentedControl
              value={moderation}
              options={(['before', 'after'] as const).map((value) => ({
                value,
                label: t(`platformSettings.moderation.${value}`),
              }))}
              onChange={setModeration}
              aria-label={t('platformSettings.moderationMode')}
            />
          </Field>
        </Section>

        <Section title={t('platformSettings.portfolios')}>
          <Field
            label={t('platformSettings.riskFreeRate')}
            hint={t('platformSettings.riskFreeRateHint')}
            error={error('riskFreeRatePct')}
          >
            <NumberInput
              value={riskFreeRatePct}
              onChange={setRiskFreeRatePct}
              decimals={2}
              suffix="%"
              highlight
              className="w-24"
            />
          </Field>
          <Field
            group
            label={t('platformSettings.riskFreeRates')}
            hint={t('platformSettings.riskFreeRatesHint')}
            error={error('riskFreeRates')}
          >
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {rates.map((rate) => (
                <label key={rate.currency} className="flex items-center gap-2 font-mono text-data">
                  <span>{rate.currency}</span>
                  <NumberInput
                    value={rate.ratePct}
                    onChange={(ratePct) =>
                      setRates((current) =>
                        current.map((entry) =>
                          entry.currency === rate.currency ? { ...entry, ratePct } : entry,
                        ),
                      )
                    }
                    decimals={2}
                    suffix="%"
                    aria-label={t('platformSettings.riskFreeRateOf', { currency: rate.currency })}
                    highlight
                    className="w-24"
                  />
                </label>
              ))}
            </div>
          </Field>
        </Section>

        <Section title={t('platformSettings.bonds')}>
          <Field
            label={t('platformSettings.xafReferenceCurve')}
            hint={t('platformSettings.xafReferenceCurveHint')}
            error={error('xafReferenceCurve')}
          >
            <Select
              value={xafReferenceCurve}
              options={CEMAC_COUNTRIES.map((code) => ({
                value: code,
                label: t('platformSettings.countryCurve', { country: format.country(code) }),
              }))}
              onChange={setXafReferenceCurve}
              highlight
              className="w-64"
            />
          </Field>
          <p className="font-sans text-data text-secondary">
            {t('platformSettings.otherCurrencies')}
          </p>
          <Field
            label={t('platformSettings.curveStaleDays')}
            hint={t('platformSettings.curveStaleDaysHint')}
            error={error('curveStaleDays')}
          >
            <NumberInput
              value={curveStaleDays}
              onChange={setCurveStaleDays}
              decimals={0}
              suffix={t('platformSettings.days')}
              highlight
              className="w-28"
            />
          </Field>
        </Section>
      </div>

      <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t px-3 py-2">
        <span className="mr-auto font-sans text-data text-secondary">
          {settings.updatedAt &&
            t('platformSettings.updated', {
              date: `${format.date(settings.updatedAt)} ${format.time(settings.updatedAt)}`,
              name: settings.updatedBy ?? '',
            })}
        </span>
        {save.error && !isApiError(save.error, 400) && (
          <span role="alert" className="font-sans text-data text-down">
            {save.error.message}
          </span>
        )}
        <Button type="button" disabled={!changed} onClick={reset}>
          {t('platformSettings.cancel')}
        </Button>
        <Button type="submit" variant="primary" disabled={!changed} busy={save.isPending}>
          {t('platformSettings.save')}
        </Button>
      </footer>
    </form>
  )
}
