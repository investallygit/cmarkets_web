import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import type { AlertSeverity } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { useTodayNotifications } from './api'

/** Colour by severity (spec section 9). */
const SEVERITY_TEXT: Record<AlertSeverity, string> = {
  info: 'text-info',
  warning: 'text-warning',
  critical: 'text-down',
}

/** Screen 1, My alerts triggered today. API /notifications, real-time AlertTriggered. */
export function TriggeredAlertsPanel() {
  const { t } = useTranslation()
  const format = useFormat()
  const { query, items } = useTodayNotifications()

  return (
    <Panel title={t('panels.alertsToday')} code="ALRT">
      <QueryView
        query={query}
        isEmpty={() => !items?.length}
        emptyMessage={t('market.noAlertsToday')}
      >
        {() => (
          <ul className="py-1">
            {items?.map((notification) => (
              <li
                key={notification.id}
                className="grid h-row grid-cols-[56px_minmax(0,1fr)_minmax(0,2.4fr)] items-center gap-2 px-2 font-mono text-data"
              >
                <span className="text-secondary">{format.time(notification.triggeredAt)}</span>
                <span className="truncate font-semibold text-accent-amber">
                  {notification.subject}
                </span>
                <span
                  className={clsx(
                    'truncate font-sans text-label',
                    SEVERITY_TEXT[notification.severity],
                  )}
                >
                  {notification.message}
                </span>
              </li>
            ))}
          </ul>
        )}
      </QueryView>
    </Panel>
  )
}
