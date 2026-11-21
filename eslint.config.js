import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'test-results', 'playwright-report', '**/._*']), // exFAT 外接碟上 macOS 產生的 ._ 檔
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['src/cloud/cloudSave.ts'],
    rules: {
      'no-restricted-syntax': ['error', {
        selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='upsert']",
        message: '雲端存檔須用唯一鍵 insert 或附遠端版本條件的 update，避免覆蓋其他裝置的進度。',
      }],
    },
  },
])
