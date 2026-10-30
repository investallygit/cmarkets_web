import { useTranslation } from 'react-i18next'
import { Navigate, useSearchParams } from 'react-router'
import { useRestoreSession, useSessionState } from '@/entities/session'
import { LoginForm } from '@/features/log-in'
import { safeNextPath } from '@/shared/routes/paths'
import { AuthLayout } from './AuthLayout'

/**
 * /login: e-mail and password, then the one-time code. A user already logged in in this browser
 * goes straight back to the page asked for; the reason of the last logout is shown.
 */
export function LoginPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const { status, endReason } = useSessionState()
  useRestoreSession(status === 'unknown')

  if (status === 'authenticated') {
    return <Navigate to={safeNextPath(searchParams.get('next'))} replace />
  }
  return (
    <AuthLayout
      title={t('auth.login.title')}
      subtitle={endReason ? t(`auth.ended.${endReason}`) : t('auth.login.subtitle')}
      width={440}
    >
      <LoginForm />
    </AuthLayout>
  )
}
