import { defineConfig, devices } from '@playwright/test'
import { ANALYST_SESSION } from './e2e/session.js'

// End-to-end flows (spec section 7) on a running CMarket.Api (development tools on, demo data, a
// fresh database), through the dev server, which forwards /api and /hubs to it (.env.development).
// The flows share the API's one database, so they run one at a time. Those tagged @fresh-db need
// the demo data as seeded, which the other flows change: E2E_FRESH_DB=1 runs them, one spec at a
// time, each on a fresh database.

// 1600 x 900 is the reference resolution of the mockups (spec section 9).
const desktop = { ...devices['Desktop Chrome'], viewport: { width: 1600, height: 900 } }
const baseURL = 'http://localhost:5173'

export default defineConfig({
  testDir: './e2e',
  grepInvert: process.env.E2E_FRESH_DB ? undefined : /@fresh-db/,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: { baseURL, trace: 'on-first-retry' },
  projects: [
    // Logs in once through the login page; every test then starts logged in.
    { name: 'setup', testMatch: /auth\.setup\.ts/, use: desktop },
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: { ...desktop, storageState: ANALYST_SESSION },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
})
