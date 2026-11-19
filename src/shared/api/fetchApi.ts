import i18n from 'i18next'
import { ApiError } from './problem'

/** Status of the ApiError for a server out of reach: no response at all. */
export const NO_RESPONSE = 0

/**
 * The language the page shows, as CMarket.Api answers in it (ROADMAP decision 37): its problems
 * in French or English. The request's own Accept-Language, if any, stays.
 */
function withLanguage(init: RequestInit): RequestInit {
  const language = i18n.resolvedLanguage ?? i18n.language
  if (!language) return init
  const headers = init.headers as Record<string, string> | undefined
  return { ...init, headers: { 'Accept-Language': language, ...headers } }
}

/**
 * fetch, in the page's language, with a server out of reach (offline, DNS, blocked) as an ApiError
 * in the user's language rather than the browser's own words ("Failed to fetch", "Load failed").
 * An abort stays an abort.
 */
export async function fetchApi(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, withLanguage(init))
  } catch (error) {
    if (error instanceof TypeError) {
      throw new ApiError({ title: i18n.t('common.networkError'), status: NO_RESPONSE })
    }
    throw error
  }
}
