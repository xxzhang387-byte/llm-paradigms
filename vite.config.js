import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 纯静态部署：前端直连 OpenRouter，无需后端代理。
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
})
