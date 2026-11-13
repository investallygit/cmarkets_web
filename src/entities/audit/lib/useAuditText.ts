import { useTranslation } from 'react-i18next'
import {
  ACCOUNT_TYPES,
  CLIENT_ACCOUNT_TYPES,
  PERMISSIONS,
  type AuditAction,
  type AuditChangeDto,
  type AuditEntryDto,
  type AuditValue,
} from '@/shared/api/contracts'
import { PERMISSION_LABELS } from '@/shared/config/permissions'
import { useFormat } from '@/shared/i18n'

const oneOf = <T extends string>(values: readonly T[], value: AuditValue): T | undefined =>
  values.find((candidate) => candidate === value)

const QUOTAS = ['portfolios', 'alerts'] as const
const ACCOUNT_STATUSES = ['active', 'suspended'] as const
const VERIFICATION_STATUSES = ['pending', 'approved', 'rejected'] as const
const CHANNELS = ['email', 'sms'] as const
const MODERATION_MODES = ['before', 'after'] as const
const PAYOUT_STATUSES = ['accruing', 'due', 'paid'] as const
const CONTACT_MODES = ['direct', 'request', 'none'] as const
const LANGUAGES = ['fr', 'en'] as const
const PUBLICATION_STATUSES = ['draft', 'pending', 'published', 'archived'] as const
const IMPORT_STATUSES = [
  'format',
  'checks',
  'ready',
  'published',
  'rolledBack',
  'discarded',
] as const

/** An entry of the audit log in the user's language: action, target and each change. */
export function useAuditText() {
  const { t } = useTranslation()
  const format = useFormat()

  const field = (change: AuditChangeDto): string => {
    const quota = oneOf(QUOTAS, change.field)
    const type = oneOf(ACCOUNT_TYPES, change.scope)
    if (quota && type) {
      return t('audit.quotaOf', {
        quota: t(`audit.fields.${quota}`),
        type: t(`accountTypes.${type}`),
      })
    }
    if (change.field === 'verificationStatus' && type) {
      return t('audit.statusOf', { type: t(`accountTypes.${type}`) })
    }
    const client = oneOf(CLIENT_ACCOUNT_TYPES, change.scope)
    if ((change.field === 'contactRule' || change.field === 'newConversations') && client) {
      return t('audit.fieldOf', {
        field: t(`audit.fields.${change.field}`),
        type: t(`accountTypes.${client}`),
      })
    }
    const language = oneOf(LANGUAGES, change.scope)
    if (change.field === 'name' && language) {
      return t('audit.nameIn', { language: t(`specialties.${language}`) })
    }
    // A security's description (CORR): its language as the scope.
    if (change.field === 'description' && language) return t(`audit.descriptionIn.${language}`)
    const permission = oneOf(PERMISSIONS, change.scope)
    if (change.field === 'permission' && permission) return t(PERMISSION_LABELS[permission])
    // An ETF currency's rate (spec section 14.5): its code as the scope, XAF's without one.
    if (change.field === 'riskFreeRatePct' && change.scope) {
      return t('audit.riskFreeRateOf', { currency: change.scope })
    }
    return t(`audit.fields.${change.field}`)
  }

  const label = <T extends string>(
    values: readonly T[],
    value: AuditValue,
    text: (value: T) => string,
  ) => {
    const known = oneOf(values, value)
    return known ? text(known) : String(value)
  }

  const value = (change: AuditChangeDto, raw: AuditValue): string => {
    if (raw === null || raw === '') {
      return oneOf(QUOTAS, change.field) ? t('audit.unlimited') : '—'
    }
    if (typeof raw === 'boolean') return raw ? t('audit.granted') : t('audit.notGranted')
    if (typeof raw === 'number') {
      switch (change.field) {
        case 'minPrice':
        case 'maxPrice':
          return t('subscription.xaf', { amount: format.number(raw, 0) })
        case 'commissionPct':
        case 'riskFreeRatePct':
          return format.percent(raw, Number.isInteger(raw) ? 0 : 2, false)
        default:
          return format.number(raw, Number.isInteger(raw) ? 0 : 2)
      }
    }
    switch (change.field) {
      case 'accountType':
        return label(ACCOUNT_TYPES, raw, (type) => t(`accountTypes.${type}`))
      case 'status':
        return label(ACCOUNT_STATUSES, raw, (status) => t(`accounts.statuses.${status}`))
      case 'verificationStatus':
        return label(VERIFICATION_STATUSES, raw, (status) =>
          t(`analystRequests.statuses.${status}`),
        )
      case 'twoFactorChannel':
        return label(CHANNELS, raw, (channel) => t(`accounts.channels.${channel}`))
      case 'moderation':
        return label(MODERATION_MODES, raw, (mode) => t(`platformSettings.moderation.${mode}`))
      case 'contactRule':
        return label(CONTACT_MODES, raw, (mode) => t(`network.privacy.modes.${mode}`))
      case 'payout':
        return label(PAYOUT_STATUSES, raw, (status) => t(`payouts.statuses.${status}`))
      case 'publicationStatus':
        return label(PUBLICATION_STATUSES, raw, (status) => t(`studio.statuses.${status}`))
      case 'importStatus':
        return label(IMPORT_STATUSES, raw, (status) => t(`dataImport.status.${status}`))
      case 'xafReferenceCurve':
        return t('platformSettings.countryCurve', { country: format.country(raw) })
      default:
        return raw
    }
  }

  return {
    action: (action: AuditAction) => t(`audit.actions.${action}`),
    target: (target: AuditEntryDto['target']) => {
      if (target.type === 'role') {
        const type = oneOf(ACCOUNT_TYPES, target.id)
        return type ? t('audit.roleOf', { type: t(`accountTypes.${type}`) }) : target.label
      }
      if (target.type !== 'settings') return target.label
      if (target.id === 'directory') return t('audit.directorySettings')
      // FX's currencies (step 39), ECO's countries and tiles with them from step 40.
      if (target.id === 'macro') return t('audit.macroSettings')
      return t('audit.platformSettings')
    },
    /** "Type: Trader → Analyst"; only the new value when there was none. */
    change: (change: AuditChangeDto) =>
      change.before === null && !oneOf(QUOTAS, change.field)
        ? `${field(change)}: ${value(change, change.after)}`
        : `${field(change)}: ${value(change, change.before)} → ${value(change, change.after)}`,
    field,
    value,
  }
}
