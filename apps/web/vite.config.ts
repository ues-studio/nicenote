import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../packages/editor/src'),
    },
  },
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
  },
})
