import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router/dom'
import { createQueryClient, onSessionChange } from '@/shared/api'
import { RealtimeProvider, type RealtimeClient } from '@/shared/realtime'
import { router } from './routes/router'

export function App({ realtime }: { realtime: RealtimeClient }) {
  const [queryClient] = useState(createQueryClient)

  // Nothing of a user stays in memory once their session ends.
  useEffect(
    () =>
      onSessionChange(({ status }) => {
        if (status === 'anonymous') queryClient.clear()
      }),
    [queryClient],
  )

  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeProvider client={realtime}>
        <RouterProvider router={router} />
      </RealtimeProvider>
    </QueryClientProvider>
  )
}
