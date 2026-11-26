import type { ComponentType, LazyExoticComponent } from 'react'
import type { ScreenTextKey } from '@/shared/i18n'
import { lazyPage } from '@/shared/lib/lazyPage'
import type { ScreenDefinition, ScreenProps } from '@/shared/routes/screens'

type Page = LazyExoticComponent<ComponentType<ScreenProps>>

// Each page is its own chunk, loaded on first visit.
const MarketDashboardPage = lazyPage(() =>
  import('@/pages/market-dashboard').then((module) => ({ default: module.MarketDashboardPage })),
)
const CommoditiesPage = lazyPage(() =>
  import('@/pages/commodities').then((module) => ({ default: module.CommoditiesPage })),
)
const MacroDashboardPage = lazyPage(() =>
  import('@/pages/macro-dashboard').then((module) => ({ default: module.MacroDashboardPage })),
)
const FxDashboardPage = lazyPage(() =>
  import('@/pages/fx-dashboard').then((module) => ({ default: module.FxDashboardPage })),
)
const DataDownloadPage = lazyPage(() =>
  import('@/pages/data-download').then((module) => ({ default: module.DataDownloadPage })),
)
const IndexProfilePage = lazyPage(() =>
  import('@/pages/index-profile').then((module) => ({ default: module.IndexProfilePage })),
)
const SecurityProfilePage = lazyPage(() =>
  import('@/pages/security-profile').then((module) => ({ default: module.SecurityProfilePage })),
)
const EquityScreenerPage = lazyPage(() =>
  import('@/pages/equity-screener').then((module) => ({ default: module.EquityScreenerPage })),
)
const BondPricingPage = lazyPage(() =>
  import('@/pages/bond-pricing').then((module) => ({ default: module.BondPricingPage })),
)
const BondScreenerPage = lazyPage(() =>
  import('@/pages/bond-screener').then((module) => ({ default: module.BondScreenerPage })),
)
const EtfScreenerPage = lazyPage(() =>
  import('@/pages/etf-screener').then((module) => ({ default: module.EtfScreenerPage })),
)
const YieldCurvesPage = lazyPage(() =>
  import('@/pages/yield-curves').then((module) => ({ default: module.YieldCurvesPage })),
)
const PortfolioPage = lazyPage(() =>
  import('@/pages/portfolio').then((module) => ({ default: module.PortfolioPage })),
)
const ResearchLibraryPage = lazyPage(() =>
  import('@/pages/research-library').then((module) => ({ default: module.ResearchLibraryPage })),
)
const PublishingStudioPage = lazyPage(() =>
  import('@/pages/publishing-studio').then((module) => ({ default: module.PublishingStudioPage })),
)
const NewsPage = lazyPage(() =>
  import('@/pages/news').then((module) => ({ default: module.NewsPage })),
)
const NewsStudioPage = lazyPage(() =>
  import('@/pages/news-studio').then((module) => ({ default: module.NewsStudioPage })),
)
const MarketCalendarPage = lazyPage(() =>
  import('@/pages/market-calendar').then((module) => ({ default: module.MarketCalendarPage })),
)
const AlertsPage = lazyPage(() =>
  import('@/pages/alerts').then((module) => ({ default: module.AlertsPage })),
)
const SettingsPage = lazyPage(() =>
  import('@/pages/settings').then((module) => ({ default: module.SettingsPage })),
)
const NetworkDirectoryPage = lazyPage(() =>
  import('@/pages/network-directory').then((module) => ({ default: module.NetworkDirectoryPage })),
)
const MessagesPage = lazyPage(() =>
  import('@/pages/messages').then((module) => ({ default: module.MessagesPage })),
)
const NetworkProfilePage = lazyPage(() =>
  import('@/pages/network-profile').then((module) => ({ default: module.NetworkProfilePage })),
)
// The back-office of the Data admin (screen 6).
const DataImportPage = lazyPage(() =>
  import('@/pages/data-import').then((module) => ({ default: module.DataImportPage })),
)
const DataSessionPage = lazyPage(() =>
  import('@/pages/data-session').then((module) => ({ default: module.DataSessionPage })),
)
const UploadHistoryPage = lazyPage(() =>
  import('@/pages/upload-history').then((module) => ({ default: module.UploadHistoryPage })),
)
const DataCorrectionsPage = lazyPage(() =>
  import('@/pages/data-corrections').then((module) => ({ default: module.DataCorrectionsPage })),
)
const ContentPage = lazyPage(() =>
  import('@/pages/content').then((module) => ({ default: module.ContentPage })),
)
const EodhdPage = lazyPage(() =>
  import('@/pages/eodhd').then((module) => ({ default: module.EodhdPage })),
)
// The Admin's screens (screen 9).
const AdminUsersPage = lazyPage(() =>
  import('@/pages/admin-users').then((module) => ({ default: module.AdminUsersPage })),
)
const AnalystRequestsPage = lazyPage(() =>
  import('@/pages/analyst-requests').then((module) => ({ default: module.AnalystRequestsPage })),
)
const ModerationPage = lazyPage(() =>
  import('@/pages/moderation').then((module) => ({ default: module.ModerationPage })),
)
const NewsSourcesPage = lazyPage(() =>
  import('@/pages/news-sources').then((module) => ({ default: module.NewsSourcesPage })),
)
const SubscriptionManagementPage = lazyPage(() =>
  import('@/pages/subscription-management').then((module) => ({
    default: module.SubscriptionManagementPage,
  })),
)
const MediaPaymentsPage = lazyPage(() =>
  import('@/pages/media-payments').then((module) => ({ default: module.MediaPaymentsPage })),
)
const PayoutsPage = lazyPage(() =>
  import('@/pages/payouts').then((module) => ({ default: module.PayoutsPage })),
)
const RfqPage = lazyPage(() =>
  import('@/pages/rfq').then((module) => ({ default: module.RfqPage })),
)
const SvtApprovalPage = lazyPage(() =>
  import('@/pages/svt-approval').then((module) => ({ default: module.SvtApprovalPage })),
)
const RfqAgreementsPage = lazyPage(() =>
  import('@/pages/rfq-agreements').then((module) => ({ default: module.RfqAgreementsPage })),
)
const SvtTradersPage = lazyPage(() =>
  import('@/pages/svt-traders').then((module) => ({ default: module.SvtTradersPage })),
)
const AccountSettingsPage = lazyPage(() =>
  import('@/pages/account-settings').then((module) => ({ default: module.AccountSettingsPage })),
)
const PlatformSettingsPage = lazyPage(() =>
  import('@/pages/platform-settings').then((module) => ({ default: module.PlatformSettingsPage })),
)
const AuditLogPage = lazyPage(() =>
  import('@/pages/audit-log').then((module) => ({ default: module.AuditLogPage })),
)
const RfqReportingPage = lazyPage(() =>
  import('@/pages/rfq-reporting').then((module) => ({ default: module.RfqReportingPage })),
)
const RfqCompletionPage = lazyPage(() =>
  import('@/pages/rfq-completion').then((module) => ({ default: module.RfqCompletionPage })),
)
const OptimisationSetupPage = lazyPage(() =>
  import('@/pages/portfolio-optimisation').then((module) => ({
    default: module.OptimisationSetupPage,
  })),
)
const OptimisationResultPage = lazyPage(() =>
  import('@/pages/portfolio-optimisation').then((module) => ({
    default: module.OptimisationResultPage,
  })),
)

const PAGES: Record<ScreenTextKey, Page> = {
  MKT: MarketDashboardPage,
  CMDTY: CommoditiesPage,
  ECO: MacroDashboardPage,
  FX: FxDashboardPage,
  DES: SecurityProfilePage,
  IDX: IndexProfilePage,
  DL: DataDownloadPage,
  ADMDL: DataDownloadPage,
  EQS: EquityScreenerPage,
  YCRV: YieldCurvesPage,
  BP: BondPricingPage,
  BS: BondScreenerPage,
  RFQ: RfqPage,
  SVT: SvtApprovalPage,
  TRD: SvtTradersPage,
  // Screen 23 for a party, an SVT and the Admin: one page, the API deciding what each reads.
  RFQAGR: RfqAgreementsPage,
  AGR: RfqAgreementsPage,
  ADMAGR: RfqAgreementsPage,
  ETFS: EtfScreenerPage,
  PORT: PortfolioPage,
  OPT: OptimisationSetupPage,
  OPTRES: OptimisationResultPage,
  PUB: ResearchLibraryPage,
  PUBNEW: PublishingStudioPage,
  N: NewsPage,
  NEWSNEW: NewsStudioPage,
  CAL: MarketCalendarPage,
  ALRT: AlertsPage,
  CFG: SettingsPage,
  NET: NetworkDirectoryPage,
  MSG: MessagesPage,
  NETME: NetworkProfilePage,
  IMP: DataImportPage,
  DATA: DataSessionPage,
  HIST: UploadHistoryPage,
  EODH: EodhdPage,
  CORR: DataCorrectionsPage,
  NEWS: ContentPage,
  USER: AdminUsersPage,
  SUBS: SubscriptionManagementPage,
  MPAY: MediaPaymentsPage,
  SRC: NewsSourcesPage,
  ANLY: AnalystRequestsPage,
  MOD: ModerationPage,
  PAY: PayoutsPage,
  ADMCFG: PlatformSettingsPage,
  MYCFG: AccountSettingsPage,
  RFQREP: RfqReportingPage,
  RFQCPL: RfqCompletionPage,
  AUDT: AuditLogPage,
}

/** The home page, open to visitors: the product, the markets, the plans. */
export const HomePage = lazyPage(() =>
  import('@/pages/home').then((module) => ({ default: module.HomePage })),
)

/** /p/{handle}: a public profile of the directory, open to visitors. */
export const PublicProfilePage = lazyPage(() =>
  import('@/pages/public-profile').then((module) => ({ default: module.PublicProfilePage })),
)

// The login pages share a chunk, loaded before the session.
export const LoginPage = lazyPage(() =>
  import('@/pages/auth').then((module) => ({ default: module.LoginPage })),
)
export const SignUpPage = lazyPage(() =>
  import('@/pages/auth').then((module) => ({ default: module.SignUpPage })),
)
export const PasswordResetPage = lazyPage(() =>
  import('@/pages/auth').then((module) => ({ default: module.PasswordResetPage })),
)

/** Prototype only: the shared UI components on one page, at /_kit. */
export const UiKitPage = lazyPage(() =>
  import('@/pages/ui-kit').then((module) => ({ default: module.UiKitPage })),
)

/** Page of a screen. */
export function pageOf(screen: ScreenDefinition): Page {
  return PAGES[screen.id]
}
