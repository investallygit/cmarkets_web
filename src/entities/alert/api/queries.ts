import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AlertDto, AlertInputDto } from '@/shared/api/contracts'
import { alertsApi } from '@/shared/api/endpoints'

export const alertKeys = { all: ['alerts'] as const }

/** GET /alerts: the user's alerts, on or off. Only for account types that may set alerts. */
export function useAlerts({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: alertKeys.all,
    queryFn: ({ signal }) => alertsApi.list(signal),
    enabled,
  })
}

/**
 * Writes what the server returned into the cached list, so the screen updates at once, then
 * refetches it. A list not loaded yet is left to its fetch, which will include the change.
 */
function useUpdateAlerts() {
  const queryClient = useQueryClient()
  return (update: (alerts: AlertDto[]) => AlertDto[]) => {
    if (queryClient.getQueryData(alertKeys.all)) {
      queryClient.setQueryData<AlertDto[]>(alertKeys.all, (alerts) => alerts && update(alerts))
    }
    void queryClient.invalidateQueries({ queryKey: alertKeys.all })
  }
}

/** POST /alerts; the server refuses it with a 409 once the quota of the account type is reached. */
export function useCreateAlert() {
  const updateAlerts = useUpdateAlerts()
  return useMutation({
    mutationFn: alertsApi.create,
    onSuccess: (created) => updateAlerts((alerts) => [...alerts, created]),
  })
}

/** PUT /alerts/{id}: edits the condition and channels, or turns the alert on or off. */
export function useUpdateAlert() {
  const updateAlerts = useUpdateAlerts()
  return useMutation({
    mutationFn: ({ id, ...input }: AlertInputDto & { id: string }) => alertsApi.update(id, input),
    onSuccess: (updated) =>
      updateAlerts((alerts) => alerts.map((alert) => (alert.id === updated.id ? updated : alert))),
  })
}

export function useDeleteAlert() {
  const updateAlerts = useUpdateAlerts()
  return useMutation({
    mutationFn: alertsApi.remove,
    onSuccess: (_result, id) => updateAlerts((alerts) => alerts.filter((alert) => alert.id !== id)),
  })
}
