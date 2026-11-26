import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  answerSide,
  formatFace,
  formatQuote,
  quoteDecimals,
  quotedValue,
  RESPONSE_TONES,
  useImproveRfqAnswer,
  useRfqPricing,
  useSendRfqAnswer,
  useServerNow,
} from '@/entities/rfq'
import { isApiError } from '@/shared/api'
import type { LicensedSvtDto, RfqBoardItemDto, RfqQuoteType } from '@/shared/api/contracts'
import { useFormat, useLocale } from '@/shared/i18n'
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { Select } from '@/shared/ui/form/Select'
import { toast } from '@/shared/ui/toast'
import { CriteriaAnswerForm } from './CriteriaAnswerForm'
import { WithdrawAnswerButton } from './WithdrawAnswerButton'

/** How long an answer stays firm, in minutes (1 to 40: the request's life). */
const VALIDITIES = [1, 2, 5, 10, 15, 30] as const

/** The other side of a quote: a rate's or a yield's price, a price's yield. */
const WORKED_OUT: Readonly<Record<RfqQuoteType, RfqQuoteType>> = {
  rate: 'price',
  yield: 'price',
  price: 'yield',
}

interface RfqAnswerFormProps {
  request: RfqBoardItemDto
  /** The trader's confirmed SVTs, of which one is chosen for the trade. */
  svts: LicensedSvtDto[]
  /** With a confirmed SVT: a trader without one reads the board only. */
  canAnswer: boolean
  minimumTradingAmount: number
}

/**
 * Screen 22's answer form under the board (spec section 9; API POST and PUT /rfq/{id}/responses):
 * a price or a rate in the request's quote type, the other worked out by CMarket (a BTA's price on
 * 360 days, an OTA's through the calculator of section 14.1), a quantity up to the face amount, the
 * responder's SVT and a validity; sent, then improved (the price kept or bettered) or withdrawn
 * until the requester confirms. A colleague's request is read, not answered. A request by criteria
 * gets its own form, a security of its eligible list offered (sixth version).
 */
export function RfqAnswerForm(props: RfqAnswerFormProps) {
  const { request } = props
  return request.mode === 'criteria' && request.criteria ? (
    <CriteriaAnswerForm {...props} request={{ ...request, criteria: request.criteria }} />
  ) : (
    <SecurityAnswerForm {...props} />
  )
}

function SecurityAnswerForm({
  request,
  svts,
  canAnswer,
  minimumTradingAmount,
}: RfqAnswerFormProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const locale = useLocale()
  const now = useServerNow()
  const send = useSendRfqAnswer()
  const improve = useImproveRfqAnswer()
  const mine = request.myResponse
  const inForce = mine !== null && (mine.status === 'sent' || mine.status === 'improved')
  const live = inForce && Date.parse(mine.validUntil) > now
  // An answer in force past its validity reads as expired before the job writes it.
  const shownStatus = mine && inForce && !live ? 'expired' : mine?.status
  const [value, setValue] = useState<number | null>(
    mine ? quotedValue(request.quoteType, mine) : null,
  )
  const [quantity, setQuantity] = useState<number | null>(mine?.quantity ?? null)
  const [svtId, setSvtId] = useState(mine?.svt.id ?? svts[0]?.id ?? '')
  // The answer's validity among the choices: the nearest above, 30 minutes at most.
  const [validity, setValidity] = useState(() => {
    const minutes = mine ? Math.round(mine.validitySeconds / 60) : 5
    return String(VALIDITIES.find((choice) => choice >= minutes) ?? 30)
  })
  const [submitted, setSubmitted] = useState(false)

  const typed = useDebouncedValue(value, 300)
  const pricing = useRfqPricing({
    securityId: request.security?.id ?? '',
    settlementDate: request.settlementDate,
    ...(typed !== null && typed > 0 ? { quoteType: request.quoteType, value: typed } : {}),
  })
  const workedOut =
    typed !== null && pricing.data?.quote
      ? quotedValue(WORKED_OUT[request.quoteType], pricing.data.quote)
      : null
  const reference = pricing.data?.reference

  const ownSide =
    answerSide(request.side) === 'buy' ? t('rfqTrading.answer.bid') : t('rfqTrading.answer.offer')
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
    if (blocked || value === null || value <= 0 || quantityInvalid || !svtId) return
    const input = { value, quantity: quantity!, svtId, validitySeconds: Number(validity) * 60 }
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

  const quoted = request.quoteType
  const label = (type: RfqQuoteType, withSide: boolean) =>
    withSide ? t(`rfqTrading.answer.${type}`, { side: ownSide }) : t(`rfqTrading.quoteType.${type}`)

  return (
    <form
      className="flex flex-col gap-2 border-t p-2"
      onSubmit={submit}
      noValidate
      aria-label={t('rfqTrading.answer.formLabel', { number: request.number })}
    >
      <h3 className="font-sans text-label font-semibold tracking-title text-accent-amber uppercase">
        {t('rfqTrading.answer.title', {
          number: request.number,
          side: t(
            request.side === 'buy'
              ? 'rfqTrading.answer.requesterBuys'
              : 'rfqTrading.answer.requesterSells',
          ),
          face: formatFace(request.faceAmount, locale),
          security: request.security?.code ?? '',
        })}
      </h3>
      {mine && (
        <p className="flex flex-wrap items-center gap-2 font-sans text-data text-secondary">
          <Badge tone={RESPONSE_TONES[shownStatus ?? mine.status]}>
            {t(`rfqTrading.responseStatus.${shownStatus ?? mine.status}`)}
          </Badge>
          <span>
            {t('rfqTrading.answer.mine', {
              value: formatQuote(quotedValue(quoted, mine), locale),
              quantity: formatFace(mine.quantity, locale),
              time: format.time(mine.validUntil, true),
            })}
          </span>
        </p>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[repeat(5,minmax(0,1fr))]">
        <Field label={label(quoted, true)} error={valueError}>
          <NumberInput
            value={value}
            onChange={setValue}
            decimals={quoteDecimals(value)}
            disabled={blocked}
            suffix={quoted === 'price' ? undefined : '%'}
          />
        </Field>
        <Field label={label(WORKED_OUT[quoted], false)} hint={t('rfqTrading.answer.workedOut')}>
          <NumberInput
            value={workedOut}
            onChange={() => undefined}
            decimals={4}
            readOnly
            disabled
            suffix={WORKED_OUT[quoted] === 'price' ? undefined : '%'}
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
      <p className="font-sans text-label text-secondary">
        {reference &&
          `${t('rfqTrading.answer.reference', { value: quoted === 'price' ? formatQuote(reference.price, locale) : `${format.number(reference.ratePct, 2)}%` })} · `}
        {t(`rfqTrading.answer.convention.${quoted}`)}
      </p>
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
