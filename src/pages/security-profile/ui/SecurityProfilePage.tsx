import { lazy, Suspense, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useParams, useSearchParams } from 'react-router'
import {
  LIBRARY_PAGE_SIZE,
  useLibrary,
  useLibraryPublication,
  type LibraryQuery,
} from '@/entities/publication'
import { useSecurityProfile } from '@/entities/security'
import { ModuleLocked, useCurrentUser } from '@/entities/session'
import { ScreenWorkspace } from '@/features/workspace-layout'
import type { SecurityProfileDto } from '@/shared/api/contracts'
import { useSymbolSubscription } from '@/shared/realtime'
import {
  isSecurityFunction,
  securityFunctionTypes,
  securityPath,
  type SecurityFunction,
} from '@/shared/routes/paths'
import { PanelEmpty, PanelError, PanelLoading } from '@/shared/ui/StatusViews'
import { AnalystPanel } from '@/widgets/analyst-panel'
import { DividendsPanel } from '@/widgets/dividends-panel'
import { DocumentListPanel } from '@/widgets/document-list-panel'
import { DocumentViewerPanel } from '@/widgets/document-viewer-panel'
import {
  FinancialStatementsPanel,
  FinancialSummaryPanel,
} from '@/widgets/financial-statements-panel'
import { KeyDataPanel } from '@/widgets/key-data-panel'
import { LatestTradesPanel } from '@/widgets/latest-trades-panel'
import { NewsArticlePanel } from '@/widgets/news-article-panel'
import { NewsListPanel } from '@/widgets/news-list-panel'
import { OrderBookPanel } from '@/widgets/order-book-panel'
import { PriceChartPanel } from '@/widgets/price-chart-panel'
import { PublicationListPanel } from '@/widgets/publication-list-panel'
import { PublicationPreviewPanel } from '@/widgets/publication-preview-panel'
import { RatiosPanel } from '@/widgets/ratios-panel'
import { RedemptionSchedulePanel } from '@/widgets/redemption-schedule-panel'
import { SecurityDocumentsPanel } from '@/widgets/security-documents-panel'
import { SecurityHeader } from '@/widgets/security-header'
import { ShareholdersPanel } from '@/widgets/shareholders-panel'
import { layoutKey, PROFILE_LAYOUTS } from '../config/layouts'
import { TAB_CODES } from '../config/tabs'
import { SecurityTabs } from './SecurityTabs'

// The chart library of the comparison loads with the FA tab, not with every profile.
const FundamentalsComparison = lazy(() =>
  import('./FundamentalsComparison').then((module) => ({
    default: module.FundamentalsComparison,
  })),
)

/**
 * Screen 2, security profile (DES and the other tabs of spec section 9): header, tabs, then the
 * panels of the tab. /securities/{id}/{tab}; ?doc= and ?article= open a document or an article.
 */
export function SecurityProfilePage() {
  const { securityId = '', fn } = useParams()
  const profile = useSecurityProfile(securityId)
  // Real-time quotes of this security while the profile is open.
  useSymbolSubscription([securityId])

  if (!isSecurityFunction(fn)) return <Navigate to={securityPath(securityId)} replace />
  if (profile.isPending) return <PanelLoading />
  if (profile.isError) {
    return <PanelError error={profile.error} onRetry={() => void profile.refetch()} />
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-col gap-2 px-2 pt-2">
        <SecurityHeader profile={profile.data} />
        <SecurityTabs security={profile.data} />
      </div>
      <div className="min-h-0 flex-1">
        <ProfileTab key={fn} fn={fn} security={profile.data} />
      </div>
    </div>
  )
}

function ProfileTab({ fn, security }: { fn: SecurityFunction; security: SecurityProfileDto }) {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const [searchParams, setSearchParams] = useSearchParams()
  const select = (param: 'doc' | 'article') => (id: string) =>
    setSearchParams({ [param]: id }, { replace: true })

  if (!(securityFunctionTypes(fn)?.includes(security.type) ?? true)) {
    return (
      <PanelEmpty
        message={t('security.notApplicable', { code: TAB_CODES[fn], security: security.code })}
      />
    )
  }
  // Fundamental analysis belongs to the Analysis module, as EQS (spec section 6).
  if (fn === 'fa' && !user.modules.includes('analysis')) return <ModuleLocked module="analysis" />

  const { id, type, currency, code } = security
  const chart = (variant: 'compact' | 'full') => (
    <PriceChartPanel
      securityId={id}
      code={code}
      securityType={type}
      currency={currency}
      variant={variant}
    />
  )
  const keyData = <KeyDataPanel profile={security} />
  const panels: Record<SecurityFunction, Record<string, ReactNode>> = {
    des: {
      chart: chart('compact'),
      orderbook: <OrderBookPanel securityId={id} securityType={type} currency={currency} />,
      trades: <LatestTradesPanel securityId={id} securityType={type} currency={currency} />,
      keydata: keyData,
      income:
        type === 'bond' ? (
          <RedemptionSchedulePanel securityId={id} />
        ) : (
          <DividendsPanel securityId={id} />
        ),
      documents: <SecurityDocumentsPanel securityId={id} />,
    },
    gp: { chart: chart('full') },
    fa: {
      comparison: (
        <Suspense fallback={<PanelLoading />}>
          <FundamentalsComparison security={security} />
        </Suspense>
      ),
      ratios: <RatiosPanel securityId={id} code={code} />,
      statements: <FinancialStatementsPanel securityId={id} code={code} />,
      summary: <FinancialSummaryPanel securityId={id} code={code} />,
      chart: chart('compact'),
    },
    dvd: {
      dividends: <DividendsPanel securityId={id} variant="full" />,
      keydata: keyData,
      chart: chart('compact'),
    },
    n: {
      list: (
        <NewsListPanel
          query={{ securityId: id, pageSize: 50 }}
          selectedId={searchParams.get('article')}
          onSelect={select('article')}
        />
      ),
      article: <NewsArticlePanel articleId={searchParams.get('article')} />,
    },
    doc: {
      list: (
        <DocumentListPanel
          query={{ securityId: id }}
          selectedId={searchParams.get('doc')}
          onSelect={select('doc')}
        />
      ),
      viewer: (
        <DocumentViewerPanel query={{ securityId: id }} documentId={searchParams.get('doc')} />
      ),
    },
    hds: {
      shareholders: <ShareholdersPanel securityId={id} />,
      keydata: keyData,
      chart: chart('compact'),
    },
    ana: {
      list: <ResearchList security={security} />,
      preview: <ResearchPreview security={security} />,
      analyst: <ResearchAnalyst security={security} />,
    },
  }

  return (
    <ScreenWorkspace
      screenId={layoutKey(fn)}
      defaultLayout={PROFILE_LAYOUTS[fn]}
      panels={panels[fn]}
    />
  )
}

/**
 * ANA: the research library's list for one security (spec section 9, screen 2); a bond shows the
 * research on its issuing country. The open publication and the page live in the URL; the first
 * publication opens when none is chosen.
 */
function useResearchSelection(security: SecurityProfileDto) {
  const [searchParams] = useSearchParams()
  const query: LibraryQuery = {
    tab: 'all',
    ...(security.type === 'bond'
      ? ({ subjectType: 'country', subjectId: security.country } as const)
      : ({ subjectType: 'company', subjectId: security.id } as const)),
    page: Math.max(1, Number(searchParams.get('page')) || 1),
    pageSize: LIBRARY_PAGE_SIZE,
  }
  const list = useLibrary(query)
  const selectedId = searchParams.get('publication') ?? list.data?.items.at(0)?.id ?? null
  return { query, selectedId }
}

function ResearchList({ security }: { security: SecurityProfileDto }) {
  const [, setSearchParams] = useSearchParams()
  const { query, selectedId } = useResearchSelection(security)
  const page: Record<string, string> = query.page > 1 ? { page: String(query.page) } : {}
  return (
    <PublicationListPanel
      query={query}
      selectedId={selectedId}
      onSelect={(publication) => setSearchParams({ ...page, publication }, { replace: true })}
      onPageChange={(next) =>
        setSearchParams(next > 1 ? { page: String(next) } : {}, { replace: true })
      }
    />
  )
}

function ResearchPreview({ security }: { security: SecurityProfileDto }) {
  return <PublicationPreviewPanel publicationId={useResearchSelection(security).selectedId} />
}

function ResearchAnalyst({ security }: { security: SecurityProfileDto }) {
  const { selectedId } = useResearchSelection(security)
  return <AnalystPanel analystId={useLibraryPublication(selectedId).data?.analyst.id ?? null} />
}
