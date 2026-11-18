import { ScreenWorkspace } from '@/features/workspace-layout'
import { AccountSecurityPanel } from '@/widgets/account-security-panel'
import { ProfilePanel } from '@/widgets/profile-panel'
import { ACCOUNT_SETTINGS_LAYOUT } from '../config/layout'

/**
 * ME, an employee's own settings (B72 of ROADMAP step 50: the Data admin and the Admin could change
 * their password only through "Forgot your password?", and never their name, phone, time zone or
 * login codes): CFG's profile and security, the back-office's CFG being the platform's settings.
 */
export function AccountSettingsPage() {
  return (
    <ScreenWorkspace
      screenId="MYCFG"
      defaultLayout={ACCOUNT_SETTINGS_LAYOUT}
      panels={{
        profile: <ProfilePanel code="ME" />,
        security: <AccountSecurityPanel code="ME" />,
      }}
    />
  )
}
