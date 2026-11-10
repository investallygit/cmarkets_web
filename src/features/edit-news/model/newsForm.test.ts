import { describe, expect, it } from 'vitest'
import type { ProviderNewsDto } from '@/shared/api/contracts'
import { textDoc } from '@/shared/lib/richText'
import {
  defaultSchedule,
  doualaIso,
  doualaParts,
  limitIssues,
  publishNeeds,
  toNewsForm,
  toWriteDto,
  type NewsForm,
} from './newsForm'

const form = (patch: Partial<NewsForm> = {}): NewsForm => ({
  type: 'article',
  headline: 'BEAC: monetary policy committee holds rates',
  summary: 'The committee left its rates unchanged.',
  body: textDoc(['The committee met in Yaoundé.']),
  category: 'monetary',
  countries: ['CM'],
  securityIds: [],
  language: 'en',
  author: '',
  originalUrl: '',
  ...patch,
})

const NOW = new Date('2026-10-29T06:00:00Z')

describe('the limits of a save', () => {
  it('finds a field past its limit and a link that is no web page', () => {
    expect(limitIssues(form())).toEqual({})
    expect(
      limitIssues(
        form({
          headline: 'h'.repeat(151),
          summary: 's'.repeat(401),
          author: 'a'.repeat(101),
          originalUrl: 'ftp://media.example',
        }),
      ),
    ).toEqual({ headline: 'tooLong', summary: 'tooLong', author: 'tooLong', originalUrl: 'url' })
    // A FLASH's text has 500 characters.
    expect(limitIssues(form({ type: 'flash', summary: 's'.repeat(500) }))).toEqual({})
    expect(limitIssues(form({ body: textDoc(['b'.repeat(10_001)]) }))).toEqual({ body: 'tooLong' })
  })
})

describe('what publishing needs', () => {
  it('names the missing fields and the rights box, in the order of the screen', () => {
    const empty = form({
      headline: ' ',
      summary: '',
      body: textDoc([]),
      category: null,
      countries: [],
    })
    expect(publishNeeds(empty, { rightsConfirmed: false, schedule: null, now: NOW })).toEqual([
      'headline',
      'summary',
      'body',
      'category',
      'countries',
      'rights',
    ])
    expect(publishNeeds(form(), { rightsConfirmed: true, schedule: null, now: NOW })).toEqual([])
    // A FLASH has no body to write.
    expect(
      publishNeeds(form({ type: 'flash', body: null }), {
        rightsConfirmed: true,
        schedule: null,
        now: NOW,
      }),
    ).toEqual([])
  })

  it('needs a time to come of Douala to schedule', () => {
    const context = { rightsConfirmed: true, now: NOW }
    expect(
      publishNeeds(form(), { ...context, schedule: { date: '2026-10-29', time: '06:30' } }),
    ).toEqual(['publishAt'])
    expect(
      publishNeeds(form(), { ...context, schedule: { date: '2026-10-29', time: '08:00' } }),
    ).toEqual([])
    expect(publishNeeds(form(), { ...context, schedule: { date: '', time: '08:00' } })).toEqual([
      'publishAt',
    ])
  })
})

describe('times of Douala', () => {
  it('reads and writes a day and a time of Douala, UTC+1 all year', () => {
    expect(doualaIso('2026-10-29', '08:00')).toBe('2026-10-29T08:00:00+01:00')
    expect(doualaParts('2026-10-29T07:00:00Z')).toEqual({ date: '2026-10-29', time: '08:00' })
    expect(doualaParts('2026-10-29T23:30:00Z')).toEqual({ date: '2026-10-30', time: '00:30' })
    expect(defaultSchedule(NOW)).toEqual({ date: '2026-10-30', time: '08:00' })
  })
})

describe('the save of the editor', () => {
  it('sends a FLASH without a body, trimmed fields, and none for an empty byline or link', () => {
    const item = { ...toWriteDto(form({ type: 'flash', author: '  ', originalUrl: ' ' }), 3) }
    expect(item).toMatchObject({
      type: 'flash',
      body: null,
      author: null,
      originalUrl: null,
      version: 3,
    })
    expect(toWriteDto(form({ headline: ' BEAC ', author: ' Media I ' }), 1)).toMatchObject({
      headline: 'BEAC',
      author: 'Media I',
    })
  })

  it('starts from the server copy', () => {
    const dto = {
      ...toWriteDto(form(), 2),
      id: 'n-1',
      status: 'draft',
      publishedAt: null,
      publishAt: null,
      withdrawnAt: null,
      updatedAt: '2026-10-29T06:00:00Z',
      subject: null,
      attachment: null,
      editedAt: null,
      rightsConfirmedAt: null,
      withdrawalReason: null,
      externalId: null,
      author: null,
      originalUrl: null,
    } satisfies ProviderNewsDto
    expect(toNewsForm(dto)).toMatchObject({ author: '', originalUrl: '', category: 'monetary' })
  })
})
