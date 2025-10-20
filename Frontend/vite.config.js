import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    allowedHosts: [
      'ardis-nondistracting-cogitatively.ngrok-free.dev', // 👈 Thêm host ngrok vào đây
    ],
    proxy: {
      '/api': {
        target: 'https://social-automation-social-be.e7cqih.easypanel.host/',
        changeOrigin: true,
      },
    },
  },
})
