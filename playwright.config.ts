import { defineConfig, devices } from '@playwright/test'
import { E2E_API_URL } from './e2e/support/env'

const PORT = 4178

export default defineConfig({
  testDir: './e2e',
  // Runs against the real backend; see playwright.real-api.config.ts.
  testIgnore: 'real-api/**',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm exec vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    env: { VITE_API_BASE_URL: E2E_API_URL },
  },
})
