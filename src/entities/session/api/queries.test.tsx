import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MeDto } from '@/shared/api/contracts'
import { meApi } from '@/shared/api/endpoints'
import { sessionKeys, useUpdateProfileFields } from './queries'

vi.mock('@/shared/api/endpoints', () => ({ meApi: { get: vi.fn(), update: vi.fn() } }))

const ME: MeDto = {
  id: 'user-atangana',
  displayName: 'K. Atangana',
  email: 'k.atangana@cmarket.example',
  accountType: 'analyst',
  organization: null,
  language: 'en',
  timeZone: 'Africa/Douala',
  phone: '+237 6 90 00 00 01',
  twoFactorChannel: 'sms',
  permissions: [],
  quotas: { portfolios: null, alerts: null },
  verificationStatus: 'approved',
  modules: [],
  trialEndsAt: null,
}

function renderUpdate(cached: MeDto) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  queryClient.setQueryData(sessionKeys.me, cached)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { queryClient, ...renderHook(() => useUpdateProfileFields(), { wrapper }) }
}

describe('useUpdateProfileFields (B100)', () => {
  beforeEach(() => {
    vi.mocked(meApi.get).mockReset()
    vi.mocked(meApi.update)
      .mockReset()
      .mockImplementation((input) => Promise.resolve({ ...ME, ...input }))
  })

  it('sends the rest of the profile as the server holds it, not as an older tab read it', async () => {
    // Another tab renamed the user, removed the phone and chose the e-mail since this one read /me.
    const saved = { ...ME, displayName: 'K. Atangana (A)', phone: null, twoFactorChannel: 'email' }
    vi.mocked(meApi.get).mockResolvedValue(saved as MeDto)
    const { result, queryClient } = renderUpdate(ME)
    act(() => result.current.mutate({ language: 'fr' }))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(meApi.update).toHaveBeenCalledWith({
      displayName: 'K. Atangana (A)',
      phone: null,
      language: 'fr',
      timeZone: 'Africa/Douala',
      twoFactorChannel: 'email',
    })
    expect(queryClient.getQueryData<MeDto>(sessionKeys.me)?.displayName).toBe('K. Atangana (A)')
  })

  it('sends nothing when the server holds the value already', async () => {
    vi.mocked(meApi.get).mockResolvedValue({ ...ME, language: 'fr' })
    const { result } = renderUpdate(ME)
    act(() => result.current.mutate({ language: 'fr' }))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(meApi.update).not.toHaveBeenCalled()
  })
})
