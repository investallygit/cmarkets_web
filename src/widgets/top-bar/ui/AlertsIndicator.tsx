import { Bell } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useTodayNotifications } from '@/entities/notification'

/** "ALERTS 3" in the top bar: unread alerts triggered today. */
export function AlertsIndicator({ to }: { to?: string }) {
  const { t } = useTranslation()
  const { items } = useTodayNotifications()
  const unread = items?.filter((notification) => !notification.read).length ?? 0
  const content = (
    <>
      <Bell aria-hidden className="size-3.5" />
      {t('shell.alerts')} {unread}
    </>
  )
  const className =
    'inline-flex items-center gap-1.5 font-sans text-label text-accent-amber uppercase'

  return to ? (
    <Link to={to} className={`${className} hover:underline`}>
      {content}
    </Link>
  ) : (
    <span className={className}>{content}</span>
  )
}
