import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Proxy PDF upload and processing to backend API (port 8000)
      '/upload': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // Proxy ERPNext integration endpoints to backend API (port 8000)
      '/erpnext': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
