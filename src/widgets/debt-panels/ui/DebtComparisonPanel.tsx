import { clsx } from 'clsx'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { billions, useDebtCompare } from '@/entities/debt'
import type { DebtComparisonDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const helper = createDataColumnHelper<DebtComparisonDto>()
const idOf = (row: DebtComparisonDto) => row.country

interface DebtComparisonPanelProps {
  /** The country shown, highlighted; CEMAC highlights none. */
  selected: string
  onSelect: (code: string) => void
}

/**
 * DEBT's CEMAC comparison (screen 35, sixth version): each state's outstanding on the BEAC's
 * market, its BTA share, its average maturity and rate, the largest first; a row picked shows
 * its state. API /debt/compare.
 */
export function DebtComparisonPanel({ selected, onSelect }: DebtComparisonPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const compare = useDebtCompare()

  const columns = useMemo(() => {
    const optional = (value: number | null, render: (value: number) => string) =>
      value === null ? '—' : render(value)
    return helper.columns([
      helper.accessor('country', {
        header: t('debt.compare.columns.country'),
        cell: ({ getValue }) => (
          <span className={clsx(getValue() === selected && 'text-accent-amber')}>{getValue()}</span>
        ),
      }),
      helper.accessor((row) => billions(row.outstanding), {
        id: 'outstanding',
        header: t('debt.compare.columns.outstanding'),
        meta: { align: 'right' },
        cell: ({ getValue }) => format.number(getValue(), 0),
      }),
      helper.accessor('btaSharePct', {
        header: t('debt.compare.columns.btaShare'),
        meta: { align: 'right' },
        cell: ({ getValue }) => (
          <span className="text-secondary">
            {optional(getValue(), (value) => format.percent(value, 0, false))}
          </span>
        ),
      }),
      helper.accessor('averageMaturityYears', {
        header: t('debt.compare.columns.maturity'),
        meta: { align: 'right' },
        cell: ({ getValue }) => optional(getValue(), (value) => format.number(value, 1)),
      }),
      helper.accessor('averageRatePct', {
        header: t('debt.compare.columns.rate'),
        meta: { align: 'right' },
        cell: ({ getValue }) => optional(getValue(), (value) => format.percent(value, 2, false)),
      }),
    ])
  }, [t, format, selected])

  return (
    <Panel
      title={t('panels.debtCompare')}
      code="DEBT"
      options={t('debt.compare.options')}
      bodyClassName="flex flex-col"
    >
      <QueryView
        query={compare}
        isEmpty={(data) => data.countries.every((row) => row.outstanding === 0)}
        emptyMessage={t('debt.compare.empty')}
      >
        {(data) => (
          <DataTable
            data={data.countries}
            columns={columns}
            getRowId={idOf}
            selectedRowId={selected}
            onRowClick={(row) => onSelect(row.country)}
            exportName="debt-cemac-comparison"
          />
        )}
      </QueryView>
      <p className="shrink-0 border-t px-3 py-1 font-sans text-title text-secondary">
        {t('debt.compare.note')}
      </p>
    </Panel>
  )
}
