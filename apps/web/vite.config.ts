import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { tokensHotReload } from './plugins/vite-plugin-tokens'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), tokensHotReload()],
  server: {
    port: 5173,
    strictPort: true,
  },
})
