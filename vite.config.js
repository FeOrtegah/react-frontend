import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: false, 
    proxy: {
      '/api': {
        target: 'https://sistema-gateway.onrender.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
