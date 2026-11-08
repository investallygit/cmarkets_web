import { clsx } from 'clsx'
import { ConnectionStatus } from './ConnectionStatus'
import { MarketSourceInfo } from './MarketSourceInfo'

/** Status bar (22 px, spec section 8): data source and last update time, real-time status. */
export function StatusBar({ className }: { className?: string }) {
  return (
    <footer
      className={clsx(
        'flex min-w-0 items-center gap-4 border-t bg-app px-3 font-mono text-title sm:gap-8',
        className,
      )}
    >
      <ConnectionStatus />
      <MarketSourceInfo />
    </footer>
  )
}
