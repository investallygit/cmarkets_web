import { env } from '@/shared/config/env'
import { ApiError, type ProblemDetails } from './problem'

type QueryValue = string | number | boolean | null | undefined
export type QueryParams = Record<string, QueryValue | readonly QueryValue[]>

interface RequestOptions {
  query?: QueryParams
  body?: unknown
  signal?: AbortSignal
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

async function readProblem(response: Response): Promise<ProblemDetails> {
  try {
    const problem = (await response.json()) as Partial<ProblemDetails>
    return {
      ...problem,
      title: problem.title ?? response.statusText,
      status: problem.status ?? response.status,
    }
  } catch {
    return { title: response.statusText || 'Request failed', status: response.status }
  }
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) throw new ApiError(await readProblem(response))
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const { query, body, signal } = options
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  })
  return readJson<T>(response)
}

/** A multipart form, such as a file upload; the browser writes its Content-Type. */
async function requestForm<T>(
  path: string,
  form: FormData,
  options: Omit<RequestOptions, 'body'> = {},
): Promise<T> {
  const response = await fetch(buildUrl(path, options.query), {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: form,
    signal: options.signal,
  })
  return readJson<T>(response)
}

/** A file, such as a PDF document, fetched with the same session as the JSON calls. */
async function requestBlob(path: string, options: Omit<RequestOptions, 'body'> = {}) {
  const response = await fetch(buildUrl(path, options.query), { signal: options.signal })
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
  postForm: requestForm,
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('PUT', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('PATCH', path, { ...options, body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('DELETE', path, options),
}
