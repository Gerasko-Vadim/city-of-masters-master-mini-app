import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 3002,
  },
  preview: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 3002,
    allowedHosts: true,
  },
})
