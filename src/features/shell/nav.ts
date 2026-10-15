import type { NavSection } from '@zp/ui'
import { SECTORS, appIcon, appsIn } from '~/ecosystem/registry'

/**
 * The sidebar: Home, then one tree node per sector with its apps beneath. A node's id is the path
 * it opens, so selecting one is a navigation and the current path is the selection. An app on a
 * link between two sectors shows under both, and both light up.
 */
export const NAV: NavSection[] = [
  { id: 'overview', title: 'Overview', icon: 'grid', nodes: [{ id: '/', label: 'Home', icon: 'grid' }] },
  {
    id: 'sectors',
    title: 'Sectors',
    icon: 'layers',
    nodes: SECTORS.map((sector) => ({
      id: `/sectors/${sector.id}`,
      label: sector.title,
      icon: sector.icon,
      children: appsIn(sector.id).map((app) => ({ id: `/apps/${app.id}`, label: app.title, icon: appIcon(app) })),
    })),
  },
]

/** The node a path belongs to: a prototype's own sub-pages (`/apps/x/items/42`) select the app. */
export function navIdFor(pathname: string) {
  const app = /^\/apps\/[^/]+/.exec(pathname)
  return app ? app[0] : pathname
}
