import { ScreenWorkspace } from '@/features/workspace-layout'
import { AccountSecurityPanel } from '@/widgets/account-security-panel'
import { InvoicesPanel } from '@/widgets/invoices-panel'
import { OrganizationPanel } from '@/widgets/organization-panel'
import { ProfilePanel } from '@/widgets/profile-panel'
import { SubscriptionPanel } from '@/widgets/subscription-panel'
import { SETTINGS_LAYOUT } from '../config/layout'

/**
 * CFG screen (spec sections 6 and 10): the profile and its security, the subscription and its
 * invoices, the organisation and its members.
 */
export function SettingsPage() {
  const panels = {
    profile: <ProfilePanel />,
    security: <AccountSecurityPanel />,
    subscription: <SubscriptionPanel />,
    organization: <OrganizationPanel />,
    invoices: <InvoicesPanel />,
  }
  return <ScreenWorkspace screenId="CFG" defaultLayout={SETTINGS_LAYOUT} panels={panels} />
}
