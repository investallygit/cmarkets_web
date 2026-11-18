import { isApiError } from '@/shared/api'

/**
 * Whether asking again may help: not for an answer the server will give again (an item that does
 * not exist, a refusal, a request it does not take: 4xx), but for a timeout, a limit, a server
 * error or no answer (B07).
 */
export function mayRetry(error: unknown): boolean {
  if (!isApiError(error)) return true
  const { status } = error
  return status < 400 || status >= 500 || status === 408 || status === 429
}
