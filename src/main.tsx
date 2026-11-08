import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import '@/app/styles/index.css'
import '@/shared/i18n'

import i18n from 'i18next'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import { FullScreenStatus } from '@/app/layouts/FullScreenStatus'
import { onSessionChange } from '@/shared/api'
import { env } from '@/shared/config/env'
import {
  createSignalRChatClient,
  createSignalRRealtimeClient,
  type ChatClient,
  type RealtimeClient,
} from '@/shared/realtime'

// Composition root: the only place that knows whether the back end is real or mocked. It reads
// VITE_USE_MOCKS itself, as readEnv does (env.useMocks), for Vite writes it into the code: a build
// for CMarket.Api then leaves the mock and MSW out of the bundle.
async function createHubs(): Promise<{ market: RealtimeClient; chat: ChatClient }> {
  if (import.meta.env.VITE_USE_MOCKS === 'true') {
    const { startMockBackend } = await import('@/mocks')
    return startMockBackend()
  }
  return {
    market: createSignalRRealtimeClient(env.realtimeHubUrl),
    chat: createSignalRChatClient(env.chatHubUrl),
  }
}

async function bootstrap() {
  const { market, chat } = await createHubs()
  // The hubs serve logged-in users only: the market's connects with the session and closes with
  // it; the app shell opens the chat's for the users who write to others.
  onSessionChange(({ status }) => {
    if (status === 'authenticated') void market.start()
    else void market.stop()
  })

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App realtime={market} chat={chat} />
    </StrictMode>,
  )
}

// The prototype's back end needs a service worker and the site's storage, which a private window
// or a security setting can refuse: say so, rather than leave an empty page.
bootstrap().catch((error: unknown) => {
  console.error(error)
  createRoot(document.getElementById('root')!).render(
    <FullScreenStatus
      kind="error"
      message={i18n.t(env.useMocks ? 'app.mockStartError' : 'app.startError')}
      onRetry={() => window.location.reload()}
    />,
  )
})
