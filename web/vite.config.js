import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/air-api': {
        target: 'http://icetea.esinko.net:9001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/air-api/, ''),
      },
    },
  },
})
