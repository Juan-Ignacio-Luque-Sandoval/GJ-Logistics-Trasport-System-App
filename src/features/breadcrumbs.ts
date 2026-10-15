import { useMatches } from '@tanstack/react-router'
import type { Crumb } from '~/shell/Shell'

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    /**
     * The route's label in the header breadcrumbs. A function gets the route's params; a record
     * page shows its id until its slice fetches the name.
     */
    crumb?: string | ((params: Record<string, string>) => string)
  }
}

/** One crumb per matched route that names itself, the last one unlinked. */
export function useBreadcrumbs(): Crumb[] {
  const matches = useMatches()
  const named = matches.filter((m) => m.staticData.crumb !== undefined)
  return named.map((m, i) => {
    const { crumb } = m.staticData
    const label = typeof crumb === 'function' ? crumb(m.params as Record<string, string>) : (crumb ?? '')
    return { label, href: m.pathname, isLast: i === named.length - 1 }
  })
}
