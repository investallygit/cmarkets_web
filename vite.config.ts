/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { readEnv } from './src/shared/config/readEnv.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // A malformed address stops the dev server and the build here, rather than a blank page later.
  readEnv(env)
  // e.g. https://localhost:7001 for a local CMarket.Api; see .env
  const proxyTarget = env.DEV_PROXY_TARGET

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    build: {
      rolldownOptions: {
        output: {
          // MSW apart from the handlers and sample data: both load with the prototype only.
          codeSplitting: { groups: [{ name: 'msw', test: /node_modules[\\/](msw|@mswjs)[\\/]/ }] },
        },
      },
    },
    server: proxyTarget
      ? {
          proxy: {
            '/api': { target: proxyTarget, changeOrigin: true, secure: false },
            '/hubs': { target: proxyTarget, changeOrigin: true, secure: false, ws: true },
          },
        }
      : undefined,
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      css: false,
    },
  }
})
