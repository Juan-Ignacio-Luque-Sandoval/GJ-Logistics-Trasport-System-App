import { createFileRoute } from '@tanstack/react-router'
import { sectorById } from '~/ecosystem/registry'
import { SectorPage } from '~/features/sector/SectorPage'

export const Route = createFileRoute('/_app/sectors/$sectorId')({
  component: SectorPage,
  staticData: { crumb: (p) => sectorById(p.sectorId ?? '')?.title ?? 'Sector' },
})
