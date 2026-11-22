import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { useBondPrice } from '@/entities/bond'
import type { BondPriceRequestDto } from '@/shared/api/contracts'
import { Panel } from '@/shared/ui/Panel'
import { ScrollArea } from '@/shared/ui/ScrollArea'
import { modeKey } from '../lib/modes'

/** The methods screen 16 explains, in the mockup's order: block B's three modes, then the Z-spread. */
const METHODS = ['yield', 'curve', 'rates', 'zSpread'] as const

interface CalculationMethodPanelProps {
  request: BondPriceRequestDto | null
}

/**
 * Screen 16, calculation method (fifth version): how each mode of block B discounts the cash
 * flows and what the Z-spread is; the mode of the last calculation stands out in amber.
 */
export function CalculationMethodPanel({ request }: CalculationMethodPanelProps) {
  const { t } = useTranslation()
  const data = useBondPrice(request).data
  const active = data ? modeKey(data.discount.mode) : null

  return (
    <Panel title={t('bondPricing.methods.title')} code="BP" bodyClassName="flex flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <ul>
          {METHODS.map((method, index) => (
            <li
              key={method}
              aria-current={method === active || undefined}
              className={clsx('px-2 py-2', index % 2 === 1 && 'bg-row-alt')}
            >
              <p
                className={clsx(
                  'font-sans text-data font-semibold',
                  method === active ? 'text-accent-amber' : 'text-primary',
                )}
              >
                {t(`bondPricing.methods.${method}.title`)}
              </p>
              <p className="font-sans text-title text-secondary">
                {t(`bondPricing.methods.${method}.text`)}
              </p>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </Panel>
  )
}
