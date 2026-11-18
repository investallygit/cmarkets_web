import { afterEach, describe, expect, it, vi } from 'vitest'
import { readStored, writeStored } from './storedValue'

describe('storedValue', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it('reads back what was written', () => {
    writeStored('cmarket.test', 'w2')
    expect(readStored('cmarket.test')).toBe('w2')
    expect(readStored('cmarket.other')).toBeNull()
  })

  it('starts from nothing when the storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => writeStored('cmarket.test', 'w2')).not.toThrow()
    expect(readStored('cmarket.test')).toBeNull()
  })
})
