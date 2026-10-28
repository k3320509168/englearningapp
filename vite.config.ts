import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// BASE_PATH：部署到 GitHub Pages 時網址在子路徑（/englearningapp/），由部署流程設定；本機開發用 /
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
})
