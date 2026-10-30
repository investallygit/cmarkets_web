import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useMarketDay } from '@/shared/lib/useMarketDay'
import { routes } from '@/shared/routes/paths'

const DAY_MS = 86_400_000

/** "TRIAL · 12 DAYS" while the free trial runs (spec section 6), a link to the plans of CFG. */
export function TrialBadge({ endsOn }: { endsOn: string }) {
  const { t } = useTranslation()
  const today = useMarketDay()
  const days = Math.max(0, Math.round((Date.parse(endsOn) - Date.parse(today)) / DAY_MS))
  return (
    <Link
      to={routes.settings}
      className="inline-flex h-6 items-center border border-warning/70 px-2 font-sans text-title font-semibold tracking-title text-warning uppercase hover:bg-warning/10"
    >
      {t('subscription.trialBadge', { count: days })}
    </Link>
  )
}
