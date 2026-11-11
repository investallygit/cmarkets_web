import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useBondAnalytics, useBondLabels, ytwDiffers } from '@/entities/bond'
import type { BondAnalyticsDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { bondCalculatorPath } from '@/shared/routes/paths'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const DASH = '—'

/** "Annual", "Semi-annual"... */
const FREQUENCIES: Record<number, 'annual' | 'semiAnnual' | 'quarterly' | 'monthly'> = {
  1: 'annual',
  2: 'semiAnnual',
  4: 'quarterly',
  12: 'monthly',
}

interface BondAnalyticsPanelProps {
  /** The bond selected in the results; none before the first run. */
  bondId: string | null
}

/**
 * Screen 17, the profile of the selected bond in its four blocks: identification and issuer;
 * pricing, yield and spreads; risk and ratings; cash flow and structure. "Open in BP" leads to
 * the pricing (the bond calculator until BP, ROADMAP step 30). API GET /bonds/{id}/analytics.
 */
export function BondAnalyticsPanel({ bondId }: BondAnalyticsPanelProps) {
  const { t } = useTranslation()
  const analytics = useBondAnalytics(bondId)
  const identification = analytics.data?.identification
  return (
    <Panel
      title={
        identification
          ? `${identification.code}${identification.isin ? ` · ${identification.isin}` : ''}`
          : t('bondScreener.profile')
      }
      code="BS"
      options={
        bondId && (
          <Link
            to={bondCalculatorPath(bondId)}
            className="panel-no-drag uppercase hover:text-primary"
          >
            {t('bondScreener.openInBp')}
          </Link>
        )
      }
      bodyClassName="overflow-y-auto"
    >
      {bondId === null ? (
        <p className="p-3 font-sans text-data text-secondary">{t('bondScreener.pickBond')}</p>
      ) : (
        <QueryView query={analytics}>{(data) => <Blocks data={data} />}</QueryView>
      )}
    </Panel>
  )
}

function Blocks({ data }: { data: BondAnalyticsDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const labels = useBondLabels()
  const { identification: a, pricing: b, risk: c, structure: d } = data
  const num = (value: number | null, decimals = 2) =>
    value === null ? DASH : format.number(value, decimals)
  const pct = (value: number | null) => (value === null ? DASH : format.percent(value, 2, false))
  const bp = (value: number | null) =>
    value === null ? DASH : t('bondScreener.bp', { value: labels.spread(value) })
  const ratingOf = (agency: 'sp' | 'moodys' | 'fitch') =>
    c.ratings.find((rating) => rating.agency === agency)?.rating ?? t('bondScreener.notRated')
  const differs = ytwDiffers(b)
  const sector = a.sector
    ? `${t(`bondScreener.categories.${a.issuerCategory}`)}, ${t(`bondScreener.sectors.${a.sector}`).toLowerCase()}`
    : t(`bondScreener.categories.${a.issuerCategory}`)
  const coupon =
    d.couponType === 'float' && d.floatIndex
      ? t('bondScreener.floating', {
          rate: format.percent(d.couponPct, 2, false),
          index: d.floatIndex,
          margin: format.percent(d.floatMarginPct ?? 0, 2, true),
        })
      : `${format.percent(d.couponPct, 2, false)} · ${t(`bondScreener.couponTypes.${d.couponType}`).toLowerCase()}`
  const frequency = FREQUENCIES[d.frequency]
  const nextCall = d.nextCall
    ? t('bondScreener.callAt', {
        date: format.isoDate(d.nextCall.date),
        price: format.number(d.nextCall.price, 2),
      })
    : t('bondScreener.noCall')

  return (
    <div className="grid gap-x-6 gap-y-4 p-3 md:grid-cols-2">
      <Block title={t('bondScreener.blocks.identification')}>
        <Line label={t('bondScreener.lines.isinName')} value={`${a.isin ?? DASH} · ${a.name}`} />
        <Line label={t('bondScreener.lines.issuerSector')} value={`${a.issuer} · ${sector}`} />
        <Line
          label={t('bondScreener.lines.countryCurrency')}
          value={`${format.country(a.country)} · ${a.currency}`}
        />
        <Line
          label={t('bondScreener.lines.seniority')}
          value={t(`bondScreener.seniorities.${a.seniority}`)}
        />
      </Block>
      <Block title={t('bondScreener.blocks.pricing')}>
        <Line
          label={t('bondScreener.lines.cleanDirty')}
          value={
            b.cleanPrice === null
              ? DASH
              : `${num(b.cleanPrice)}${b.priceSource === 'model' ? '*' : ''} · ${num(b.dirtyPrice)}`
          }
        />
        <Line label={t('bondScreener.lines.accrued')} value={num(b.accruedInterest)} />
        <Line
          label={t('bondScreener.lines.ytmYtw')}
          value={
            b.ytmPct === null
              ? DASH
              : `${pct(b.ytmPct)} · ${pct(b.ytwPct)}${
                  differs && b.ytwDate
                    ? ` ${t('bondScreener.toDate', { date: format.isoDate(b.ytwDate) })}`
                    : ''
                }`
          }
          highlight={differs}
        />
        <Line label={t('bondScreener.lines.currentYield')} value={pct(b.currentYieldPct)} />
        <Line
          label={t('bondScreener.lines.spreads')}
          value={`${bp(b.creditSpreadBp)} · ${bp(b.zSpreadBp)}`}
        />
        <Line
          label={t('bondScreener.lines.oas')}
          value={b.hasOptions ? t('bondScreener.oasLater') : bp(b.oasBp)}
        />
      </Block>
      <Block title={t('bondScreener.blocks.risk')}>
        <Line
          label={t('bondScreener.lines.ratings')}
          value={`${ratingOf('sp')} · ${ratingOf('moodys')} · ${ratingOf('fitch')}`}
        />
        <Line
          label={t('bondScreener.lines.bucket')}
          value={t(`bondScreener.buckets.${c.bucket}`)}
        />
        <Line
          label={t('bondScreener.lines.durations')}
          value={`${num(c.macaulayDuration)} · ${num(c.modifiedDuration)}`}
        />
        <Line
          label={t('bondScreener.lines.effective')}
          value={`${num(c.effectiveDuration)} · ${num(c.effectiveConvexity, 1)}`}
        />
        <Line
          label={t('bondScreener.lines.timeToMaturity')}
          value={
            c.timeToMaturity === null
              ? DASH
              : t('bondScreener.years', { value: format.number(c.timeToMaturity, 2) })
          }
        />
      </Block>
      <Block title={t('bondScreener.blocks.structure')}>
        <Line
          label={t('bondScreener.lines.coupon')}
          value={d.couponType === 'zero' ? t('bondScreener.couponTypes.zero') : coupon}
        />
        <Line
          label={t('bondScreener.lines.frequency')}
          value={frequency ? t(`bondScreener.frequencies.${frequency}`) : String(d.frequency)}
        />
        <Line
          label={t('bondScreener.lines.maturityCall')}
          value={`${format.isoDate(d.maturityDate)} · ${nextCall}`}
        />
        <Line
          label={t('bondScreener.lines.status')}
          value={t(`bondScreener.statuses.${d.status}`)}
        />
      </Block>
      {b.priceSource === 'model' && (
        <p className="font-sans text-title text-secondary md:col-span-2">
          {t('bondScreener.modelNote')}
        </p>
      )}
    </div>
  )
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <h3 className="mb-1 font-sans text-label font-semibold text-accent-amber uppercase">
        {title}
      </h3>
      <dl>{children}</dl>
    </section>
  )
}

function Line({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-1 py-0.5 even:bg-panel-header/40">
      <dt className="font-sans text-data text-secondary">{label}</dt>
      <dd
        className={clsx(
          'text-right font-mono text-data',
          highlight ? 'text-warning' : 'text-primary',
        )}
      >
        {value}
      </dd>
    </div>
  )
}
