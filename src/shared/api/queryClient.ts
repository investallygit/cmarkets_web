import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './problem'

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Quotes are cached 15 s on the server (spec section 11); no point refetching sooner.
        staleTime: 15_000,
        refetchOnWindowFocus: false,
        // Client errors (4xx) will not fix themselves on retry.
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status < 500) && failureCount < 2,
      },
    },
  })
}
