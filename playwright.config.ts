import { defineConfig } from '@playwright/test';

const performanceMode = process.env.E2E_PERF === '1';
const baseURL = process.env.E2E_BASE_URL || `http://127.0.0.1:${performanceMode ? 5184 : 5183}`;
export default defineConfig({
  testDir: './e2e',
  outputDir: process.env.E2E_OUTPUT_DIR || 'test-results/flows',
  timeout: 45_000,
  workers: 1,
  use: {
    baseURL,
    headless: true,
    launchOptions: { executablePath: process.env.E2E_CHROME_EXECUTABLE || undefined },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: performanceMode ? 'npm run preview -- --host 127.0.0.1 --port 5184 --strictPort' : 'npm run dev -- --host 127.0.0.1 --port 5183 --strictPort',
    env: performanceMode ? { BASE_PATH: '/englearningapp/' } : {},
    url: `${baseURL}/englearningapp/`,
    reuseExistingServer: !process.env.CI,
  },
});
