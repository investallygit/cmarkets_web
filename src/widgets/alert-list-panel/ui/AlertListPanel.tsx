import { clsx } from 'clsx'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { openAlertDialog, useAlerts, useDescribeAlert } from '@/entities/alert'
import { useCurrentUser } from '@/entities/session'
import { AlertToggle, DeleteAlertDialog, useAlertMenu } from '@/features/manage-alerts'
import type { AlertDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const helper = createDataColumnHelper<AlertDto>()
const getAlertId = (alert: AlertDto) => alert.id

interface AlertListPanelProps {
  /** The alert highlighted, e.g. the one behind a notification of the history. */
  selectedId: string | null
  onSelect: (alertId: string) => void
}

/**
 * ALRT screen, the user's alerts: on / off, type, condition, channels, last time it went off. The
 * count is limited by the account type (spec section 12). API /alerts.
 */
export function AlertListPanel({ selectedId, onSelect }: AlertListPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const user = useCurrentUser()
  const alerts = useAlerts()
  const describe = useDescribeAlert()
  const [deleting, setDeleting] = useState<AlertDto | null>(null)
  const alertMenu = useAlertMenu(setDeleting)

  const quota = user.quotas.alerts
  const used = alerts.data?.length ?? 0
  const quotaReached = quota !== null && used >= quota
  const label = (alert: AlertDto) => {
    const { subject, condition } = describe(alert)
    return `${subject} · ${condition}`
  }

  const columns = useMemo(
    () =>
      helper.columns([
        helper.display({
          id: 'enabled',
          header: t('columns.enabled'),
          meta: { width: '56px', exportable: false },
          cell: ({ row }) => (
            <AlertToggle
              alert={row.original}
              label={`${describe(row.original).subject} · ${describe(row.original).condition}`}
            />
          ),
        }),
        helper.accessor((alert) => t(`alerts.types.${alert.condition.type}`), {
          id: 'type',
          header: t('columns.type'),
          meta: { width: '1.3fr' },
          cell: ({ getValue }) => <span className="font-sans">{getValue()}</span>,
        }),
        helper.accessor((alert) => describe(alert).subject, {
          id: 'subject',
          header: t('columns.subject'),
          meta: { width: '1.2fr' },
          cell: ({ getValue }) => <span className="text-accent-amber">{getValue()}</span>,
        }),
        helper.accessor((alert) => describe(alert).condition, {
          id: 'condition',
          header: t('columns.condition'),
          meta: { width: '2.4fr' },
          cell: ({ getValue }) => <span className="font-sans">{getValue()}</span>,
        }),
        helper.accessor(
          (alert) =>
            alert.channels.map((channel) => t(`alerts.channelNames.${channel}`)).join(' · '),
          { id: 'channels', header: t('columns.channels'), meta: { width: '1.3fr' } },
        ),
        helper.accessor((alert) => alert.lastTriggeredAt ?? '', {
          id: 'lastTriggered',
          header: t('columns.lastTriggered'),
          meta: { align: 'right', width: '1.3fr' },
          cell: ({ getValue }) => {
            const at = getValue()
            return at ? (
              `${format.date(at)} ${format.time(at)}`
            ) : (
              <span className="text-secondary">{t('alerts.never')}</span>
            )
          },
        }),
      ]),
    [t, format, describe],
  )

  return (
    <Panel
      title={t('panels.alerts')}
      code="ALRT"
      options={
        <>
          <span title={quotaReached ? t('alerts.quotaReached', { quota }) : undefined}>
            {t('alerts.quotaShort', { used, quota: quota ?? '∞' })}
          </span>
          <button
            type="button"
            disabled={quotaReached}
            title={quotaReached ? t('alerts.quotaReached', { quota }) : undefined}
            onClick={() => openAlertDialog()}
            className="panel-no-drag inline-flex items-center gap-1 text-accent-amber uppercase enabled:hover:underline disabled:text-secondary"
          >
            <Plus aria-hidden className="size-3" />
            {t('alerts.newAlert')}
          </button>
        </>
      }
    >
      <QueryView query={alerts}>
        {(data) => (
          <DataTable
            data={data}
            columns={columns}
            getRowId={getAlertId}
            selectedRowId={selectedId}
            onRowClick={(alert) => onSelect(alert.id)}
            onRowDoubleClick={(alert) => openAlertDialog({ alert })}
            rowMenu={alertMenu}
            rowClassName={(alert) => clsx(!alert.enabled && 'text-secondary')}
            exportName="alerts"
            emptyMessage={t('alerts.noAlerts')}
          />
        )}
      </QueryView>
      <DeleteAlertDialog
        alert={deleting}
        label={deleting ? label(deleting) : ''}
        onClose={() => setDeleting(null)}
      />
    </Panel>
  )
}
