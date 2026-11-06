import { defineConfig, devices } from '@playwright/test'
import { API_URL } from './e2e/real-api/support/env'

const PORT = 4179
const COMPOSE = 'docker compose -f e2e/backend/docker-compose.yml'

/**
 * E2E against the real project_management_ruby_api, started in Docker from a sibling
 * checkout (override with API_PATH). Covers what the mocked suite can't: the API
 * contract, the httpOnly refresh cookie, CORS and the emails (via Mailpit).
 */
export default defineConfig({
  testDir: './e2e/real-api',
  fullyParallel: true,
  // The dockerized API is a single Rails process in development mode: more workers only queue
  // requests on it (sign-ups alone took 20s) and tests time out instead of running faster.
  workers: 3,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // Reused when already up (`docker compose -f e2e/backend/docker-compose.yml up -d`),
      // otherwise started and stopped with the run (the database lives in tmpfs).
      command: `${COMPOSE} up --build`,
      url: `${API_URL}/up`,
      reuseExistingServer: true,
      timeout: 10 * 60_000,
      gracefulShutdown: { signal: 'SIGTERM', timeout: 30_000 },
    },
    {
      command: `pnpm exec vite --port ${PORT} --strictPort`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: false,
      env: { VITE_API_BASE_URL: API_URL },
    },
  ],
})
