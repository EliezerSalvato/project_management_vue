// Fake API host: every request to it is intercepted by `e2e/support/fixtures.ts`,
// so the suite never depends on (or accidentally hits) a real backend.
export const E2E_API_URL = 'http://api.e2e.test'
