/**
 * Every endpoint of CMarket.Api the front end calls, one file per controller folder of the API
 * (CMarket.Api/Controllers/{Area}), each with its route table and its calls. The entities' hooks
 * call these; only src/shared/api sends requests. ROUTE_TABLES is checked against the API's
 * OpenAPI document (openapi-routes.txt) and against the mock's handlers.
 */
import type { RouteTable } from './define'

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
export const ROUTE_TABLES: Readonly<Record<string, RouteTable>> = {}
