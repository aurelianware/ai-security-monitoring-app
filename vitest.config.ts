import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    pool: 'forks', // Use forked process pool to avoid module conflicts
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
  },
})