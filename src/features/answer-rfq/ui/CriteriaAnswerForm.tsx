import { clsx } from 'clsx'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  countryCode3,
  criteriaChecks,
  formatFace,
  formatQuote,
  quoteDecimals,
  RESPONSE_TONES,
  useDescribeCriteria,
  useImproveRfqAnswer,
  useRfqPricing,
  useRfqRequestEligible,
  useSendRfqAnswer,
  useServerNow,
} from '@/entities/rfq'
import { isApiError } from '@/shared/api'
import type { LicensedSvtDto, RfqBoardItemDto, RfqCriteriaDto } from '@/shared/api/contracts'
import { useFormat, useLocale } from '@/shared/i18n'
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { Select } from '@/shared/ui/form/Select'
import { toast } from '@/shared/ui/toast'
import { WithdrawAnswerButton } from './WithdrawAnswerButton'

/** How long an answer stays firm, in minutes (1 to 40: the request's life). */
const VALIDITIES = [1, 2, 5, 10, 15, 30] as const

interface CriteriaAnswerFormProps {
  request: RfqBoardItemDto & { criteria: RfqCriteriaDto }
  svts: LicensedSvtDto[]
  canAnswer: boolean
  minimumTradingAmount: number
}

/**
 * The answer to a request by criteria (screen 22, sixth version; ROADMAP decision 49): a security
 * of its eligible list, quoted as its kind is (a BTA's rate, an OTA's clean price), the yield
 * CMarket works out at each keystroke checked against the criteria in green or red, a quantity up
 * to the amount, an SVT and a validity; sent, improved (the yield kept or bettered, the security
 * changeable) or withdrawn until the requester confirms.
 */
export function CriteriaAnswerForm({
  request,
  svts,
  canAnswer,
  minimumTradingAmount,
}: CriteriaAnswerFormProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const locale = useLocale()
  const describe = useDescribeCriteria()
  const now = useServerNow()
  const send = useSendRfqAnswer()
  const improve = useImproveRfqAnswer()
  const eligible = useRfqRequestEligible(request.id)
  const list = eligible.data ?? []
  const mine = request.myResponse
  const inForce = mine !== null && (mine.status === 'sent' || mine.status === 'improved')
  const live = inForce && Date.parse(mine.validUntil) > now
  const shownStatus = mine && inForce && !live ? 'expired' : mine?.status

  const [chosenId, setChosenId] = useState<string | null>(mine?.security?.id ?? null)
  const offered = list.find((item) => item.security.id === chosenId) ?? list[0] ?? null
  const bill = offered?.security.instrument === 'BTA'
  const [value, setValue] = useState<number | null>(
    mine ? (mine.security?.instrument === 'BTA' ? mine.ratePct : mine.price) : null,
  )
  const [quantity, setQuantity] = useState<number | null>(mine?.quantity ?? null)
  const [svtId, setSvtId] = useState(mine?.svt.id ?? svts[0]?.id ?? '')
  const [validity, setValidity] = useState(() => {
    const minutes = mine ? Math.round(mine.validitySeconds / 60) : 2
    return String(VALIDITIES.find((choice) => choice >= minutes) ?? 30)
  })
  const [submitted, setSubmitted] = useState(false)

  const typed = useDebouncedValue(value, 300)
  const pricing = useRfqPricing(
    offered
      ? {
          securityId: offered.security.id,
          settlementDate: request.settlementDate,
          ...(typed !== null && typed > 0
            ? { quoteType: bill ? 'rate' : 'price', value: typed }
            : {}),
        }
      : null,
  )
  const yieldPct = typed !== null && pricing.data?.quote ? pricing.data.yieldPct : null
  const checks = offered ? criteriaChecks(request.criteria, offered, yieldPct) : null

  const open = Date.parse(request.closesAt) > now
  const confirmable = Date.parse(request.expiresAt) > now
  const blocked = !canAnswer || request.ownOrganization || (live ? !confirmable : !open)
  const least = Math.min(minimumTradingAmount, request.faceAmount)
  const quantityInvalid =
    quantity === null ||
    quantity < least ||
    quantity > request.faceAmount ||
    !Number.isInteger(quantity)
  const pending = send.isPending || improve.isPending
  const error = send.error ?? improve.error
  const serverErrors = isApiError(error, 400) ? error.problem.errors : undefined
  const valueError =
    (submitted && (value === null || value <= 0)
      ? t('rfqTrading.answer.errors.value')
      : undefined) ?? serverErrors?.value?.[0]
  const securityError =
    (submitted && !offered ? t('rfqCriteria.answer.errors.security') : undefined) ??
    serverErrors?.securityId?.[0]
  const quantityError =
    (submitted && quantityInvalid
      ? t('rfqTrading.answer.errors.quantity', {
          minimum: format.number(least, 0),
          face: format.number(request.faceAmount, 0),
        })
      : undefined) ?? serverErrors?.quantity?.[0]
  const otherError = error && !isApiError(error, 400) ? error.message : undefined

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (blocked || !offered || value === null || value <= 0 || quantityInvalid || !svtId) return
    const input = {
      securityId: offered.security.id,
      value,
      quantity: quantity!,
      svtId,
      validitySeconds: Number(validity) * 60,
    }
    const done = (key: 'sent' | 'improved') => () => {
      toast.success(t(`rfqTrading.answer.${key}`, { number: request.number }))
      setSubmitted(false)
    }
    if (live && mine)
      improve.mutate(
        { id: request.id, responseId: mine.id, input },
        { onSuccess: done('improved') },
      )
    else send.mutate({ id: request.id, input }, { onSuccess: done('sent') })
  }

  const check = (ok: boolean | null, text: string) =>
    ok === null ? null : (
      <li key={text} className={ok ? 'text-up' : 'text-down'}>
        {ok ? '✓ ' : '✗ '}
        {text}
      </li>
    )
  const criteria = request.criteria

  return (
    <form
      className="flex flex-col gap-2 border-t p-2"
      onSubmit={submit}
      noValidate
      aria-label={t('rfqTrading.answer.formLabel', { number: request.number })}
    >
      <h3 className="font-sans text-label font-semibold tracking-title text-accent-amber uppercase">
        {t('rfqCriteria.answer.title', {
          number: request.number,
          criteria: describe(criteria).long,
        })}
      </h3>
      {mine && (
        <p className="flex flex-wrap items-center gap-2 font-sans text-data text-secondary">
          <Badge tone={RESPONSE_TONES[shownStatus ?? mine.status]}>
            {t(`rfqTrading.responseStatus.${shownStatus ?? mine.status}`)}
          </Badge>
          <span>
            {`${mine.security?.code ?? ''} · `}
            {t('rfqTrading.answer.mine', {
              value: formatQuote(
                mine.security?.instrument === 'BTA' ? mine.ratePct : mine.price,
                locale,
              ),
              quantity: formatFace(mine.quantity, locale),
              time: format.time(mine.validUntil, true),
            })}
          </span>
        </p>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[repeat(5,minmax(0,1fr))]">
        <Field label={t('rfqCriteria.answer.security')} error={securityError}>
          <Select
            value={offered?.security.id ?? ''}
            onChange={setChosenId}
            disabled={blocked || list.length === 0}
            options={list.map((item) => ({ value: item.security.id, label: item.security.code }))}
          />
        </Field>
        <Field
          label={bill ? t('rfqCriteria.answer.rate') : t('rfqCriteria.answer.price')}
          error={valueError}
        >
          <NumberInput
            value={value}
            onChange={setValue}
            decimals={quoteDecimals(value)}
            disabled={blocked}
            suffix={bill ? '%' : undefined}
          />
        </Field>
        <Field
          label={t('rfqTrading.answer.quantity', { face: formatFace(request.faceAmount, locale) })}
          error={quantityError}
        >
          <NumberInput value={quantity} onChange={setQuantity} decimals={0} disabled={blocked} />
        </Field>
        <Field label={t('rfqTrading.answer.svt')} error={serverErrors?.svtId?.[0]}>
          <Select
            value={svtId}
            onChange={setSvtId}
            disabled={blocked || svts.length === 0}
            options={
              svts.length > 0
                ? svts.map((svt) => ({
                    value: svt.id,
                    label: t('rfq.mySvts.svtName', { name: svt.name }),
                  }))
                : [{ value: '', label: t('rfqTrading.newRequest.noSvtOption') }]
            }
          />
        </Field>
        <Field label={t('rfqTrading.answer.validity')}>
          <Select
            value={validity}
            onChange={setValidity}
            disabled={blocked}
            options={VALIDITIES.map((minutes) => ({
              value: String(minutes),
              label: t('rfqTrading.answer.validityMinutes', { count: minutes }),
            }))}
          />
        </Field>
      </div>
      {offered && checks && (
        <ul
          aria-label={t('rfqCriteria.answer.checks.label')}
          aria-live="polite"
          className={clsx('flex flex-wrap gap-x-6 gap-y-1 font-sans text-data')}
        >
          {criteria.minYield !== null && yieldPct !== null
            ? check(
                checks.yield,
                t(
                  checks.yield
                    ? 'rfqCriteria.answer.checks.yieldOk'
                    : 'rfqCriteria.answer.checks.yieldLow',
                  {
                    value: format.number(yieldPct, 2),
                    min: format.number(criteria.minYield, 2),
                  },
                ),
              )
            : yieldPct !== null && (
                <li className="text-info">
                  {t('rfqCriteria.answer.yieldOnly', { value: format.number(yieldPct, 2) })}
                </li>
              )}
          {criteria.maxMaturityYears !== null &&
            check(
              checks.maturity,
              t(
                checks.maturity
                  ? 'rfqCriteria.answer.checks.maturityOk'
                  : 'rfqCriteria.answer.checks.maturityLong',
                {
                  value: format.number(offered.remainingYears, 2),
                  max: format.number(criteria.maxMaturityYears, 2),
                },
              ),
            )}
          {criteria.countries.length > 0 &&
            check(
              checks.country,
              t(
                checks.country
                  ? 'rfqCriteria.answer.checks.countryOk'
                  : 'rfqCriteria.answer.checks.countryRefused',
                {
                  country: `${format.country(offered.security.country)} (${countryCode3(offered.security.country)})`,
                },
              ),
            )}
        </ul>
      )}
      {otherError && (
        <p role="alert" className="font-sans text-data text-down">
          {otherError}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" variant="primary" busy={pending} disabled={blocked}>
          {live ? t('rfqTrading.answer.improve') : t('rfqTrading.answer.send')}
        </Button>
        {live && mine && confirmable && (
          <WithdrawAnswerButton
            requestId={request.id}
            responseId={mine.id}
            number={request.number}
          />
        )}
        <span className="font-sans text-label text-secondary">{t('rfqCriteria.answer.note')}</span>
      </div>
      <p className="font-sans text-label text-secondary">
        {request.ownOrganization
          ? t('rfqTrading.answer.ownOrganization')
          : !canAnswer
            ? t('rfqTrading.board.readOnly')
            : !open && !live
              ? t('rfqTrading.answer.closed')
              : t('rfqTrading.answer.note')}
      </p>
    </form>
  )
}
