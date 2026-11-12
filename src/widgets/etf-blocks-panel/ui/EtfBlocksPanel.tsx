import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useEtf, useEtfLabels, useEtfPerformance } from '@/entities/etf'
import type { EtfDto, EtfPerformanceDto, EtfPeriod } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { securityPath } from '@/shared/routes/paths'
import { ChangeText } from '@/shared/ui/ChangeText'
import { CountryFlag } from '@/shared/ui/CountryFlag'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const DASH = '—'

interface EtfBlocksPanelProps {
  /** The ETF selected in the results; none before the first run. */
  etfId: string | null
  /** The screener's: "ETF PROFILE" opens the ETF's profile; its profile's has none. */
  profileLink?: boolean
  /** Which screen's code the title bar shows. */
  code?: string
}

/**
 * Screen 15, the profile of the selected ETF in its five blocks: identification; structure; size,
 * liquidity and pricing; costs and yield; performance and risk. APIs GET /etfs/{id} and
 * /etfs/{id}/performance.
 */
export function EtfBlocksPanel({ etfId, profileLink = true, code = 'ETFS' }: EtfBlocksPanelProps) {
  const { t } = useTranslation()
  const etf = useEtf(etfId)
  const identification = etf.data?.identification
  return (
    <Panel
      title={
        identification
          ? `${identification.name} · ${identification.code}`
          : t('etfScreener.profile')
      }
      code={code}
      options={
        profileLink &&
        etfId && (
          <Link to={securityPath(etfId)} className="panel-no-drag uppercase hover:text-primary">
            {t('etfScreener.openProfile')}
          </Link>
        )
      }
      bodyClassName="overflow-y-auto"
    >
      {etfId === null ? (
        <p className="p-3 font-sans text-data text-secondary">{t('etfScreener.pickEtf')}</p>
      ) : (
        <QueryView query={etf}>{(data) => <Blocks data={data} />}</QueryView>
      )}
    </Panel>
  )
}

function Blocks({ data }: { data: EtfDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const labels = useEtfLabels()
  const performance = useEtfPerformance(data.etfId)
  const { identification: a, structure: b, size: c, costs: d } = data
  const pct = (value: number | null, decimals = 2) =>
    value === null ? DASH : format.percent(value, decimals, false)
  const accumulating = b.distribution === 'accumulating'

  return (
    <div className="grid gap-x-6 gap-y-4 p-3 md:grid-cols-2 xl:grid-cols-3">
      <Block title={t('etfScreener.blocks.identification')}>
        <Line
          label={t('etfScreener.lines.tickerName')}
          value={
            <span className="inline-flex items-center gap-1.5">
              <CountryFlag
                code={a.listingCountry}
                label={t('etfScreener.listedIn', { country: format.country(a.listingCountry) })}
              />
              {`${a.code} · ${a.shortName}`}
            </span>
          }
        />
        <Line label={t('etfScreener.lines.assetClass')} value={labels.assetClass(a.assetClass)} />
        <Line label={t('etfScreener.lines.subCategory')} value={a.subCategory} />
        {a.sector && <Line label={t('etfScreener.lines.sector')} value={labels.sector(a.sector)} />}
        <Line
          label={t('etfScreener.lines.issuer')}
          value={a.brand ? `${a.issuer} (${a.brand})` : a.issuer}
        />
        <Line
          label={t('etfScreener.lines.listing')}
          value={`${labels.exchange(a.exchange)} · ${a.currency}`}
        />
      </Block>
      <Block title={t('etfScreener.blocks.structure')}>
        <Line
          label={t('etfScreener.lines.replication')}
          value={labels.replication(b.replication)}
        />
        <Line
          label={t('etfScreener.lines.dividends')}
          value={labels.distribution(b.distribution)}
        />
        <Line
          label={t('etfScreener.lines.status')}
          value={b.ucits ? t('etf.ucits') : t('etf.nonUcits')}
        />
        <Line
          label={t('etfScreener.lines.fundCurrency')}
          value={`${b.fundCurrency} · ${b.hedged ? t('etf.hedged') : t('etf.unhedged')}`}
        />
        <Line label={t('etfScreener.lines.domicile')} value={format.country(b.domicile)} />
      </Block>
      <Block title={t('etfScreener.blocks.size')}>
        <Line
          label={t('etfScreener.lines.aum')}
          value={c.aum === null ? DASH : labels.size(c.aum, a.currency)}
        />
        <Line
          label={t('etfScreener.lines.price')}
          value={c.price === null ? DASH : labels.price(c.price, a.currency)}
        />
        <Line
          label={t('etfScreener.lines.nav')}
          value={c.nav === null ? DASH : labels.price(c.nav, a.currency)}
        />
        <Line
          label={t('etfScreener.lines.premium')}
          value={
            c.premiumDiscountPct === null ? (
              DASH
            ) : (
              <ChangeText value={c.premiumDiscountPct} percent />
            )
          }
        />
        <Line
          label={t('etfScreener.lines.volume')}
          value={c.averageVolume === null ? DASH : labels.shares(c.averageVolume)}
        />
        <Line
          label={t('etfScreener.lines.spread')}
          value={
            c.averageSpreadPct === null
              ? DASH
              : t('etfScreener.spread', {
                  pct: pct(c.averageSpreadPct),
                  bp: format.number(c.averageSpreadPct * 100, 0),
                })
          }
        />
      </Block>
      <Block title={t('etfScreener.blocks.costs')}>
        <Line
          label={t('etfScreener.lines.ter')}
          value={t('etfScreener.perYear', { value: pct(d.terPct) })}
        />
        <Line
          label={t('etfScreener.lines.yield')}
          value={accumulating ? t('etfScreener.accumulatingYield') : pct(d.distributionYieldPct)}
        />
        <Line
          label={t('etfScreener.lines.frequency')}
          value={d.distributionFrequency ? labels.frequency(d.distributionFrequency) : DASH}
        />
      </Block>
      <div className="md:col-span-2">
        <QueryView query={performance}>{(figures) => <Performance figures={figures} />}</QueryView>
      </div>
    </div>
  )
}

function Performance({ figures }: { figures: EtfPerformanceDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const returnOf = (period: EtfPeriod): ReactNode => {
    const value = figures.returns.find((row) => row.period === period)?.etfPct ?? null
    return value === null ? DASH : <ChangeText value={value} percent decimals={1} />
  }
  const joined = (...parts: ReactNode[]) => (
    <span className="inline-flex items-center gap-1">
      {parts.map((part, index) => (
        <span key={index} className="inline-flex items-center gap-1">
          {index > 0 && (
            <span aria-hidden className="text-secondary">
              ·
            </span>
          )}
          {part}
        </span>
      ))}
    </span>
  )
  const pct = (value: number | null, decimals: number) =>
    value === null ? DASH : format.percent(value, decimals, false)
  const signed = (value: number | null, decimals: number) =>
    value === null ? DASH : format.percent(value, decimals)
  return (
    <Block title={t('etfScreener.blocks.performance')}>
      <Line
        label={t('etfScreener.lines.shortReturns')}
        value={joined(returnOf('1D'), returnOf('1M'), returnOf('3M'))}
      />
      <Line
        label={t('etfScreener.lines.yearReturns')}
        value={joined(returnOf('YTD'), returnOf('1Y'))}
      />
      <Line
        label={t('etfScreener.lines.longReturns')}
        value={joined(returnOf('3Y'), returnOf('5Y'))}
      />
      <Line label={t('etfScreener.lines.sinceInception')} value={returnOf('SI')} />
      <Line
        label={t('etfScreener.lines.tracking')}
        value={`${pct(figures.trackingErrorPct, 2)} · ${signed(figures.trackingDifferencePct, 2)}`}
      />
      <Line
        label={t('etfScreener.lines.volatility')}
        value={`${pct(figures.volatility1yPct, 1)} · ${pct(figures.volatility3yPct, 1)}`}
      />
      <Line
        label={t('etfScreener.lines.sharpeDrawdown')}
        value={`${figures.sharpe === null ? DASH : format.number(figures.sharpe, 2)} · ${signed(figures.maxDrawdownPct, 1)}`}
      />
    </Block>
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

function Line({
  label,
  value,
  className,
}: {
  label: string
  value: ReactNode
  className?: string
}) {
  return (
    <div
      className={clsx(
        'flex items-baseline justify-between gap-3 px-1 py-0.5 even:bg-panel-header/40',
        className,
      )}
    >
      <dt className="font-sans text-data text-secondary">{label}</dt>
      <dd className="text-right font-mono text-data text-primary">{value}</dd>
    </div>
  )
}
