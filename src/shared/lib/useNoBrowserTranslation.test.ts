import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useNoBrowserTranslation } from './useNoBrowserTranslation'

describe('useNoBrowserTranslation', () => {
  it('turns the translation of the page off while mounted, and back on after', () => {
    const { unmount } = renderHook(() => useNoBrowserTranslation())
    expect(document.documentElement.getAttribute('translate')).toBe('no')
    unmount()
    expect(document.documentElement.hasAttribute('translate')).toBe(false)
  })
})
