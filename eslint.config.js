import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// Feature-Sliced Design (https://feature-sliced.design), layers from top to bottom.
// A layer may only import the layers below it. On the sliced layers, a slice never imports another
// slice of its own layer, and other slices are reached only through their public index.
// main.tsx is the entry point; mocks/ is a fake back end that only sees shared/.
const LAYERS = ['app', 'pages', 'widgets', 'features', 'entities', 'shared']
const SLICED_LAYERS = ['pages', 'widgets', 'features', 'entities']

const modules = (names) => names.flatMap((name) => [`@/${name}`, `@/${name}/*`])

const publicApiOnly = {
  group: SLICED_LAYERS.flatMap((layer) => [`@/${layer}/*/*`, `@/${layer}/*/**`]),
  message: 'Import a slice through its public index: @/<layer>/<slice>.',
}

function importRules(...patterns) {
  return { 'no-restricted-imports': ['error', { patterns: [...patterns, publicApiOnly] }] }
}

const layerRules = LAYERS.map((layer, index) => {
  const patterns = [
    {
      group: modules([...LAYERS.slice(0, index), 'mocks']),
      message:
        layer === 'shared'
          ? 'shared/ is the bottom layer: it must not import any other layer.'
          : `${layer}/ may only import the layers below it; only src/main.tsx loads mocks/.`,
    },
  ]
  if (SLICED_LAYERS.includes(layer)) {
    patterns.push(
      {
        group: modules([layer]),
        message: `A slice must not import another slice of ${layer}/; inside a slice, use relative imports.`,
      },
      {
        group: ['../../*'],
        message: 'Leave a slice only through the public index of another slice.',
      },
    )
  }
  return { files: [`src/${layer}/**`], rules: importRules(...patterns) }
})

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
  { files: ['src/**'], rules: importRules() },
  ...layerRules,
  {
    files: ['src/mocks/**'],
    rules: importRules({
      group: modules(['app', 'pages', 'widgets', 'features', 'entities']),
      message: 'mocks/ is a fake back end: it may only use shared/ (API contracts, config).',
    }),
  },
])
