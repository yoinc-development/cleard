import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

// Reuses the Vite plugins (React, compiler) and adds the test environment.
// Kept separate from vite.config.ts so `tsc -b` doesn't have to reconcile the
// Vite copy that vitest bundles with the project's rolldown-vite.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/setupTests.ts',
    },
  }),
)
