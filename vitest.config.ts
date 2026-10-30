import {defineConfig} from 'vitest/config';
export default defineConfig({test:{include:['tests/unit/**/*.test.{ts,tsx}','tests/integration/**/*.test.ts'],environment:'node',testTimeout:30000,hookTimeout:60000,pool:'forks',maxWorkers:2},resolve:{conditions:['node']}});
