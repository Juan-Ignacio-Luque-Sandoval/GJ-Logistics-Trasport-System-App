/**
 * Copied from GJ-plm-srm's @gloria-jeans/eslint-config (index.mjs + react.mjs) rather than
 * imported, for the reason the UI library is vendored: that package is not published.
 *
 * Only TypeScript is linted, and not the vendored design system (src/zp).
 */
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import globals from 'globals'

export default tseslint.config(
  { ignores: ['**/*.js', '**/*.jsx', '**/*.mjs', 'node_modules/**', 'src/routeTree.gen.ts', 'src/zp/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactPlugin.configs.flat.recommended,
  {
    plugins: { 'react-hooks': reactHooksPlugin },
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    settings: { react: { version: 'detect' } },
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },
)
