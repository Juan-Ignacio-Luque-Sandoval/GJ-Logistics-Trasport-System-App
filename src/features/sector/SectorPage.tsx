import { getRouteApi, Link } from '@tanstack/react-router'
import { EmptyState } from '@zp/ui'
import { appsIn, sectorById } from '~/ecosystem/registry'
import { AppCard } from '~/features/home/AppCard'
import { PageHeader } from '~/ui-local'

const route = getRouteApi('/_app/sectors/$sectorId')

export function SectorPage() {
  const { sectorId } = route.useParams()
  const sector = sectorById(sectorId)
  if (!sector) return <NotFound what="sector" />
  const apps = appsIn(sector.id)
  return (
    <div className="gj-stack">
      <PageHeader title={sector.title} subtitle={sector.summary} />
      <div className="gj-grid">
        {apps.map((app) => <AppCard key={app.id} app={app} />)}
      </div>
    </div>
  )
}

export function NotFound({ what }: { what: string }) {
  return (
    <EmptyState
      title={`There is no such ${what} on the map`}
      action={<Link to="/" className="btn secondary"><span>Back to home</span></Link>}
    >
      Check the address, or pick a sector from the sidebar.
    </EmptyState>
  )
}
