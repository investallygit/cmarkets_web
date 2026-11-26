import { clsx } from 'clsx'
import { Check, Info, TriangleAlert, type LucideIcon } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { useFormat } from '@/shared/i18n'
import type { EntryStatus } from '../model/entryStatus'

interface EntryStatusBoxProps {
  status: EntryStatus
  byTenor: boolean
  /** The curve the rates started from (their reference), as block B labels it. */
  start: string | null
}

/**
 * Block B's "Entry status" (spec section 9, sixth version; ROADMAP decision 56): the rates entered
 * for the dates or the tenors, the 0–30% check, the average spread to the reference curve and the
 * starting point.
 */
export function EntryStatusBox({ status, byTenor, start }: EntryStatusBoxProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const headingId = useId()
  const complete = byTenor ? status.entered > 0 : status.missing === 0
  return (
    <section aria-labelledby={headingId} className="grid gap-1 border bg-panel-header p-2">
      <h4
        id={headingId}
        className="font-mono text-label font-semibold tracking-title text-accent-amber uppercase"
      >
        {t('bondPricing.entry.status')}
      </h4>
      <ul className="grid gap-0.5">
        <Line icon={complete ? Check : TriangleAlert} tone={complete ? 'ok' : 'warning'}>
          {byTenor
            ? t('bondPricing.entry.enteredTenors', { count: status.entered, total: status.total })
            : t('bondPricing.entry.enteredDates', { count: status.entered, total: status.total })}
        </Line>
        <Line
          icon={status.outside === 0 ? Check : TriangleAlert}
          tone={status.outside === 0 ? 'ok' : 'warning'}
        >
          {status.outside === 0
            ? t('bondPricing.entry.inRange')
            : t('bondPricing.entry.outside', { count: status.outside })}
        </Line>
        {status.averageSpread !== null && (
          <Line icon={Info} tone="info">
            {t('bondPricing.entry.averageSpread', {
              spread:
                status.averageSpread === 0
                  ? format.number(0, 1)
                  : format.signed(status.averageSpread, 1),
            })}
          </Line>
        )}
      </ul>
      {start && (
        <p className="font-sans text-title text-secondary">
          {t(status.modified ? 'bondPricing.entry.startModified' : 'bondPricing.entry.startSame', {
            curve: start,
          })}
        </p>
      )}
    </section>
  )
}

const TONES = { ok: 'text-up', warning: 'text-warning', info: 'text-info' } as const

function Line({
  icon: Icon,
  tone,
  children,
}: {
  icon: LucideIcon
  tone: keyof typeof TONES
  children: string
}) {
  return (
    <li className="flex items-start gap-1.5 font-sans text-data text-primary">
      <Icon aria-hidden className={clsx('mt-0.5 size-3.5 shrink-0', TONES[tone])} />
      {children}
    </li>
  )
}
