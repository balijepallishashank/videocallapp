import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'agora-vendor': ['agora-rtc-sdk-ng'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          'utils-vendor': ['xlsx', 'date-fns']
        }
      }
    }
  }
})
