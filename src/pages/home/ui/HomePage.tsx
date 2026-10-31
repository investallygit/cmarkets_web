import { useTranslation } from 'react-i18next'
import { FACTS } from '../config/content'
import { useVisitorStatus, type VisitorStatus } from '../model/useVisitorStatus'
import { AudienceSection } from './AudienceSection'
import { FeaturesSection } from './FeaturesSection'
import { HomeActions } from './HomeActions'
import { HomeFooter } from './HomeFooter'
import { HomeHeader } from './HomeHeader'
import { MarketsSection } from './MarketsSection'
import { PlansSection } from './PlansSection'
import { Container } from './Section'
import { TerminalPreview } from './TerminalPreview'
import { TrustSection } from './TrustSection'

/**
 * The home page, open without a session, in the brand navy and green of the marketing pages
 * (spec section 8): what CMarket does, its markets, its users and its plans, then the trial or
 * the login. A visitor already logged in opens the terminal from it. The spec gives no mockup.
 */
export function HomePage() {
  const visitor = useVisitorStatus()
  return (
    <div className="h-full overflow-y-auto scroll-smooth bg-brand-navy motion-reduce:scroll-auto">
      <HomeHeader />
      <main>
        <Hero visitor={visitor} />
        <Facts />
        <FeaturesSection />
        <MarketsSection />
        <AudienceSection />
        <PlansSection />
        <TrustSection />
        {visitor !== 'authenticated' && <Closing />}
      </main>
      <HomeFooter />
    </div>
  )
}

function Hero({ visitor }: { visitor: VisitorStatus }) {
  const { t } = useTranslation()
  return (
    <section
      aria-labelledby="home-title"
      className="bg-[radial-gradient(ellipse_at_80%_20%,color-mix(in_srgb,var(--brand-green)_14%,transparent),transparent_55%)]"
    >
      <Container className="grid items-center gap-12 pt-14 pb-16 lg:grid-cols-[1fr_1.1fr] lg:pt-20 lg:pb-24">
        <div className="flex flex-col gap-6">
          <p className="font-mono text-data tracking-title text-brand-green uppercase">
            {t('home.hero.eyebrow')}
          </p>
          <h1 id="home-title" className="font-sans text-headline font-bold sm:text-display">
            {t('home.hero.title')}
          </h1>
          <p className="max-w-xl font-sans text-lead text-primary/80">{t('home.hero.lead')}</p>
          <HomeActions />
          {visitor !== 'authenticated' && (
            <p className="font-sans text-data text-secondary">{t('auth.signUp.subtitle')}</p>
          )}
        </div>
        <TerminalPreview />
      </Container>
    </section>
  )
}

/** Four figures under the hero. */
function Facts() {
  const { t } = useTranslation()
  return (
    <section aria-label={t('home.facts.label')} className="border-y border-primary/10 bg-app/25">
      <Container>
        <dl className="grid grid-cols-2 lg:grid-cols-4">
          {FACTS.map((fact) => (
            <div key={fact} className="flex flex-col gap-1 py-6 pr-6">
              <dt className="order-last font-sans text-label text-primary/75">
                {t(`home.facts.${fact}.label`)}
              </dt>
              <dd className="font-mono text-figure font-semibold">
                {t(`home.facts.${fact}.value`)}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  )
}

function Closing() {
  const { t } = useTranslation()
  return (
    <section aria-labelledby="home-closing" className="py-16 sm:py-20">
      <Container>
        <div className="flex flex-col gap-6 border border-brand-green/40 bg-brand-green/5 p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <h2 id="home-closing" className="font-sans text-headline font-bold">
              {t('home.closing.title')}
            </h2>
            <p className="font-sans text-lead text-primary/80">{t('home.closing.text')}</p>
          </div>
          <HomeActions />
        </div>
      </Container>
    </section>
  )
}
