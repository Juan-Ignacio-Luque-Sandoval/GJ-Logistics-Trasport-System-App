import type { IconName } from '@zp/ui'

export interface Sector {
  /** Stable key; appears in the URL (`#/sectors/<id>`). */
  id: string
  title: string
  /** One of the design system's icons (`ICON_PATHS` in @zp/ui). */
  icon: IconName
  summary: string
}

/** `prototype`: something clickable is mounted. `concept`: on the map, nothing built yet. */
export type Stage = 'prototype' | 'concept'

export interface EcosystemApp {
  /** Stable key, also the folder under `src/apps/` that mounts it. */
  id: string
  title: string
  /** Where it lives. Two sector ids put it in both (an app on the link between them). */
  sectors: readonly [string, ...string[]]
  summary: string
  icon?: IconName
  tag?: string
  stage: Stage
}
