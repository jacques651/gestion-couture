import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Le front compilé est servi directement par le backend Express
    outDir: 'backend/public',
    emptyOutDir: true,
  },
  server: {
    port: 1420,
    strictPort: true,
  },
})
