import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type { ChartDrawingDto, ChartDrawingsDto } from '@/shared/api/contracts'

export const chartDrawingKeys = {
  all: ['chartDrawings'] as const,
  of: (securityId: string) => [...chartDrawingKeys.all, securityId] as const,
}

const drawingsPath = (securityId: string) => `/charts/${encodeURIComponent(securityId)}/drawings`

/** Lines the user drew on the chart of a security, saved per user (spec section 3). */
export function useChartDrawings(securityId: string) {
  return useQuery({
    queryKey: chartDrawingKeys.of(securityId),
    queryFn: ({ signal }) => apiClient.get<ChartDrawingsDto>(drawingsPath(securityId), { signal }),
    staleTime: Infinity,
  })
}

/** Saves the whole list; the chart shows it at once and goes back if the server refuses it. */
export function useSaveChartDrawings(securityId: string) {
  const queryClient = useQueryClient()
  const queryKey = chartDrawingKeys.of(securityId)
  return useMutation({
    mutationFn: (drawings: ChartDrawingDto[]) =>
      apiClient.put<void>(drawingsPath(securityId), { drawings }),
    onMutate: async (drawings) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<ChartDrawingsDto>(queryKey)
      queryClient.setQueryData<ChartDrawingsDto>(queryKey, { securityId, drawings })
      return { previous }
    },
    onError: (_error, _drawings, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })
}
