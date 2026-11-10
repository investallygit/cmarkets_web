import { describe, expect, it } from 'vitest'
import { summaryLimit, toParagraphs } from './newsLimits'

describe('summaryLimit', () => {
  it('gives an article its standfirst and a flash its text', () => {
    expect(summaryLimit('article')).toBe(400)
    expect(summaryLimit('flash')).toBe(500)
  })
})

describe('toParagraphs', () => {
  it('splits on empty lines and leaves the blank ones out', () => {
    expect(toParagraphs(' First line\nstill first. \n\n  \n\nSecond. ')).toEqual([
      'First line\nstill first.',
      'Second.',
    ])
    expect(toParagraphs('   ')).toEqual([])
  })
})
