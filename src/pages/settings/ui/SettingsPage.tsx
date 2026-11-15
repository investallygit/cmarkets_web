import { hasPlan, useCurrentUser } from '@/entities/session'
import { ScreenWorkspace } from '@/features/workspace-layout'
import { AccountSecurityPanel } from '@/widgets/account-security-panel'
import { InvoicesPanel } from '@/widgets/invoices-panel'
import { OrganizationPanel } from '@/widgets/organization-panel'
import { ProfilePanel } from '@/widgets/profile-panel'
import { SubscriptionPanel } from '@/widgets/subscription-panel'
import { NO_PLAN_SETTINGS_LAYOUT, SETTINGS_LAYOUT } from '../config/layout'

/**
 * CFG screen (spec sections 6 and 10): the profile and its security, the subscription and its
 * invoices, the organisation and its members; an account without a plan, the SVT, has neither
 * subscription nor invoices (ROADMAP decision 16).
 */
export function SettingsPage() {
  const user = useCurrentUser()
  const paying = hasPlan(user.accountType)
  const panels = {
    profile: <ProfilePanel />,
    security: <AccountSecurityPanel />,
    ...(paying && { subscription: <SubscriptionPanel /> }),
    organization: <OrganizationPanel />,
    ...(paying && { invoices: <InvoicesPanel /> }),
  }
  return (
    <ScreenWorkspace
      screenId="CFG"
      defaultLayout={paying ? SETTINGS_LAYOUT : NO_PLAN_SETTINGS_LAYOUT}
      panels={panels}
    />
  )
}
