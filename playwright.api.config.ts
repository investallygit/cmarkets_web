import { defineConfig, devices } from '@playwright/test'
import { ANALYST_SESSION } from './e2e/session.js'

// npm run e2e:api: the flows tagged @api on a running CMarket.Api (development tools on, demo
// data), through the dev server in the mode api on port 5174, beside the mock's on 5173. They
// name no id of the mock and count nothing the other flows change: run them on a fresh database.
process.env.E2E_BACKEND = 'api'
const desktop = { ...devices['Desktop Chrome'], viewport: { width: 1600, height: 900 } }
const baseURL = 'http://localhost:5174'

export default defineConfig({
  testDir: './e2e',
  // E2E_API_ALL=1 runs every flow, to see which ones pass on the API.
  grep: process.env.E2E_API_ALL ? undefined : /@api/,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  outputDir: 'test-results/api',
  use: { baseURL, trace: 'on-first-retry' },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/, grep: /.*/, use: desktop },
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
