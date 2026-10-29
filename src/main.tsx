import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import '@/app/styles/index.css'
import '@/shared/i18n'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
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
  void realtime.start()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App realtime={realtime} />
    </StrictMode>,
  )
}

void bootstrap()
