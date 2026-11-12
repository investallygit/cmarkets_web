import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  SUBSCRIPTION_STATUS_COLORS,
  useAdminPlans,
  useAdminSubscription,
} from '@/entities/subscription'
import { SubscriptionActions } from '@/features/manage-subscription'
import type { AdminSubscriptionDetailsDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { PanelEmpty } from '@/shared/ui/StatusViews'
import { useSubscriptionText } from '../lib/useSubscriptionText'
import { SubscriptionPayments } from './SubscriptionPayments'

function Row({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className="flex h-row items-center justify-between gap-3 border-b border-border/60">
      <dt className="shrink-0 font-sans text-data text-secondary">{label}</dt>
      <dd className={clsx('truncate text-right font-mono text-data', className)}>{children}</dd>
    </div>
  )
}

/**
 * Screen 14, account subscription (GET /admin/subscriptions/{accountId}): account, type, plan and
 * price, status, start, expiry, auto-renewal and the stored card or number, last payment, last
 * invoice; then its payments and invoices, and Extend, Change plan, Resend last invoice, Suspend.
 * A member's is its organisation's subscription, which the actions change.
 */
export function AccountSubscriptionPanel({ accountId }: { accountId: string | null }) {
  const { t } = useTranslation()
  const subscription = useAdminSubscription(accountId)

  return (
    <Panel
      title={t('panels.accountSubscription')}
      code="SUBS"
      options={subscription.data && <span>{subscription.data.name}</span>}
    >
      {accountId === null ? (
        <PanelEmpty message={t('subscriptionAdmin.details.choose')} />
      ) : (
        <QueryView query={subscription}>{(details) => <Details details={details} />}</QueryView>
      )}
    </Panel>
  )
}

function Details({ details }: { details: AdminSubscriptionDetailsDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const plans = useAdminPlans()
  const text = useSubscriptionText(plans.data)
  const { storedMethod, suspension, lastPayment } = details
  const perPeriod = details.billingCycle === 'monthly' ? 'perMonth' : 'perYear'
  const plan = text.planName(details)
  const renewal =
    details.method === 'agreement'
      ? t('subscriptionAdmin.details.byAgreement')
      : details.method === 'transfer'
        ? t('subscriptionAdmin.details.byTransfer')
        : storedMethod
          ? t(
              `subscriptionAdmin.details.${storedMethod.method === 'mobileMoney' ? 'mobileMoney' : 'card'}`,
              {
                ending: storedMethod.ending,
              },
            )
          : t('subscriptionAdmin.details.nothingStored')

  return (
    <div className="flex flex-col gap-3 p-2">
      {details.viaOrganization && (
        <p className="font-sans text-data text-secondary">
          {t('subscriptionAdmin.details.via', { name: details.viaOrganization.name })}
        </p>
      )}
      <dl>
        <Row label={t('subscriptionAdmin.details.account')}>
          {details.email
            ? t('subscriptionAdmin.details.accountLine', {
                name: details.name,
                email: details.email,
              })
            : details.name}
        </Row>
        <Row label={t('subscriptionAdmin.details.type')}>{text.type(details)}</Row>
        <Row label={t('subscriptionAdmin.details.plan')}>
          {details.billingCycle
            ? t('subscriptionAdmin.details.price', {
                plan,
                currency: details.currency,
                amount: text.amount(details.price),
                per: t(`subscriptionAdmin.details.${perPeriod}`),
              })
            : plan}
          {details.seats > 1 && (
            <span className="text-secondary">
              {' · '}
              {t('subscriptionAdmin.details.seats', { count: details.seats })}
            </span>
          )}
        </Row>
        <Row
          label={t('subscriptionAdmin.details.status')}
          className={SUBSCRIPTION_STATUS_COLORS[details.status]}
        >
          {t(`subscriptionAdmin.statuses.${details.status}`)}
        </Row>
        <Row label={t('subscriptionAdmin.details.start')}>{format.isoDate(details.startedOn)}</Row>
        <Row label={t('subscriptionAdmin.details.expiry')}>{format.isoDate(details.expiresOn)}</Row>
        {details.billingCycle && (
          <Row label={t('subscriptionAdmin.details.autoRenewal')}>
            {details.autoRenew ? t('subscriptionAdmin.yes') : t('subscriptionAdmin.no')} · {renewal}
          </Row>
        )}
        <Row label={t('subscriptionAdmin.details.lastPayment')}>
          {lastPayment
            ? t('subscriptionAdmin.details.lastPaymentLine', {
                date: format.date(lastPayment.at),
                currency: lastPayment.currency,
                amount: text.amount(lastPayment.amount),
              })
            : t('subscriptionAdmin.details.none')}
        </Row>
        <Row label={t('subscriptionAdmin.details.lastInvoice')}>
          {details.lastInvoice?.number ?? t('subscriptionAdmin.details.none')}
        </Row>
      </dl>
      {details.retryUntil && (
        <p className="font-sans text-data text-down">
          {t('subscriptionAdmin.details.retryUntil', { date: format.isoDate(details.retryUntil) })}
        </p>
      )}
      {suspension && (
        <p className="font-sans text-data text-accent-amber">
          {suspension.by
            ? t('subscriptionAdmin.details.suspendedOn', {
                date: format.date(suspension.at),
                name: suspension.by,
                reason: suspension.reason,
              })
            : t('subscriptionAdmin.details.suspendedOnBy', {
                date: format.date(suspension.at),
                reason: suspension.reason,
              })}
        </p>
      )}
      <SubscriptionPayments
        accountId={details.payer.id}
        currency={details.currency}
        method={text.method}
      />
      <SubscriptionActions
        subscription={details}
        plans={plans.data ?? []}
        planName={text.planName}
      />
    </div>
  )
}
