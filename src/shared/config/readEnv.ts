/** The variables of the build that the app reads (see .env). */
export interface EnvVariables {
  VITE_API_URL?: string
  VITE_API_BASE_URL?: string
  VITE_REALTIME_HUB_URL?: string
  VITE_CHAT_HUB_URL?: string
  VITE_USE_MOCKS?: string
}

export interface AppEnv {
  /** Origin of CMarket.Api, such as https://api.cmarket.example; '' when it is the site's own. */
  apiOrigin: string
  /** The REST API (spec section 10). */
  apiBaseUrl: string
  /** The market hub. */
  realtimeHubUrl: string
  /** The hub of the messaging. */
  chatHubUrl: string
  /** Prototype mode: src/mocks answers the API and simulates the real-time hubs. */
  useMocks: boolean
}

const API_PREFIX = '/api/v1'

/** An absolute http(s) origin without its trailing slash, or '' for the site's own origin. */
function readOrigin(value: string | undefined): string {
  const text = value?.trim() ?? ''
  if (!text) return ''
  let url: URL
  try {
    url = new URL(text)
  } catch {
    throw new Error(
      `VITE_API_URL must be an absolute URL such as https://api.example.com: "${text}"`,
    )
  }
  if (!/^https?:$/.test(url.protocol) || url.pathname.replace(/\/+$/, '') || url.search || url.hash)
    throw new Error(
      `VITE_API_URL must be the origin of the API (http or https, no path): "${text}"`,
    )
  return url.origin
}

const override = (value: string | undefined) => value?.trim() || undefined

/**
 * The addresses of the back end, from VITE_API_URL: the REST API and the two hubs sit under the
 * same origin, as CMarket.Api serves them. VITE_API_BASE_URL and the two hub variables replace
 * one address each. Throws on a malformed VITE_API_URL, so that a build fails rather than a page.
 */
export function readEnv(variables: EnvVariables): AppEnv {
  const apiOrigin = readOrigin(variables.VITE_API_URL)
  return {
    apiOrigin,
    apiBaseUrl: override(variables.VITE_API_BASE_URL) ?? `${apiOrigin}${API_PREFIX}`,
    realtimeHubUrl: override(variables.VITE_REALTIME_HUB_URL) ?? `${apiOrigin}/hubs/market`,
    chatHubUrl: override(variables.VITE_CHAT_HUB_URL) ?? `${apiOrigin}/hubs/chat`,
    useMocks: variables.VITE_USE_MOCKS === 'true',
  }
}

/**
 * An address the API gives as a path of its own (/api/v1/profile-photos/…): on the API's origin
 * when the API sits on another one. Other addresses (data:, https:, relative) are left as they are.
 */
export function resolveApiPath(url: string, apiOrigin: string): string {
  return apiOrigin && url.startsWith(`${API_PREFIX}/`) ? `${apiOrigin}${url}` : url
}

/** The reverse of resolveApiPath: the API's path again, as the API expects it back. */
export function toApiPath(url: string, apiOrigin: string): string {
  return apiOrigin && url.startsWith(`${apiOrigin}${API_PREFIX}/`)
    ? url.slice(apiOrigin.length)
    : url
}
