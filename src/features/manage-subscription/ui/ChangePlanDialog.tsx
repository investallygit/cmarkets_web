import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BILLING_CYCLES,
  useChangeSubscriptionPlan,
  usePlanChangeProration,
} from '@/entities/subscription'
import type {
  AdminPlanDto,
  AdminSubscriptionDetailsDto,
  BillingCycle,
  PlanChangeProrationDto,
} from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { SegmentedControl } from '@/shared/ui/form/SegmentedControl'
import { Select } from '@/shared/ui/form/Select'
import { toast } from '@/shared/ui/toast'

type PlanName = (plan: {
  planId: string
  planName: string
  billingCycle: BillingCycle | null
}) => string

interface ChangePlanDialogProps {
  subscription: AdminSubscriptionDetailsDto
  plans: readonly AdminPlanDto[]
  planName: PlanName
  open: boolean
  onClose: () => void
}

/**
 * PUT /admin/subscriptions/{accountId}/plan: a plan the account may have and its cycle, the change
 * previewed as the server prorates it by the day (GET .../proration) before it is confirmed.
 */
export function ChangePlanDialog({ subscription, open, onClose, ...rest }: ChangePlanDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('subscriptionAdmin.actions.changePlanTitle', { name: subscription.payer.name })}
      width={460}
    >
      <ChangePlanForm subscription={subscription} onClose={onClose} {...rest} />
    </Dialog>
  )
}

/** Mounted with each opening, so the choice starts on the plan in force. */
function ChangePlanForm({
  subscription,
  plans,
  planName,
  onClose,
}: Omit<ChangePlanDialogProps, 'open'>) {
  const { t } = useTranslation()
  const format = useFormat()
  const change = useChangeSubscriptionPlan()
  const allowed = plans.filter((plan) => subscription.planIds.includes(plan.id))
  const [planId, setPlanId] = useState(
    allowed.some((plan) => plan.id === subscription.planId)
      ? subscription.planId
      : (allowed[0]?.id ?? ''),
  )
  const [cycle, setCycle] = useState<BillingCycle>(subscription.billingCycle ?? 'yearly')
  // The plan in force, renewing as it is: nothing to change, nothing to ask the server.
  const current =
    planId === subscription.planId &&
    cycle === subscription.billingCycle &&
    (subscription.status === 'active' ||
      subscription.status === 'expiringSoon' ||
      subscription.status === 'paymentFailed')
  const choice = planId && !current ? { planId, billingCycle: cycle } : null
  const proration = usePlanChangeProration(subscription.payer.id, choice)
  const preview = choice ? proration.data : undefined

  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        if (!choice || !preview) return
        change.mutate(
          { accountId: subscription.payer.id, change: choice },
          {
            onSuccess: (changed) => {
              toast.success(
                t('subscriptionAdmin.actions.planChanged', {
                  name: subscription.payer.name,
                  plan: planName(changed),
                  date: format.isoDate(changed.expiresOn),
                }),
              )
              onClose()
            },
          },
        )
      }}
    >
      <DialogBody>
        <p className="font-sans text-label">{t('subscriptionAdmin.actions.changePlanMessage')}</p>
        <Field label={t('subscriptionAdmin.actions.newPlan')}>
          <Select
            value={planId}
            options={allowed.map((plan) => ({ value: plan.id, label: plan.name }))}
            onChange={setPlanId}
            highlight
          />
        </Field>
        <Field label={t('subscriptionAdmin.actions.cycle')} group>
          <SegmentedControl
            value={cycle}
            options={BILLING_CYCLES.map((value) => ({
              value,
              label: t(`subscriptionAdmin.cycleOptions.${value}`),
            }))}
            onChange={setCycle}
          />
        </Field>
        <div
          aria-live="polite"
          className="flex flex-col gap-1 border bg-row-alt p-2 font-sans text-data"
        >
          <span className="font-semibold tracking-title text-secondary uppercase">
            {t('subscriptionAdmin.proration.title')}
          </span>
          {current ? (
            <span className="text-secondary">{t('subscriptionAdmin.proration.current')}</span>
          ) : proration.isFetching && !preview ? (
            <span className="text-secondary">{t('subscriptionAdmin.proration.loading')}</span>
          ) : proration.error ? (
            <span role="alert" className="text-down">
              {proration.error.message}
            </span>
          ) : (
            preview && (
              <Proration preview={preview} subscription={subscription} planName={planName} />
            )
          )}
        </div>
        {change.error && (
          <p role="alert" className="font-sans text-data text-down">
            {change.error.message}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button type="button" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={!preview || proration.isFetching || proration.isError}
          busy={change.isPending}
        >
          {t('subscriptionAdmin.actions.changePlan')}
        </Button>
      </DialogFooter>
    </form>
  )
}

interface ProrationProps {
  preview: PlanChangeProrationDto
  subscription: AdminSubscriptionDetailsDto
  planName: PlanName
}

/** The days left of the plan in force, what they buy of the new one, or what is charged now. */
function Proration({ preview, subscription, planName }: ProrationProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const current = planName(subscription)
  const next = planName({
    planId: preview.planId,
    planName: preview.planName,
    billingCycle: preview.billingCycle,
  })
  const date = format.isoDate(preview.expiresOn)
  return (
    <>
      <span>
        {preview.daysLeft > 0
          ? t('subscriptionAdmin.proration.daysLeft', {
              days: preview.daysLeft,
              plan: current,
              currency: preview.currency,
              value: format.number(preview.valueLeft, 0),
            })
          : t('subscriptionAdmin.proration.nothingLeft', { plan: current })}
      </span>
      <span className="text-primary">
        {preview.free
          ? t('subscriptionAdmin.proration.free', { plan: next, date })
          : preview.chargeNow > 0
            ? t('subscriptionAdmin.proration.chargeNow', {
                plan: next,
                date,
                currency: preview.currency,
                amount: format.number(preview.chargeNow, 0),
              })
            : t('subscriptionAdmin.proration.buys', { days: preview.newDays, plan: next, date })}
      </span>
    </>
  )
}
