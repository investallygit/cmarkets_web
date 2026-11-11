import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useBond } from '@/entities/bond'
import type { BondCashFlowDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { useMarketDay } from '@/shared/lib/useMarketDay'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const helper = createDataColumnHelper<BondCashFlowDto>()

/**
 * Screen 20, CF tab: every payment of the bond's schedule, coupon, principal repaid and their
 * total per 100 of original face value, and the principal outstanding after it; the past ones in
 * grey. API /bonds/{id}.
 */
export function RedemptionSchedulePanel({ securityId }: { securityId: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const bond = useBond(securityId)
  const today = useMarketDay()

  const columns = useMemo(() => {
    const amount = (value: number) => format.number(value, 4)
    return helper.columns([
      helper.accessor('date', {
        header: t('bondProfile.cashFlows.columns.date'),
        cell: ({ getValue }) => format.isoDate(getValue()),
      }),
      helper.accessor('coupon', {
        header: t('bondProfile.cashFlows.columns.coupon'),
        meta: { align: 'right' },
        cell: ({ getValue }) => amount(getValue()),
      }),
      helper.accessor('amortization', {
        header: t('bondProfile.cashFlows.columns.principal'),
        meta: { align: 'right' },
        cell: ({ getValue }) => amount(getValue()),
      }),
      helper.accessor((flow) => flow.coupon + flow.amortization, {
        id: 'total',
        header: t('bondProfile.cashFlows.columns.total'),
        meta: { align: 'right' },
        cell: ({ getValue }) => amount(getValue()),
      }),
      helper.accessor('outstanding', {
        header: t('bondProfile.cashFlows.columns.outstanding'),
        meta: { align: 'right' },
        cell: ({ getValue }) => amount(getValue()),
      }),
    ])
  }, [t, format])

  return (
    <Panel
      title={t('panels.cashFlowSchedule')}
      code="CF"
      options={<span>{t('bondProfile.cashFlows.perFace')}</span>}
    >
      <QueryView query={bond}>
        {(terms) => (
          <DataTable
            data={terms.schedule}
            columns={columns}
            getRowId={(flow) => flow.date}
            rowClassName={(flow) => (flow.date < today ? 'text-secondary' : undefined)}
            exportName={`schedule-${securityId}`}
          />
        )}
      </QueryView>
    </Panel>
  )
}
