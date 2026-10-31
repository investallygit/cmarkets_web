import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type {
  Paged,
  PriceCorrectionDto,
  PriceCorrectionRequestDto,
  StoredPriceDto,
} from '@/shared/api/contracts'

export const storedPriceKeys = {
  all: ['stored-prices'] as const,
  sessions: (securityId: string, from: string, to: string) =>
    [...storedPriceKeys.all, 'sessions', securityId, from, to] as const,
  corrections: (securityId: string | null, page: number) =>
    [...storedPriceKeys.all, 'corrections', securityId, page] as const,
}

/** GET /data/securities/{id}/prices?from=&to=: the stored sessions, newest first, with their source. */
export function useStoredPrices(securityId: string | null, from: string, to: string) {
  return useQuery({
    queryKey: storedPriceKeys.sessions(securityId ?? '', from, to),
    queryFn: ({ signal }) =>
      apiClient.get<StoredPriceDto[]>(
        `/data/securities/${encodeURIComponent(securityId ?? '')}/prices`,
        { query: { from, to }, signal },
      ),
    enabled: Boolean(securityId),
    placeholderData: keepPreviousData,
  })
}

/** GET /data/corrections: the log of manual corrections, newest first. */
export function useCorrections(securityId: string | null, page = 1) {
  return useQuery({
    queryKey: storedPriceKeys.corrections(securityId, page),
    queryFn: ({ signal }) =>
      apiClient.get<Paged<PriceCorrectionDto>>('/data/corrections', {
        query: { securityId, page, pageSize: 50 },
        signal,
      }),
    placeholderData: keepPreviousData,
  })
}

/** PUT /data/securities/{id}/prices/{date}: a correction, logged with its reason. */
export function useCorrectPrice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      securityId,
      date,
      correction,
    }: {
      securityId: string
      date: string
      correction: PriceCorrectionRequestDto
    }) =>
      apiClient.put<PriceCorrectionDto>(
        `/data/securities/${encodeURIComponent(securityId)}/prices/${date}`,
        correction,
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storedPriceKeys.all }),
  })
}
