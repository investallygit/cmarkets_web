import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { meApi } from '@/shared/api/endpoints'
import type { ScreenPanel } from '../lib/arrangement'
import { useWorkspaceLayout } from './useWorkspaceLayout'

vi.mock('@/shared/api/endpoints', () => ({ meApi: { layout: vi.fn(), saveLayout: vi.fn() } }))

const PANELS: ScreenPanel[] = [
  { i: 'indices', name: 'indices', x: 0, y: 0, w: 6, h: 4 },
  { i: 'ratesFx', name: 'ratesFx', x: 6, y: 0, w: 6, h: 4 },
]
/** The two panels swapped, as a drag reports them. */
const SWAPPED = [
  { ...PANELS[0], x: 6 },
  { ...PANELS[1], x: 0 },
]

function renderLayout() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return renderHook(() => useWorkspaceLayout('MKT', PANELS), { wrapper })
}

describe('useWorkspaceLayout', () => {
  beforeEach(() => {
    vi.mocked(meApi.layout).mockReset().mockResolvedValue({ screen: 'MKT', items: [] })
    vi.mocked(meApi.saveLayout).mockReset().mockResolvedValue(undefined)
  })

  it('saves a drag that still waits when the tab goes away', async () => {
    const { result } = renderLayout()
    await waitFor(() => expect(result.current.isReady).toBe(true))
    act(() => result.current.onLayoutChange(SWAPPED))
    // A drag waits for the ones that may follow.
    expect(meApi.saveLayout).not.toHaveBeenCalled()

    // A page that goes away runs no React cleanup: pagehide saves it at once.
    window.dispatchEvent(new Event('pagehide'))
    expect(meApi.saveLayout).toHaveBeenCalledTimes(1)
    expect(vi.mocked(meApi.saveLayout).mock.calls[0][0]).toBe('MKT')
    expect(vi.mocked(meApi.saveLayout).mock.calls[0][1].items).toContainEqual(
      expect.objectContaining({ i: 'ratesFx', x: 0 }),
    )
  })

  it('saves what waits when the screen closes, and nothing more on leaving the tab', async () => {
    const { result, unmount } = renderLayout()
    await waitFor(() => expect(result.current.isReady).toBe(true))
    act(() => result.current.onLayoutChange(SWAPPED))
    unmount()
    expect(meApi.saveLayout).toHaveBeenCalledTimes(1)

    window.dispatchEvent(new Event('pagehide'))
    expect(meApi.saveLayout).toHaveBeenCalledTimes(1)
  })
})
