import type { TFunction } from 'i18next'
import { clsx } from 'clsx'
import { useContext, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { BondPriceCashFlowDto, BondPriceRequestDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { createDataColumnHelper, type DataColumns } from '@/shared/ui/dataColumns'
import { DataTable, type TableExporter } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { TableExportContext } from '@/shared/ui/tableExport'
import { PricedView } from './PricedView'

const helper = createDataColumnHelper<BondPriceCashFlowDto>()
const getDate = (row: BondPriceCashFlowDto) => row.date

function buildColumns(
  t: TFunction,
  format: ReturnType<typeof useFormat>,
): DataColumns<BondPriceCashFlowDto> {
  const figure = (
    key: 'years' | 'coupon' | 'principal' | 'cashFlow' | 'discountFactor' | 'presentValue',
    decimals: number,
    width: string,
    className?: string,
  ) =>
    helper.accessor(key, {
      header: t(`bondPricing.columns.${key}`),
      meta: { align: 'right', width },
      cell: ({ getValue }) => (
        <span className={className}>{format.number(getValue(), decimals)}</span>
      ),
    })
  return [
    helper.accessor('date', {
      header: t('bondPricing.columns.date'),
      meta: { width: '1.1fr' },
      cell: ({ getValue }) => format.isoDate(getValue()),
    }),
    figure('years', 4, '0.9fr', 'text-secondary'),
    figure('coupon', 4, '0.9fr'),
    figure('principal', 4, '0.9fr'),
    figure('cashFlow', 4, '1.1fr'),
    figure('discountFactor', 6, '1.1fr', 'text-secondary'),
    figure('presentValue', 4, '1fr'),
  ]
}

interface CashFlowSchedulePanelProps {
  request: BondPriceRequestDto | null
}

/**
 * Screen 16, cash-flow schedule: each payment still to come per 100 of the principal outstanding,
 * its time in years, its discount factor and present value; the total is the dirty price. XLSX for
 * the accounts that export.
 */
export function CashFlowSchedulePanel({ request }: CashFlowSchedulePanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const canExport = useContext(TableExportContext)
  const exportRef = useRef<TableExporter | null>(null)
  const columns = useMemo(() => buildColumns(t, format), [t, format])

  return (
    <Panel
      title={t('bondPricing.cashFlows')}
      code="BP"
      options={
        canExport && (
          <button
            type="button"
            onClick={() => exportRef.current?.('xlsx')}
            className="panel-no-drag uppercase hover:text-primary"
          >
            {t('bondPricing.export')}
          </button>
        )
      }
      bodyClassName="flex flex-col"
    >
      <PricedView request={request}>
        {(data, stale) => (
          <>
            <div className={clsx('min-h-0 flex-1', stale && 'opacity-60')}>
              <DataTable
                data={data.cashFlows}
                columns={columns}
                getRowId={getDate}
                enableSorting={false}
                exportName="bp-cash-flows"
                exportRef={exportRef}
                footer={{
                  cells: {
                    date: <span className="text-accent-amber">{t('bondPricing.total')}</span>,
                    presentValue: (
                      <span className="text-accent-amber">
                        {format.number(data.pricing.dirtyPrice, 4)}
                      </span>
                    ),
                  },
                  values: { date: t('bondPricing.total'), presentValue: data.pricing.dirtyPrice },
                }}
              />
            </div>
            <p className="shrink-0 border-t px-2 py-1 font-sans text-title text-secondary">
              {t('bondPricing.cashFlowsNote')}
            </p>
          </>
        )}
      </PricedView>
    </Panel>
  )
}
