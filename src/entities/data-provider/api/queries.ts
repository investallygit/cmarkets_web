import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type { EodhdStatusDto } from '@/shared/api/contracts'

export const dataProviderKeys = {
  all: ['data-provider'] as const,
  eodhd: () => [...dataProviderKeys.all, 'eodhd'] as const,
}

/** GET /data/providers/eodhd/status: the connector, asked again every minute. */
export function useEodhdStatus() {
  return useQuery({
    queryKey: dataProviderKeys.eodhd(),
    queryFn: ({ signal }) =>
      apiClient.get<EodhdStatusDto>('/data/providers/eodhd/status', { signal }),
    refetchInterval: 60_000,
  })
}
