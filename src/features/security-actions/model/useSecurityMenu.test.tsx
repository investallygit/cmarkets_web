import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { useAlertDialog } from '@/entities/alert'
import { sessionKeys } from '@/entities/session'
import { useWatchlistDialog, watchlistKeys } from '@/entities/watchlist'
import type { MeDto, WatchlistDto } from '@/shared/api/contracts'
import { useSecurityMenu } from './useSecurityMenu'

const analyst: MeDto = {
  id: 'user-analyst',
  displayName: 'K. Atangana',
  email: 'k.atangana@example.cm',
  accountType: 'analyst',
  organization: null,
  language: 'en',
  timeZone: 'Africa/Douala',
  phone: null,
  twoFactorChannel: 'email',
  permissions: ['market:read', 'alerts:write'],
  quotas: { portfolios: 5, alerts: 50 },
  verificationStatus: 'approved',
  modules: ['monitoring', 'analysis', 'portfolio'],
  trialEndsAt: null,
}

const list = (id: string, code: string, name: string, securityIds: string[]): WatchlistDto => ({
  id,
  code,
  name,
  columns: ['last'],
  items: securityIds.map((securityId) => ({
    securityId,
    code: securityId,
    name: securityId,
    type: 'equity',
    currency: 'XAF',
    last: 1,
    change: 0,
    changePct: 0,
    volume: 0,
    isDelayed: false,
    sparkline: [],
  })),
})

function renderMenu(user: MeDto) {
  // Data already in the cache, never stale: no request is made.
  const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } })
  queryClient.setQueryData(sessionKeys.me, user)
  queryClient.setQueryData(watchlistKeys.all, [
    list('watchlist-1', 'W1', 'My picks', ['SEMC', 'BANGE']),
    list('watchlist-2', 'W2', 'Sovereign bonds', ['ECMR-6.25-2029']),
  ])
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
  return renderHook(() => useSecurityMenu(), { wrapper }).result.current
}

describe('right-click menu of a security (spec section 9)', () => {
  it('ticks the lists that hold the security', () => {
    const items = renderMenu(analyst)({ id: 'SEMC', code: 'SEMC' })
    expect(items.map((item) => item.label)).toEqual([
      'Open profile',
      'Add to a list',
      'W1 · My picks',
      'W2 · Sovereign bonds',
      'New list…',
      '',
      'Create an alert',
    ])
    expect(items.filter((item) => item.checked).map((item) => item.label)).toEqual([
      'W1 · My picks',
    ])
  })

  it('opens the list and alert forms with the security filled in', () => {
    const items = renderMenu(analyst)({ id: 'SIAT', code: 'SIAT' })
    items.find((item) => item.id === 'new-list')?.onSelect?.()
    expect(useWatchlistDialog.getState().request).toEqual({
      mode: 'create',
      securities: [{ id: 'SIAT', code: 'SIAT' }],
    })
    items.find((item) => item.id === 'create-alert')?.onSelect?.()
    expect(useAlertDialog.getState().request).toEqual({ securityId: 'SIAT' })
  })

  it('offers alerts only to the account types that may set them', () => {
    const items = renderMenu({ ...analyst, permissions: ['market:read'] })({
      id: 'SEMC',
      code: 'SEMC',
    })
    expect(items.find((item) => item.id === 'create-alert')?.disabled).toBe(true)
  })
})
