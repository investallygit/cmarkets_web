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

// Composition root: the hubs of CMarket.Api.
function createHubs(): { market: RealtimeClient; chat: ChatClient } {
  return {
    market: createSignalRRealtimeClient(env.realtimeHubUrl),
    chat: createSignalRChatClient(env.chatHubUrl),
  }
}

async function bootstrap() {
  const { market, chat } = createHubs()
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

// Say so when the app cannot start, rather than leave an empty page.
bootstrap().catch((error: unknown) => {
  console.error(error)
  createRoot(document.getElementById('root')!).render(
    <FullScreenStatus
      kind="error"
      message={i18n.t('app.startError')}
      onRetry={() => window.location.reload()}
    />,
  )
})
