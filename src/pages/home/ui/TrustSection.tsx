import { KeyRound, Scale, ScrollText, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TRUST } from '../config/content'
import { Container } from './Section'

const ICONS: Record<(typeof TRUST)[number], LucideIcon> = {
  independent: Scale,
  secure: KeyRound,
  audited: ScrollText,
}

/** What CMarket is not (spec section 1), the login (section 6) and the audit (section 12). */
export function TrustSection() {
  const { t } = useTranslation()
  return (
    <section aria-labelledby="home-trust" className="border-y border-primary/10 bg-app/25 py-14">
      <Container className="flex flex-col gap-8">
        <h2 id="home-trust" className="font-sans text-headline font-bold">
          {t('home.trust.title')}
        </h2>
        <ul className="grid gap-8 md:grid-cols-3">
          {TRUST.map((item) => {
            const Icon = ICONS[item]
            return (
              <li key={item} className="flex flex-col gap-2">
                <Icon aria-hidden className="size-5 text-brand-green" />
                <h3 className="font-sans text-label font-semibold">
                  {t(`home.trust.${item}.title`)}
                </h3>
                <p className="font-sans text-label text-primary/75">
                  {t(`home.trust.${item}.text`)}
                </p>
              </li>
            )
          })}
        </ul>
      </Container>
    </section>
  )
}
