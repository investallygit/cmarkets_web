import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { coverPercent, coverTone, useAuctionLabel, useAuctionSummary } from '@/entities/auction'
import { cemacCode3 } from '@/shared/config/countries'
import { useFormat } from '@/shared/i18n'
import { billions } from '../lib/amounts'
import type { AuctionFilters } from '../model/filters'

/**
 * AUC's indicators (screen 33): the amount raised and the auctions of the year, the average cover,
 * the latest reference rates (the 52-week BTA, the 5-year OTA) and the next auction, following the
 * filters. API /auctions/summary.
 */
export function AuctionIndicators({ filters }: { filters: AuctionFilters }) {
  const { t } = useTranslation()
  const format = useFormat()
  const label = useAuctionLabel()
  const summary = useAuctionSummary({
    year: filters.year,
    country: filters.country || undefined,
    type: filters.type || undefined,
  }).data
  const none = t('auctionMarket.indicators.none')
  const next = summary?.next

  return (
    <section
      aria-label={t('auctionMarket.indicators.label')}
      className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-6"
    >
      <Tile title={t('auctionMarket.indicators.raised', { year: filters.year })}>
        {summary
          ? t('auctionMarket.bn', { amount: format.number(billions(summary.amountRaised), 0) })
          : none}
      </Tile>
      <Tile title={t('auctionMarket.indicators.auctions', { year: filters.year })}>
        {summary ? format.number(summary.auctions, 0) : none}
      </Tile>
      <Tile title={t('auctionMarket.indicators.cover')}>
        {summary?.averageCover != null ? (
          <span className={coverTone(summary.averageCover) === 'down' ? 'text-down' : 'text-up'}>
            {format.number(coverPercent(summary.averageCover), 0)}%
          </span>
        ) : (
          none
        )}
      </Tile>
      {(summary?.referenceRates ?? []).map((rate) => (
        <Tile
          key={rate.tenor}
          title={
            rate.country
              ? t('auctionMarket.indicators.reference', {
                  country: cemacCode3(rate.country),
                  security: label(rate),
                })
              : t('auctionMarket.indicators.referenceNone', { security: label(rate) })
          }
        >
          <span className="text-accent-amber">
            {rate.averageRate != null ? format.percent(rate.averageRate, 2, false) : none}
          </span>
        </Tile>
      ))}
      <Tile title={t('auctionMarket.indicators.next')}>
        <span className="text-info">
          {next
            ? t('auctionMarket.indicators.nextValue', {
                country: cemacCode3(next.country),
                security: label(next),
                date: format.isoDate(next.date),
              })
            : none}
        </span>
      </Tile>
    </section>
  )
}

function Tile({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-w-0 border bg-panel px-3 py-2">
      <p className="truncate font-mono text-title font-semibold tracking-title text-secondary uppercase">
        {title}
      </p>
      <p className="font-mono text-figure break-words text-primary tabular-nums">{children}</p>
    </div>
  )
}
