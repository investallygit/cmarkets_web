// npm run test:api: the API module against a running CMarket.Api (src/**/*.live.ts), apart from
// npm run test:run, which needs no back end. The API's address: CMARKET_API_URL, the local
// development API by default (dotnet run --project src/CMarket.Api --launch-profile http).
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

const apiUrl = process.env.CMARKET_API_URL ?? 'http://localhost:5001'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.live.ts'],
    env: { VITE_API_URL: apiUrl },
    // One session at a time: the accounts follow each other.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
})
