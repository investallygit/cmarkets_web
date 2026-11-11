import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { BondPriceRequestDto } from '@/shared/api/contracts'
import { bondsApi } from '@/shared/api/endpoints'
import { bondScreenerKeys } from './screener'

/** BP, bond pricing (screen 16). */
export const bondPricingKeys = {
  /** Under the screener's root: a publication that refreshes BS refreshes the yield BP starts from. */
  marketYield: (id: string) => [...bondScreenerKeys.all, 'market-yield', id] as const,
  price: (request: BondPriceRequestDto | null) => ['bond-price', request] as const,
}

/** GET /bonds/{id}/market-yield: the yield BP starts from, and the settlement of its market. */
export function useMarketYield(id: string | null) {
  return useQuery({
    queryKey: bondPricingKeys.marketYield(id ?? ''),
    queryFn: ({ signal }) => bondsApi.marketYield(id ?? '', signal),
    enabled: id !== null,
    staleTime: 60_000,
  })
}

/**
 * POST /bonds/price, cached by its inputs like a read: the panels of BP share one request. The
 * figures of the inputs before stay on screen while the next ones load; nothing is sent while
 * `request` is null.
 */
export function useBondPrice(request: BondPriceRequestDto | null) {
  return useQuery({
    queryKey: bondPricingKeys.price(request),
    // Only enabled with a request.
    queryFn: ({ signal }) => bondsApi.price(request!, signal),
    enabled: request !== null,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
}
