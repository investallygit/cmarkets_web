import { clsx } from 'clsx'
import { LoaderCircle } from 'lucide-react'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useBond, useBondCalculation, useBonds } from '@/entities/bond'
import { useQuote } from '@/entities/quote'
import { isApiError } from '@/shared/api'
import type { BondCalculationDto, BondDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { toMarketDay } from '@/shared/lib/format'
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue'
import { useKeyboardScrolling } from '@/shared/lib/useKeyboardScrolling'
import { DateInput } from '@/shared/ui/form/DateInput'
import { Field } from '@/shared/ui/form/Field'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { Panel } from '@/shared/ui/Panel'
import { PanelSelect } from '@/shared/ui/PanelSelect'
import { PanelError, PanelLoading } from '@/shared/ui/StatusViews'
import { initialForm, shownFigures, toRequest, type CalculatorForm } from '../model/calculatorForm'

/**
 * Typing pauses this long before a calculation, so a price typed digit by digit sends one
 * request; with the server's answer, the other figure follows in under 300 ms (spec section 9).
 */
const RECALCULATE_DELAY_MS = 120

interface BondCalculatorPanelProps {
  bondId: string
  onBondChange: (bondId: string) => void
}

/**
 * Screen 4, bond calculator (YAS): settlement date, clean price or yield, face amount (amber
 * inputs); the other figure, accrued interest, durations and the spread over the issuer's curve
 * come from POST /bonds/{id}/calculate (spec section 14.1).
 */
export function BondCalculatorPanel({ bondId, onBondChange }: BondCalculatorPanelProps) {
  const { t } = useTranslation()
  const bonds = useBonds()
  const bond = useBond(bondId)
  const quote = useQuote(bondId)
  const options = bonds.data?.map((item) => ({ value: item.id, label: item.code })) ?? [
    { value: bondId, label: bond.data?.code ?? bondId },
  ]

  const body = () => {
    if (bond.isPending || quote.isPending) return <PanelLoading />
    if (bond.isError) return <PanelError error={bond.error} onRetry={() => void bond.refetch()} />
    // The calculator starts from the last price; it works without one.
    return <Calculator key={bondId} bond={bond.data} lastPrice={quote.data?.last ?? null} />
  }

  return (
    <Panel
      title={t('panels.bondCalculator')}
      code="YAS"
      options={
        <PanelSelect
          value={bondId}
          options={options}
          onChange={onBondChange}
          aria-label={t('calculator.bond')}
        />
      }
    >
      {body()}
    </Panel>
  )
}

function Calculator({ bond, lastPrice }: { bond: BondDto; lastPrice: number | null }) {
  const { t } = useTranslation()
  const format = useFormat()
  const [form, setForm] = useState(() => initialForm(toMarketDay(Date.now()), lastPrice))
  const request = useDebouncedValue(
    useMemo(() => toRequest(form), [form]),
    RECALCULATE_DELAY_MS,
  )
  const calculation = useBondCalculation(bond.id, request)
  const result = calculation.data
  const shown = shownFigures(form, result)
  const fieldErrors = isApiError(calculation.error, 400)
    ? (calculation.error.problem.errors ?? {})
    : {}
  const set = (patch: Partial<CalculatorForm>) => setForm((current) => ({ ...current, ...patch }))
  // The figures scroll in a short panel (a narrow window): the keyboard scrolls them too.
  const resultsRef = useRef<HTMLDivElement>(null)
  useKeyboardScrolling(resultsRef)

  const frequency =
    bond.frequency === 2
      ? t('keyData.frequencies.halfYearly')
      : bond.frequency === 4
        ? t('keyData.frequencies.quarterly')
        : t('keyData.frequencies.annual')
  const amortization =
    bond.amortization === 'bullet'
      ? t('calculator.bullet')
      : t('calculator.straight', {
          share: format.percent(100 / bond.schedule.length, 0, false),
        })

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-3 pt-2">
        <p className="truncate font-mono text-label font-semibold text-accent-amber">{bond.name}</p>
        <p className="truncate font-sans text-data text-secondary">
          {[amortization, t('calculator.coupon', { frequency }), bond.dayCount, bond.currency].join(
            ' · ',
          )}
        </p>
      </div>
      <div className="flex shrink-0 flex-col gap-1.5 px-3 py-2">
        <Field
          label={t('calculator.settlementDate')}
          inline
          error={
            form.settlementDate === null
              ? t('calculator.dateRequired')
              : fieldErrors.settlementDate?.at(0)
          }
        >
          <DateInput
            value={form.settlementDate}
            onChange={(settlementDate) => set({ settlementDate })}
            highlight
          />
        </Field>
        <Field label={t('calculator.cleanPrice')} inline error={fieldErrors.cleanPrice?.at(0)}>
          <NumberInput
            value={shown.cleanPrice}
            onChange={(cleanPrice) => set({ driver: 'price', cleanPrice })}
            decimals={2}
            highlight
          />
        </Field>
        <Field label={t('calculator.yield')} inline error={fieldErrors.yieldPct?.at(0)}>
          <NumberInput
            value={shown.yieldPct}
            onChange={(yieldPct) => set({ driver: 'yield', yieldPct })}
            decimals={2}
            suffix="%"
            highlight
          />
        </Field>
        <Field
          label={t('calculator.faceAmount', { currency: bond.currency })}
          inline
          error={
            form.faceAmount !== null && form.faceAmount <= 0
              ? t('calculator.positiveAmount')
              : fieldErrors.faceAmount?.at(0)
          }
        >
          <NumberInput
            value={form.faceAmount}
            onChange={(faceAmount) => set({ faceAmount })}
            decimals={0}
            highlight
          />
        </Field>
      </div>
      <div
        ref={resultsRef}
        aria-live="polite"
        aria-busy={calculation.isFetching}
        className={clsx(
          'min-h-0 flex-1 overflow-y-auto border-t outline-none focus-visible:ring-1 focus-visible:ring-accent-amber focus-visible:ring-inset',
          calculation.isPlaceholderData && 'opacity-60',
        )}
      >
        {result ? (
          <CalculationResults result={result} currency={bond.currency} />
        ) : calculation.isError && Object.keys(fieldErrors).length === 0 ? (
          <p role="alert" className="p-3 font-sans text-data text-down">
            {calculation.error.message}
          </p>
        ) : (
          calculation.isFetching && <PanelLoading />
        )}
      </div>
      <p className="flex shrink-0 items-center gap-1.5 border-t px-3 py-1.5 font-sans text-title text-secondary">
        {calculation.isFetching && (
          <LoaderCircle aria-hidden className="size-3 shrink-0 animate-spin" />
        )}
        {t('calculator.hint')}
      </p>
    </div>
  )
}

function CalculationResults({
  result,
  currency,
}: {
  result: BondCalculationDto
  currency: string
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const amount = (value: number) => `${currency} ${format.number(value, 0)}`
  const { curve } = result
  const rows: [label: string, value: ReactNode, title?: string][] = [
    [
      t('calculator.outstanding'),
      `${format.percent(result.outstandingPct, 2, false)} (${amount(result.outstandingFace)})`,
    ],
    [
      t('calculator.accruedInterest'),
      `${format.percent(result.accruedInterest, 2, false)} (${amount(result.accruedAmount)})`,
      t('calculator.accruedDays', { days: result.accruedDays, period: result.periodDays }),
    ],
    [t('calculator.dirtyPrice'), format.percent(result.dirtyPrice, 2, false)],
    [t('calculator.settlementAmount'), amount(result.settlementAmount)],
    [
      t('calculator.averageLife'),
      t('calculator.years', { value: format.number(result.averageLife, 2) }),
    ],
    [t('calculator.macaulay'), format.number(result.macaulayDuration, 2)],
    [t('calculator.modified'), format.number(result.modifiedDuration, 2)],
    [t('calculator.convexity'), format.number(result.convexity, 2)],
    [t('calculator.dv01'), amount(result.dv01)],
    [
      t('calculator.spread', { country: format.country(curve.country) }),
      curve.spreadBp === null || curve.yieldPct === null ? (
        '—'
      ) : (
        <>
          <span className="text-secondary">
            {t('calculator.curveYield', { value: format.percent(curve.yieldPct, 2, false) })}
          </span>{' '}
          {t('calculator.basisPoints', { value: format.signed(curve.spreadBp, 0) })}
        </>
      ),
      curve.spreadBp === null ? t('calculator.outsideCurve') : undefined,
    ],
  ]

  return (
    <dl>
      {rows.map(([label, value, title], index) => (
        <div
          key={label}
          title={title}
          className={clsx('flex h-row items-center gap-3 px-3', index % 2 === 1 && 'bg-row-alt')}
        >
          <dt className="truncate font-sans text-data text-secondary">{label}</dt>
          <dd className="ml-auto truncate font-mono text-data">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
