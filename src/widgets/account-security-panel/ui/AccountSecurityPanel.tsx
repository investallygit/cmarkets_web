import { useTranslation } from 'react-i18next'
import { PasswordForm } from '@/features/change-password'
import { TwoFactorForm } from '@/features/edit-profile'
import { INACTIVITY_LIMIT_MS } from '@/features/log-out'
import { Panel } from '@/shared/ui/Panel'

/**
 * CFG, security (spec section 6): the password, where the login codes go, and the automatic
 * logout after inactivity.
 */
export function AccountSecurityPanel() {
  const { t } = useTranslation()
  return (
    <Panel title={t('panels.security')} code="CFG">
      <div className="flex flex-col gap-4 p-3">
        <PasswordForm />
        <div className="border-t pt-3">
          <TwoFactorForm />
        </div>
        <p className="border-t pt-3 font-sans text-data text-secondary">
          {t('settings.security.inactivity', { count: INACTIVITY_LIMIT_MS / 60_000 })}
        </p>
      </div>
    </Panel>
  )
}
