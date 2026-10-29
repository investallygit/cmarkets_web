import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// Layers, top to bottom: main.tsx -> app -> screens -> features -> shared.
// A layer may only import the layers below it. mocks/ is a fake back end that only sees shared/.
const deepFeatureImport = {
  group: ['@/features/*/*', '@/features/*/**'],
  message: 'Import a feature through its public index: @/features/<name>.',
}

function layer(forbidden, message) {
  return {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          { group: forbidden.flatMap((name) => [name, `${name}/*`]), message },
          deepFeatureImport,
        ],
      },
    ],
  }
}

export default defineConfig([
  globalIgnores([
    'dist',
    'coverage',
    'playwright-report',
    'test-results',
    'public/mockServiceWorker.js',
  ]),
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
    files: ['src/shared/**'],
    rules: layer(
      ['@/app', '@/screens', '@/features', '@/mocks'],
      'shared/ is the bottom layer: it must not import app/, screens/, features/ or mocks/.',
    ),
  },
  {
    files: ['src/features/**'],
    rules: layer(
      ['@/app', '@/screens', '@/mocks'],
      'features/ may only import shared/ and other features through their index.',
    ),
  },
  {
    files: ['src/screens/**'],
    rules: layer(
      ['@/app', '@/mocks'],
      'screens/ compose features; they must not import app/ or mocks/.',
    ),
  },
  {
    files: ['src/app/**'],
    rules: layer(['@/mocks'], 'Only src/main.tsx decides whether the mock back end is loaded.'),
  },
  {
    files: ['src/mocks/**'],
    rules: layer(
      ['@/app', '@/screens', '@/features'],
      'mocks/ is a fake back end: it may only use shared/ (API contracts, config).',
    ),
  },
])
