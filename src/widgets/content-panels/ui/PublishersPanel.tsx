import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { usePublishers } from '@/entities/news-source'
import type { PublisherDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const helper = createDataColumnHelper<PublisherDto>()
const getId = (publisher: PublisherDto) => publisher.id

interface PublishersPanelProps {
  tabs: React.ReactNode
  selectedId: string | null
  onSelect: (id: string) => void
}

/**
 * NEWS, the publishers (spec section 16, GET /admin/publishers): the domains the Data admin named,
 * with the newspapers of the international API and the AI each names. A click opens it beside.
 */
export function PublishersPanel({ tabs, selectedId, onSelect }: PublishersPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const publishers = usePublishers()

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('domain', {
          header: t('publishers.domain'),
          meta: { width: '1.4fr' },
          cell: ({ getValue }) => <span className="font-mono">{getValue()}</span>,
        }),
        helper.accessor('name', { header: t('publishers.name'), meta: { width: '1.4fr' } }),
        helper.accessor('shortName', {
          header: t('publishers.shortName'),
          meta: { width: '1fr' },
          cell: ({ getValue }) => <span className="font-mono font-semibold">{getValue()}</span>,
        }),
        helper.accessor('sources', {
          header: t('publishers.sources'),
          meta: { align: 'right', width: '88px' },
        }),
        helper.accessor('updatedAt', {
          header: t('publishers.updated'),
          meta: { width: '1.4fr' },
          cell: ({ row, getValue }) =>
            t('publishers.updatedBy', {
              date: format.date(getValue()),
              name: row.original.updatedBy ?? '',
            }),
        }),
      ]),
    [t, format],
  )

  return (
    <Panel title={t('panels.publishers')} code="NEWS" options={tabs}>
      <QueryView query={publishers}>
        {(list) => (
          <DataTable
            data={list}
            columns={columns}
            getRowId={getId}
            selectedRowId={selectedId}
            onRowClick={(publisher) => onSelect(publisher.id)}
            exportName="publishers"
            emptyMessage={t('publishers.none')}
          />
        )}
      </QueryView>
    </Panel>
  )
}
