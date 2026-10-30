import { useTranslation } from 'react-i18next'
import { PasswordResetForm } from '@/features/reset-password'
import { AuthLayout } from './AuthLayout'

/** /reset-password: a code sent to the address, then a new password. */
export function PasswordResetPage() {
  const { t } = useTranslation()
  return (
    <AuthLayout title={t('auth.reset.title')}>
      <PasswordResetForm />
    </AuthLayout>
  )
}
