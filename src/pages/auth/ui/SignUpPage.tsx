import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router'
import { useSessionState } from '@/entities/session'
import { SignUpForm } from '@/features/sign-up'
import { AuthLayout } from './AuthLayout'

/** /signup: the account type and the user, then the code that confirms the address. */
export function SignUpPage() {
  const { t } = useTranslation()
  const { status } = useSessionState()
  if (status === 'authenticated') return <Navigate to="/" replace />
  return (
    <AuthLayout title={t('auth.signUp.title')} subtitle={t('auth.signUp.subtitle')} width={560}>
      <SignUpForm />
    </AuthLayout>
  )
}
