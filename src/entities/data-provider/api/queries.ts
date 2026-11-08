import { useQuery } from '@tanstack/react-query'
import { dataAdminApi } from '@/shared/api/endpoints'

export const dataProviderKeys = {
  all: ['data-provider'] as const,
  eodhd: () => [...dataProviderKeys.all, 'eodhd'] as const,
}

/** GET /data/providers/eodhd/status: the connector, asked again every minute. */
export function useEodhdStatus() {
  return useQuery({
    queryKey: dataProviderKeys.eodhd(),
    queryFn: ({ signal }) => dataAdminApi.eodhdStatus(signal),
    refetchInterval: 60_000,
  })
}
