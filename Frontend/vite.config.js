import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    allowedHosts: [
      'autosocial.tmedu.vn', // 👈 Thêm host ngrok vào đây
    ],
    proxy: {
      '/api': {
        target: 'https://autosocialbe.tmedu.vn',
        changeOrigin: true,
      },
    },
  },
})
