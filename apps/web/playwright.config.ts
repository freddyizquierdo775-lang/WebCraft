import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración E2E — WebCraft AI Studio.
 *
 * Ejecución local:
 *   pnpm next build && pnpm playwright test
 *
 * El webServer arranca `next start -p 3099` automáticamente.
 * Requiere NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en el entorno.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:3099',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm exec next start -p 3099',
    url: 'http://localhost:3099',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
