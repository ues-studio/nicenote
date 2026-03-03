import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

// https://wails.io/docs/guides/vite
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  // Wails3 开发模式：端口由 CLI 参数 --port WAILS_VITE_PORT 指定，不在此硬编码
  // HMR 必须走 localhost，Wails3 的 wails.localhost 代理会对 WebSocket 返回 501
  server: {
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
    },
  },
})
