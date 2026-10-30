import { defineConfig, devices } from '@playwright/test'
import { ANALYST_SESSION } from './e2e/session.js'

// 1600 x 900 is the reference resolution of the mockups (spec section 9).
const desktop = { ...devices['Desktop Chrome'], viewport: { width: 1600, height: 900 } }

// End-to-end flows (spec section 7). Runs against the dev server with the mock back end.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
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
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
