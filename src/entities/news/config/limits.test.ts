import { describe, expect, it } from 'vitest'
import { summaryLimit } from './limits'

describe('summaryLimit', () => {
  it('gives an article its standfirst and a flash its text', () => {
    expect(summaryLimit('article')).toBe(400)
    expect(summaryLimit('flash')).toBe(500)
  })
})
