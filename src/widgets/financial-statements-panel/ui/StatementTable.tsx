import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { FinancialLineDto, FinancialLineUnit } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { ChangeText } from '@/shared/ui/ChangeText'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'

const helper = createDataColumnHelper<FinancialLineDto>()
const getLineKey = (line: FinancialLineDto) => line.key

interface StatementTableProps {
  fiscalYears: readonly number[]
  currency: string
  lines: FinancialLineDto[]
  exportName: string
}

/**
 * Line items by fiscal year, then the growth over the years shown: CAGR for amounts, change in
 * points for percentages (screen 3 mockup). The lines keep their order: no sorting.
 */
export function StatementTable({ fiscalYears, currency, lines, exportName }: StatementTableProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const years = fiscalYears.join(',')

  const columns = useMemo(() => {
    const value = (unit: FinancialLineUnit, amount: number) =>
      unit === 'percent' ? format.percent(amount, 1, false) : format.number(amount, 0)
    return helper.columns([
      helper.accessor((line) => t(`financials.lines.${line.key}`, { currency }), {
        id: 'line',
        header: t('financials.lineItem'),
        meta: { width: 'minmax(104px, 1.8fr)' },
        cell: ({ getValue }) => (
          <span title={getValue()} className="font-sans">
            {getValue()}
          </span>
        ),
      }),
      ...years.split(',').map((year, index) =>
        helper.accessor((line) => line.values[index] ?? undefined, {
          id: year,
          header: year,
          meta: { align: 'right' },
          cell: ({ row, getValue }) => {
            const amount = getValue()
            return amount === undefined ? '—' : value(row.original.unit, amount)
          },
        }),
      ),
      helper.accessor((line) => line.growth ?? undefined, {
        id: 'growth',
        header: t('financials.cagr'),
        meta: { align: 'right', width: '76px' },
        cell: ({ row, getValue }) => {
          const growth = getValue()
          if (growth === undefined) return '—'
          return row.original.unit === 'percent' ? (
            <ChangeText value={growth} decimals={1} suffix={t('financials.points')} />
          ) : (
            <ChangeText value={growth} percent decimals={1} />
          )
        },
      }),
    ])
  }, [t, format, currency, years])

  return (
    <DataTable
      data={lines}
      columns={columns}
      getRowId={getLineKey}
      enableSorting={false}
      exportName={exportName}
    />
  )
}
