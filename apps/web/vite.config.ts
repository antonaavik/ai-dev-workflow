import process from 'node:process'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env files from this package dir, including non-VITE_ prefixed vars.
  const env = loadEnv(mode, process.cwd(), '')

  // Keep the web dev port and the proxy target overridable so this app can run
  // alongside other local projects without fighting over ports.
  const webPort = Number(env.WEB_PORT ?? 5173)
  const apiTarget
    = env.VITE_API_PROXY_TARGET
      ?? `http://localhost:${env.SERVER_PORT ?? 3000}`

  return {
    plugins: [react()],
    server: {
      port: webPort,
      strictPort: true,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
