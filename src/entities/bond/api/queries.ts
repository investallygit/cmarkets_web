import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type {
  BondCalculationDto,
  BondCalculationRequestDto,
  BondDto,
  BondSummaryDto,
} from '@/shared/api/contracts'

export const bondKeys = {
  all: ['bonds'] as const,
  list: () => ['bond-list'] as const,
  bond: (id: string) => [...bondKeys.all, id] as const,
  calculation: (id: string, request: BondCalculationRequestDto | null) =>
    ['bond-calculation', id, request] as const,
}

const bondPath = (id: string) => `/bonds/${encodeURIComponent(id)}`

/** GET /bonds: listed bonds and government securities. */
export function useBonds() {
  return useQuery({
    queryKey: bondKeys.list(),
    queryFn: ({ signal }) => apiClient.get<BondSummaryDto[]>('/bonds', { signal }),
    staleTime: 5 * 60_000,
  })
}

/** GET /bonds/{id}: terms and cash-flow schedule. */
export function useBond(id: string, enabled = true) {
  return useQuery({
    queryKey: bondKeys.bond(id),
    queryFn: ({ signal }) => apiClient.get<BondDto>(bondPath(id), { signal }),
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
    queryFn: ({ signal }) =>
      apiClient.post<BondCalculationDto>(`${bondPath(id)}/calculate`, request, { signal }),
    enabled: request !== null,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
}
