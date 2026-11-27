import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useBond, useBondAnalytics, ytwDiffers } from '@/entities/bond'
import { canAccessScreen, useCurrentUser, useHasPermission } from '@/entities/session'
import type { SecurityProfileDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { cemacCode3, isCemacCountry } from '@/shared/config/countries'
import { auctionsPath, debtPath, rfqPath } from '@/shared/routes/paths'
import { SCREENS } from '@/shared/routes/screens'
import { ChangeText } from '@/shared/ui/ChangeText'
import { DASH, useBondWords } from '../lib/words'

interface Figure {
  label: string
  value: string
  warning?: boolean
}

/**
 * Screen 20 header: the issuer's country, the bond's code, its issuer and ISIN, the line of its
 * terms (category, market, currency, coupon, redemption, seniority), the clean price of the latest
 * daily calculation and its change, then the key figures: dirty price, YTM, YTW, modified
 * duration, spread and maturity. API /bonds/{id}, /bonds/{id}/analytics.
 */
export function BondProfileHeader({ profile }: { profile: SecurityProfileDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const words = useBondWords()
  const user = useCurrentUser()
  const auctions = SCREENS.some((screen) => screen.code === 'AUC' && canAccessScreen(user, screen))
  const debt = SCREENS.some((screen) => screen.code === 'DEBT' && canAccessScreen(user, screen))
  const bond = useBond(profile.id).data
  const trader = useHasPermission('rfq:trade')
  const analytics = useBondAnalytics(profile.id).data
  const pricing = analytics?.pricing
  const model = pricing?.priceSource === 'model'
  const cleanPrice = pricing?.cleanPrice ?? null
  const change = pricing?.cleanPriceChange ?? null
  const figures: Figure[] = [
    { label: t('bondProfile.figures.dirtyPrice'), value: words.price(pricing?.dirtyPrice ?? null) },
    { label: t('bondProfile.figures.ytm'), value: words.percent(pricing?.ytmPct ?? null) },
    {
      label: t('bondProfile.figures.ytw'),
      value: words.percent(pricing?.ytwPct ?? null),
      warning: pricing ? ytwDiffers(pricing) : false,
    },
    {
      label: t('bondProfile.figures.modifiedDuration'),
      value: words.price(analytics?.risk.modifiedDuration ?? null),
    },
    {
      label: t('bondProfile.figures.spread'),
      value: words.spread(pricing?.creditSpreadBp ?? null),
    },
    {
      label: t('bondProfile.figures.maturity'),
      value: bond ? format.isoDate(bond.maturityDate) : DASH,
    },
  ]

  return (
    <section
      aria-label={profile.code}
      className="flex min-h-14 shrink-0 flex-wrap items-center gap-x-10 gap-y-2 border bg-panel px-3 py-1.5"
    >
      {/* On a narrow screen the issuer and the terms go below the code rather than cut short. */}
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        <span
          title={format.country(profile.country)}
          className="shrink-0 border bg-panel-header px-1.5 py-0.5 font-mono text-data font-semibold text-secondary"
        >
          {profile.country}
        </span>
        <h1 className="shrink-0 font-mono text-figure font-semibold text-accent-amber">
          {profile.code}
        </h1>
        <div className="min-w-0 basis-60 grow">
          <p className="truncate font-sans text-label font-semibold">
            {[profile.issuer, bond?.isin ?? profile.isin].filter(Boolean).join(' · ')}
          </p>
          <p className="truncate font-sans text-data text-secondary">
            {bond ? words.description(bond) : profile.name}
          </p>
        </div>
      </div>
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-price font-semibold">
          {cleanPrice === null ? (
            <span className="text-secondary">{DASH}</span>
          ) : (
            <>
              <span className="sr-only">{t('bondProfile.cleanPrice')} </span>
              {format.number(cleanPrice, 2)}
              {model && (
                <span title={t('bondProfile.modelPrice')}>
                  <span aria-hidden>*</span>
                  <span className="sr-only">, {t('bondProfile.modelPrice')}</span>
                </span>
              )}
            </>
          )}
        </span>
        {change !== null && (
          <ChangeText value={change} showIcon className="font-mono text-label font-semibold" />
        )}
      </div>
      {/* A BTA or an OTA of the BEAC: its price asked on the RFQ (spec, screen 22). */}
      {trader && bond?.market === 'beac' && (
        <Link
          to={rfqPath(profile.id)}
          className="inline-flex h-6 items-center border border-accent-amber/60 px-3 font-sans text-data text-accent-amber outline-none hover:bg-selected focus-visible:ring-1 focus-visible:ring-accent-amber"
        >
          {t('rfqTrading.requestPrice')}
        </Link>
      )}
      {/* Its state's BTA and OTA auctions (AUC, screen 33, sixth version). */}
      {auctions && bond?.market === 'beac' && (
        <Link
          to={auctionsPath(profile.country)}
          className="inline-flex h-6 items-center font-sans text-data text-info hover:underline"
        >
          {t('auctionMarket.links.security')}
        </Link>
      )}
      {/* A CEMAC state's security: its debt (DEBT, screen 35, sixth version). */}
      {debt && bond?.issuerCategory === 'sovereign' && isCemacCountry(profile.country) && (
        <Link
          to={debtPath(cemacCode3(profile.country))}
          className="inline-flex h-6 items-center font-sans text-data text-info hover:underline"
        >
          {t('debt.links.bond', { code: cemacCode3(profile.country) })}
        </Link>
      )}
      <dl className="ml-auto flex flex-wrap gap-x-8 gap-y-1">
        {figures.map((figure) => (
          <div key={figure.label} className="flex flex-col gap-0.5">
            <dt className="font-sans text-title text-secondary">{figure.label}</dt>
            <dd
              className={
                figure.warning
                  ? 'font-mono text-data font-semibold text-warning'
                  : 'font-mono text-data font-semibold'
              }
            >
              {figure.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
