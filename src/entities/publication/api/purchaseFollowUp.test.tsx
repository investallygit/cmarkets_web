import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PaymentDto } from '@/shared/api/contracts'
import { subscriptionsApi } from '@/shared/api/endpoints'
import { toast } from '@/shared/ui/toast'
import { usePendingPurchases } from '../model/pendingPurchases'
import { libraryKeys, usePurchaseFollowUp } from './libraryQueries'

vi.mock('@/shared/api/endpoints', () => ({
  researchApi: {},
  subscriptionsApi: { payment: vi.fn() },
}))
vi.mock('@/shared/ui/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const PENDING: PaymentDto = {
  id: 'payment-1',
  purpose: 'publication',
  publicationId: 'pub-semc',
  planId: null,
  amount: 15000,
  currency: 'XAF',
  method: 'mobileMoney',
  status: 'pending',
  createdAt: '2026-11-17T10:00:00Z',
  confirmedAt: null,
  failureReason: null,
}

afterEach(() => usePendingPurchases.setState({ purchases: {} }))

describe('usePurchaseFollowUp (B65)', () => {
  it('follows a payment to its end with no purchase form on the screen', async () => {
    vi.mocked(subscriptionsApi.payment).mockResolvedValue({
      ...PENDING,
      status: 'confirmed',
      confirmedAt: '2026-11-17T10:00:03Z',
    })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    renderHook(() => usePurchaseFollowUp(), { wrapper })
    // The reader paid, closed the dialog and opened another note: the form is gone.
    act(() =>
      usePendingPurchases.getState().start('pub-semc', { payment: PENDING, title: 'SEMC: buy' }),
    )
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        'Payment confirmed: SEMC: buy is yours, with its future updates.',
      ),
    )
    expect(invalidate).toHaveBeenCalledWith({ queryKey: libraryKeys.detail('pub-semc') })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: libraryKeys.lists() })
    expect(usePendingPurchases.getState().purchases).toEqual({})
  })
})
