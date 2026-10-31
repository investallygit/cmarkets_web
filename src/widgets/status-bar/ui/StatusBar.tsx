import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { env } from '@/shared/config/env'
import { ConnectionStatus } from './ConnectionStatus'
import { MarketSourceInfo } from './MarketSourceInfo'

/** Status bar (22 px, spec section 8): data source and last update time, real-time status. */
export function StatusBar({ className }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <footer
      className={clsx(
        'flex min-w-0 items-center gap-4 border-t bg-app px-3 font-mono text-title sm:gap-8',
        className,
      )}
    >
      <ConnectionStatus />
      <MarketSourceInfo />
      {env.useMocks && (
        <span className="ml-auto min-w-0 truncate text-accent-amber uppercase">
          {t('shell.prototypeData')}
        </span>
      )}
    </footer>
  )
}
