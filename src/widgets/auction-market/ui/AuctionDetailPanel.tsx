import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import { coverPercent, coverTone, useAuctionDetail, useAuctionLabel } from '@/entities/auction'
import type { AuctionDetailDto } from '@/shared/api/contracts'
import { cemacCode3 } from '@/shared/config/countries'
import { useFormat } from '@/shared/i18n'
import { cssVar } from '@/shared/lib/theme'
import { useChartTheme } from '@/shared/ui/charts/chartTheme'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { billions } from '../lib/amounts'

/**
 * AUC's auction detail (screen 33): the bids by rate, those allotted in amber up to the marginal
 * rate's cut-off, others in grey ("bids by rate are shown only when the BEAC publishes them"); the
 * amounts, the cover, the average and marginal rates, the bidders, the value date and the security.
 * API /auctions/{id}.
 */
export function AuctionDetailPanel({ auctionId }: { auctionId: string | null }) {
  const { t } = useTranslation()
  const format = useFormat()
  const label = useAuctionLabel()
  const detail = useAuctionDetail(auctionId)
  const auction = detail.data?.auction
  const title = auction
    ? t('auctionMarket.detail.title', {
        security: `${cemacCode3(auction.country)} ${label(auction)}`,
        date: format.isoDate(auction.date),
      })
    : t('auctionMarket.detail.titleNone')

  return (
    <Panel
      title={title}
      code="AUC"
      options={<span>{t('auctionMarket.detail.options')}</span>}
      bodyClassName="flex flex-col"
    >
      {auctionId === null ? (
        <p className="p-3 font-sans text-label text-secondary">{t('auctionMarket.detail.pick')}</p>
      ) : (
        <QueryView query={detail}>{(data) => <Detail detail={data} />}</QueryView>
      )}
    </Panel>
  )
}

function Detail({ detail }: { detail: AuctionDetailDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const label = useAuctionLabel()
  const { auction, bids } = detail
  const security = `${cemacCode3(auction.country)} ${label(auction)}`
  const bn = (millions: number) =>
    t('auctionMarket.bn', { amount: format.number(billions(millions), 1) })
  return (
    <div className="flex min-h-0 flex-1 flex-wrap gap-3 p-2">
      <div className="flex min-h-40 min-w-[16rem] flex-[3_1_18rem] flex-col">
        {bids.length === 0 ? (
          <p className="font-sans text-label text-secondary">{t('auctionMarket.detail.noBids')}</p>
        ) : (
          <>
            <Bids detail={detail} security={security} />
            <p className="font-sans text-title text-secondary">
              {t('auctionMarket.detail.chartNote')}
            </p>
          </>
        )}
      </div>
      <dl
        aria-label={t('auctionMarket.detail.figures.label')}
        className="grid min-w-[14rem] flex-[2_1_14rem] content-start font-mono text-data"
      >
        <Figure name={t('auctionMarket.detail.figures.offered')}>
          {bn(auction.amountOffered)}
        </Figure>
        <Figure name={t('auctionMarket.detail.figures.bid')}>{bn(auction.amountBid)}</Figure>
        <Figure name={t('auctionMarket.detail.figures.allotted')}>
          {bn(auction.amountAllotted)}
        </Figure>
        <Figure name={t('auctionMarket.detail.figures.cover')}>
          <span className={coverTone(auction.coverRatio) === 'down' ? 'text-down' : undefined}>
            {format.number(coverPercent(auction.coverRatio), 0)}%
          </span>
        </Figure>
        <Figure name={t('auctionMarket.detail.figures.average')}>
          {format.percent(auction.averageRate, 2, false)}
        </Figure>
        <Figure name={t('auctionMarket.detail.figures.marginal')}>
          {format.percent(auction.marginalRate, 2, false)}
        </Figure>
        <Figure name={t('auctionMarket.detail.figures.bidders')}>
          {auction.bidders != null
            ? t('auctionMarket.detail.bidders', { count: auction.bidders })
            : '—'}
        </Figure>
        <Figure name={t('auctionMarket.detail.figures.valueDate')}>
          {auction.valueDate ? format.isoDate(auction.valueDate) : '—'}
        </Figure>
        <Figure name={t('auctionMarket.detail.figures.security')}>
          {auction.security?.code ?? '—'}
        </Figure>
      </dl>
    </div>
  )
}

function Figure({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b px-2 py-1 even:bg-row-alt">
      <dt className="font-sans text-secondary">{name}</dt>
      <dd className="text-right tabular-nums">{children}</dd>
    </div>
  )
}

function Bids({ detail, security }: { detail: AuctionDetailDto; security: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const theme = useChartTheme()
  const { auction, bids } = detail
  const rows = bids.map((bid) => ({
    rate: format.number(bid.rate, 2),
    amount: billions(bid.amount),
    allotted: bid.allotted,
  }))
  const cutOff = rows.findLast((row) => row.allotted)?.rate
  const amber = cssVar('--accent-amber')
  return (
    <div
      role="img"
      aria-label={t('auctionMarket.detail.chartLabel', {
        security,
        date: format.isoDate(auction.date),
        rate: format.percent(auction.marginalRate, 2, false),
      })}
      className="min-h-36 flex-1"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 20, right: 8, bottom: 0, left: 0 }}>
          <XAxis dataKey="rate" tick={theme.tick} stroke={theme.grid} interval={0} />
          <YAxis hide />
          <Bar dataKey="amount" isAnimationActive={false}>
            {rows.map((row) => (
              <Cell key={row.rate} fill={row.allotted ? amber : theme.secondary} />
            ))}
            <LabelList
              dataKey="amount"
              position="top"
              formatter={(value: unknown) => format.number(Number(value), 1)}
              fill={theme.secondary}
              fontSize={10}
            />
          </Bar>
          {cutOff && (
            <ReferenceLine
              x={cutOff}
              stroke={cssVar('--down')}
              strokeDasharray="3 3"
              label={{
                value: t('auctionMarket.detail.marginal', {
                  rate: format.percent(auction.marginalRate, 2, false),
                }),
                position: 'insideTopRight',
                fill: cssVar('--down'),
                fontSize: 11,
              }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
