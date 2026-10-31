import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FACTS } from '../config/content'
import { PHOTOS } from '../config/photos'
import { revealDelay, riseDelay } from '../lib/reveal'
import { useReveal } from '../model/useReveal'
import { useVisitorStatus, type VisitorStatus } from '../model/useVisitorStatus'
import { AudienceSection } from './AudienceSection'
import { FeaturesSection } from './FeaturesSection'
import { HomeActions } from './HomeActions'
import { HeroBackdrop, PageGlows, PhotoBackdrop } from './HomeBackground'
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
 * The hero rises into place over a moving backdrop and each section comes in as it scrolls into
 * view, unless the user asks for less motion; the hero's Pause button stops what keeps moving.
 * Photos of cities and of the users' work set the mood: the hero, the markets, the account types
 * and the trial.
 */
export function HomePage() {
  const visitor = useVisitorStatus()
  const [scrolled, setScrolled] = useState(false)
  const [paused, setPaused] = useState(false)
  return (
    <div
      onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 8)}
      className="relative isolate h-full overflow-y-auto scroll-smooth bg-brand-navy motion-reduce:scroll-auto"
    >
      <PageGlows paused={paused} />
      <HomeHeader scrolled={scrolled} />
      <main>
        <Hero visitor={visitor} paused={paused} onPausedChange={setPaused} />
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

interface HeroProps {
  visitor: VisitorStatus
  paused: boolean
  onPausedChange: (paused: boolean) => void
}

function Hero({ visitor, paused, onPausedChange }: HeroProps) {
  const { t } = useTranslation()
  return (
    <section aria-labelledby="home-title" className="relative isolate">
      <HeroBackdrop paused={paused} />
      <Container className="grid items-center gap-12 pt-14 pb-16 lg:grid-cols-[1fr_1.1fr] lg:pt-20 lg:pb-24">
        <div className="flex flex-col gap-6">
          <p className="font-mono text-data tracking-title text-brand-green uppercase motion-safe:animate-rise">
            {t('home.hero.eyebrow')}
          </p>
          <h1
            id="home-title"
            style={riseDelay(1)}
            className="font-sans text-headline font-bold motion-safe:animate-rise sm:text-display"
          >
            {t('home.hero.title')}
          </h1>
          <p
            style={riseDelay(2)}
            className="max-w-xl font-sans text-lead text-primary/80 motion-safe:animate-rise"
          >
            {t('home.hero.lead')}
          </p>
          <div style={riseDelay(3)} className="motion-safe:animate-rise">
            <HomeActions />
          </div>
          {visitor !== 'authenticated' && (
            <p
              style={riseDelay(4)}
              className="font-sans text-data text-secondary motion-safe:animate-rise"
            >
              {t('auth.signUp.subtitle')}
            </p>
          )}
        </div>
        <div style={riseDelay(3)} className="min-w-0 motion-safe:animate-rise">
          <TerminalPreview paused={paused} onPausedChange={onPausedChange} />
        </div>
      </Container>
    </section>
  )
}

/** Four figures under the hero. */
function Facts() {
  const { t } = useTranslation()
  const reveal = useReveal<HTMLElement>()
  return (
    <section
      {...reveal}
      aria-label={t('home.facts.label')}
      className="border-y border-primary/10 bg-app/25"
    >
      <Container>
        <dl className="grid grid-cols-2 lg:grid-cols-4">
          {FACTS.map((fact, index) => (
            <div
              key={fact}
              style={revealDelay(index)}
              className="reveal flex flex-col gap-1 py-6 pr-6"
            >
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
  const reveal = useReveal<HTMLElement>()
  return (
    <section {...reveal} aria-labelledby="home-closing" className="relative isolate py-24 sm:py-36">
      <PhotoBackdrop photo={PHOTOS.closing} under="card" className="inset-y-0" />
      <Container>
        <div className="reveal flex flex-col gap-6 border border-brand-green/40 bg-brand-navy/75 p-6 backdrop-blur-md sm:p-8 md:flex-row md:items-center md:justify-between">
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
