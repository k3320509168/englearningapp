/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'

// https://vite.dev/config/
// BASE_PATH：部署到 GitHub Pages 時網址在子路徑（/englearningapp/），由部署流程設定；本機開發用 /
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  // exFAT 外接碟上 macOS 會產生 ._ 檔，測試不要讀到
  test: { exclude: [...configDefaults.exclude, '**/._*'] },
})
