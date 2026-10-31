import { clsx } from 'clsx'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DocumentLinks, useAnalystRequests } from '@/entities/analyst-request'
import {
  AnalystDecision,
  AnalystDocumentDialog,
  type OpenDocument,
} from '@/features/review-analyst-request'
import type { AnalystRequestDto, AnalystStatus } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import { QueryView } from '@/shared/ui/QueryView'

const STATUSES: readonly AnalystStatus[] = ['pending', 'approved', 'rejected']

const helper = createDataColumnHelper<AnalystRequestDto>()
const getRequestId = (request: AnalystRequestDto) => request.id

/**
 * Screen 9, Analyst status requests waiting for an Admin: the applicant, the supporting documents
 * and Approve or Reject (GET /admin/analyst-requests). USER shows them as in the mockup.
 */
export function PendingRequestsPanel() {
  const { t } = useTranslation()
  const format = useFormat()
  const requests = useAnalystRequests('pending')
  const [document, setDocument] = useState<OpenDocument | null>(null)

  return (
    <Panel
      title={t('panels.analystRequests')}
      code="ANLY"
      options={
        requests.data && (
          <span>{t('analystRequests.pending', { count: requests.data.length })}</span>
        )
      }
    >
      <QueryView
        query={requests}
        isEmpty={(items) => items.length === 0}
        emptyMessage={t('analystRequests.none')}
      >
        {(items) => (
          <ul className="flex flex-col">
            {items.map((request, index) => (
              <li
                key={request.id}
                className={clsx(
                  'flex items-center gap-3 border-b px-3 py-2.5',
                  index % 2 === 1 && 'bg-row-alt',
                )}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1 font-sans text-data">
                  <p className="truncate">
                    <span className="text-label font-semibold">{request.displayName}</span>
                    <span className="ml-2 text-secondary">
                      {request.organization ?? t('accounts.independent')}
                    </span>
                  </p>
                  <DocumentLinks
                    request={request}
                    onOpen={(kind) =>
                      setDocument({
                        requestId: request.id,
                        kind,
                        fileName:
                          request.documents.find((document) => document.kind === kind)?.fileName ??
                          '',
                      })
                    }
                  />
                  <p className="font-mono text-secondary">
                    {t('analystRequests.requested', { date: format.date(request.requestedAt) })}
                  </p>
                </div>
                <AnalystDecision request={request} wide />
              </li>
            ))}
          </ul>
        )}
      </QueryView>
      <AnalystDocumentDialog document={document} onClose={() => setDocument(null)} />
    </Panel>
  )
}

interface AnalystRequestsPanelProps {
  status: AnalystStatus
  onStatusChange: (status: AnalystStatus) => void
  selectedId: string | null
  onSelect: (request: AnalystRequestDto) => void
}

/** ANLY: the requests waiting, approved or rejected, newest first. */
export function AnalystRequestsPanel({
  status,
  onStatusChange,
  selectedId,
  onSelect,
}: AnalystRequestsPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const requests = useAnalystRequests(status)

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('displayName', {
          header: t('settings.profile.name'),
          meta: { width: '1fr' },
        }),
        helper.accessor((request) => request.organization ?? t('accounts.independent'), {
          id: 'organization',
          header: t('settings.profile.organization'),
          meta: { width: '1.1fr' },
        }),
        helper.accessor((request) => request.documents.length, {
          id: 'documents',
          header: t('analystRequests.documentsColumn'),
          meta: { width: '80px', align: 'right' },
        }),
        helper.accessor('requestedAt', {
          header: t('analystRequests.requestedColumn'),
          meta: { width: '92px' },
          cell: ({ getValue }) => format.date(getValue()),
        }),
        ...(status === 'pending'
          ? []
          : [
              helper.accessor((request) => request.decision?.at ?? '', {
                id: 'decided',
                header: t('analystRequests.decidedColumn'),
                meta: { width: '92px' },
                cell: ({ getValue }) => (getValue() ? format.date(getValue()) : ''),
              }),
              helper.accessor((request) => request.decision?.by ?? '', {
                id: 'by',
                header: t('analystRequests.byColumn'),
                meta: { width: '0.8fr' },
              }),
            ]),
      ]),
    [t, format, status],
  )

  return (
    <Panel
      title={t('panels.analystRequests')}
      code="ANLY"
      options={
        <PanelTabs
          value={status}
          options={STATUSES.map((value) => ({
            value,
            label: t(`analystRequests.tabs.${value}`),
          }))}
          onChange={onStatusChange}
        />
      }
    >
      <QueryView query={requests}>
        {(items) => (
          <DataTable
            data={items}
            columns={columns}
            getRowId={getRequestId}
            selectedRowId={selectedId}
            onRowClick={onSelect}
            exportName={`cmarket-analyst-requests-${status}`}
            emptyMessage={t(`analystRequests.empty.${status}`)}
          />
        )}
      </QueryView>
    </Panel>
  )
}
