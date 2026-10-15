import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import path from 'node:path'

/** The shell. Prototypes plug in under `src/apps/<id>/` (see src/apps/README.md). */
export default defineConfig({
  root: path.resolve(__dirname, 'src'),
  plugins: [
    // File-based routing: `src/routes/` generates `routeTree.gen.ts`, which is committed so
    // `pnpm typecheck` works without a build. Must come before react().
    tanstackRouter({
      target: 'react',
      routesDirectory: path.resolve(__dirname, 'src/routes'),
      generatedRouteTree: path.resolve(__dirname, 'src/routeTree.gen.ts'),
      autoCodeSplitting: true,
    }),
    react(),
  ],
  resolve: {
    // `@zp/ui` is the vendored design system (src/zp, see src/VENDORED.md), imported under its
    // package name so code reads the same as in an app that installs it. `~/` is the app's.
    alias: [
      { find: '@zp/ui/styles.css', replacement: path.resolve(__dirname, 'src/zp/react/src/styles.css') },
      { find: /^@zp\/ui$/, replacement: path.resolve(__dirname, 'src/zp/react/src/index.ts') },
      { find: '~', replacement: path.resolve(__dirname, 'src') },
    ],
  },
  build: { outDir: path.resolve(__dirname, 'dist'), emptyOutDir: true },
  server: { port: 5192, strictPort: true },
})
