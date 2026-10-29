import { QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { RouterProvider } from 'react-router/dom'
import { createQueryClient } from '@/shared/api'
import { RealtimeProvider, type RealtimeClient } from '@/shared/realtime'
import { router } from './router'

export function App({ realtime }: { realtime: RealtimeClient }) {
  const [queryClient] = useState(createQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeProvider client={realtime}>
        <RouterProvider router={router} />
      </RealtimeProvider>
    </QueryClientProvider>
  )
}
