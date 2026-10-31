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
import { createSignalRRealtimeClient, type RealtimeClient } from '@/shared/realtime'

// Composition root: the only place that knows whether the back end is real or mocked.
async function createRealtimeClient(): Promise<RealtimeClient> {
  if (env.useMocks) {
    const { startMockBackend } = await import('@/mocks')
    return startMockBackend()
  }
  return createSignalRRealtimeClient(env.realtimeHubUrl)
}

async function bootstrap() {
  const realtime = await createRealtimeClient()
  // The hub serves logged-in users only: it connects with the session and closes with it.
  onSessionChange(({ status }) => {
    if (status === 'authenticated') void realtime.start()
    else void realtime.stop()
  })

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App realtime={realtime} />
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
