import i18next from 'i18next'
import { describe, expect, it } from 'vitest'

import { issueText } from './issueText'

describe('the words of a check', () => {
  it('words a known code with its value and limit, and keeps the API sentence for another', () => {
    const t = i18next.getFixedT('en')
    expect(
      issueText(t, {
        code: 'unknownSecurity',
        column: 'securities',
        message: 'x',
        value: 'SEMCX',
        limit: null,
      }),
    ).toBe('Unknown security code “SEMCX”.')
    expect(
      issueText(t, {
        code: 'flashQuota',
        column: 'type',
        message: 'x',
        value: '2026-10-29',
        limit: 20,
      }),
    ).toBe('FLASH quota exceeded: 20 a day.')
    expect(
      issueText(t, {
        code: 'somethingNew',
        column: 'title',
        message: 'The API says why.',
        value: null,
        limit: null,
      }),
    ).toBe('The API says why.')
  })
})
