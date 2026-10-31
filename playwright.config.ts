import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: {timeout: 15_000},
  reporter: [['list'], ['html', {open: 'never'}]],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    storageState: {cookies:[],origins:[{origin:'http://127.0.0.1:5173',localStorage:[{name:'lifecity-tools-mode',value:'advanced'}]}]},
    trace: 'retain-on-failure', screenshot: 'only-on-failure',
    launchOptions: {executablePath: process.env.CHROMIUM_PATH ?? (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader']},
  },
  projects: [{name: 'chromium', use: {...devices['Desktop Chrome']}}],
  webServer: [
    {command: 'npx tsx tests/e2e/start-server.ts', url: 'http://127.0.0.1:4174/api/health', timeout: 120_000, reuseExistingServer: false, env: {LOCAL_API_PORT: '4174'}},
    {command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort', url: 'http://127.0.0.1:5173', timeout: 120_000, reuseExistingServer: false, env: {VITE_BACKEND_MODE: 'local'}},
  ],
});
