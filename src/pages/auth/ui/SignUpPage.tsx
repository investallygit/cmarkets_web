import { useTranslation } from 'react-i18next'
import { Navigate, useSearchParams } from 'react-router'
import { useSessionState } from '@/entities/session'
import { SignUpForm } from '@/features/sign-up'
import { CLIENT_ACCOUNT_TYPES } from '@/shared/api/contracts'
import { routes } from '@/shared/routes/paths'
import { AuthLayout } from './AuthLayout'

/**
 * /signup: the account type and the user, then the code that confirms the address. The home page
 * links to it with the account type chosen (?type=analyst).
 */
export function SignUpPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const { status } = useSessionState()
  if (status === 'authenticated') return <Navigate to={routes.app} replace />
  const accountType = CLIENT_ACCOUNT_TYPES.find((type) => type === searchParams.get('type'))
  return (
    <AuthLayout title={t('auth.signUp.title')} subtitle={t('auth.signUp.subtitle')} width={560}>
      <SignUpForm accountType={accountType} />
    </AuthLayout>
  )
}
