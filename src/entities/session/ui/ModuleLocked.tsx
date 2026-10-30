import { Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { ModuleCode } from '@/shared/api/contracts'
import { routes } from '@/shared/routes/paths'

/**
 * In place of a screen whose module the user's plan lacks (spec section 6): which module, and
 * where to choose a plan with it. The server refuses the module's data all the same.
 */
export function ModuleLocked({ module }: { module: ModuleCode }) {
  const { t } = useTranslation()
  const name = t(`modules.${module}`)
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center font-sans text-label text-secondary">
      <Lock aria-hidden className="size-6 text-accent-amber" />
      <p className="text-primary">{t('subscription.locked.title', { module: name })}</p>
      <p className="max-w-md">{t('subscription.locked.detail')}</p>
      <Link to={routes.settings} className="text-info hover:underline">
        {t('subscription.locked.seePlans')}
      </Link>
    </div>
  )
}
