import { describe, expect, it } from 'vitest'
import { toParagraphs } from './paragraphs'

describe('toParagraphs', () => {
  it('splits on empty lines and leaves the blank ones out', () => {
    expect(toParagraphs(' First line\nstill first. \n\n  \n\nSecond. ')).toEqual([
      'First line\nstill first.',
      'Second.',
    ])
    expect(toParagraphs('   ')).toEqual([])
  })
})
