import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useBondPrice } from '@/entities/bond'
import type { BondPriceDto, BondPriceRequestDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { PricedView } from './PricedView'
import { modeKey } from '../lib/modes'

interface PricingResultsPanelProps {
  request: BondPriceRequestDto | null
  /** Of the amounts: the bond's. */
  currency: string
}

/**
 * Screen 16, results: A, the dirty price, the accrued interest and the clean price per 100 of the
 * principal outstanding; with one yield, B, the Macaulay and modified durations and the DV01 of
 * the face amount, C, the current yield, the settlement amount and the time to maturity (spec
 * sections 14.1, 14.4); from a curve or rates entered (fifth version), B, the equivalent yield,
 * the modified duration and the DV01 at it, C, the market price, the Z-spread to the rates and the
 * settlement amount.
 */
export function PricingResultsPanel({ request, currency }: PricingResultsPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const data = useBondPrice(request).data
  const settlementDate = data?.settlementDate

  return (
    <Panel
      title={t('bondPricing.results')}
      code="BP"
      options={
        settlementDate &&
        data && (
          <span>
            {t('bondPricing.asOfMode', {
              date: format.isoDate(settlementDate),
              mode: t(`bondPricing.modes.${modeKey(data.discount.mode)}`),
            })}
          </span>
        )
      }
      bodyClassName="@container overflow-y-auto"
    >
      <PricedView request={request}>
        {(data, stale) => <Figures data={data} currency={currency} stale={stale} />}
      </PricedView>
    </Panel>
  )
}

function Figures({
  data,
  currency,
  stale,
}: {
  data: BondPriceDto
  currency: string
  stale: boolean
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const { pricing, risk, supplemental } = data
  const price = (value: number) => format.percent(value, 4, false)
  const amount = (value: number) => `${format.number(value, 0)} ${currency}`
  const years = (value: number, decimals: number) =>
    t('bondPricing.years', { value: format.number(value, decimals) })
  const dv01 = (
    <Figure
      label={t('bondPricing.dv01', { amount: format.compact(data.faceAmount, 0), currency })}
      value={amount(risk.dv01)}
    />
  )
  const pricingBlock = (
    <Block title={t('bondPricing.pricing')}>
      <Figure label={t('bondPricing.dirtyPrice')} value={price(pricing.dirtyPrice)} main />
      <Figure label={t('bondPricing.accruedInterest')} value={price(pricing.accruedInterest)} />
      <Figure label={t('bondPricing.cleanPrice')} value={price(pricing.cleanPrice)} />
    </Block>
  )

  if (data.discount.mode !== 'yield') {
    const { marketCleanPrice, zSpreadBp } = data.comparison
    return (
      <div
        aria-live="polite"
        className={clsx('grid gap-3 p-2 @xl:grid-cols-3', stale && 'opacity-60')}
      >
        {pricingBlock}
        <Block title={t('bondPricing.yieldAndRisk')}>
          <Figure label={t('bondPricing.equivalentYield')} value={price(data.ytmPct)} />
          <Figure label={t('bondPricing.modified')} value={price(risk.modifiedDuration)} />
          {dv01}
        </Block>
        <Block title={t('bondPricing.comparison')}>
          <Figure
            label={t('bondPricing.marketPrice')}
            value={marketCleanPrice === null ? '—' : price(marketCleanPrice)}
          />
          <Figure
            label={t(`bondPricing.zSpread.${modeKey(data.discount.mode)}`)}
            value={
              zSpreadBp === null
                ? '—'
                : t('bondPricing.shift', { value: format.signed(zSpreadBp, 1) })
            }
            tone={zSpreadBp === null ? undefined : zSpreadBp < 0 ? 'text-down' : 'text-up'}
          />
          <Figure
            label={t('bondPricing.settlementAmount')}
            value={amount(supplemental.settlementAmount)}
          />
        </Block>
      </div>
    )
  }

  return (
    <div
      aria-live="polite"
      className={clsx('grid gap-3 p-2 @xl:grid-cols-3', stale && 'opacity-60')}
    >
      {pricingBlock}
      <Block title={t('bondPricing.risk')}>
        <Figure label={t('bondPricing.macaulay')} value={years(risk.macaulayDuration, 4)} />
        {/* As the mockup writes it: the change of price in percent for a point of yield. */}
        <Figure label={t('bondPricing.modified')} value={price(risk.modifiedDuration)} />
        {dv01}
      </Block>
      <Block title={t('bondPricing.supplemental')}>
        <Figure
          label={t('bondPricing.currentYield')}
          value={
            supplemental.currentYieldPct === null
              ? t('bondPricing.zeroCoupon')
              : price(supplemental.currentYieldPct)
          }
        />
        <Figure
          label={t('bondPricing.settlementAmount')}
          value={amount(supplemental.settlementAmount)}
        />
        <Figure
          label={t('bondPricing.timeToMaturity')}
          value={years(supplemental.timeToMaturity, 2)}
        />
      </Block>
    </div>
  )
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex min-w-0 flex-col gap-1.5">
      <h3 className="font-mono text-label font-semibold tracking-title text-accent-amber uppercase">
        {title}
      </h3>
      <dl className="flex flex-col gap-1.5">{children}</dl>
    </section>
  )
}

function Figure({
  label,
  value,
  main,
  tone,
}: {
  label: string
  value: string
  main?: boolean
  /** The Z-spread: below the rates in red, above in green. */
  tone?: string
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 border bg-panel-header px-2.5 py-2">
      <dt className="truncate font-sans text-data text-secondary">{label}</dt>
      <dd
        className={clsx(
          'truncate text-right font-mono tabular-nums',
          main ? 'text-figure font-semibold' : 'text-label font-semibold',
          tone,
        )}
      >
        {value}
      </dd>
    </div>
  )
}
