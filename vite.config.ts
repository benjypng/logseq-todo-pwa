import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ['logseq'],
    host: true,
    proxy: {
      '/logseq-api': {
        target: 'http://127.0.0.1:12315',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/logseq-api/, ''),
      },
    },
  },
})
