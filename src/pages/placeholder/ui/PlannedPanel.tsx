import { clsx } from 'clsx'
import { Construction } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { Panel } from '@/shared/ui/Panel'
import type { PanelPlan } from '../config/plans'

export function PlannedPanel({ plan }: { plan: PanelPlan }) {
  const { t } = useTranslation()
  const { securityId, bondId } = useParams()
  const subject = securityId ?? bondId
  const compact = plan.h <= 3

  return (
    <Panel title={plan.title} code={plan.code}>
      <div
        className={clsx(
          'flex h-full items-center justify-center gap-x-4 gap-y-2 p-3 text-center',
          compact ? 'flex-row flex-wrap' : 'flex-col',
        )}
      >
        <span className="inline-flex items-center gap-2 font-sans text-label text-secondary">
          <Construction aria-hidden className="size-4 shrink-0" />
          {t('placeholder.notBuilt')}
        </span>
        {subject && <span className="font-mono text-data text-accent-amber">{subject}</span>}
        <ul className={clsx('font-mono text-title text-info', compact && 'flex flex-wrap gap-x-3')}>
          {plan.api.map((endpoint) => (
            <li key={endpoint}>{endpoint}</li>
          ))}
        </ul>
      </div>
    </Panel>
  )
}
