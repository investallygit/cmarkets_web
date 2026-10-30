import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { RATIO_KEYS, useFormatRatio, useRatios } from '@/entities/fundamentals'
import type { RatioKey, RatiosDto } from '@/shared/api/contracts'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

interface RatioRow {
  key: RatioKey
  value: number | null
  sectorAverage: number | null
}

const helper = createDataColumnHelper<RatioRow>()
const getRatioKey = (row: RatioRow) => row.key

const toRows = (data: RatiosDto): RatioRow[] =>
  RATIO_KEYS.map((key) => ({
    key,
    value: data.ratios[key],
    sectorAverage: data.sectorAverages[key],
  }))

interface RatiosPanelProps {
  securityId: string
  code: string
}

/**
 * FA tab: the computed ratios of spec section 3 (P/E, dividend yield, price-to-book, ROE,
 * leverage, margins) next to the sector's averages. API /securities/{id}/ratios.
 */
export function RatiosPanel({ securityId, code }: RatiosPanelProps) {
  const { t } = useTranslation()
  const formatRatio = useFormatRatio()
  const ratios = useRatios(securityId)
  const sector = ratios.data?.sector

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor((row) => t(`comparison.metrics.${row.key}`), {
          id: 'ratio',
          header: t('ratios.ratio'),
          meta: { width: 'minmax(0,1.6fr)' },
          cell: ({ getValue }) => <span className="font-sans">{getValue()}</span>,
        }),
        helper.accessor((row) => row.value ?? undefined, {
          id: 'value',
          header: code,
          meta: { align: 'right' },
          cell: ({ row }) => (
            <span className="text-accent-amber">
              {formatRatio(row.original.key, row.original.value)}
            </span>
          ),
        }),
        helper.accessor((row) => row.sectorAverage ?? undefined, {
          id: 'sectorAverage',
          header: t('ratios.sectorAverage'),
          meta: { align: 'right' },
          cell: ({ row }) => formatRatio(row.original.key, row.original.sectorAverage),
        }),
      ]),
    [t, code, formatRatio],
  )

  return (
    <Panel
      title={
        ratios.data && sector
          ? t('ratios.title', { year: ratios.data.fiscalYear, sector })
          : t('ratios.titleShort')
      }
      code="FA"
    >
      <QueryView query={ratios}>
        {(data) => (
          <DataTable
            data={toRows(data)}
            columns={columns}
            getRowId={getRatioKey}
            enableSorting={false}
            exportName={`${code}-ratios`}
          />
        )}
      </QueryView>
    </Panel>
  )
}
