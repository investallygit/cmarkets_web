import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { chartsApi } from '@/shared/api/endpoints'
import { ApiError } from '@/shared/api/problem'
import { useDrawings } from './useDrawings'

vi.mock('@/shared/api/endpoints', () => ({
  chartsApi: { drawings: vi.fn(), saveDrawings: vi.fn() },
}))

const LEVEL = { kind: 'horizontal' as const, price: 52000 }
const SAVED = [
  { id: 'a', kind: 'horizontal' as const, price: 50000 },
  { id: 'b', kind: 'horizontal' as const, price: 51000 },
]

function renderDrawings() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return renderHook(() => useDrawings('SEMC'), { wrapper })
}

describe('useDrawings', () => {
  beforeEach(() => {
    vi.mocked(chartsApi.drawings).mockReset()
    vi.mocked(chartsApi.saveDrawings).mockReset().mockResolvedValue(undefined)
  })

  it('never saves over lines it could not read (B48)', async () => {
    vi.mocked(chartsApi.drawings).mockRejectedValue(
      new ApiError({ title: 'Internal Server Error', status: 500 }),
    )
    const { result } = renderDrawings()
    await waitFor(() => expect(result.current.failed).toBe(true))
    expect(result.current.ready).toBe(false)
    act(() => result.current.add(LEVEL))
    act(() => result.current.clear())
    expect(chartsApi.saveDrawings).not.toHaveBeenCalled()

    // Read again, they are kept and the new line comes after them.
    vi.mocked(chartsApi.drawings).mockResolvedValue({ securityId: 'SEMC', drawings: SAVED })
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.ready).toBe(true))
    act(() => result.current.add(LEVEL))
    await waitFor(() => expect(chartsApi.saveDrawings).toHaveBeenCalledOnce())
    const [, saved] = vi.mocked(chartsApi.saveDrawings).mock.calls[0]
    expect(saved.map((drawing) => drawing.id).slice(0, 2)).toEqual(['a', 'b'])
    expect(saved).toHaveLength(3)
  })
})
