import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCorrections } from '@/entities/stored-price'
import type { PriceCorrectionDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Pager } from '@/shared/ui/Pager'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const helper = createDataColumnHelper<PriceCorrectionDto>()
const getCorrectionId = (correction: PriceCorrectionDto) => correction.id

/**
 * CORR: the log of manual corrections (GET /data/corrections), newest first: when, who, the
 * session, the close before and after, and why. The audit log (AUDT) keeps them too.
 */
export function CorrectionsLogPanel({
  onOpen,
}: {
  onOpen: (correction: PriceCorrectionDto) => void
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const [page, setPage] = useState(1)
  const corrections = useCorrections(null, page)

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('correctedAt', {
          header: t('corrections.when'),
          meta: { width: '96px' },
          cell: ({ getValue }) => `${format.dayMonth(getValue())} ${format.time(getValue())}`,
        }),
        helper.accessor('securityId', {
          header: t('columns.security'),
          meta: { width: '1fr' },
          cell: ({ getValue }) => <span className="text-accent-amber">{getValue()}</span>,
        }),
        helper.accessor('date', {
          header: t('corrections.session'),
          meta: { width: '88px' },
          cell: ({ getValue }) => format.isoDate(getValue()),
        }),
        helper.accessor((correction) => correction.after.close, {
          id: 'close',
          header: t('corrections.fields.close'),
          meta: { align: 'right', width: '1.4fr' },
          cell: ({ row }) =>
            `${format.number(row.original.before.close, 2)} → ${format.number(row.original.after.close, 2)}`,
        }),
        helper.accessor('reason', {
          header: t('corrections.reason'),
          meta: { width: '2fr' },
          cell: ({ getValue }) => <span title={getValue()}>{getValue()}</span>,
        }),
        helper.accessor('correctedBy', {
          header: t('dataImport.history.by'),
          meta: { width: '1fr' },
        }),
      ]),
    [t, format],
  )

  return (
    <Panel title={t('panels.corrections')} code="CORR" bodyClassName="flex flex-col">
      <div className="min-h-0 flex-1">
        <QueryView query={corrections}>
          {(result) => (
            <DataTable
              data={result.items}
              columns={columns}
              getRowId={getCorrectionId}
              onRowClick={onOpen}
              exportName="cmarket-corrections"
              emptyMessage={t('corrections.none')}
            />
          )}
        </QueryView>
      </div>
      {corrections.data && (
        <Pager
          page={corrections.data.page}
          pageSize={corrections.data.pageSize}
          totalCount={corrections.data.totalCount}
          onChange={setPage}
        />
      )}
    </Panel>
  )
}
