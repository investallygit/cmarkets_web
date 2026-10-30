import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useMarketSummary } from '@/entities/market'
import { LiveIndexChange, LiveIndexChangePct, LiveIndexValue } from '@/entities/quote'
import type { IndexQuoteDto } from '@/shared/api/contracts'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const helper = createDataColumnHelper<IndexQuoteDto>()
const getIndexId = (index: IndexQuoteDto) => index.code

interface IndicesPanelProps {
  /** Highlighted index (null: the first one). */
  selectedCode?: string | null
  onSelect?: (code: string) => void
}

/** Screen 1, Indices: value, change, % change; click = index chart. API /market/summary. */
export function IndicesPanel({ selectedCode = null, onSelect }: IndicesPanelProps) {
  const { t } = useTranslation()
  const summary = useMarketSummary()

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('name', { header: t('columns.index'), meta: { width: '2fr' } }),
        helper.accessor('value', {
          header: t('columns.value'),
          meta: { align: 'right' },
          cell: ({ row }) => <LiveIndexValue index={row.original} />,
        }),
        helper.accessor('change', {
          header: t('columns.change'),
          meta: { align: 'right' },
          cell: ({ row }) => <LiveIndexChange index={row.original} />,
        }),
        helper.accessor('changePct', {
          header: t('columns.changePct'),
          meta: { align: 'right' },
          cell: ({ row }) => <LiveIndexChangePct index={row.original} />,
        }),
      ]),
    [t],
  )

  return (
    <Panel title={t('panels.indices')} code="MKT">
      <QueryView query={summary}>
        {({ indices }) => (
          <DataTable
            data={indices}
            columns={columns}
            getRowId={getIndexId}
            selectedRowId={selectedCode ?? indices.at(0)?.code}
            onRowClick={onSelect && ((index: IndexQuoteDto) => onSelect(index.code))}
            exportName="indices"
          />
        )}
      </QueryView>
    </Panel>
  )
}
