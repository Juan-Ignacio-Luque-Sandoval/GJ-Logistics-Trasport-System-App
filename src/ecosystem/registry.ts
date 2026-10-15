import type { EcosystemApp, Sector } from './types'

/**
 * The only place the shell learns what exists: the Transport sector of the store-to-store
 * movements project (Technical Sheet v1.0, 13 Oct 2026). This shell carries the driver app; the
 * desktop system is the sibling `prototype/` folder.
 */
export const SECTORS: readonly Sector[] = [
  {
    id: 'transport',
    title: 'Transport',
    icon: 'truck',
    summary: 'Store-to-store movements: plan, dispatch, execute and prove every transfer between stores.',
  },
]

export const APPS: readonly EcosystemApp[] = [
  {
    id: 'driver-app',
    title: 'Driver app',
    sectors: ['transport'],
    icon: 'truck',
    stage: 'prototype',
    summary: 'The mobile app for drivers: daily route, stop by stop, carton scans, seals, signatures, photos, failed stops and offline sync.',
  },
  {
    id: 'transport-system',
    title: 'Transport system',
    sectors: ['transport'],
    icon: 'grid',
    stage: 'concept',
    summary: 'Planner, control tower, dispatch, carriers and costs on desktop. Built in the sibling prototype/ folder (port 5191).',
  },
]

export const sectorById = (id: string) => SECTORS.find((s) => s.id === id)
export const appById = (id: string) => APPS.find((a) => a.id === id)
export const appsIn = (sector: string) => APPS.filter((a) => a.sectors.includes(sector))
export const appIcon = (app: EcosystemApp) => app.icon ?? 'box'
