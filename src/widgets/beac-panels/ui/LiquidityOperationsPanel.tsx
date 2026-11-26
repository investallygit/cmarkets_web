import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useBeacOperations } from '@/entities/beac'
import type { BeacOperationDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const helper = createDataColumnHelper<BeacOperationDto>()
const idOf = (operation: BeacOperationDto) => operation.id

/**
 * BEAC's liquidity injections (screen 34): the weekly and monthly tenders, newest first, their
 * term, the amounts offered, bid and allotted (XAF bn) and their rate; under them, whether the
 * latest one's demand was above the offer. API /beac/operations.
 */
export function LiquidityOperationsPanel() {
  const { t } = useTranslation()
  const format = useFormat()
  const operations = useBeacOperations()
  const latest = operations.data?.items[0]

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('date', {
          header: t('beac.operations.columns.date'),
          cell: ({ getValue }) => format.isoDate(getValue()),
        }),
        helper.accessor('termDays', {
          header: t('beac.operations.columns.term'),
          cell: ({ row, getValue }) => {
            const term = t('beac.operations.days', { count: getValue() })
            return row.original.kind === 'absorption'
              ? t('beac.operations.absorption', { term })
              : term
          },
        }),
        helper.accessor('offered', {
          header: t('beac.operations.columns.offered'),
          meta: { align: 'right' },
          cell: ({ getValue }) => format.number(getValue(), 1),
        }),
        helper.accessor('bid', {
          header: t('beac.operations.columns.bid'),
          meta: { align: 'right' },
          cell: ({ getValue }) => format.number(getValue(), 1),
        }),
        helper.accessor('allotted', {
          header: t('beac.operations.columns.allotted'),
          meta: { align: 'right' },
          cell: ({ getValue }) => format.number(getValue(), 1),
        }),
        helper.accessor('rate', {
          header: t('beac.operations.columns.rate'),
          meta: { align: 'right' },
          cell: ({ getValue }) => (
            <span className="text-accent-amber">{format.percent(getValue(), 2, false)}</span>
          ),
        }),
      ]),
    [t, format],
  )

  return (
    <Panel
      title={t('panels.beacOperations')}
      code="BEAC"
      options={t('beac.operations.options')}
      bodyClassName="flex flex-col"
    >
      <QueryView
        query={operations}
        isEmpty={(result) => result.items.length === 0}
        emptyMessage={t('beac.operations.empty')}
      >
        {(result) => (
          <DataTable
            data={result.items}
            columns={columns}
            getRowId={idOf}
            exportName="beac-operations"
          />
        )}
      </QueryView>
      <div className="shrink-0 border-t px-2 py-1 font-sans text-title text-secondary">
        {latest && (
          <p>
            {latest.bid > latest.offered ? t('beac.operations.tight') : t('beac.operations.ample')}
          </p>
        )}
        <p>{t('beac.operations.source')}</p>
      </div>
    </Panel>
  )
}
