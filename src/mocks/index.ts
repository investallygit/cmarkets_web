import { setupWorker } from 'msw/browser'
import type { RealtimeClient } from '@/shared/realtime'
import { handlers } from './handlers'
import { createMockRealtimeClient } from './realtime'

/**
 * Fake back end of the prototype: MSW answers /api/v1 inside the browser and a simulated hub
 * replaces SignalR. Set VITE_USE_MOCKS=false to use CMarket.Api instead; no other change needed.
 */
export async function startMockBackend(): Promise<RealtimeClient> {
  const worker = setupWorker(...handlers)
  await worker.start({
    // Vite modules, fonts and anything outside /api/v1 go to the network untouched.
    onUnhandledFrame: 'bypass',
    quiet: true,
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  })
  return createMockRealtimeClient()
}
