import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: true,
    cors: true
  },
  preview: {
    port: 5173,
    host: true,
    allowedHosts: true,
    cors: true
  },
  build: {
    minify: true,
    sourcemap: false,
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-charts': ['recharts'],
          'vendor-icons': ['lucide-react'],
          'vendor-confetti': ['canvas-confetti']
        }
      }
    }
  }
})
