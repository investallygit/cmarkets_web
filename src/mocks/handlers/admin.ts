import { analystRequestHandlers } from './admin/analystRequests'
import { auditLogHandlers } from './admin/auditLog'
import { moderationHandlers } from './admin/moderation'
import { payoutHandlers } from './admin/payouts'
import { settingsHandlers } from './admin/settings'
import { userHandlers } from './admin/users'

/**
 * Screen 9 and the Admin's screens (USER, ANLY, MOD, PAY, ADMCFG, AUDT): accounts, Analyst
 * status requests, moderation, settings and permissions, payouts and the audit log (spec
 * sections 10 and 12). Every change is written to the audit log. One module per screen in ./admin.
 */
export const adminHandlers = [
  ...userHandlers,
  ...analystRequestHandlers,
  ...moderationHandlers,
  ...settingsHandlers,
  ...payoutHandlers,
  ...auditLogHandlers,
]
