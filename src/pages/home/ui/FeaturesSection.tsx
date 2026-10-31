import { useTranslation } from 'react-i18next'
import { FEATURES, POINTS } from '../config/content'
import { revealDelay } from '../lib/reveal'
import { Point, Section } from './Section'

/** Monitoring, analysis and portfolios (spec section 1), then research, with their screens. */
export function FeaturesSection() {
  const { t } = useTranslation()
  return (
    <Section
      id="features"
      eyebrow={t('home.features.eyebrow')}
      title={t('home.features.title')}
      lead={t('home.features.lead')}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {FEATURES.map((feature, index) => (
          <article
            key={feature.id}
            style={revealDelay(index)}
            className="reveal flex flex-col gap-4 border bg-panel p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <ul aria-label={t('home.features.codes')} className="flex flex-wrap gap-1.5">
                {feature.codes.map((code) => (
                  <li
                    key={code}
                    className="border border-accent-amber/40 px-1.5 font-mono text-data text-accent-amber"
                  >
                    {code}
                  </li>
                ))}
              </ul>
              <span className="font-sans text-data text-secondary">
                {feature.module
                  ? t('home.features.module', { module: t(`modules.${feature.module}`) })
                  : t('home.features.everyAccount')}
              </span>
            </div>
            <h3 className="font-sans text-figure font-semibold">
              {t(`home.features.${feature.id}.title`)}
            </h3>
            <ul className="flex flex-col gap-2">
              {POINTS.map((point) => (
                <Point key={point}>{t(`home.features.${feature.id}.point${point}`)}</Point>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </Section>
  )
}
