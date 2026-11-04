import { useTranslation } from 'react-i18next'

/** The green VERIFIED badge of an approved Analyst, Journalist or CEO (spec section 9, screen 10). */
export function VerifiedBadge() {
  const { t } = useTranslation()
  return (
    <span className="inline-block border border-up px-1 font-sans text-title font-semibold tracking-title text-up uppercase">
      {t('verifiedBadge')}
    </span>
  )
}
