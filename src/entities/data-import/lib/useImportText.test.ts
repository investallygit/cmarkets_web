import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useImportCell } from './useImportText'

describe('useImportCell (B87)', () => {
  it('writes a year as a year, an amount as an amount', () => {
    const { result } = renderHook(() => useImportCell())
    const cell = result.current
    expect(cell({ name: 'year', kind: 'integer' }, 2025)).toBe('2025')
    expect(cell({ name: 'fiscal_year', kind: 'number' }, 2025)).toBe('2025')
    expect(cell({ name: 'value', kind: 'number' }, 18250)).toBe('18,250')
    expect(cell({ name: 'volume', kind: 'integer' }, 12500)).toBe('12,500')
  })
})
