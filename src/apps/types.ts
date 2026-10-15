import type { ComponentType } from 'react'

/**
 * What a prototype hands the shell. A prototype is a folder `src/apps/<id>/` whose `index.tsx`
 * default-exports a component of this type; `<id>` is the app's id in `ecosystem/registry.ts`.
 * The shell loads it lazily, so an unbuilt app costs nothing.
 */
export interface PrototypeProps {
  /** Hash path the shell mounts the prototype under, e.g. `/apps/example-app`. Prefix every link with it. */
  basePath: string
  /** The remainder of the location below `basePath`, e.g. `/items/42`; empty at the app's root. */
  subPath: string
}

export type PrototypeModule = { default: ComponentType<PrototypeProps> }
