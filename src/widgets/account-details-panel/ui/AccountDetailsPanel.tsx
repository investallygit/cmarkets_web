import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AccountTypeText, useAccount } from '@/entities/account'
import { AccountActions } from '@/features/manage-account'
import type { AdminUserDetailsDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { PanelEmpty } from '@/shared/ui/StatusViews'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex h-row items-center justify-between gap-3 border-b border-border/60">
      <dt className="shrink-0 font-sans text-data text-secondary">{label}</dt>
      <dd className="truncate text-right font-mono text-data">{children}</dd>
    </div>
  )
}

/**
 * Screen 9, account details: type, organisation, subscription, two-factor, publications and
 * sales of an analyst or research bought by a client, logins; then Change type, Reset two-factor,
 * View audit log and Suspend (GET /admin/users/{id}).
 */
export function AccountDetailsPanel({ accountId }: { accountId: string | null }) {
  const { t } = useTranslation()
  const account = useAccount(accountId)

  return (
    <Panel
      title={t('panels.accountDetails')}
      code="USER"
      options={account.data && <span className="normal-case">{account.data.displayName}</span>}
    >
      {accountId === null ? (
        <PanelEmpty message={t('accounts.choose')} />
      ) : (
        <QueryView query={account}>{(details) => <AccountDetails account={details} />}</QueryView>
      )}
    </Panel>
  )
}

function AccountDetails({ account }: { account: AdminUserDetailsDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const xaf = (amount: number) =>
    amount >= 1_000_000
      ? t('accounts.xafCompact', { amount: format.compact(amount) })
      : t('subscription.xaf', { amount: format.number(amount, 0) })
  const {
    subscription,
    publishing,
    reportsReceived,
    purchases,
    verificationDecision,
    suspension,
    lastLogin,
  } = account

  const typeDetail = !account.verificationStatus
    ? null
    : account.verificationStatus === 'pending'
      ? t('accounts.verificationPending', { date: format.date(account.createdAt) })
      : t(`accounts.verification.${account.verificationStatus}`, {
          date: verificationDecision ? format.date(verificationDecision.at) : '',
        })

  return (
    <div className="flex flex-col gap-2 p-2">
      <dl>
        <Row label={t('settings.profile.accountType')}>
          <AccountTypeText type={account.accountType} />
          {typeDetail && <span className="text-secondary"> ({typeDetail})</span>}
        </Row>
        <Row label={t('settings.profile.organization')}>
          {account.organization?.name ?? t('accounts.independent')}
          {account.organizationRole === 'admin' && (
            <span className="text-secondary"> · {t('organization.roles.admin')}</span>
          )}
        </Row>
        {account.phone && <Row label={t('settings.profile.phone')}>{account.phone}</Row>}
        <Row label={t('accounts.subscription')}>
          {!subscription
            ? t(account.twoFactor.mandatory ? 'accounts.employee' : 'accounts.noPlan')
            : subscription.status === 'trial'
              ? t('accounts.trialUntil', { date: format.date(subscription.periodEnd) })
              : subscription.status === 'expired'
                ? t('accounts.planEnded', {
                    plan: subscription.planName,
                    date: format.date(subscription.periodEnd),
                  })
                : t('accounts.planEnds', {
                    plan: subscription.planName,
                    cycle: subscription.billingCycle
                      ? t(`subscription.cycles.${subscription.billingCycle}`)
                      : '',
                    date: format.month(subscription.periodEnd.slice(0, 7)),
                  })}
          {subscription?.paidBy === 'organization' && (
            <span className="text-secondary"> · {t('accounts.paidByOrganization')}</span>
          )}
        </Row>
        <Row label={t('accounts.twoFactor')}>
          {t(account.twoFactor.mandatory ? 'accounts.mfaMandatory' : 'accounts.mfaEnabled', {
            channel: t(`accounts.channels.${account.twoFactor.channel}`),
          })}
        </Row>
        {publishing && (
          <>
            <Row label={t('accounts.publications')}>
              {publishing.withdrawn > 0
                ? t('accounts.publicationsWithdrawn', {
                    count: publishing.withdrawn,
                    total: publishing.publications,
                  })
                : format.number(publishing.publications, 0)}
            </Row>
            <Row label={t('accounts.sales')}>
              {format.number(publishing.sales, 0)} · {xaf(publishing.revenue)}
            </Row>
          </>
        )}
        {reportsReceived && (
          <Row label={t('accounts.reports')}>
            {reportsReceived.total === 0 ? (
              '0'
            ) : reportsReceived.referred ? (
              <span className="text-down">
                {t('accounts.reportsReferred', {
                  open: reportsReceived.open,
                  total: reportsReceived.total,
                })}
              </span>
            ) : reportsReceived.open > 0 ? (
              t('accounts.reportsOpen', {
                count: reportsReceived.open,
                total: reportsReceived.total,
              })
            ) : (
              t('accounts.reportsClosed', { count: reportsReceived.total })
            )}
          </Row>
        )}
        {purchases && account.accountType !== 'analyst' && (
          <Row label={t('accounts.purchases')}>
            {format.number(purchases.count, 0)}
            {purchases.count > 0 && ` · ${xaf(purchases.amount)}`}
          </Row>
        )}
        <Row label={t('accounts.lastLogin')}>
          {lastLogin
            ? `${format.date(lastLogin.at)} ${format.time(lastLogin.at)} · ${lastLogin.place}`
            : t('accounts.never')}
        </Row>
      </dl>
      {suspension && (
        <p role="note" className="border border-down/60 p-2 font-sans text-data text-down">
          {t('accounts.suspendedBy', {
            date: format.date(suspension.at),
            name: suspension.by,
            reason: suspension.reason ?? '',
          })}
        </p>
      )}
      {account.verificationStatus === 'rejected' && verificationDecision?.reason && (
        <p role="note" className="border p-2 font-sans text-data text-secondary">
          {t('accounts.rejectedBecause', {
            type: t(`accountTypes.${account.accountType}`),
            reason: verificationDecision.reason,
          })}
        </p>
      )}
      <AccountActions account={account} />
    </div>
  )
}
