import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { BondCalculationRequestDto } from '@/shared/api/contracts'
import { bondsApi } from '@/shared/api/endpoints'

export const bondKeys = {
  all: ['bonds'] as const,
  list: () => ['bond-list'] as const,
  bond: (id: string) => [...bondKeys.all, id] as const,
  calculation: (id: string, request: BondCalculationRequestDto | null) =>
    ['bond-calculation', id, request] as const,
}

/** GET /bonds: listed bonds and government securities. */
export function useBonds() {
  return useQuery({
    queryKey: bondKeys.list(),
    queryFn: ({ signal }) => bondsApi.list(signal),
    staleTime: 5 * 60_000,
  })
}

/** GET /bonds/{id}: terms and cash-flow schedule. */
export function useBond(id: string, enabled = true) {
  return useQuery({
    queryKey: bondKeys.bond(id),
    queryFn: ({ signal }) => bondsApi.bond(id, signal),
    staleTime: 5 * 60_000,
    enabled,
  })
}

/**
 * POST /bonds/{id}/calculate, cached by its inputs like a read. When the inputs change, the
 * request still running for the old ones is cancelled, and its results stay on screen until the
 * new ones arrive. Nothing is sent while `request` is null (an input is missing or wrong).
 */
export function useBondCalculation(id: string, request: BondCalculationRequestDto | null) {
  return useQuery({
    queryKey: bondKeys.calculation(id, request),
    // Only enabled with a request.
    queryFn: ({ signal }) => bondsApi.calculate(id, request!, signal),
    enabled: request !== null,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
}
