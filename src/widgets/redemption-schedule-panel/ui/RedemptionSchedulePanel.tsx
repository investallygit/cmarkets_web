import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useBond } from '@/entities/bond'
import type { BondCashFlowDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { toMarketDay } from '@/shared/lib/format'
import { useNow } from '@/shared/lib/useNow'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const helper = createDataColumnHelper<BondCashFlowDto>()

/**
 * Screen 2 for a bond, in place of the dividends: coupons and redemptions per 100 of face value,
 * past payments in grey. API /bonds/{id}.
 */
export function RedemptionSchedulePanel({ securityId }: { securityId: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const bond = useBond(securityId)
  const today = toMarketDay(useNow(60 * 60_000))

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('date', {
          header: t('columns.date'),
          cell: ({ getValue }) => format.isoDate(getValue()),
        }),
        helper.accessor('coupon', {
          header: t('columns.coupon'),
          meta: { align: 'right' },
          cell: ({ getValue }) => format.number(getValue(), 2),
        }),
        helper.accessor('amortization', {
          header: t('columns.amortization'),
          meta: { align: 'right' },
          cell: ({ getValue }) => format.number(getValue(), 2),
        }),
        helper.accessor('outstanding', {
          header: t('columns.outstanding'),
          meta: { align: 'right' },
          cell: ({ getValue }) => format.number(getValue(), 2),
        }),
      ]),
    [t, format],
  )

  return (
    <Panel title={t('panels.redemptions')} code="DES">
      <QueryView query={bond}>
        {(terms) => (
          <DataTable
            data={terms.schedule}
            columns={columns}
            getRowId={(flow) => flow.date}
            rowClassName={(flow) => (flow.date <= today ? 'text-secondary' : undefined)}
            exportName={`schedule-${securityId}`}
          />
        )}
      </QueryView>
    </Panel>
  )
}
