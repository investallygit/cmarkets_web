import { defineConfig, devices } from '@playwright/test'
import { ANALYST_SESSION } from './e2e/session.js'

// npm run e2e:api: the flows on a running CMarket.Api (development tools on, demo data, a fresh
// database), through the dev server in the mode api on port 5174, beside the mock's on 5173. Every
// flow runs but those tagged @mock, which need the mock: its simulated people, its sample figures,
// or its data as seeded, which the other flows change on the API's one database.
process.env.E2E_BACKEND = 'api'
const desktop = { ...devices['Desktop Chrome'], viewport: { width: 1600, height: 900 } }
const baseURL = 'http://localhost:5174'

export default defineConfig({
  testDir: './e2e',
  // E2E_API_ALL=1 runs the @mock flows too: one spec at a time, on a fresh database, most pass.
  grepInvert: process.env.E2E_API_ALL ? undefined : /@mock/,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  outputDir: 'test-results/api',
  use: { baseURL, trace: 'on-first-retry' },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/, use: desktop },
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: { ...desktop, storageState: ANALYST_SESSION },
    },
  ],
  webServer: {
    command: 'npx vite --mode api --port 5174 --strictPort',
    url: baseURL,
    reuseExistingServer: true,
  },
})
