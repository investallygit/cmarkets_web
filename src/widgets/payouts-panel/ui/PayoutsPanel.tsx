import { CircleCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PayoutStatusText, useAdminPayouts } from '@/entities/payout'
import { useMarkPaid } from '@/features/mark-payout-paid'
import type { AdminPayoutDto, PayoutStatus } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { useSearchParamsUpdate, withParams } from '@/shared/routes/useSearchParamsUpdate'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Button } from '@/shared/ui/form/Button'
import { Select } from '@/shared/ui/form/Select'
import type { MenuItem } from '@/shared/ui/menu'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const helper = createDataColumnHelper<AdminPayoutDto>()
const getPayoutId = (payout: AdminPayoutDto) => payout.id
const STATUSES: readonly PayoutStatus[] = ['due', 'accruing', 'paid']

/**
 * PAY, analyst payouts: by analyst and month, the sales, revenue, CMarket's commission and the net
 * payable, with its status; "Mark paid" with a confirmation once the transfer is made
 * (GET /admin/payouts, POST /admin/payouts/{id}/mark-paid). The filters stay in the URL.
 * "Mark paid" sits in the title bar for the payout selected, a 24 px target that a button in a
 * 22 px row could not be (WCAG 2.5.8); a double click, Enter or the right-click menu also asks.
 */
export function PayoutsPanel() {
  const { t } = useTranslation()
  const format = useFormat()
  const [params, updateParams] = useSearchParamsUpdate()
  const { ask, dialog } = useMarkPaid()
  // Every statement, for the choices of the filters and the total due.
  const all = useAdminPayouts()
  const statusParam = params.get('status')
  const status = STATUSES.find((value) => value === statusParam)
  const month = params.get('month') ?? undefined
  const analystId = params.get('analyst') ?? undefined
  const payouts = useAdminPayouts({ status, month, analystId })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = payouts.data?.find((payout) => payout.id === selectedId)
  const setFilter = (values: Record<string, string>) =>
    updateParams((current) => withParams(current, values))

  const months = [...new Set((all.data ?? []).map((payout) => payout.month))]
  const analysts = [
    ...new Map((all.data ?? []).map((payout) => [payout.analyst.id, payout.analyst])).values(),
  ].sort((a, b) => a.displayName.localeCompare(b.displayName))
  const due = (all.data ?? []).filter((payout) => payout.status === 'due')
  const xaf = (amount: number) => format.number(amount, 0)

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('month', {
          header: t('payouts.month'),
          meta: { width: '132px' },
          cell: ({ getValue }) => format.month(getValue()),
        }),
        helper.accessor((payout) => payout.analyst.displayName, {
          id: 'analyst',
          header: t('payouts.analyst'),
          meta: { width: '1fr' },
        }),
        helper.accessor('sales', {
          header: t('payouts.sales'),
          meta: { width: '64px', align: 'right' },
          cell: ({ getValue }) => format.number(getValue(), 0),
        }),
        helper.accessor('revenue', {
          header: t('payouts.revenue'),
          meta: { width: '0.8fr', align: 'right' },
          cell: ({ getValue }) => format.number(getValue(), 0),
        }),
        helper.accessor('commission', {
          header: t('payouts.commission'),
          meta: { width: '0.8fr', align: 'right' },
          cell: ({ getValue }) => format.number(getValue(), 0),
        }),
        helper.accessor('net', {
          header: t('payouts.net'),
          meta: { width: '0.8fr', align: 'right' },
          cell: ({ getValue }) => (
            <span className="font-semibold">{format.number(getValue(), 0)}</span>
          ),
        }),
        helper.accessor((payout) => t(`payouts.statuses.${payout.status}`), {
          id: 'status',
          header: t('columns.status'),
          meta: { width: '104px' },
          cell: ({ row }) => <PayoutStatusText status={row.original.status} />,
        }),
        helper.accessor((payout) => payout.paidAt ?? '', {
          id: 'paidAt',
          header: t('payouts.paidOn'),
          meta: { width: '1fr' },
          cell: ({ row }) =>
            row.original.paidAt
              ? [format.isoDate(row.original.paidAt), row.original.paidBy]
                  .filter(Boolean)
                  .join(' · ')
              : '',
        }),
      ]),
    [t, format],
  )

  const rowMenu = (payout: AdminPayoutDto): MenuItem[] =>
    payout.status === 'due'
      ? [
          {
            id: 'mark-paid',
            label: t('payouts.markPaid'),
            icon: CircleCheck,
            onSelect: () => ask(payout),
          },
        ]
      : []

  const totals = (payouts.data ?? []).reduce(
    (sum, payout) => ({
      sales: sum.sales + payout.sales,
      revenue: sum.revenue + payout.revenue,
      commission: sum.commission + payout.commission,
      net: sum.net + payout.net,
    }),
    { sales: 0, revenue: 0, commission: 0, net: 0 },
  )

  return (
    <Panel
      title={t('panels.payouts')}
      code="PAY"
      options={
        <>
          {all.data && (
            <span>
              {t('payouts.dueTotal', {
                amount: xaf(due.reduce((sum, payout) => sum + payout.net, 0)),
                count: due.length,
              })}
            </span>
          )}
          <Button
            size="sm"
            variant="success"
            disabled={selected?.status !== 'due'}
            title={selected?.status === 'due' ? undefined : t('payouts.markPaidHint')}
            onClick={() => selected && ask(selected)}
            className="panel-no-drag"
          >
            {t('payouts.markPaid')}
          </Button>
        </>
      }
      bodyClassName="flex flex-col"
    >
      <div className="flex flex-wrap items-center gap-2 border-b p-2">
        <Select
          value={month ?? ''}
          prefix={t('payouts.monthFilter')}
          aria-label={t('payouts.month')}
          options={[
            { value: '', label: t('payouts.allMonths') },
            ...months.map((value) => ({ value, label: format.month(value) })),
          ]}
          onChange={(value) => setFilter({ month: value })}
          className="w-52"
        />
        <Select<PayoutStatus | ''>
          value={status ?? ''}
          prefix={t('payouts.statusFilter')}
          aria-label={t('columns.status')}
          options={[
            { value: '', label: t('payouts.allStatuses') },
            ...STATUSES.map((value) => ({ value, label: t(`payouts.statuses.${value}`) })),
          ]}
          onChange={(value) => setFilter({ status: value })}
          className="w-44"
        />
        <Select
          value={analystId ?? ''}
          prefix={t('payouts.analystFilter')}
          aria-label={t('payouts.analyst')}
          options={[
            { value: '', label: t('payouts.allAnalysts') },
            ...analysts.map((analyst) => ({ value: analyst.id, label: analyst.displayName })),
          ]}
          onChange={(value) => setFilter({ analyst: value })}
          className="w-56"
        />
        <span className="ml-auto font-sans text-data text-secondary">
          {t('payouts.commissionNote')}
        </span>
      </div>
      <div className="min-h-0 flex-1">
        <QueryView query={payouts}>
          {(items) => (
            <DataTable
              data={items}
              columns={columns}
              getRowId={getPayoutId}
              selectedRowId={selectedId}
              onRowClick={(payout) => setSelectedId(payout.id)}
              onRowDoubleClick={(payout) => {
                if (payout.status === 'due') ask(payout)
              }}
              rowMenu={rowMenu}
              exportName="cmarket-payouts"
              emptyMessage={t('payouts.none')}
              footer={
                items.length > 0
                  ? {
                      cells: {
                        month: t('payouts.total'),
                        sales: format.number(totals.sales, 0),
                        revenue: xaf(totals.revenue),
                        commission: xaf(totals.commission),
                        net: <span className="font-semibold">{xaf(totals.net)}</span>,
                      },
                      values: { month: t('payouts.total'), ...totals },
                    }
                  : undefined
              }
            />
          )}
        </QueryView>
      </div>
      {dialog}
    </Panel>
  )
}
