import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  AdminPlanDto,
  AdminSubscriptionRowDto,
  LastPaymentDto,
  PlanPaymentMethod,
} from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { membersLine } from './subscriptionText'

type PlanOfRow = Pick<
  AdminSubscriptionRowDto,
  'planId' | 'planName' | 'billingCycle' | 'viaOrganization'
>

/**
 * SUBS's words, as the mockup writes them: "Professional annual", a member's "Org. (Asset manager
 * A)", a plan given by agreement without its cycle; "Manager ×4, CEO ×1"; "15/03/2026 · 834,750
 * · Card", a member's "— (via organisation)".
 */
export function useSubscriptionText(plans: readonly AdminPlanDto[] | undefined) {
  const { t } = useTranslation()
  const format = useFormat()
  return useMemo(() => {
    const byAgreement = new Set(plans?.filter((plan) => plan.byAgreement).map((plan) => plan.id))
    const none = t('subscriptionAdmin.details.none')
    const method = (value: PlanPaymentMethod | null) =>
      value ? t(`subscriptionAdmin.methods.${value}`) : none
    const planName = (row: Omit<PlanOfRow, 'viaOrganization'>) => {
      if (!row.billingCycle) return t('subscriptionAdmin.planTrial', { plan: row.planName })
      if (byAgreement.has(row.planId)) return row.planName
      return t('subscriptionAdmin.planCycle', {
        plan: row.planName,
        cycle: t(`subscriptionAdmin.cycles.${row.billingCycle}`),
      })
    }
    const paymentLine = (payment: LastPaymentDto) =>
      t('subscriptionAdmin.lastPaymentLine', {
        date: format.date(payment.at),
        amount: format.number(payment.amount, 0),
        method: method(payment.method),
      })
    return {
      method,
      /** The plan's name and cycle; a member's organisation; a trial's plan. */
      plan: (row: PlanOfRow) =>
        row.viaOrganization
          ? t('subscriptionAdmin.organizationPlan', { name: row.viaOrganization.name })
          : planName(row),
      /** The plan's name and cycle, whoever pays it. */
      planName,
      /** A user's type; an organisation's members by type. */
      type: (row: Pick<AdminSubscriptionRowDto, 'accountType' | 'members'>) =>
        row.accountType
          ? t(`accountBadge.${row.accountType}`)
          : membersLine(row.members, (member) =>
              t('subscriptionAdmin.memberCount', {
                type: t(`accountBadge.${member.type}`),
                count: member.count,
              }),
            ),
      lastPayment: (row: Pick<AdminSubscriptionRowDto, 'lastPayment' | 'viaOrganization'>) =>
        row.viaOrganization
          ? t('subscriptionAdmin.viaOrganization')
          : row.lastPayment
            ? paymentLine(row.lastPayment)
            : none,
      autoRenew: (value: boolean | null) =>
        value === null ? none : value ? t('subscriptionAdmin.yes') : t('subscriptionAdmin.no'),
      /** An amount in francs, without decimals: "834,750". */
      amount: (value: number) => format.number(value, 0),
    }
  }, [t, format, plans])
}
