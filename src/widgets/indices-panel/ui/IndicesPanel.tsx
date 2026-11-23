import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { hasIndexProfile, useMarketSummary } from '@/entities/market'
import {
  LiveIndexChange,
  LiveIndexChangePct,
  LiveIndexValue,
  useLiveIndexRows,
} from '@/entities/quote'
import type { IndexQuoteDto } from '@/shared/api/contracts'
import { useSymbolSubscription } from '@/shared/realtime'
import { indexPath } from '@/shared/routes/paths'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { DownloadDataLink } from '@/features/download-data'

const helper = createDataColumnHelper<IndexQuoteDto>()
const getIndexId = (index: IndexQuoteDto) => index.code

interface IndicesPanelProps {
  /** Highlighted index (null: the first one). */
  selectedCode?: string | null
  onSelect?: (code: string) => void
}

/**
 * Screen 1, Indices: value, change, % change; click = index chart, double click = the index
 * profile (screen 31, fifth version). API /market/summary.
 */
export function IndicesPanel({ selectedCode = null, onSelect }: IndicesPanelProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const summary = useMarketSummary()
  // IndexUpdated reaches only the screens that follow the index.
  useSymbolSubscription(summary.data?.indices.map((index) => index.code) ?? [])
  // The values shown, so that a sorted column follows them (B42).
  const indices = useLiveIndexRows(summary.data?.indices)

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
    <Panel
      title={t('panels.indices')}
      code="MKT"
      options={
        <DownloadDataLink
          dataset="indices"
          items={indices.map((index) => index.code).filter((code) => code !== 'MCAP')}
          what={t('panels.indices')}
        />
      }
    >
      <QueryView query={summary}>
        {() => (
          <DataTable
            data={indices}
            columns={columns}
            getRowId={getIndexId}
            selectedRowId={selectedCode ?? indices.at(0)?.code}
            onRowClick={onSelect && ((index: IndexQuoteDto) => onSelect(index.code))}
            onRowDoubleClick={(index: IndexQuoteDto) => {
              if (hasIndexProfile(index.code)) void navigate(indexPath(index.code))
            }}
            exportName="indices"
          />
        )}
      </QueryView>
    </Panel>
  )
}
