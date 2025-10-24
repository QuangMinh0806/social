import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    allowedHosts: [
      'localhost:3000',
      'https://autosocial.tmedu.vn', 
    ],
    proxy: {
      '/api': {
        // target: 'https://autosocialbe.tmedu.vn',
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
