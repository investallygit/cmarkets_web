import { describe, expect, it } from 'vitest'
import { fitFiles } from './files'

describe('fitFiles', () => {
  it('takes the files that fit, in their order, and counts the others', () => {
    expect(fitFiles(['a', 'b', 'c', 'd', 'e', 'f', 'g'], 0, 5)).toEqual({
      taken: ['a', 'b', 'c', 'd', 'e'],
      dropped: 2,
    })
    expect(fitFiles(['a', 'b'], 4, 5)).toEqual({ taken: ['a'], dropped: 1 })
    expect(fitFiles(['a', 'b'], 1, 5)).toEqual({ taken: ['a', 'b'], dropped: 0 })
  })

  it('takes nothing once the message holds the most', () => {
    expect(fitFiles(['a'], 5, 5)).toEqual({ taken: [], dropped: 1 })
    expect(fitFiles(['a'], 6, 5)).toEqual({ taken: [], dropped: 1 })
  })
})
