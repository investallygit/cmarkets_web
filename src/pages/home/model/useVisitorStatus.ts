import { useRestoreSession, useSessionState } from '@/entities/session'

export type VisitorStatus = 'pending' | 'anonymous' | 'authenticated'

/**
 * Whether the visitor of the home page is logged in in this browser: the refresh cookie of the
 * last login says so. Until it answers, the calls to action wait; without it, they invite to the
 * trial and the login.
 */
export function useVisitorStatus(): VisitorStatus {
  const { status } = useSessionState()
  const restore = useRestoreSession(status === 'unknown')
  if (status === 'authenticated') return 'authenticated'
  return status === 'unknown' && !restore.isError ? 'pending' : 'anonymous'
}
