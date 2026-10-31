import { ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CEMAC_COUNTRIES } from '@/shared/config/countries'
import { POINTS } from '../config/content'
import { Point, Section } from './Section'

const WORLD_ASSETS = ['equities', 'indices', 'currencies'] as const

/** The CEMAC data loaded by file, and the European and US markets of EODHD (spec section 11). */
export function MarketsSection() {
  const { t } = useTranslation()
  return (
    <Section
      id="markets"
      eyebrow={t('home.markets.eyebrow')}
      title={t('home.markets.title')}
      lead={t('home.markets.lead')}
    >
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <article className="flex flex-col gap-4 border bg-panel p-6">
          <h3 className="font-sans text-figure font-semibold">{t('home.markets.cemac.title')}</h3>
          <p className="font-sans text-label text-primary/75">{t('home.markets.cemac.text')}</p>
          <ul aria-label={t('home.markets.cemac.countries')} className="flex flex-wrap gap-2">
            {CEMAC_COUNTRIES.map((country) => (
              <li
                key={country}
                className="flex items-center gap-1.5 border border-primary/15 px-2 py-1 font-sans text-data"
              >
                <span className="font-mono text-secondary">{country}</span>
                {t(`home.markets.countries.${country}`)}
              </li>
            ))}
          </ul>
          <ul className="flex flex-col gap-2">
            {POINTS.map((point) => (
              <Point key={point}>{t(`home.markets.cemac.point${point}`)}</Point>
            ))}
          </ul>
        </article>
        <div className="flex flex-col gap-4">
          <article className="flex flex-col gap-4 border bg-panel p-6">
            <h3 className="font-sans text-figure font-semibold">{t('home.markets.world.title')}</h3>
            <p className="font-sans text-label text-primary/75">{t('home.markets.world.text')}</p>
            <ul className="flex flex-wrap gap-2">
              {WORLD_ASSETS.map((asset) => (
                <li key={asset} className="border border-primary/15 px-2 py-1 font-sans text-data">
                  {t(`home.markets.world.${asset}`)}
                </li>
              ))}
            </ul>
          </article>
          <article className="flex flex-1 flex-col gap-3 border border-brand-green/40 bg-brand-green/5 p-6">
            <h3 className="flex items-center gap-2 font-sans text-figure font-semibold">
              <ShieldCheck aria-hidden className="size-5 shrink-0 text-brand-green" />
              {t('home.markets.qualityTitle')}
            </h3>
            <p className="font-sans text-label text-primary/75">{t('home.markets.quality')}</p>
          </article>
        </div>
      </div>
    </Section>
  )
}
