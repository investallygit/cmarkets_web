/**
 * Every endpoint of CMarket.Api the front end calls, one file per controller folder of the API
 * (CMarket.Api/Controllers/{Area}), each with its route table and its calls. The entities' hooks
 * call these; only src/shared/api sends requests. ROUTE_TABLES is checked against the API's
 * OpenAPI document (openapi-routes.txt) and against the mock's handlers.
 */
import { analysisRoutes } from './analysis'
import { authRoutes } from './auth'
import type { RouteTable } from './define'
import { devToolsRoutes } from './devTools'
import { marketRoutes } from './market'
import { meRoutes } from './me'
import { securitiesRoutes } from './securities'

export { analysisApi, analysisRoutes } from './analysis'
export { authApi, authRoutes } from './auth'
export { devToolsApi, devToolsRoutes, type DemoAccountsDto, type SentCodeQuery } from './devTools'
export { marketApi, marketRoutes, type HistoryRange } from './market'
export { meApi, meRoutes } from './me'
export { securitiesApi, securitiesRoutes, type SecurityFilters } from './securities'

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
  Analysis: analysisRoutes,
  Auth: authRoutes,
  DevTools: devToolsRoutes,
  Market: marketRoutes,
  Me: meRoutes,
  Securities: securitiesRoutes,
}
