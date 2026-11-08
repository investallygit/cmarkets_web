import { apiClient, type QueryParams } from '../client'

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * One endpoint of CMarket.Api: its method, its path under /api/v1 with each parameter in braces
 * (`/watchlists/{id}`), as the API's OpenAPI document writes it, and the type of its answer.
 */
export interface Route<Path extends string = string, Response = unknown> {
  readonly method: Method
  readonly path: Path
  /** The prototype's development tools (/_prototype/*): development only, not in the OpenAPI. */
  readonly devOnly?: boolean
  /** Never set: carries the type of the answer, from answer<T>(). */
  readonly response?: Response
}

/** The endpoints of one area of the API, by the name of their call. */
export type RouteTable = Readonly<Record<string, Route>>

/** The type of an answer, for route(): `route('GET', '/watchlists', answer<WatchlistDto[]>())`. */
export const answer = <Response>() => undefined as Response

/** An endpoint whose answer is empty (204) unless answer<T>() says otherwise. */
export function route<Path extends `/${string}`, Response = void>(
  method: Method,
  path: Path,
  _answer?: Response,
  options: { devOnly?: boolean } = {},
): Route<Path, Response> {
  return { method, path, ...options }
}

/** The names in braces of a path: 'id' | 'securityId' for `/watchlists/{id}/items/{securityId}`. */
export type ParamName<Path extends string> = Path extends `${string}{${infer Name}}${infer Rest}`
  ? Name | ParamName<Rest>
  : never

export type PathParams<Path extends string> = Record<ParamName<Path>, string | number>

/** The path with its parameters filled in, each encoded. */
export function fillPath(path: string, params: Readonly<Record<string, string | number>> = {}) {
  return path.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = params[name]
    if (value === undefined || value === '') throw new Error(`Missing {${name}} for ${path}`)
    return encodeURIComponent(String(value))
  })
}

interface CommonOptions {
  query?: QueryParams
  signal?: AbortSignal
  /** Calls of the login pages: no access token, and the session cookie goes both ways. */
  anonymous?: boolean
}

/** Options of a call: `params` exactly when the path has parameters. */
export type CallOptions<Path extends string, Extra = object> = CommonOptions &
  Extra &
  ([ParamName<Path>] extends [never] ? { params?: undefined } : { params: PathParams<Path> })

/** The options may be left out when the path has no parameter. */
type OptionsArgument<Path extends string, Extra = object> = [ParamName<Path>] extends [never]
  ? [options?: CallOptions<Path, Extra>]
  : [options: CallOptions<Path, Extra>]

/** Sends a JSON request to an endpoint, with the session of client.ts, and reads its answer. */
export function send<Path extends string, Response>(
  endpoint: Route<Path, Response>,
  ...[options]: OptionsArgument<Path, { body?: unknown }>
): Promise<Response> {
  const { params, body, ...rest } = (options ?? {}) as CallOptions<string, { body?: unknown }>
  const path = fillPath(endpoint.path, params)
  switch (endpoint.method) {
    case 'GET':
      return apiClient.get<Response>(path, rest)
    case 'POST':
      return apiClient.post<Response>(path, body, rest)
    case 'PUT':
      return apiClient.put<Response>(path, body, rest)
    case 'PATCH':
      return apiClient.patch<Response>(path, body, rest)
    case 'DELETE':
      return apiClient.delete<Response>(path, rest)
  }
}

/** Sends a multipart form (a file upload) to a POST or PUT endpoint. */
export function sendForm<Path extends string, Response>(
  endpoint: Route<Path, Response>,
  form: FormData,
  ...[options]: OptionsArgument<Path>
): Promise<Response> {
  const { params, ...rest } = (options ?? {}) as CallOptions<string>
  const path = fillPath(endpoint.path, params)
  if (endpoint.method === 'PUT') return apiClient.putForm<Response>(path, form, rest)
  if (endpoint.method === 'POST') return apiClient.postForm<Response>(path, form, rest)
  throw new Error(`A form goes with POST or PUT, not ${endpoint.method} ${endpoint.path}`)
}

/** Reads a file (a PDF, an export) from a GET endpoint, with the session. */
export function sendBlob<Path extends string>(
  endpoint: Route<Path, Blob>,
  ...[options]: OptionsArgument<Path>
): Promise<Blob> {
  const { params, query, signal } = (options ?? {}) as CallOptions<string>
  if (endpoint.method !== 'GET')
    throw new Error(`A file is read with GET, not ${endpoint.method} ${endpoint.path}`)
  return apiClient.getBlob(fillPath(endpoint.path, params), { query, signal })
}
