import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router/dom'
import { createQueryClient, onSessionChange } from '@/shared/api'
import {
  RealtimeProvider,
  type ChatClient,
  type RealtimeClient,
  type RfqClient,
} from '@/shared/realtime'
import { router } from './routes/router'

interface AppProps {
  realtime: RealtimeClient
  chat: ChatClient
  rfq: RfqClient
}

export function App({ realtime, chat, rfq }: AppProps) {
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
      <RealtimeProvider client={realtime} chat={chat} rfq={rfq}>
        <RouterProvider router={router} />
      </RealtimeProvider>
    </QueryClientProvider>
  )
}
