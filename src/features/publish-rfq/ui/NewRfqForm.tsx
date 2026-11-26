import { clsx } from 'clsx'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  criteriaQuery,
  formatQuote,
  usePublishRfq,
  useRfqEligiblePreview,
  useRfqPricing,
  type CriteriaDraft,
  type RfqPricingQuery,
} from '@/entities/rfq'
import { isApiError } from '@/shared/api'
import type {
  RfqEligibleQuery,
  RfqMode,
  RfqQuoteType,
  RfqRequestDto,
  RfqSetupDto,
  RfqSide,
} from '@/shared/api/contracts'
import { useFormat, useLocale } from '@/shared/i18n'
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { SegmentedControl } from '@/shared/ui/form/SegmentedControl'
import { Select } from '@/shared/ui/form/Select'
import { toast } from '@/shared/ui/toast'
import { CriteriaFields } from './CriteriaFields'

/** "Request duration (1 to 30 minutes)". */
const DURATIONS = [1, 2, 3, 5, 10, 15, 20, 30] as const

interface NewRfqFormProps {
  setup: RfqSetupDto
  /** A security to start from: "Request a price (RFQ)" on BS or a bond's profile. */
  initialSecurityId?: string | null
  onPublished: (request: RfqRequestDto) => void
  /** By criteria, the preview's question as the criteria change (the page shows its list); null otherwise. */
  onCriteriaChange?: (query: RfqEligibleQuery | null) => void
}

const NO_CRITERIA: CriteriaDraft = {
  minYield: null,
  maxMaturityYears: null,
  countries: [],
  securityTypes: [],
}

/**
 * Screen 22's "New request" (spec section 9; API POST /rfq): a BTA or an OTA of the list, buy or
 * sell, the face amount, how the answers quote (a BTA in rate, an OTA in clean price or yield), the
 * agreed delivery-versus-payment date among the BEAC's business days, 1 to 30 minutes, one of the
 * trader's confirmed SVTs, anonymous or not; the CMarket curve's reference for the security at
 * that date. Without a confirmed SVT the trader reads the board only. By criteria (sixth version,
 * ROADMAP decision 49): a purchase of the amount alone, its criteria optional, the securities they
 * accept counted as they change; none, and the request is not published.
 */
export function NewRfqForm({
  setup,
  initialSecurityId,
  onPublished,
  onCriteriaChange,
}: NewRfqFormProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const locale = useLocale()
  const publish = usePublishRfq()
  const first =
    setup.securities.find((security) => security.id === initialSecurityId) ?? setup.securities[0]
  const [securityId, setSecurityId] = useState(first?.id ?? '')
  const [side, setSide] = useState<RfqSide>('buy')
  const [faceAmount, setFaceAmount] = useState<number | null>(null)
  const [quoteType, setQuoteType] = useState<RfqQuoteType>(first?.quoteTypes[0] ?? 'price')
  const [settlementDate, setSettlementDate] = useState(setup.settlementDates[0] ?? '')
  const [duration, setDuration] = useState('5')
  const [svtId, setSvtId] = useState(setup.svts[0]?.id ?? '')
  const [anonymous, setAnonymous] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [mode, setMode] = useState<RfqMode>('security')
  const [criteria, setCriteria] = useState<CriteriaDraft>(NO_CRITERIA)
  const byCriteria = mode === 'criteria'

  // By criteria, the securities the criteria accept now, asked again a moment after a change.
  const typedCriteria = useDebouncedValue(criteria, 300)
  const preview = useMemo(
    () => (byCriteria && settlementDate ? criteriaQuery(typedCriteria, settlementDate) : null),
    [byCriteria, settlementDate, typedCriteria],
  )
  const eligible = useRfqEligiblePreview(preview)
  const eligibleCount = eligible.data?.length ?? null
  useEffect(() => onCriteriaChange?.(preview), [onCriteriaChange, preview])

  const security = setup.securities.find((candidate) => candidate.id === securityId)
  const pricingQuery: RfqPricingQuery | null =
    securityId && settlementDate && mode === 'security' ? { securityId, settlementDate } : null
  const pricing = useRfqPricing(pricingQuery)
  const reference = pricing.data?.reference

  const minimum = setup.minimumTradingAmount
  const faceInvalid = faceAmount === null || faceAmount < minimum || !Number.isInteger(faceAmount)
  const serverErrors = isApiError(publish.error, 400) ? publish.error.problem.errors : undefined
  const faceError =
    (submitted && faceInvalid
      ? t('rfqTrading.newRequest.errors.faceAmount', { minimum: format.number(minimum, 0) })
      : undefined) ?? serverErrors?.faceAmount?.[0]
  const otherError =
    publish.error && !isApiError(publish.error, 400) ? publish.error.message : undefined

  const chooseSecurity = (id: string) => {
    setSecurityId(id)
    const next = setup.securities.find((candidate) => candidate.id === id)
    if (next && !next.quoteTypes.includes(quoteType)) setQuoteType(next.quoteTypes[0] ?? 'price')
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (faceInvalid || (!byCriteria && !security) || !svtId || !settlementDate) return
    if (byCriteria && eligibleCount === 0) return
    const common = {
      faceAmount: faceAmount!,
      settlementDate,
      durationSeconds: Number(duration) * 60,
      svtId,
      anonymous,
    }
    publish.mutate(
      byCriteria
        ? { mode: 'criteria', ...common, ...criteria }
        : { mode: 'security', ...common, securityId, side, quoteType },
      {
        onSuccess: (request) => {
          toast.success(
            t('rfqTrading.newRequest.published', { number: request.number, minutes: duration }),
          )
          setSubmitted(false)
          onPublished(request)
        },
      },
    )
  }

  if (!security)
    return (
      <p className="p-2 font-sans text-data text-secondary">
        {t('rfqTrading.newRequest.noSecurity')}
      </p>
    )

  return (
    <form
      className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto p-2"
      onSubmit={submit}
      noValidate
    >
      <Field label={t('rfqCriteria.requestType')} group>
        <SegmentedControl
          value={mode}
          onChange={setMode}
          options={[
            { value: 'security', label: t('rfqCriteria.types.security') },
            { value: 'criteria', label: t('rfqCriteria.types.criteria') },
          ]}
        />
      </Field>
      {!byCriteria && (
        <Field label={t('rfqTrading.newRequest.security')}>
          <Select
            value={securityId}
            onChange={chooseSecurity}
            options={setup.securities.map((candidate) => ({
              value: candidate.id,
              label: candidate.code,
            }))}
          />
        </Field>
      )}
      <Field
        label={t('rfqTrading.newRequest.side')}
        hint={byCriteria ? t('rfqCriteria.buyOnly') : undefined}
        group
      >
        <SegmentedControl
          value={byCriteria ? 'buy' : side}
          onChange={setSide}
          options={[
            { value: 'buy', label: t('rfqTrading.side.buy'), tone: 'up' },
            { value: 'sell', label: t('rfqTrading.side.sell'), tone: 'down', disabled: byCriteria },
          ]}
        />
      </Field>
      <Field
        label={byCriteria ? t('rfqCriteria.amount') : t('rfqTrading.newRequest.faceAmount')}
        error={faceError}
      >
        <NumberInput value={faceAmount} onChange={setFaceAmount} decimals={0} />
      </Field>
      {byCriteria ? (
        <CriteriaFields
          draft={criteria}
          onChange={setCriteria}
          errors={{
            minYield: serverErrors?.minYield?.[0],
            maxMaturityYears: serverErrors?.maxMaturityYears?.[0],
            countries: serverErrors?.countries?.[0],
            securityTypes: serverErrors?.securityTypes?.[0],
          }}
        />
      ) : (
        <Field label={t('rfqTrading.newRequest.quoteType')} error={serverErrors?.quoteType?.[0]}>
          <Select
            value={quoteType}
            onChange={setQuoteType}
            options={security.quoteTypes.map((type) => ({
              value: type,
              label: t(`rfqTrading.quoteType.${type}`),
            }))}
          />
        </Field>
      )}
      <Field
        label={t('rfqTrading.newRequest.settlementDate')}
        error={serverErrors?.settlementDate?.[0]}
      >
        <Select
          value={settlementDate}
          onChange={setSettlementDate}
          options={setup.settlementDates.map((date) => ({
            value: date,
            label: format.isoDate(date),
          }))}
        />
      </Field>
      <Field label={t('rfqTrading.newRequest.duration')}>
        <Select
          value={duration}
          onChange={setDuration}
          options={DURATIONS.map((minutes) => ({
            value: String(minutes),
            label: t('rfqTrading.newRequest.minutes', { count: minutes }),
          }))}
        />
      </Field>
      <Field label={t('rfqTrading.newRequest.svt')} error={serverErrors?.svtId?.[0]}>
        <Select
          value={svtId}
          onChange={setSvtId}
          disabled={!setup.canTrade}
          options={
            setup.canTrade
              ? setup.svts.map((svt) => ({
                  value: svt.id,
                  label: t('rfq.mySvts.svtName', { name: svt.name }),
                }))
              : [{ value: '', label: t('rfqTrading.newRequest.noSvtOption') }]
          }
        />
      </Field>
      <Field label={t('rfqTrading.newRequest.anonymous')} group>
        <SegmentedControl
          value={anonymous ? 'yes' : 'no'}
          onChange={(value) => setAnonymous(value === 'yes')}
          options={[
            { value: 'yes', label: t('rfqTrading.newRequest.yes') },
            { value: 'no', label: t('rfqTrading.newRequest.no') },
          ]}
        />
      </Field>
      {byCriteria ? (
        <>
          <p
            className={clsx('font-sans text-data', eligibleCount === 0 ? 'text-down' : 'text-info')}
            aria-live="polite"
          >
            {eligibleCount === null
              ? ' '
              : eligibleCount === 0
                ? t('rfqCriteria.noneEligible')
                : t('rfqCriteria.eligible', { count: eligibleCount })}
          </p>
          <p className="border px-2 py-1 font-sans text-label text-secondary">
            {t('rfqCriteria.emptyNote')}
          </p>
        </>
      ) : (
        <p className="flex flex-wrap justify-between gap-2 font-sans text-data">
          <span className="text-secondary">{t('rfqTrading.newRequest.reference')}</span>
          <span className="font-mono tabular-nums text-info">
            {reference
              ? `${formatQuote(reference.price, locale)} · ${format.number(reference.ratePct, 2)}%`
              : t('rfqTrading.newRequest.noReference')}
          </span>
        </p>
      )}
      <p className="font-sans text-label text-secondary">
        {setup.canTrade ? t('rfqTrading.newRequest.note') : t('rfqTrading.newRequest.noSvt')}
      </p>
      {otherError && (
        <p role="alert" className="font-sans text-data text-down">
          {otherError}
        </p>
      )}
      <Button
        type="submit"
        variant="primary"
        className="mt-auto w-full"
        busy={publish.isPending}
        disabled={!setup.canTrade || (byCriteria && eligibleCount === 0)}
      >
        {t('rfqTrading.newRequest.publish')}
      </Button>
    </form>
  )
}
