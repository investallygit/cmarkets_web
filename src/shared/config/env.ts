export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  realtimeHubUrl: import.meta.env.VITE_REALTIME_HUB_URL ?? '/hubs/market',
  /** Prototype mode: src/mocks answers the API and simulates the real-time hub. */
  useMocks: import.meta.env.VITE_USE_MOCKS === 'true',
} as const
