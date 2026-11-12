import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useResendInvoice, useSuspendSubscription } from '@/entities/subscription'
import type {
  AdminPlanDto,
  AdminSubscriptionDetailsDto,
  BillingCycle,
} from '@/shared/api/contracts'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Button } from '@/shared/ui/form/Button'
import { toast } from '@/shared/ui/toast'
import { ChangePlanDialog } from './ChangePlanDialog'
import { ExtendSubscriptionDialog } from './ExtendSubscriptionDialog'

type Asking = 'extend' | 'plan' | 'suspend' | null

interface SubscriptionActionsProps {
  subscription: AdminSubscriptionDetailsDto
  plans: readonly AdminPlanDto[]
  /** "Professional annual", as the list writes a plan. */
  planName: (plan: {
    planId: string
    planName: string
    billingCycle: BillingCycle | null
  }) => string
}

/**
 * The actions of screen 14's account subscription: Extend subscription (a later day and a reason),
 * Change plan (prorated by the day, previewed), Resend last invoice, Suspend subscription (a reason,
 * confirmed) or lift the suspension. They change the payer's subscription: a member's is its
 * organisation's.
 */
export function SubscriptionActions({ subscription, plans, planName }: SubscriptionActionsProps) {
  const { t } = useTranslation()
  const resend = useResendInvoice()
  const suspend = useSuspendSubscription()
  const [asking, setAsking] = useState<Asking>(null)
  const name = subscription.payer.name
  const suspended = subscription.status === 'suspended'
  const close = () => {
    suspend.reset()
    setAsking(null)
  }
  const lastInvoice = subscription.lastInvoice

  return (
    <div className="flex flex-col gap-1.5">
      <Button onClick={() => setAsking('extend')}>{t('subscriptionAdmin.actions.extend')}</Button>
      <Button
        disabled={suspended}
        title={suspended ? t('subscriptionAdmin.actions.suspendedFirst') : undefined}
        onClick={() => setAsking('plan')}
      >
        {t('subscriptionAdmin.actions.changePlan')}
      </Button>
      <Button
        variant="info"
        disabled={!lastInvoice || resend.isPending}
        title={lastInvoice ? undefined : t('subscriptionAdmin.actions.noInvoice')}
        onClick={() =>
          lastInvoice &&
          resend.mutate(lastInvoice.id, {
            onSuccess: (sent) =>
              toast.success(
                t('subscriptionAdmin.actions.resent', {
                  number: sent.number,
                  to: sent.sentTo.join(', '),
                }),
              ),
            onError: (error) => toast.error(error.message),
          })
        }
      >
        {t('subscriptionAdmin.actions.resend')}
      </Button>
      <Button
        variant={suspended ? 'success' : 'danger'}
        disabled={!suspended && subscription.status === 'expired'}
        onClick={() => setAsking('suspend')}
      >
        {suspended
          ? t('subscriptionAdmin.actions.reactivate')
          : t('subscriptionAdmin.actions.suspend')}
      </Button>

      <ExtendSubscriptionDialog
        subscription={subscription}
        open={asking === 'extend'}
        onClose={() => setAsking(null)}
      />
      <ChangePlanDialog
        subscription={subscription}
        plans={plans}
        planName={planName}
        open={asking === 'plan'}
        onClose={() => setAsking(null)}
      />
      <ConfirmDialog
        open={asking === 'suspend'}
        onClose={close}
        title={
          suspended
            ? t('subscriptionAdmin.actions.reactivateTitle', { name })
            : t('subscriptionAdmin.actions.suspendTitle', { name })
        }
        message={
          <>
            {suspended
              ? t('subscriptionAdmin.actions.reactivateMessage')
              : t('subscriptionAdmin.actions.suspendMessage')}
            {suspend.error && (
              <span role="alert" className="mt-2 block text-down">
                {suspend.error.message}
              </span>
            )}
          </>
        }
        confirmLabel={
          suspended
            ? t('subscriptionAdmin.actions.reactivate')
            : t('subscriptionAdmin.actions.suspend')
        }
        tone={suspended ? 'primary' : 'danger'}
        requireReason
        busy={suspend.isPending}
        onConfirm={(reason) =>
          suspend.mutate(
            { accountId: subscription.payer.id, suspend: !suspended, reason },
            {
              onSuccess: () => {
                toast.success(
                  suspended
                    ? t('subscriptionAdmin.actions.reactivated', { name })
                    : t('subscriptionAdmin.actions.suspended', { name }),
                )
                setAsking(null)
              },
            },
          )
        }
      />
    </div>
  )
}
