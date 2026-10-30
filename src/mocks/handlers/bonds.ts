import { delay, http, HttpResponse } from 'msw'
import type {
  BondCalculationDto,
  BondCalculationRequestDto,
  BondDto,
  BondSummaryDto,
  YieldCurveDto,
} from '@/shared/api/contracts'
import { CEMAC_COUNTRIES, isCemacCountry } from '@/shared/config/countries'
import { toMarketDay } from '@/shared/lib/format'
import { addDays, isWeekend } from '@/shared/lib/isoDate'
import { auctions } from '../db'
import { bondOf, bondSummaries } from '../fixtures/bonds'
import { yieldCurve } from '../fixtures/curves'
import { BondMathError, calculateBond, interpolateCurve } from '../lib/bondMath'
import { api, latency, problem } from '../lib/http'
import { businessDay } from '../lib/time'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

const isIsoDate = (value: unknown): value is string =>
  typeof value === 'string' && ISO_DATE.test(value) && !Number.isNaN(Date.parse(value))

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

/** The latest session on or before a date, and never after today. */
function sessionOnOrBefore(date: string | null): string {
  const latest = businessDay(0)
  if (!date || date >= latest) return latest
  let day = date
  while (isWeekend(day)) day = addDays(day, -1)
  return day
}

/** The fields of a calculation, or the errors by field, as FluentValidation reports them. */
function readCalculation(body: Partial<BondCalculationRequestDto>) {
  const errors: Record<string, string[]> = {}
  if (!isIsoDate(body.settlementDate)) errors.settlementDate = ['A date is required.']
  if (!isNumber(body.faceAmount) || body.faceAmount <= 0) {
    errors.faceAmount = ['A positive amount is required.']
  }
  const hasPrice = body.cleanPrice !== undefined
  if (hasPrice === (body.yieldPct !== undefined)) {
    errors.cleanPrice = ['Give the clean price or the yield, not both.']
  } else if (hasPrice && (!isNumber(body.cleanPrice) || body.cleanPrice <= 0)) {
    errors.cleanPrice = ['A positive price is required.']
  } else if (!hasPrice && (!isNumber(body.yieldPct) || Math.abs(body.yieldPct - 25) > 75)) {
    errors.yieldPct = ['Between -50% and +100%.']
  }
  return Object.keys(errors).length > 0
    ? { errors }
    : { input: body as BondCalculationRequestDto & { settlementDate: string } }
}

function calculationError(error: unknown) {
  if (!(error instanceof BondMathError)) throw error
  switch (error.code) {
    case 'beforeIssue':
      return problem(400, 'Invalid calculation', undefined, {
        settlementDate: ['Before the issue date.'],
      })
    case 'matured':
      return problem(400, 'Invalid calculation', undefined, {
        settlementDate: ['On or after the last payment.'],
      })
    case 'noYield':
      return problem(
        422,
        'No yield for this price',
        'No yield between -50% and +100% gives this clean price.',
      )
  }
}

const unknownBond = (id: unknown) => problem(404, 'Unknown bond', `No bond ${String(id)}.`)

export const bondHandlers = [
  http.get(api('/bonds'), async () => {
    await latency()
    return HttpResponse.json<BondSummaryDto[]>(bondSummaries())
  }),

  http.get(api('/bonds/:id'), async ({ params }) => {
    await latency()
    const bond = bondOf(String(params.id))
    if (!bond) return unknownBond(params.id)
    return HttpResponse.json<BondDto>(bond)
  }),

  // Kept fast: the screen recalculates as the user types (spec section 9, screen 4).
  http.post(api('/bonds/:id/calculate'), async ({ params, request }) => {
    await delay(20 + Math.random() * 40)
    const bond = bondOf(String(params.id))
    if (!bond) return unknownBond(params.id)
    const read = readCalculation((await request.json()) as Partial<BondCalculationRequestDto>)
    if ('errors' in read) return problem(400, 'Invalid calculation', undefined, read.errors)
    const { input } = read
    let result: ReturnType<typeof calculateBond>
    try {
      result = calculateBond(bond, input)
    } catch (error) {
      return calculationError(error)
    }
    const date = sessionOnOrBefore(input.settlementDate)
    const curve = isCemacCountry(bond.country)
      ? yieldCurve(bond.country, date, toMarketDay(Date.now()), auctions)
      : undefined
    const curveYield = curve ? interpolateCurve(curve.points, result.averageLife) : null
    return HttpResponse.json<BondCalculationDto>({
      bondId: bond.id,
      settlementDate: input.settlementDate,
      ...result,
      curve: {
        country: bond.country,
        date,
        yieldPct: curveYield,
        spreadBp: curveYield === null ? null : Math.round((result.yieldPct - curveYield) * 100),
      },
    })
  }),

  http.get(api('/yield-curves'), async ({ request }) => {
    await latency()
    const query = new URL(request.url).searchParams
    const requested = query.get('date')
    if (requested !== null && !isIsoDate(requested)) {
      return problem(400, 'Invalid date', 'date must be an ISO date such as 2026-10-28.')
    }
    const country = query.get('country')
    if (country !== null && !isCemacCountry(country)) {
      return problem(404, 'Unknown curve', `No curve for ${country}.`)
    }
    const date = sessionOnOrBefore(requested)
    const today = toMarketDay(Date.now())
    const countries = country === null ? CEMAC_COUNTRIES : [country]
    return HttpResponse.json<YieldCurveDto[]>(
      countries.map((code) => yieldCurve(code, date, today, auctions)),
    )
  }),
]
