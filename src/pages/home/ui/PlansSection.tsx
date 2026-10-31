import { clsx } from 'clsx'
import { Check, Minus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BILLING_CYCLES, usePublicPlans } from '@/entities/subscription'
import { MODULES, type BillingCycle, type PlanDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { yearlySavingPct } from '@/shared/lib/billing'
import { routes, signUpPath } from '@/shared/routes/paths'
import { ButtonLink } from '@/shared/ui/form/Button'
import { PanelError, PanelLoading } from '@/shared/ui/StatusViews'
import { useVisitorStatus } from '../model/useVisitorStatus'
import { Section } from './Section'

/**
 * The plans of spec section 6, as the server prices them (GET /subscription/plans, before login):
 * by month or by year, the modules of each, and the trial to start. A visitor already logged in
 * goes to the plans of CFG.
 */
export function PlansSection() {
  const { t } = useTranslation()
  const format = useFormat()
  const plans = usePublicPlans()
  const [cycle, setCycle] = useState<BillingCycle>('monthly')
  const first = plans.data?.[0]
  const saving = first ? yearlySavingPct(first.monthlyPrice, first.yearlyPrice) : 0

  return (
    <Section
      id="plans"
      eyebrow={t('home.plans.eyebrow')}
      title={t('home.plans.title')}
      lead={t('home.plans.lead')}
    >
      <div className="flex flex-col gap-6">
        <div
          role="group"
          aria-label={t('home.plans.cycle')}
          className="flex self-start border p-0.5"
        >
          {BILLING_CYCLES.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={cycle === value}
              onClick={() => setCycle(value)}
              className={clsx(
                'h-8 px-4 font-sans text-label',
                cycle === value
                  ? 'bg-brand-green font-semibold text-brand-navy'
                  : 'text-primary/75 hover:text-primary',
              )}
            >
              {value === 'monthly'
                ? t('home.plans.monthly')
                : saving > 0
                  ? t('subscription.yearlySaving', { pct: saving })
                  : t('subscription.cycles.yearly')}
            </button>
          ))}
        </div>
        {plans.isPending ? (
          <div className="h-40 border bg-panel">
            <PanelLoading />
          </div>
        ) : plans.isError ? (
          <div className="h-40 border bg-panel">
            <PanelError error={plans.error} onRetry={() => void plans.refetch()} />
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {plans.data.map((plan) => (
              <li key={plan.id}>
                <PlanCard plan={plan} cycle={cycle} />
              </li>
            ))}
          </ul>
        )}
        {first && (
          <p className="font-sans text-data text-secondary">
            {t('home.plans.payment', { rate: format.number(first.taxRatePct, 2) })}
          </p>
        )}
      </div>
    </Section>
  )
}

function PlanCard({ plan, cycle }: { plan: PlanDto; cycle: BillingCycle }) {
  const { t } = useTranslation()
  const format = useFormat()
  const visitor = useVisitorStatus()
  const xaf = (amount: number) => t('subscription.xaf', { amount: format.number(amount, 0) })
  const types = new Intl.ListFormat(format.locale).format(
    plan.accountTypes.map((type) => t(`accountTypes.${type}`)),
  )
  // The student plan opens the sign-up of a Student; the others leave the type to choose.
  const signUp = signUpPath(plan.accountTypes.length === 1 ? plan.accountTypes[0] : undefined)

  return (
    <article aria-label={plan.name} className="flex h-full flex-col gap-5 border bg-panel p-6">
      <header className="flex flex-col gap-1">
        <h3 className="font-sans text-figure font-semibold">{plan.name}</h3>
        {/* Two lines kept for the account types, so the prices line up. */}
        <p className="font-sans text-data text-secondary sm:min-h-8">
          {t('home.plans.for', { types })}
        </p>
      </header>
      <div className="flex flex-col gap-1">
        <p className="font-mono text-headline font-semibold">
          {xaf(cycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice)}
        </p>
        <p className="font-sans text-data text-secondary">
          {t(cycle === 'monthly' ? 'home.plans.perMonth' : 'home.plans.perYear')}
        </p>
        {cycle === 'yearly' && (
          <p className="font-sans text-data text-brand-green">
            {t('home.plans.monthlyEquivalent', { amount: xaf(Math.round(plan.yearlyPrice / 12)) })}
          </p>
        )}
      </div>
      <ul className="flex flex-col gap-2 border-t border-primary/10 pt-4">
        {MODULES.map((module) => {
          const included = plan.modules.includes(module)
          return (
            <li
              key={module}
              className={clsx(
                'flex items-center gap-2 font-sans text-label',
                !included && 'text-secondary',
              )}
            >
              {included ? (
                <Check aria-hidden className="size-4 shrink-0 text-brand-green" />
              ) : (
                <Minus aria-hidden className="size-4 shrink-0" />
              )}
              {t(`modules.${module}`)}
              <span className="sr-only">
                {` (${t(included ? 'subscription.included' : 'subscription.notIncluded')})`}
              </span>
            </li>
          )
        })}
      </ul>
      <ButtonLink
        to={visitor === 'authenticated' ? routes.settings : signUp}
        variant={visitor === 'authenticated' ? 'outline' : 'brand'}
        size="lg"
        className="mt-auto"
      >
        {t(visitor === 'authenticated' ? 'home.plans.seeMine' : 'home.plans.start')}
      </ButtonLink>
    </article>
  )
}
