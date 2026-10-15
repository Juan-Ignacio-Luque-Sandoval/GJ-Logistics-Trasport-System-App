import { createHashHistory, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

/**
 * File-based routes under `routes/`. Hash history, so the shell runs from any static host
 * and a prototype's own `#/…` links keep working.
 */
export const router = createRouter({
  routeTree,
  history: createHashHistory(),
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
