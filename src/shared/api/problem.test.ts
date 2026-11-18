import { describe, expect, it } from 'vitest'
import { ApiError, problemMessage } from './problem'

describe('problemMessage', () => {
  it('says the detail, else the first field error, else the title (B49, B55, B58, B69)', () => {
    expect(
      problemMessage({ title: 'Not allowed', status: 403, detail: 'A trader enters it.' }),
    ).toBe('A trader enters it.')
    expect(
      problemMessage({
        title: 'Invalid request',
        status: 400,
        errors: { file: ['The content is not what its type says.'], name: ['Too long.'] },
      }),
    ).toBe('The content is not what its type says.')
    expect(problemMessage({ title: 'Not Found', status: 404 })).toBe('Not Found')
    expect(
      new ApiError({
        title: 'Invalid request',
        status: 400,
        errors: { couponPct: ['Between 0% and 100%.'] },
      }).message,
    ).toBe('Between 0% and 100%.')
  })
})
