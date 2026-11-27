import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { billions, DEBT_ZONE, ratingPair, useDebtSummary } from '@/entities/debt'
import { useFormat } from '@/shared/i18n'

/**
 * DEBT's six indicators (screen 35, sixth version): the government securities outstanding, its
 * BTA and OTA, the average maturity and the weighted average rate (weighted by the outstanding),
 * the principal maturing within 12 months and the rating, S&P / Moody's, "(example)" for the
 * demo's, hidden while ADMCFG's switch is off (ROADMAP decision 60). API /debt/{country}/summary.
 */
export function DebtIndicators({ country }: { country: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const summary = useDebtSummary(country).data
  const none = t('debt.indicators.none')
  const bn = (amount: number) => format.number(billions(amount), 0)
  const ratings = summary?.ratings
  const pair = ratingPair(ratings)
  const example = ratings?.some((rating) => rating.rating !== null && rating.example) ?? false

  let rating: ReactNode = none
  let ratingHint: string | undefined
  if (country === DEBT_ZONE) rating = t('debt.indicators.zoneRating')
  else if (summary && ratings === null) {
    rating = t('debt.indicators.hidden')
    ratingHint = t('debt.indicators.hiddenHint')
  } else if (pair) {
    rating = <span className="text-info">{pair}</span>
    ratingHint = t('debt.indicators.ratingHint')
  }

  return (
    <section
      aria-label={t('debt.indicators.label')}
      className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-6"
    >
      <Tile title={t('debt.indicators.outstanding')}>
        {summary ? `XAF ${t('debt.bn', { value: bn(summary.outstanding) })}` : none}
      </Tile>
      <Tile title={t('debt.indicators.split')}>
        {summary ? t('debt.bn', { value: `${bn(summary.bta)} / ${bn(summary.ota)}` }) : none}
      </Tile>
      <Tile title={t('debt.indicators.maturity')}>
        {summary?.averageMaturityYears != null
          ? t('debt.years', { value: format.number(summary.averageMaturityYears, 1) })
          : none}
      </Tile>
      <Tile title={t('debt.indicators.rate')}>
        {summary?.averageRatePct != null ? (
          <span className="text-accent-amber">
            {format.percent(summary.averageRatePct, 2, false)}
          </span>
        ) : (
          none
        )}
      </Tile>
      <Tile title={t('debt.indicators.maturing')}>
        {summary ? (
          <span className="text-accent-amber">
            {t('debt.bn', { value: bn(summary.maturing12Months) })}
          </span>
        ) : (
          none
        )}
      </Tile>
      <Tile
        title={example ? t('debt.indicators.ratingExample') : t('debt.indicators.rating')}
        hint={ratingHint}
      >
        {rating}
      </Tile>
    </section>
  )
}

function Tile({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="min-w-0 border bg-panel px-3 py-2" title={hint}>
      <p className="truncate font-mono text-title font-semibold tracking-title text-secondary uppercase">
        {title}
      </p>
      <p className="truncate font-mono text-figure text-primary tabular-nums">{children}</p>
      {hint && <span className="sr-only">{hint}</span>}
    </div>
  )
}
