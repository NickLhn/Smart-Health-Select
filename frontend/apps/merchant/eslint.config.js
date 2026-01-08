import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const tsRecommended = Array.isArray(tseslint.configs.recommended)
  ? tseslint.configs.recommended
  : [tseslint.configs.recommended]

const reactHooksRules = reactHooks.configs?.recommended?.rules ?? {}
const reactRefreshRules = reactRefresh.configs?.vite?.rules ?? {}

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tsRecommended,
    ],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      ...reactHooksRules,
      ...reactRefreshRules,
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
])
