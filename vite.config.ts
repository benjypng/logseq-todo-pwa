import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const allowedHosts = env.ALLOWED_HOSTS
    ? env.ALLOWED_HOSTS.split(',')
        .map((h) => h.trim())
        .filter(Boolean)
    : []

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png'],
        manifest: {
          name: 'Logseq Todo',
          short_name: 'Todo',
          description: 'Logseq task manager PWA',
          theme_color: '#1a1816',
          background_color: '#faf8f4',
          display: 'standalone',
          start_url: '/',
          icons: [
            { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            {
              src: 'maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          navigateFallbackDenylist: [/^\/logseq-cli/],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/logseq-cli'),
              handler: 'NetworkOnly',
            },
          ],
        },
      }),
    ],
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
      },
    },
  }
})
