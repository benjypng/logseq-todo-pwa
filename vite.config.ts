import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
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
