import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation } from 'react-router'
import { useRestoreSession, useSessionState } from '@/entities/session'
import { loginPath } from '@/shared/routes/paths'
import { FullScreenStatus } from '../layouts/FullScreenStatus'

/**
 * The app shell needs a session: at start-up the refresh cookie of the last login restores it,
 * otherwise the login page opens, and brings the user back here afterwards.
 */
export function RequireSession({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const location = useLocation()
  const { status } = useSessionState()
  const restore = useRestoreSession(status === 'unknown')

  if (status === 'authenticated') return children
  if (status === 'anonymous') {
    return <Navigate to={loginPath(`${location.pathname}${location.search}`)} replace />
  }
  if (restore.isError) {
    return (
      <FullScreenStatus
        kind="error"
        message={t('app.sessionError')}
        onRetry={() => void restore.refetch()}
      />
    )
  }
  return <FullScreenStatus kind="loading" />
}
