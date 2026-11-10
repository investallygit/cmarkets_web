import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { contentApi } from '@/shared/api/endpoints'
import { forgetNewsViews, useNewsView, VIEW_AFTER_MS } from './useNewsView'

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state })
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('useNewsView', () => {
  let view: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.useFakeTimers()
    forgetNewsViews()
    setVisibility('visible')
    view = vi.spyOn(contentApi, 'newsView').mockResolvedValue(undefined)
  })

  afterEach(() => {
    view.mockRestore()
    vi.useRealTimers()
  })

  it('sends the view once the content has shown 3 seconds, and once only', () => {
    const { unmount } = renderHook(() => useNewsView('news-1'))

    vi.advanceTimersByTime(VIEW_AFTER_MS - 1)
    expect(view).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(view).toHaveBeenCalledExactlyOnceWith('news-1')

    // The same item shown again, in this tab: the server would ignore it, nothing goes.
    unmount()
    renderHook(() => useNewsView('news-1'))
    vi.advanceTimersByTime(VIEW_AFTER_MS)
    expect(view).toHaveBeenCalledOnce()
  })

  it('counts the time of a visible tab only', () => {
    renderHook(() => useNewsView('news-2'))

    vi.advanceTimersByTime(2_000)
    setVisibility('hidden')
    vi.advanceTimersByTime(10_000)
    expect(view).not.toHaveBeenCalled()
    setVisibility('visible')
    vi.advanceTimersByTime(999)
    expect(view).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(view).toHaveBeenCalledExactlyOnceWith('news-2')
  })

  it('sends nothing when the content goes before its 3 seconds, or for no item', () => {
    const { unmount } = renderHook(() => useNewsView('news-3'))
    vi.advanceTimersByTime(2_500)
    unmount()
    renderHook(() => useNewsView(null))
    vi.advanceTimersByTime(VIEW_AFTER_MS)

    expect(view).not.toHaveBeenCalled()
  })

  it('waits for the tab to show when the content opens in a hidden tab', () => {
    setVisibility('hidden')
    renderHook(() => useNewsView('news-4'))
    vi.advanceTimersByTime(VIEW_AFTER_MS * 2)
    expect(view).not.toHaveBeenCalled()

    setVisibility('visible')
    vi.advanceTimersByTime(VIEW_AFTER_MS)
    expect(view).toHaveBeenCalledExactlyOnceWith('news-4')
  })
})
