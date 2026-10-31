import i18n from 'i18next'
import { ApiError } from './problem'

/** Status of the ApiError for a server out of reach: no response at all. */
export const NO_RESPONSE = 0

/**
 * fetch, with a server out of reach (offline, DNS, blocked) as an ApiError in the user's language
 * rather than the browser's own words ("Failed to fetch", "Load failed"). An abort stays an abort.
 */
export async function fetchApi(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init)
  } catch (error) {
    if (error instanceof TypeError) {
      throw new ApiError({ title: i18n.t('common.networkError'), status: NO_RESPONSE })
    }
    throw error
  }
}
