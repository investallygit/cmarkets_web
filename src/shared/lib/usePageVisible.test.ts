import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePageVisible } from './usePageVisible'

function showPage(state: DocumentVisibilityState) {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(state)
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'))
  })
}

describe('usePageVisible', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('follows the tab hidden, then shown again', () => {
    const { result } = renderHook(() => usePageVisible())
    expect(result.current).toBe(true)
    showPage('hidden')
    expect(result.current).toBe(false)
    showPage('visible')
    expect(result.current).toBe(true)
  })
})
