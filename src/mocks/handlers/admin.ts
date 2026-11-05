import { analystRequestHandlers } from './admin/analystRequests'
import { auditLogHandlers } from './admin/auditLog'
import { directorySettingsHandlers } from './admin/directory'
import { moderationHandlers } from './admin/moderation'
import { payoutHandlers } from './admin/payouts'
import { reportHandlers } from './admin/reports'
import { settingsHandlers } from './admin/settings'
import { userHandlers } from './admin/users'

/**
 * Screen 9 and the Admin's screens (USER, ANLY, MOD, PAY, ADMCFG, AUDT): accounts, Analyst
 * status requests, moderation and the reports of the directory, settings and permissions,
 * payouts and the audit log (spec sections 10, 12 and 15). Every change is written to the audit
 * log. One module per screen or part in ./admin.
 */
export const adminHandlers = [
  ...userHandlers,
  ...analystRequestHandlers,
  ...moderationHandlers,
  ...reportHandlers,
  ...directorySettingsHandlers,
  ...settingsHandlers,
  ...payoutHandlers,
  ...auditLogHandlers,
]
