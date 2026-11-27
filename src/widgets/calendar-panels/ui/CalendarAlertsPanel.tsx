import { useTranslation } from 'react-i18next'
import { openAlertDialog, useAlerts, useDescribeAlert } from '@/entities/alert'
import type { AlertDto } from '@/shared/api/contracts'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { ScrollArea } from '@/shared/ui/ScrollArea'

/**
 * "My calendar alerts" (screen 32, sixth version): the user's calendar alerts, what each follows,
 * how many days before and on which channels; a click edits one (ALRT keeps the others). API
 * /alerts, the calendar's.
 */
export function CalendarAlertsPanel() {
  const { t } = useTranslation()
  const alerts = useAlerts()
  const describe = useDescribeAlert()
  const calendar = (rows: AlertDto[]) => rows.filter((alert) => alert.condition.type === 'calendar')

  return (
    <Panel title={t('panels.calendarAlerts')} code="ALRT" bodyClassName="flex flex-col">
      <QueryView
        query={alerts}
        isEmpty={(rows) => calendar(rows).length === 0}
        emptyMessage={t('calendar.alerts.empty')}
      >
        {(rows) => (
          <ScrollArea className="min-h-0 flex-1">
            <ul className="font-sans text-data">
              {calendar(rows).map((alert) => {
                const { subject, condition } = describe(alert)
                const days =
                  alert.condition.type === 'calendar' && alert.condition.daysBefore > 0
                    ? `${t('calendar.alerts.daysBefore', { days: alert.condition.daysBefore })} · `
                    : ''
                return (
                  <li key={alert.id} className="border-b border-border/50">
                    <button
                      type="button"
                      onClick={() => openAlertDialog({ alert })}
                      className="flex min-h-8 w-full items-center justify-between gap-3 px-3 text-left hover:bg-row-alt"
                    >
                      <span className="min-w-0 truncate text-primary">
                        {`${condition.split(' · ')[0]} — ${subject}`}
                      </span>
                      <span className="shrink-0 text-secondary">
                        {days}
                        {alert.channels
                          .map((channel) => t(`calendar.alerts.channels.${channel}`))
                          .join(' + ')}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </ScrollArea>
        )}
      </QueryView>
      <p className="shrink-0 border-t px-3 py-1 font-sans text-title text-secondary">
        {t('calendar.alerts.sources')}
      </p>
    </Panel>
  )
}
