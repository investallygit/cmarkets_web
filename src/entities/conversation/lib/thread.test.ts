import { describe, expect, it } from 'vitest'
import type { MessageDto } from '@/shared/api/contracts'
import { byDay, relativeDay } from './thread'

// The date separators of a thread, screen 11.
const message = (id: string, sentAt: string) => ({ id, sentAt }) as MessageDto

describe('thread days', () => {
  it('put the messages under the day they were sent, in the time zone given', () => {
    const days = byDay(
      [
        message('1', '2026-11-04T22:30:00Z'),
        message('2', '2026-11-04T23:30:00Z'),
        message('3', '2026-11-05T08:00:00Z'),
      ],
      // Douala, an hour ahead of UTC.
      (time) => new Date(Date.parse(time) + 3_600_000).toISOString().slice(0, 10),
    )
    expect(days.map(({ day, messages }) => [day, messages.map((item) => item.id)])).toEqual([
      ['2026-11-04', ['1']],
      ['2026-11-05', ['2', '3']],
    ])
  })

  it('name today and yesterday, and leave the other days to their date', () => {
    expect(relativeDay('2026-11-05', '2026-11-05')).toBe('today')
    expect(relativeDay('2026-11-04', '2026-11-05')).toBe('yesterday')
    expect(relativeDay('2026-10-27', '2026-11-05')).toBeNull()
  })
})
