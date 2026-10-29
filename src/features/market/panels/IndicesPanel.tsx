import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { IndexQuoteDto } from '@/shared/api/contracts'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { useMarketSummary } from '../api'
import { LiveIndexChange, LiveIndexChangePct, LiveIndexValue } from '../components/LiveIndex'
import { useMarketSelection } from '../selection'

const helper = createDataColumnHelper<IndexQuoteDto>()
const getIndexId = (index: IndexQuoteDto) => index.code

/** Screen 1, Indices: value, change, % change; click = index chart. API /market/summary. */
export function IndicesPanel() {
  const { t } = useTranslation()
  const summary = useMarketSummary()
  const selectedCode = useMarketSelection((state) => state.indexCode)
  const selectIndex = useMarketSelection((state) => state.selectIndex)

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
            onRowClick={(index) => selectIndex(index.code)}
            exportName="indices"
          />
        )}
      </QueryView>
    </Panel>
  )
}
