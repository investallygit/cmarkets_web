import { Briefcase, Plus, SlidersHorizontal } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useParams } from 'react-router'
import {
  openPortfolioDialog,
  openTransactionDialog,
  usePortfolio,
  usePortfolios,
} from '@/entities/portfolio'
import { useHasPermission } from '@/entities/session'
import { PortfolioDialogHost, usePortfolioQuota } from '@/features/manage-portfolios'
import { ImportTransactionsDialog, TransactionDialogHost } from '@/features/record-transaction'
import { ScreenWorkspace } from '@/features/workspace-layout'
import type { PortfolioSummaryDto } from '@/shared/api/contracts'
import {
  isPortfolioTab,
  PORTFOLIO_TABS,
  portfolioPath,
  type PortfolioTab,
} from '@/shared/routes/paths'
import { Button } from '@/shared/ui/form/Button'
import { ScreenTabs } from '@/shared/ui/ScreenTabs'
import { PanelError, PanelLoading } from '@/shared/ui/StatusViews'
import { PortfolioAllocationPanel } from '@/widgets/portfolio-allocation-panel'
import { PortfolioHeader } from '@/widgets/portfolio-header'
import { PortfolioIncomePanel } from '@/widgets/portfolio-income-panel'
import {
  PortfolioPerformancePanel,
  PortfolioReturnsPanel,
} from '@/widgets/portfolio-performance-panel'
import { PortfolioPositionsPanel } from '@/widgets/portfolio-positions-panel'
import {
  PortfolioReportFormPanel,
  PortfolioReportPreviewPanel,
  PortfolioReportsPanel,
} from '@/widgets/portfolio-reports-panel'
import {
  PortfolioIssuersPanel,
  PortfolioLimitsPanel,
  PortfolioRiskPanel,
} from '@/widgets/portfolio-risk-panel'
import { PortfolioTransactionsPanel } from '@/widgets/portfolio-transactions-panel'
import { layoutKey, LOCKED_REPORTS_LAYOUT, PORTFOLIO_LAYOUTS } from '../config/layouts'

/**
 * Screen 5, portfolio (spec section 9): header, tabs, then the panels of the tab.
 * /port opens the first portfolio; /port/{id}/{tab} a tab of one.
 */
export function PortfolioPage() {
  const { portfolioId, tab = 'positions' } = useParams()
  const portfolios = usePortfolios()

  if (!isPortfolioTab(tab)) {
    return <Navigate to={portfolioId ? portfolioPath(portfolioId) : '/port'} replace />
  }
  if (portfolios.isPending) return <PanelLoading />
  if (portfolios.isError) {
    return <PanelError error={portfolios.error} onRetry={() => void portfolios.refetch()} />
  }
  const list = portfolios.data
  const current = list.find((portfolio) => portfolio.id === portfolioId)
  if (list.length === 0) return <NoPortfolio />
  if (!current) return <Navigate to={portfolioPath(list[0].id, tab)} replace />
  return <PortfolioScreen portfolios={list} current={current} tab={tab} />
}

function PortfolioScreen({
  portfolios,
  current,
  tab,
}: {
  portfolios: PortfolioSummaryDto[]
  current: PortfolioSummaryDto
  tab: PortfolioTab
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const canWrite = useHasPermission('portfolios:write')
  const details = usePortfolio(current.id).data
  const [importing, setImporting] = useState(false)
  const model = current.kind === 'model'
  const tabs = PORTFOLIO_TABS.filter((value) => !(model && value === 'transactions')).map(
    (value) => ({ to: portfolioPath(current.id, value), label: t(`portfolio.tabs.${value}`) }),
  )
  if (model && tab === 'transactions') return <Navigate to={portfolioPath(current.id)} replace />

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-col gap-2 px-2 pt-2">
        <PortfolioHeader
          portfolios={portfolios}
          portfolioId={current.id}
          onSelect={(id) => void navigate(portfolioPath(id, tab))}
        />
        <div className="flex items-center justify-between gap-2">
          <ScreenTabs tabs={tabs} label={t('portfolio.tabsLabel')} />
          {canWrite &&
            (model ? (
              <Button
                icon={SlidersHorizontal}
                disabled={!details}
                onClick={() => details && openPortfolioDialog({ mode: 'edit', portfolio: details })}
              >
                {t('portfolio.editAllocation')}
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => openTransactionDialog({ portfolioId: current.id })}
                className="uppercase"
              >
                {t('portfolio.newTransaction')}
              </Button>
            ))}
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <PortfolioTabPanels
          key={`${current.id}|${tab}`}
          portfolioId={current.id}
          tab={tab}
          onImport={() => setImporting(true)}
        />
      </div>
      <TransactionDialogHost />
      <PortfolioDialogHost />
      <ImportTransactionsDialog
        portfolioId={current.id}
        open={importing}
        onClose={() => setImporting(false)}
      />
    </div>
  )
}

function PortfolioTabPanels({
  portfolioId,
  tab,
  onImport,
}: {
  portfolioId: string
  tab: PortfolioTab
  onImport: () => void
}) {
  const navigate = useNavigate()
  const canReport = useHasPermission('portfolios:reports')
  // The Reports tab: the list says which report the preview shows.
  const [reportId, setReportId] = useState<string | null>(null)

  const panels: Record<PortfolioTab, Record<string, ReactNode>> = {
    positions: {
      positions: <PortfolioPositionsPanel portfolioId={portfolioId} onImport={onImport} />,
      performance: <PortfolioPerformancePanel portfolioId={portfolioId} />,
      allocation: <PortfolioAllocationPanel portfolioId={portfolioId} />,
      risk: <PortfolioRiskPanel portfolioId={portfolioId} />,
      income: (
        <PortfolioIncomePanel
          portfolioId={portfolioId}
          onGenerateReport={() => void navigate(portfolioPath(portfolioId, 'reports'))}
        />
      ),
    },
    transactions: {
      transactions: <PortfolioTransactionsPanel portfolioId={portfolioId} onImport={onImport} />,
    },
    performance: {
      chart: <PortfolioPerformancePanel portfolioId={portfolioId} variant="full" />,
      returns: <PortfolioReturnsPanel portfolioId={portfolioId} />,
    },
    risk: {
      metrics: <PortfolioRiskPanel portfolioId={portfolioId} variant="full" />,
      limits: <PortfolioLimitsPanel portfolioId={portfolioId} />,
      issuers: <PortfolioIssuersPanel portfolioId={portfolioId} />,
      maturities: <PortfolioAllocationPanel portfolioId={portfolioId} views={['maturity']} />,
    },
    income: {
      upcoming: <PortfolioIncomePanel portfolioId={portfolioId} />,
      received: <PortfolioIncomePanel portfolioId={portfolioId} variant="received" />,
    },
    reports: canReport
      ? {
          form: <PortfolioReportFormPanel portfolioId={portfolioId} onQueued={setReportId} />,
          reports: (
            <PortfolioReportsPanel
              portfolioId={portfolioId}
              selectedJobId={reportId}
              onSelect={setReportId}
            />
          ),
          preview: <PortfolioReportPreviewPanel jobId={reportId} />,
        }
      : { form: <PortfolioReportFormPanel portfolioId={portfolioId} onQueued={setReportId} /> },
  }

  return (
    <ScreenWorkspace
      screenId={layoutKey(tab)}
      defaultLayout={
        tab === 'reports' && !canReport ? LOCKED_REPORTS_LAYOUT : PORTFOLIO_LAYOUTS[tab]
      }
      panels={panels[tab]}
    />
  )
}

/** No portfolio yet: the first one to create, within the account type's quota. */
function NoPortfolio() {
  const { t } = useTranslation()
  const quota = usePortfolioQuota()
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <Briefcase aria-hidden className="size-6 text-secondary" />
      <p className="max-w-md font-sans text-label text-secondary">
        {quota.modelOnly ? t('portfolio.empty.student') : t('portfolio.empty.message')}
      </p>
      {quota.canWrite && !quota.reached && (
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => openPortfolioDialog({ mode: 'create' })}
        >
          {t('portfolio.selector.new')}
        </Button>
      )}
      <PortfolioDialogHost />
    </div>
  )
}
