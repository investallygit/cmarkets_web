import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { CalendarEventDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'

const BILLION = 1_000_000_000

export interface CalendarWords {
  /** "BTA 26 weeks", "SAFACAM · ex-dividend", "Monetary Policy Committee"; the others as entered. */
  title: (event: CalendarEventDto) => string
  /** The agenda's detail: "Offered 25 bn · value 16/11", "Average rate 6.62% · cover 148%". */
  detail: (event: CalendarEventDto) => string
}

/** CAL's words for an event in the user's language, from its type and facts (decision 57). */
export function useCalendarWords(): CalendarWords {
  const { t } = useTranslation()
  const format = useFormat()

  const dayMonth = useCallback((iso: string) => format.isoDate(iso).slice(0, 5), [format])

  const auction = useCallback(
    (event: CalendarEventDto) => {
      const { instrument, term } = event.facts
      if (!instrument || term === null) return event.title
      return t(instrument === 'bta' ? 'calendar.words.bta' : 'calendar.words.ota', { term })
    },
    [t],
  )

  const title = useCallback(
    (event: CalendarEventDto) => {
      const code = event.securityCode ?? event.securityId ?? ''
      switch (event.type) {
        case 'auction':
          return auction(event)
        case 'result':
          return event.facts.auctionDate
            ? t('calendar.words.resultOf', {
                security: auction(event),
                date: dayMonth(event.facts.auctionDate),
              })
            : event.title
        case 'dividend':
        case 'redemption':
          return event.facts.phase
            ? `${code} · ${t(`calendar.words.phases.${event.facts.phase}`)}`
            : event.title
        case 'beac':
          return t('calendar.words.mpc')
        default:
          return event.title
      }
    },
    [t, auction, dayMonth],
  )

  const detail = useCallback(
    (event: CalendarEventDto) => {
      const { facts } = event
      const parts: string[] = []
      const bn = (amount: number) => format.number(amount / BILLION, amount % BILLION === 0 ? 0 : 1)
      switch (event.type) {
        case 'auction':
          if (facts.offered !== null)
            parts.push(t('calendar.words.offered', { amount: bn(facts.offered) }))
          if (facts.valueDate)
            parts.push(t('calendar.words.value', { date: dayMonth(facts.valueDate) }))
          break
        case 'result':
          if (facts.averageRate !== null)
            parts.push(
              t('calendar.words.averageRate', {
                rate: format.percent(facts.averageRate, 2, false),
              }),
            )
          if (facts.coverPct !== null)
            parts.push(
              t('calendar.words.cover', { cover: format.percent(facts.coverPct, 0, false) }),
            )
          break
        case 'redemption':
          if (facts.amount !== null)
            parts.push(t('calendar.words.outstanding', { amount: bn(facts.amount) }))
          break
        case 'dividend':
          parts.push(
            facts.amount !== null
              ? t('calendar.words.perShare', {
                  amount: `${facts.currency ?? 'XAF'} ${format.number(facts.amount, 0)}`,
                })
              : t('calendar.words.toBeConfirmed'),
          )
          break
        case 'beac':
          if (facts.policyRate !== null)
            parts.push(
              t('calendar.words.policyRate', {
                rate: format.percent(facts.policyRate, 2, false),
              }) + (event.example ? ` ${t('calendar.words.example')}` : ''),
            )
          break
        default:
          if (facts.note) parts.push(facts.note)
      }
      if (event.announced) parts.push(t('calendar.words.announced'))
      return parts.join(' · ')
    },
    [t, format, dayMonth],
  )

  return { title, detail }
}
