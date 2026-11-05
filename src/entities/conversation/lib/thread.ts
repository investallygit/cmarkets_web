import type { MessageDto } from '@/shared/api/contracts'
import { addDays } from '@/shared/lib/isoDate'

/** The messages of a day, under its separator. */
export interface MessageDay {
  day: string
  messages: MessageDto[]
}

/** The messages under the separators of their days, the oldest first (spec section 9). */
export function byDay(
  messages: readonly MessageDto[],
  dayOf: (time: string) => string,
): MessageDay[] {
  const days: MessageDay[] = []
  for (const message of messages) {
    const day = dayOf(message.sentAt)
    const last = days.at(-1)
    if (last?.day === day) last.messages.push(message)
    else days.push({ day, messages: [message] })
  }
  return days
}

/** "Today" or "Yesterday" for those days; null for the others, which show their date. */
export function relativeDay(day: string, today: string): 'today' | 'yesterday' | null {
  if (day === today) return 'today'
  if (day === addDays(today, -1)) return 'yesterday'
  return null
}
