import type { TFunction } from 'i18next'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { rangeFrom, usePerformance } from '@/entities/portfolio'
import type { PeriodReturnDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { useMarketDay } from '@/shared/lib/useMarketDay'
import { ChangeText } from '@/shared/ui/ChangeText'
import { createDataColumnHelper, type DataColumns } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const helper = createDataColumnHelper<PeriodReturnDto>()
const getPeriod = (row: PeriodReturnDto) => row.period

function change(value: number | undefined, suffix?: string) {
  return value === undefined ? '—' : <ChangeText value={value} percent={!suffix} suffix={suffix} />
}

function buildColumns(
  t: TFunction,
  format: ReturnType<typeof useFormat>,
): DataColumns<PeriodReturnDto> {
  return [
    helper.accessor((row) => t(`portfolio.periods.${row.period}`), {
      id: 'period',
      header: t('portfolio.returns.period'),
      meta: { width: '1.3fr' },
      cell: ({ row, getValue }) => (
        <span
          className="font-sans"
          title={t('portfolio.returns.since', { date: format.isoDate(row.original.from) })}
        >
          {getValue()}
        </span>
      ),
    }),
    helper.accessor('twrPct', {
      header: t('portfolio.returns.portfolio'),
      meta: { align: 'right' },
      cell: ({ getValue }) => change(getValue()),
    }),
    helper.accessor((row) => row.benchmarkPct ?? undefined, {
      id: 'benchmark',
      header: t('portfolio.returns.benchmark'),
      meta: { align: 'right' },
      cell: ({ getValue }) => change(getValue()),
    }),
    helper.accessor((row) => row.outperformancePts ?? undefined, {
      id: 'outperformance',
      header: t('portfolio.returns.outperformance'),
      meta: { align: 'right' },
      cell: ({ getValue }) => change(getValue(), t('portfolio.points')),
    }),
    helper.accessor((row) => row.annualizedPct ?? undefined, {
      id: 'annualized',
      header: t('portfolio.returns.annualized'),
      meta: { align: 'right' },
      cell: ({ getValue }) => change(getValue()),
    }),
  ]
}

/**
 * Returns by period (spec section 4: day, month, year, since inception), time-weighted, against
 * the benchmark; annualized beyond a year. The table twin of the performance chart.
 */
export function PortfolioReturnsPanel({ portfolioId }: { portfolioId: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  // The periods come with any range: the header's year-to-date series is reused.
  const performance = usePerformance(portfolioId, { from: rangeFrom('ytd', useMarketDay()) })
  const columns = useMemo(() => buildColumns(t, format), [t, format])

  return (
    <Panel title={t('panels.returns')} code="PORT">
      <QueryView query={performance}>
        {(data) => (
          <div className="flex h-full flex-col">
            <div className="min-h-0 flex-1">
              <DataTable
                data={data.periods}
                columns={columns}
                getRowId={getPeriod}
                enableSorting={false}
                exportName="port-returns"
                emptyMessage={t('portfolio.performance.noHistory')}
              />
            </div>
            <p className="shrink-0 border-t px-2 py-1 font-sans text-title text-secondary">
              {t('portfolio.returns.note', { benchmark: data.benchmark.name })}
            </p>
          </div>
        )}
      </QueryView>
    </Panel>
  )
}
