import { useTranslation } from 'react-i18next'
import type { CalendarEventType } from '@/shared/api/contracts'
import { EVENT_TYPE_COLORS } from '../config/eventTypes'

/** An event's type as the mockup's agenda shows it: a framed word in the type's colour. */
export function EventTypeBadge({ type }: { type: CalendarEventType }) {
  const { t } = useTranslation()
  const color = EVENT_TYPE_COLORS[type]
  return (
    <span
      className="inline-flex min-w-24 justify-center border px-2 font-mono text-title font-semibold tracking-title uppercase"
      style={{ color, borderColor: color }}
    >
      {t(`calendar.badges.${type}`)}
    </span>
  )
}
