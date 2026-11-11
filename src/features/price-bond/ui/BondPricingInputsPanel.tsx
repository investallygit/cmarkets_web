import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useBond, useBondPrice, useBonds, useMarketYield } from '@/entities/bond'
import { isApiError } from '@/shared/api'
import {
  COUPON_FREQUENCIES,
  DAY_COUNTS,
  type BondDto,
  type DayCount,
  type MarketYieldDto,
} from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Button } from '@/shared/ui/form/Button'
import { DateInput } from '@/shared/ui/form/DateInput'
import { Field } from '@/shared/ui/form/Field'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { Select } from '@/shared/ui/form/Select'
import { Panel } from '@/shared/ui/Panel'
import { PanelError, PanelLoading } from '@/shared/ui/StatusViews'
import { useBondPricingStore } from '../model/bondPricingStore'
import {
  formOf,
  frequencyOf,
  hasChanged,
  nextRepayment,
  toRequest,
  type PricingForm,
  type RedemptionKind,
} from '../model/pricingForm'
import { RedemptionScheduleEditor } from './RedemptionScheduleEditor'

/** The value of the bond drop-down for characteristics entered by hand. */
const BY_HAND = ''

interface BondPricingInputsPanelProps {
  /** The bond of the address, or the first of the list; null while the list loads. */
  bondId: string | null
  onBondChange: (bondId: string) => void
}

/**
 * Screen 16, inputs: A, the characteristics of a bond of the master list (changing one makes it a
 * bond entered by hand); B, the yield the platform supplies (BS's last, else the country curve and
 * the bond's spread), which the user may change, and the face amount. Calculate sends POST
 * /bonds/price; the bond opens calculated.
 */
export function BondPricingInputsPanel({ bondId, onBondChange }: BondPricingInputsPanelProps) {
  const { t } = useTranslation()
  const bond = useBond(bondId ?? '', bondId !== null)
  const market = useMarketYield(bondId)
  const seededFrom = useBondPricingStore((state) => state.seededFrom)
  const form = useBondPricingStore((state) => state.form)
  const seed = useBondPricingStore((state) => state.seed)

  // Another bond fills the form again; the same one keeps what the user typed.
  const bondData = bond.data?.id === bondId ? bond.data : undefined
  useEffect(() => {
    if (bondId && bondId !== seededFrom && bondData && market.data?.bondId === bondId) {
      seed(bondId, formOf(bondData, market.data, useBondPricingStore.getState().form?.faceAmount))
    }
  }, [bondId, seededFrom, bondData, market.data, seed])

  const body = () => {
    if (bond.isError) return <PanelError error={bond.error} onRetry={() => void bond.refetch()} />
    if (market.isError) {
      return <PanelError error={market.error} onRetry={() => void market.refetch()} />
    }
    if (!form || !bondData || seededFrom !== bondId) return <PanelLoading />
    return (
      <Inputs
        form={form}
        bond={bondData}
        market={market.data}
        onBondChange={(id) =>
          // The bond of the address again: its characteristics as the list gives them.
          id === bondId && market.data
            ? seed(id, formOf(bondData, market.data, form.faceAmount))
            : onBondChange(id)
        }
      />
    )
  }

  return (
    <Panel title={t('bondPricing.inputs')} code="BP" bodyClassName="flex flex-col">
      {body()}
    </Panel>
  )
}

interface InputsProps {
  form: PricingForm
  /** The bond of the address: its country names the curve of the market yield. */
  bond: BondDto
  market: MarketYieldDto | undefined
  onBondChange: (bondId: string) => void
}

function Inputs({ form, bond, market, onBondChange }: InputsProps) {
  const { t } = useTranslation()
  const bonds = useBonds()
  const submitted = useBondPricingStore((state) => state.submitted)
  const { edit, editCharacteristics, calculate } = useBondPricingStore.getState()
  const price = useBondPrice(submitted)
  const serverErrors = isApiError(price.error, 400) ? (price.error.problem.errors ?? {}) : {}
  const serverError = (field: string) => serverErrors[field]?.at(0)
  const request = toRequest(form)
  const changed = hasChanged(form, submitted)

  const bondOptions = [
    { value: BY_HAND, label: t('bondPricing.byHand') },
    ...(bonds.data ?? [bond]).map((item) => ({
      value: item.id,
      label: t('bondPricing.ofTheList', { code: item.code }),
    })),
  ]
  const settlementLabel =
    market && form.settlementDate === market.settlementDate
      ? t('bondPricing.fields.settlementLag', { sessions: market.settlementSessions })
      : t('bondPricing.fields.settlementDate')

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        if (request) calculate()
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
        <Heading>{t('bondPricing.characteristics')}</Heading>
        <Field label={t('bondPricing.bond')} hint={t('bondPricing.orByHand')}>
          <Select
            value={form.bondId ?? BY_HAND}
            options={bondOptions}
            onChange={(value) =>
              value === BY_HAND ? editCharacteristics({}) : onBondChange(value)
            }
          />
        </Field>
        <Field
          label={t('bondPricing.fields.faceValue')}
          hint={t('bondPricing.fields.faceValueHint')}
          error={serverError('faceValue')}
        >
          <NumberInput
            value={form.faceValue}
            onChange={(faceValue) => editCharacteristics({ faceValue })}
            decimals={2}
            suffix="%"
          />
        </Field>
        <Field label={t('bondPricing.fields.couponRate')} error={serverError('couponRate')}>
          <NumberInput
            value={form.couponRate}
            onChange={(couponRate) => editCharacteristics({ couponRate })}
            decimals={2}
            suffix="%"
          />
        </Field>
        <Field label={t('bondPricing.fields.frequency')} error={serverError('frequency')}>
          <Select
            value={String(form.frequency)}
            options={COUPON_FREQUENCIES.map((frequency) => ({
              value: String(frequency),
              label: t(`bondPricing.frequencies.${frequency}`),
            }))}
            onChange={(value) => editCharacteristics({ frequency: frequencyOf(Number(value)) })}
          />
        </Field>
        <Field
          label={t('bondPricing.fields.maturityDate')}
          error={
            form.maturityDate === null ? t('bondPricing.dateRequired') : serverError('maturityDate')
          }
        >
          <DateInput
            value={form.maturityDate}
            onChange={(maturityDate) => editCharacteristics({ maturityDate })}
          />
        </Field>
        <Field
          label={settlementLabel}
          error={
            form.settlementDate === null
              ? t('bondPricing.dateRequired')
              : serverError('settlementDate')
          }
        >
          <DateInput
            value={form.settlementDate}
            onChange={(settlementDate) => edit({ settlementDate })}
          />
        </Field>
        <Field label={t('bondPricing.fields.dayCount')} error={serverError('dayCount')}>
          <Select
            value={form.dayCount}
            options={DAY_COUNTS.map((code) => ({ value: code, label: code }))}
            onChange={(dayCount: DayCount) => editCharacteristics({ dayCount })}
          />
        </Field>
        <Field label={t('bondPricing.fields.redemption')}>
          <Select
            value={form.redemption}
            options={(['bullet', 'amortizing'] as const).map((kind) => ({
              value: kind,
              label: t(`bondPricing.redemptions.${kind}`),
            }))}
            onChange={(redemption: RedemptionKind) =>
              editCharacteristics(
                redemption === 'amortizing' && form.schedule.length === 0
                  ? { redemption, schedule: [nextRepayment(form)] }
                  : { redemption },
              )
            }
          />
        </Field>
        {form.redemption === 'amortizing' && (
          <RedemptionScheduleEditor
            rows={form.schedule}
            onChange={(schedule) => editCharacteristics({ schedule })}
            onAdd={() => editCharacteristics({ schedule: [...form.schedule, nextRepayment(form)] })}
            error={serverError('redemptionSchedule')}
          />
        )}

        <Heading>{t('bondPricing.marketInput')}</Heading>
        <Field
          label={t('bondPricing.fields.ytm')}
          hint={<YieldSource form={form} bond={bond} market={market} />}
          error={form.ytm === null ? t('bondPricing.required') : serverError('ytm')}
        >
          <NumberInput
            value={form.ytm}
            onChange={(ytm) => edit({ ytm })}
            decimals={4}
            suffix="%"
            highlight
          />
        </Field>
        <Field
          label={t('bondPricing.fields.faceAmount', { currency: form.currency })}
          error={
            form.faceAmount !== null && form.faceAmount <= 0
              ? t('bondPricing.positiveAmount')
              : serverError('faceAmount')
          }
        >
          <NumberInput
            value={form.faceAmount}
            onChange={(faceAmount) => edit({ faceAmount })}
            decimals={0}
          />
        </Field>
      </div>
      <div className="flex shrink-0 flex-col gap-1.5 border-t p-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={request === null}
          busy={price.isFetching}
        >
          {t('bondPricing.calculate')}
        </Button>
        {request === null ? (
          <p className="font-sans text-title text-warning">{t('bondPricing.incomplete')}</p>
        ) : (
          changed && <p className="font-sans text-title text-warning">{t('bondPricing.changed')}</p>
        )}
      </div>
    </form>
  )
}

function Heading({ children }: { children: ReactNode }) {
  return (
    <h3 className="pt-1 font-mono text-label font-semibold tracking-title text-accent-amber uppercase">
      {children}
    </h3>
  )
}

/** Where the yield comes from (BS, a curve, none, the user), and the platform's to go back to. */
function YieldSource({
  form,
  bond,
  market,
}: {
  form: PricingForm
  bond: BondDto
  market: MarketYieldDto | undefined
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const edit = useBondPricingStore((state) => state.edit)
  if (!form.bondId) return t('bondPricing.source.byHand')
  if (!market || market.ytmPct === null) return t('bondPricing.source.none')
  const date = market.asOf ? format.isoDate(market.asOf) : '—'
  const country = format.country(bond.country)
  if (form.ytm !== null && Math.abs(form.ytm - market.ytmPct) < 1e-9) {
    if (market.source === 'curve') {
      return t('bondPricing.source.curve', {
        country,
        spread:
          market.spreadBp === null
            ? ''
            : t('bondPricing.shift', { value: format.signed(market.spreadBp, 0) }),
        date,
      })
    }
    return market.priceSource === 'model'
      ? t('bondPricing.source.bsModel', { date })
      : t('bondPricing.source.bs', { date })
  }
  const platform = market.ytmPct
  return (
    <>
      {t('bondPricing.source.yours', {
        value: format.percent(platform, 4, false),
        source:
          market.source === 'curve'
            ? t('bondPricing.source.curveShort', { country })
            : t('bondPricing.source.bsShort'),
        date,
      })}{' '}
      <button
        type="button"
        onClick={() => edit({ ytm: platform })}
        className="inline-flex min-h-6 items-center text-info hover:underline"
      >
        {t('bondPricing.source.useIt')}
      </button>
    </>
  )
}
