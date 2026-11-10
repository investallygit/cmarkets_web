import { clsx } from 'clsx'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NewsTags } from '@/entities/news'
import { SEVERITY_TEXT, useMarkNotificationRead, useNotifications } from '@/entities/notification'
import type { NotificationDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const helper = createDataColumnHelper<NotificationDto>()
const getNotificationId = (notification: NotificationDto) => notification.id

interface AlertHistoryPanelProps {
  /** A click marks the notification read and points at the alert behind it. */
  onSelectAlert: (alertId: string) => void
}

/**
 * ALRT screen, the alerts that went off, newest first, coloured by severity; unread ones are
 * marked. API /notifications, refreshed by AlertTriggered.
 */
export function AlertHistoryPanel({ onSelectAlert }: AlertHistoryPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const notifications = useNotifications()
  const markRead = useMarkNotificationRead()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const columns = useMemo(
    () =>
      helper.columns([
        helper.display({
          id: 'read',
          header: '',
          meta: { width: '28px', exportable: false },
          cell: ({ row }) =>
            !row.original.read && (
              <span
                role="img"
                aria-label={t('alerts.unread')}
                className="inline-block size-1.5 rounded-full bg-accent-amber"
              />
            ),
        }),
        helper.accessor('triggeredAt', {
          header: t('columns.time'),
          meta: { width: '136px' },
          cell: ({ getValue }) => (
            <span className="text-secondary">
              {format.date(getValue())} {format.time(getValue())}
            </span>
          ),
        }),
        helper.accessor('subject', {
          header: t('columns.subject'),
          // A news alert starts with the item's two tags (spec section 16).
          cell: ({ row, getValue }) => (
            <span className="flex min-w-0 items-center gap-1.5">
              {row.original.news && (
                <NewsTags
                  type={row.original.news.type}
                  source={row.original.news.source}
                  mode="none"
                />
              )}
              <span className="truncate font-semibold text-accent-amber">{getValue()}</span>
            </span>
          ),
        }),
        helper.accessor('message', {
          header: t('columns.message'),
          meta: { width: '2.2fr' },
          cell: ({ row, getValue }) => (
            <span className={clsx('font-sans', SEVERITY_TEXT[row.original.severity])}>
              {getValue()}
            </span>
          ),
        }),
      ]),
    [t, format],
  )

  return (
    <Panel title={t('panels.alertHistory')} code="ALRT">
      <QueryView query={notifications}>
        {(page) => (
          <DataTable
            data={page.items}
            columns={columns}
            getRowId={getNotificationId}
            selectedRowId={selectedId}
            onRowClick={(notification) => {
              setSelectedId(notification.id)
              if (!notification.read) markRead.mutate(notification.id)
              if (notification.alertId) onSelectAlert(notification.alertId)
            }}
            exportName="triggered-alerts"
            emptyMessage={t('alerts.historyEmpty')}
          />
        )}
      </QueryView>
    </Panel>
  )
}
