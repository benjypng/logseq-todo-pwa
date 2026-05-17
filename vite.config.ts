import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const allowedHosts = env.ALLOWED_HOSTS
    ? env.ALLOWED_HOSTS.split(',')
        .map((h) => h.trim())
        .filter(Boolean)
    : []

  return {
    plugins: [react(), tailwindcss()],
    server: {
      allowedHosts,
      host: true,
      proxy: {
        '/logseq-cli': {
          target: 'http://127.0.0.1:12316',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/logseq-cli/, ''),
        },
        '/logseq-api': {
          target: 'http://127.0.0.1:12315',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/logseq-api/, ''),
        },
      },
    },
  }
})
