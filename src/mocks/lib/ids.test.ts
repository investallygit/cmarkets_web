import { describe, expect, it } from 'vitest'
import { newId } from './ids'

describe('newId', () => {
  it('stays unique for many ids written in the same millisecond', () => {
    const ids = Array.from({ length: 5000 }, () => newId('audit'))
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids[0]).toMatch(/^audit-[0-9a-z]+-[0-9a-f]{8}$/)
  })
})
