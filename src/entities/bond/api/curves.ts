import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CustomCurveUpdateDto } from '@/shared/api/contracts'
import { bondsApi, meApi } from '@/shared/api/endpoints'

/** BP's curves (spec screen 16, fifth version; ROADMAP decision 45). */
export const curveKeys = {
  all: ['curves'] as const,
  list: (country: string | null) => [...curveKeys.all, 'list', country] as const,
  points: (id: string, date: string | null) => [...curveKeys.all, 'points', id, date] as const,
}

/** GET /curves?country=: CMarket's curve of the country on the latest session, then the custom curves. */
export function useCurves(country: string | null, enabled = true) {
  return useQuery({
    queryKey: curveKeys.list(country),
    queryFn: ({ signal }) => bondsApi.curves(country ? { country } : {}, signal),
    staleTime: 5 * 60_000,
    enabled,
  })
}

/** GET /curves/{id}/points: a curve's points by time; nothing is asked while `id` is null. */
export function useCurve(id: string | null, date: string | null = null) {
  return useQuery({
    queryKey: curveKeys.points(id ?? '', date),
    queryFn: ({ signal }) => bondsApi.curve(id ?? '', date ?? undefined, signal),
    enabled: id !== null,
    staleTime: 5 * 60_000,
  })
}

/** A custom curve saved, renamed, shared or deleted: every list and curve read again. */
function useRefreshCurves() {
  const queryClient = useQueryClient()
  return () => void queryClient.invalidateQueries({ queryKey: curveKeys.all })
}

/** POST /me/curves: 409 when the user has a curve of that name already. */
export function useSaveCurve() {
  const refresh = useRefreshCurves()
  return useMutation({ mutationFn: meApi.saveCurve, onSuccess: refresh })
}

/** PUT /me/curves/{id}: its owner renames it or shares it. */
export function useUpdateCurve() {
  const refresh = useRefreshCurves()
  return useMutation({
    mutationFn: ({ id, update }: { id: string; update: CustomCurveUpdateDto }) =>
      meApi.updateCurve(id, update),
    onSuccess: refresh,
  })
}

/** DELETE /me/curves/{id}. */
export function useDeleteCurve() {
  const refresh = useRefreshCurves()
  return useMutation({ mutationFn: meApi.deleteCurve, onSuccess: refresh })
}
