import { ArrowRight } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useBondCashFlows } from '@/entities/bond'
import type { BondCashFlowsDto, UpcomingCashFlowDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { securityPath } from '@/shared/routes/paths'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const helper = createDataColumnHelper<UpcomingCashFlowDto>()

/**
 * Screen 20, upcoming cash flows: each payment to come per 100 of face value, coupon, principal
 * and total; the days to the next coupon; "Open in bond pricing (BP)", the profile's BP tab. API
 * /bonds/{id}/cashflows.
 */
export function UpcomingCashFlowsPanel({ bondId }: { bondId: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const flows = useBondCashFlows(bondId)

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
      helper.accessor('principal', {
        header: t('bondProfile.cashFlows.columns.principal'),
        meta: { align: 'right' },
        cell: ({ getValue }) => amount(getValue()),
      }),
      helper.accessor('total', {
        header: t('bondProfile.cashFlows.columns.total'),
        meta: { align: 'right' },
        cell: ({ getValue }) => amount(getValue()),
      }),
    ])
  }, [t, format])

  return (
    <Panel
      title={t('panels.upcomingCashFlows')}
      code="CF"
      options={<span>{t('bondProfile.cashFlows.perFace')}</span>}
      bodyClassName="flex min-h-0 flex-col"
    >
      <QueryView query={flows}>
        {(data) => (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <DataTable data={data.items} columns={columns} getRowId={(flow) => flow.date} />
            </div>
            <div className="flex shrink-0 flex-col gap-2 p-2">
              <NextPayment data={data} />
              <Link
                to={securityPath(bondId, 'bp')}
                className="flex h-8 items-center justify-center gap-1 border border-info font-sans text-label text-info hover:bg-info/10"
              >
                {t('bondProfile.cashFlows.openBp')}
                <ArrowRight aria-hidden className="size-3.5" />
              </Link>
            </div>
          </>
        )}
      </QueryView>
    </Panel>
  )
}

/** "Next coupon in 6 days."; a zero coupon's repayment; a matured bond. */
function NextPayment({ data }: { data: BondCashFlowsDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const last = data.items.at(-1)
  const text =
    data.daysToNextCoupon === 0
      ? t('bondProfile.cashFlows.couponToday')
      : data.daysToNextCoupon !== null
        ? t('bondProfile.cashFlows.nextCoupon', { count: data.daysToNextCoupon })
        : last
          ? t('bondProfile.cashFlows.zeroCoupon', { date: format.isoDate(last.date) })
          : t('bondProfile.cashFlows.matured')
  return <p className="font-sans text-data text-warning">{text}</p>
}
