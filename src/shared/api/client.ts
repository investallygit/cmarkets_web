import { env } from '@/shared/config/env'
import { fetchApi } from './fetchApi'
import { ApiError, readProblem } from './problem'
import { endSession, getAccessToken, refreshAccessToken } from './session'

type QueryValue = string | number | boolean | null | undefined
export type QueryParams = Record<string, QueryValue | readonly QueryValue[]>

interface RequestOptions {
  query?: QueryParams
  body?: unknown
  signal?: AbortSignal
  /** Calls of the login pages: no access token, and the session cookie goes both ways. */
  anonymous?: boolean
}

function buildUrl(path: string, query?: QueryParams): string {
  const url = new URL(`${env.apiBaseUrl}${path}`, window.location.origin)
  for (const [key, value] of Object.entries(query ?? {})) {
    const values: readonly QueryValue[] = Array.isArray(value) ? value : [value]
    for (const item of values) {
      if (item !== undefined && item !== null && item !== '')
        url.searchParams.append(key, String(item))
    }
  }
  return url.toString()
}

function withToken(init: RequestInit, token: string | null): RequestInit {
  if (!token) return init
  return { ...init, headers: { ...init.headers, Authorization: `Bearer ${token}` } }
}

/**
 * Sends a request with the access token. A 401 means the token was refused before its time
 * (revoked, or a clock off): it is renewed once and the request sent again. A second 401 ends the
 * session, and the app goes back to the login page.
 */
async function send(url: string, init: RequestInit, anonymous = false): Promise<Response> {
  if (anonymous) return fetchApi(url, { ...init, credentials: 'include' })
  const token = await getAccessToken()
  let response = await fetchApi(url, withToken(init, token))
  if (response.status === 401 && token) {
    const renewed = await refreshAccessToken()
    if (renewed) response = await fetchApi(url, withToken(init, renewed))
  }
  if (response.status === 401) endSession('expired')
  return response
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) throw new ApiError(await readProblem(response))
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const { query, body, signal, anonymous } = options
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const init = {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  }
  return readJson<T>(await send(buildUrl(path, query), init, anonymous))
}

/** A multipart form, such as a file upload; the browser writes its Content-Type. */
async function requestForm<T>(
  method: 'POST' | 'PUT',
  path: string,
  form: FormData,
  options: Omit<RequestOptions, 'body'> = {},
): Promise<T> {
  const init = {
    method,
    headers: { Accept: 'application/json' },
    body: form,
    signal: options.signal,
  }
  return readJson<T>(await send(buildUrl(path, options.query), init, options.anonymous))
}

/** A file, such as a PDF document, fetched with the same session as the JSON calls. */
async function requestBlob(path: string, options: Omit<RequestOptions, 'body'> = {}) {
  const response = await send(buildUrl(path, options.query), { signal: options.signal })
  if (!response.ok) throw new ApiError(await readProblem(response))
  return response.blob()
}

/**
 * Hand-written client for the prototype. Once CMarket.Api publishes its OpenAPI contract,
 * the generated client (Orval) replaces these calls behind the same feature hooks.
 */
export const apiClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('GET', path, options),
  getBlob: requestBlob,
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('POST', path, { ...options, body }),
  postForm: <T>(path: string, form: FormData, options?: Omit<RequestOptions, 'body'>) =>
    requestForm<T>('POST', path, form, options),
  putForm: <T>(path: string, form: FormData, options?: Omit<RequestOptions, 'body'>) =>
    requestForm<T>('PUT', path, form, options),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('PUT', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('PATCH', path, { ...options, body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('DELETE', path, options),
}
