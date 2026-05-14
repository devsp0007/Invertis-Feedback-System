import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
  },
  preview: {
    allowedHosts: ['invertis-feedback-system-1-nn84.onrender.com'],
  },
})
