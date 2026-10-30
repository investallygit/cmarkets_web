import type { TFunction } from 'i18next'
import { FileText, Lock } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useIncome } from '@/entities/portfolio'
import { useHasPermission } from '@/entities/session'
import type { IncomeDto, IncomeItemDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { securityPath } from '@/shared/routes/paths'
import { createDataColumnHelper, type DataColumns } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Button } from '@/shared/ui/form/Button'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const helper = createDataColumnHelper<IncomeItemDto>()
const rowId = (item: IncomeItemDto) => `${item.date}|${item.securityId}|${item.kind}`

/** "Dividend", "Coupon", "Coupon + amort." when principal comes with it, "Redemption". */
function kindLabel(t: TFunction, item: IncomeItemDto): string {
  if (item.kind === 'coupon' && item.principal > 0) return t('portfolio.income.couponAndPrincipal')
  return t(`portfolio.income.kinds.${item.kind}`)
}

function buildColumns(
  t: TFunction,
  format: ReturnType<typeof useFormat>,
  currency: string,
): DataColumns<IncomeItemDto> {
  return [
    helper.accessor('date', {
      header: t('columns.date'),
      meta: { width: '96px' },
      cell: ({ getValue }) => format.isoDate(getValue()),
    }),
    helper.accessor('securityCode', {
      header: t('columns.security'),
      meta: { width: '1.2fr' },
      cell: ({ getValue }) => <span className="text-accent-amber">{getValue()}</span>,
    }),
    helper.accessor((item) => kindLabel(t, item), {
      id: 'kind',
      header: t('columns.type'),
      meta: { width: '1.2fr' },
      cell: ({ getValue }) => <span className="font-sans">{getValue()}</span>,
    }),
    helper.accessor((item) => item.income + item.principal, {
      id: 'amount',
      header: t('portfolio.income.amount', { currency }),
      meta: { align: 'right', width: '1.2fr' },
      cell: ({ row, getValue }) => (
        <span
          title={
            row.original.principal > 0 && row.original.income > 0
              ? t('portfolio.income.split', {
                  income: format.number(row.original.income, 0),
                  principal: format.number(row.original.principal, 0),
                })
              : undefined
          }
        >
          {format.number(getValue(), 0)}
        </span>
      ),
    }),
  ]
}

interface PortfolioIncomePanelProps {
  portfolioId: string
  /** upcoming: from the issuers' calendars; received: as the transactions recorded it. */
  variant?: 'upcoming' | 'received'
  /** "Generate portfolio PDF report" under the list, as in the mockup. */
  onGenerateReport?: () => void
}

/**
 * Screen 5, income: dividends, coupons and redemptions of the lines held, upcoming or received
 * (spec section 4). API GET /portfolios/{id}/income.
 */
export function PortfolioIncomePanel({
  portfolioId,
  variant = 'upcoming',
  onGenerateReport,
}: PortfolioIncomePanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const navigate = useNavigate()
  const canReport = useHasPermission('portfolios:reports')
  const income = useIncome(portfolioId)
  const currency = income.data?.currency ?? ''
  const columns = useMemo(() => buildColumns(t, format, currency), [t, format, currency])
  const items = (data: IncomeDto) => (variant === 'upcoming' ? data.upcoming : data.received)

  return (
    <Panel
      title={variant === 'upcoming' ? t('panels.upcomingIncome') : t('panels.receivedIncome')}
      code="PORT"
    >
      <QueryView query={income}>
        {(data) => (
          <div className="flex h-full flex-col">
            <div className="min-h-0 flex-1">
              <DataTable
                data={items(data)}
                columns={columns}
                getRowId={rowId}
                onRowDoubleClick={(item) => void navigate(securityPath(item.securityId))}
                exportName={
                  variant === 'upcoming' ? 'port-upcoming-income' : 'port-received-income'
                }
                emptyMessage={
                  variant === 'upcoming'
                    ? t('portfolio.income.noneUpcoming')
                    : t('portfolio.income.noneReceived')
                }
              />
            </div>
            <p className="shrink-0 border-t px-2 py-1 font-sans text-title text-secondary">
              {variant === 'upcoming'
                ? t('portfolio.income.upcomingTotal', {
                    amount: format.number(data.upcoming3Months, 0),
                    currency,
                  })
                : t('portfolio.income.receivedTotal', {
                    amount: format.number(data.receivedYtd, 0),
                    currency,
                  })}
            </p>
            {onGenerateReport && (
              <div className="shrink-0 border-t p-2">
                {canReport ? (
                  <Button
                    variant="info"
                    icon={FileText}
                    className="w-full"
                    onClick={onGenerateReport}
                  >
                    {t('portfolio.reports.generateLink')}
                  </Button>
                ) : (
                  <p className="flex items-center justify-center gap-1.5 font-sans text-data text-secondary">
                    <Lock aria-hidden className="size-3" />
                    {t('portfolio.reports.locked')}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </QueryView>
    </Panel>
  )
}
