import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CompletionRatio, useRfqParticipants } from '@/entities/rfq'
import type { RfqParticipantDto } from '@/shared/api/contracts'
import { DataTable } from '@/shared/ui/DataTable'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const helper = createDataColumnHelper<RfqParticipantDto>()

/**
 * Every participant's ratios on the Admin's RFQ screen (ROADMAP decision 52): the organisations
 * with cases over the window, as a requester and as a responder, their open disputes; one picked
 * shows its cases beside.
 */
export function ParticipantsPanel({
  selected,
  onSelect,
}: {
  selected: string | null
  onSelect: (organizationId: string) => void
}) {
  const { t } = useTranslation()
  const participants = useRfqParticipants()
  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('organization', {
          header: t('rfqCompletion.admin.columns.organization'),
          meta: { width: 'minmax(140px, 2fr)' },
          cell: ({ getValue }) => <span className="text-primary">{getValue()}</span>,
        }),
        helper.accessor((row) => row.completion.requester.percent ?? -1, {
          id: 'requester',
          header: t('rfqCompletion.roles.requester'),
          meta: { align: 'right', width: 'minmax(90px, 1fr)' },
          cell: ({ row }) => <CompletionRatio completion={row.original.completion.requester} />,
        }),
        helper.accessor((row) => row.completion.responder.percent ?? -1, {
          id: 'responder',
          header: t('rfqCompletion.roles.responder'),
          meta: { align: 'right', width: 'minmax(90px, 1fr)' },
          cell: ({ row }) => <CompletionRatio completion={row.original.completion.responder} />,
        }),
        helper.accessor('openDisputes', {
          header: t('rfqCompletion.admin.columns.openDisputes'),
          meta: { align: 'right', width: '80px' },
          cell: ({ getValue }) => (
            <span className={getValue() > 0 ? 'text-warning' : 'text-secondary'}>{getValue()}</span>
          ),
        }),
      ]),
    [t],
  )
  return (
    <Panel title={t('rfqCompletion.admin.participants')}>
      <QueryView query={participants}>
        {(rows) => (
          <DataTable
            data={rows}
            columns={columns}
            getRowId={(row) => row.organizationId}
            selectedRowId={selected}
            onRowClick={(row) => onSelect(row.organizationId)}
            emptyMessage={t('rfqCompletion.admin.noParticipant')}
            exportName="rfq-completion"
          />
        )}
      </QueryView>
    </Panel>
  )
}
