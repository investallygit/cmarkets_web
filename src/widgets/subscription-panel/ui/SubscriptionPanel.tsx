import { clsx } from 'clsx'
import { Check, Minus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlanCheckout } from '@/features/choose-plan'
import { BILLING_CYCLES, usePlans, useSubscription } from '@/entities/subscription'
import {
  MODULES,
  type BillingCycle,
  type PlanDto,
  type SubscriptionDto,
} from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { yearlySavingPct } from '@/shared/lib/billing'
import { Button } from '@/shared/ui/form/Button'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import { PanelError, PanelLoading } from '@/shared/ui/StatusViews'

/**
 * CFG, the subscription (spec section 6): the plan that covers the user and its modules, the free
 * trial, then the plans by month or year, chosen and paid by card, mobile money or transfer.
 */
export function SubscriptionPanel() {
  const { t } = useTranslation()
  const subscription = useSubscription()
  const plans = usePlans()
  // The current plan's cycle first; yearly, the cheaper, for a trial.
  const [chosenCycle, setCycle] = useState<BillingCycle | null>(null)
  const cycle = chosenCycle ?? subscription.data?.billingCycle ?? 'yearly'
  const [chosen, setChosen] = useState<PlanDto | null>(null)
  const saving = plans.data?.[0]
    ? yearlySavingPct(plans.data[0].monthlyPrice, plans.data[0].yearlyPrice)
    : 0

  const options = (
    <PanelTabs
      value={cycle}
      options={BILLING_CYCLES.map((value) => ({
        value,
        label:
          value === 'yearly' && saving > 0
            ? t('subscription.yearlySaving', { pct: saving })
            : t(`subscription.cycles.${value}`),
      }))}
      onChange={setCycle}
    />
  )

  return (
    <Panel title={t('panels.subscription')} code="CFG" options={options}>
      {subscription.isPending || plans.isPending ? (
        <PanelLoading />
      ) : subscription.isError || plans.isError ? (
        <PanelError
          error={subscription.error ?? plans.error}
          onRetry={() => {
            void subscription.refetch()
            void plans.refetch()
          }}
        />
      ) : (
        <div className="flex flex-col gap-3 p-3">
          <CurrentPlan subscription={subscription.data} />
          <PlanTable
            plans={plans.data}
            subscription={subscription.data}
            cycle={cycle}
            onChoose={setChosen}
          />
          <PlanCheckout
            plan={chosen}
            billingCycle={cycle}
            seats={subscription.data?.seats ?? 1}
            onClose={() => setChosen(null)}
          />
        </div>
      )}
    </Panel>
  )
}

/** The plan in force, by the name the API gives it: the media's plan by agreement is not among those offered. */
function CurrentPlan({ subscription }: { subscription: SubscriptionDto | null }) {
  const { t } = useTranslation()
  const format = useFormat()
  if (!subscription) {
    return <p className="font-sans text-label text-secondary">{t('subscription.none')}</p>
  }
  const name = subscription.planName
  const end = format.isoDate(subscription.periodEnd)
  const status =
    subscription.status === 'trial'
      ? t('subscription.status.trial', { date: end })
      : subscription.status === 'expired'
        ? t('subscription.status.expired', { date: end })
        : subscription.status === 'paymentFailed'
          ? t('subscription.status.paymentFailed')
          : subscription.status === 'suspended'
            ? t('subscription.status.suspended')
            : t('subscription.status.active', {
                cycle: t(`subscription.cycles.${subscription.billingCycle ?? 'monthly'}`),
                date: end,
              })

  return (
    <section aria-label={t('subscription.current')} className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-sans text-data text-secondary">{t('subscription.current')}</span>
        <span className="font-sans text-figure font-semibold">{name}</span>
        <span
          className={clsx(
            'font-sans text-label',
            subscription.status === 'expired' ||
              subscription.status === 'paymentFailed' ||
              subscription.status === 'suspended'
              ? 'text-down'
              : subscription.status === 'trial'
                ? 'text-warning'
                : 'text-up',
          )}
        >
          {status}
        </span>
      </div>
      <p className="font-sans text-data text-secondary">
        {subscription.payer === 'organization'
          ? t('subscription.paidByOrganization', { count: subscription.seats })
          : t('subscription.paidByUser')}
        {' · '}
        {subscription.modules.length > 0
          ? subscription.modules.map((module) => t(`modules.${module}`)).join(', ')
          : t('subscription.noModule')}
      </p>
      {subscription.dueInvoiceId && (
        <p className="font-sans text-data text-warning">{t('subscription.invoiceDue')}</p>
      )}
      {!subscription.canManage && (
        <p className="font-sans text-data text-secondary">{t('subscription.managedByAdmins')}</p>
      )}
    </section>
  )
}

interface PlanTableProps {
  plans: PlanDto[]
  subscription: SubscriptionDto | null
  cycle: BillingCycle
  onChoose: (plan: PlanDto) => void
}

function PlanTable({ plans, subscription, cycle, onChoose }: PlanTableProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const canManage = subscription?.canManage ?? true
  const cell = 'h-row border-b px-2'

  return (
    <table className="w-full border-collapse font-sans text-data">
      <caption className="sr-only">{t('subscription.plans')}</caption>
      <thead>
        <tr className="bg-panel-header text-left text-secondary">
          <th scope="col" className={cell}>
            {t('subscription.plan')}
          </th>
          {MODULES.map((module) => (
            <th key={module} scope="col" className={clsx(cell, 'text-center')}>
              {t(`modules.${module}`)}
            </th>
          ))}
          <th scope="col" className={clsx(cell, 'text-right')}>
            {t(`subscription.pricePer.${cycle}`)}
          </th>
          <th scope="col" className={cell}>
            <span className="sr-only">{t('subscription.choose')}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {plans.map((plan) => {
          const current =
            subscription?.planId === plan.id &&
            subscription.status === 'active' &&
            subscription.billingCycle === cycle
          const price = cycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
          return (
            <tr key={plan.id} className={current ? 'bg-selected' : undefined}>
              <th scope="row" className={clsx(cell, 'text-left font-semibold')}>
                {plan.name}
              </th>
              {MODULES.map((module) => (
                <td key={module} className={clsx(cell, 'text-center')}>
                  {plan.modules.includes(module) ? (
                    <Check
                      aria-label={t('subscription.included')}
                      className="mx-auto size-3.5 text-up"
                    />
                  ) : (
                    <Minus
                      aria-label={t('subscription.notIncluded')}
                      className="mx-auto size-3.5 text-secondary"
                    />
                  )}
                </td>
              ))}
              <td className={clsx(cell, 'text-right font-mono text-accent-amber')}>
                {t('subscription.xaf', { amount: format.number(price, 0) })}
              </td>
              <td className={clsx(cell, 'text-right')}>
                {current ? (
                  <span className="font-sans text-title tracking-title text-up uppercase">
                    {t('subscription.currentTag')}
                  </span>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => onChoose(plan)}
                    disabled={!canManage}
                    aria-label={t('subscription.chooseNamed', { plan: plan.name })}
                  >
                    {t('subscription.choose')}
                  </Button>
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
