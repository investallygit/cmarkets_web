import type { AccountType, Permission } from '@/shared/api/contracts'
import type { TranslationKey } from '@/shared/i18n'

/** The rows of the permission matrix, grouped as in spec section 12. */
export const PERMISSION_GROUPS: readonly {
  id: string
  label: TranslationKey
  permissions: readonly Permission[]
}[] = [
  {
    id: 'market',
    label: 'permissions.groups.market',
    permissions: ['market:read', 'market:realtime', 'market:orderbook'],
  },
  {
    id: 'analysis',
    label: 'permissions.groups.analysis',
    permissions: ['analysis:read', 'analysis:export', 'analysis:save'],
  },
  {
    id: 'portfolios',
    label: 'permissions.groups.portfolios',
    permissions: ['portfolios:read', 'portfolios:write', 'portfolios:reports', 'alerts:write'],
  },
  {
    id: 'research',
    label: 'permissions.groups.research',
    permissions: ['research:read', 'research:buy', 'publications:write', 'publications:earnings'],
  },
  {
    id: 'network',
    label: 'permissions.groups.network',
    permissions: ['directory:list', 'directory:profile', 'messages:write'],
  },
  {
    id: 'news',
    label: 'permissions.groups.news',
    permissions: ['news:write', 'news:stats', 'news:moderate', 'news:payments'],
  },
  { id: 'data', label: 'permissions.groups.data', permissions: ['data:import', 'content:publish'] },
  {
    id: 'admin',
    label: 'permissions.groups.admin',
    permissions: [
      'users:manage',
      'subscriptions:manage',
      'moderation:manage',
      'settings:manage',
      'payouts:manage',
      'audit:read',
    ],
  },
]

export const PERMISSION_LABELS: Record<Permission, TranslationKey> = {
  'market:read': 'permissions.labels.marketRead',
  'market:realtime': 'permissions.labels.marketRealtime',
  'market:orderbook': 'permissions.labels.marketOrderbook',
  'analysis:read': 'permissions.labels.analysisRead',
  'analysis:export': 'permissions.labels.analysisExport',
  'analysis:save': 'permissions.labels.analysisSave',
  'portfolios:read': 'permissions.labels.portfoliosRead',
  'portfolios:write': 'permissions.labels.portfoliosWrite',
  'portfolios:reports': 'permissions.labels.portfoliosReports',
  'alerts:write': 'permissions.labels.alertsWrite',
  'research:read': 'permissions.labels.researchRead',
  'research:buy': 'permissions.labels.researchBuy',
  'publications:write': 'permissions.labels.publicationsWrite',
  'publications:earnings': 'permissions.labels.publicationsEarnings',
  'directory:list': 'permissions.labels.directoryList',
  'directory:profile': 'permissions.labels.directoryProfile',
  'messages:write': 'permissions.labels.messagesWrite',
  'news:write': 'permissions.labels.newsWrite',
  'news:stats': 'permissions.labels.newsStats',
  'news:moderate': 'permissions.labels.newsModerate',
  'news:payments': 'permissions.labels.newsPayments',
  'data:import': 'permissions.labels.dataImport',
  'content:publish': 'permissions.labels.contentPublish',
  'users:manage': 'permissions.labels.usersManage',
  'subscriptions:manage': 'permissions.labels.subscriptionsManage',
  'moderation:manage': 'permissions.labels.moderationManage',
  'settings:manage': 'permissions.labels.settingsManage',
  'audit:read': 'permissions.labels.auditRead',
  'payouts:manage': 'permissions.labels.payoutsManage',
}

/** The Admin keeps the settings: without them, nobody could give a permission back. */
export const isLockedPermission = (role: AccountType, permission: Permission) =>
  role === 'admin' && permission === 'settings:manage'
