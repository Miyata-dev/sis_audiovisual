import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    host: '0.0.0.0', 
    proxy: {
      '/api': {
        target: 'http://backend:3000', 
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://backend:3000', 
        changeOrigin: true,
      },
    },
  },
})