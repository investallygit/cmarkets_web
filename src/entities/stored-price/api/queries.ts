import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PriceCorrectionRequestDto } from '@/shared/api/contracts'
import { dataAdminApi } from '@/shared/api/endpoints'

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
    queryFn: ({ signal }) => dataAdminApi.storedPrices(securityId ?? '', from, to, signal),
    enabled: Boolean(securityId),
    placeholderData: keepPreviousData,
  })
}

/** GET /data/corrections: the log of manual corrections, newest first. */
export function useCorrections(securityId: string | null, page = 1) {
  return useQuery({
    queryKey: storedPriceKeys.corrections(securityId, page),
    queryFn: ({ signal }) => dataAdminApi.corrections({ securityId, page, pageSize: 50 }, signal),
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
    }) => dataAdminApi.correctPrice(securityId, date, correction),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storedPriceKeys.all }),
  })
}
