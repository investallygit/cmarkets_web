import { describe, expect, it } from 'vitest'
import { decimalsOf, isExportField } from './fields'

describe('DL fields', () => {
  it('names the fields it knows and counts their decimals', () => {
    expect(isExportField('close')).toBe(true)
    expect(isExportField('somethingNew')).toBe(false)
    expect([decimalsOf('volume'), decimalsOf('xafRate'), decimalsOf('close')]).toEqual([0, 4, 2])
  })
})

describe('DL time zones', () => {
  it("names each zone by its city and offset, the profile's first", async () => {
    const { timeZoneOptions } = await import('./timeZones')
    const options = timeZoneOptions('Europe/Paris', new Date('2026-11-12T10:00:00Z'))

    expect(options[0]).toEqual({ value: 'Europe/Paris', label: 'Paris (GMT+1)' })
    expect(options.map((option) => option.label)).toContain('Douala (GMT+1)')
    expect(options.map((option) => option.label)).toContain('New York (GMT-5)')
    expect(options.filter((option) => option.value === 'Europe/Paris')).toHaveLength(1)
  })
})
