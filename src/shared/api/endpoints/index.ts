/**
 * Every endpoint of CMarket.Api the front end calls, one file per controller folder of the API
 * (CMarket.Api/Controllers/{Area}), each with its route table and its calls. The entities' hooks
 * call these; only src/shared/api sends requests. ROUTE_TABLES is checked against the API's
 * OpenAPI document (openapi-routes.txt) and against the mock's handlers.
 */
import { adminRoutes } from './admin'
import { alertsRoutes } from './alerts'
import { analysisRoutes } from './analysis'
import { authRoutes } from './auth'
import { bondsRoutes } from './bonds'
import { chartsRoutes } from './charts'
import { contentRoutes } from './content'
import { dataAdminRoutes } from './dataAdmin'
import type { RouteTable } from './define'
import { devToolsRoutes } from './devTools'
import { etfsRoutes } from './etfs'
import { marketRoutes } from './market'
import { meRoutes } from './me'
import { messagingRoutes } from './messaging'
import { networkRoutes } from './network'
import { organizationRoutes } from './organization'
import { portfoliosRoutes } from './portfolios'
import { providerRoutes } from './provider'
import { researchRoutes } from './research'
import { securitiesRoutes } from './securities'
import { subscriptionsRoutes } from './subscriptions'
import { watchlistsRoutes } from './watchlists'

export {
  adminApi,
  adminRoutes,
  type AccountQuery,
  type AuditQuery,
  type NewsQueueQuery,
  type PayoutQuery,
  type StatementItemsSort,
} from './admin'
export { alertsApi, alertsRoutes } from './alerts'
export { analysisApi, analysisRoutes } from './analysis'
export { authApi, authRoutes } from './auth'
export {
  bondsApi,
  bondsRoutes,
  type AuctionQuery,
  type PriceYieldQuery,
  type YieldCurveQuery,
} from './bonds'
export { chartsApi, chartsRoutes } from './charts'
export {
  contentApi,
  contentRoutes,
  type CalendarRange,
  type DocumentFilters,
  type NewsFilters,
  type Page,
} from './content'
export { dataAdminApi, dataAdminRoutes, type ImportQuery, type UploadInput } from './dataAdmin'
export { devToolsApi, devToolsRoutes, type DemoAccountsDto, type SentCodeQuery } from './devTools'
export { etfsApi, etfsRoutes, type EtfHistoryQuery } from './etfs'
export { marketApi, marketRoutes, type HistoryRange } from './market'
export { meApi, meRoutes } from './me'
export { messagingApi, messagingRoutes } from './messaging'
export { networkApi, networkRoutes } from './network'
export { organizationApi, organizationRoutes } from './organization'
export { portfoliosApi, portfoliosRoutes, type PerformanceQuery } from './portfolios'
export { providerApi, providerRoutes, type ProviderNewsQuery } from './provider'
export { researchApi, researchRoutes, type LibraryFilters, type PublicationStep } from './research'
export { securitiesApi, securitiesRoutes, type SecurityFilters } from './securities'
export { subscriptionsApi, subscriptionsRoutes } from './subscriptions'
export { watchlistsApi, watchlistsRoutes } from './watchlists'

export {
  answer,
  fillPath,
  route,
  send,
  sendBlob,
  sendForm,
  type CallOptions,
  type Method,
  type Route,
  type RouteTable,
} from './define'

/** The route table of each area, by the name of its controller folder. */
export const ROUTE_TABLES: Readonly<Record<string, RouteTable>> = {
  Admin: adminRoutes,
  Alerts: alertsRoutes,
  Analysis: analysisRoutes,
  Auth: authRoutes,
  Bonds: bondsRoutes,
  Charts: chartsRoutes,
  Content: contentRoutes,
  DataAdmin: dataAdminRoutes,
  DevTools: devToolsRoutes,
  Etfs: etfsRoutes,
  Market: marketRoutes,
  Me: meRoutes,
  Messaging: messagingRoutes,
  Network: networkRoutes,
  Organization: organizationRoutes,
  Portfolios: portfoliosRoutes,
  Provider: providerRoutes,
  Research: researchRoutes,
  Securities: securitiesRoutes,
  Subscriptions: subscriptionsRoutes,
  Watchlists: watchlistsRoutes,
}
