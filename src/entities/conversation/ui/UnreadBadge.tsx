import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { useUnreadTotal } from '../api/chat'

/**
 * The count on MSG in the menu: the unread messages and the requests waiting, which the hub keeps
 * current; nothing when there are none.
 */
export function UnreadBadge({ enabled, className }: { enabled: boolean; className?: string }) {
  const { t } = useTranslation()
  const total = useUnreadTotal(enabled)
  if (total === 0) return null
  return (
    <span
      className={clsx(
        'flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-accent-amber px-0.5 font-mono text-caption font-bold text-app',
        className,
      )}
    >
      <span aria-hidden>{total > 99 ? '99+' : total}</span>
      <span className="sr-only">{t('messaging.unreadTotal', { count: total })}</span>
    </span>
  )
}
