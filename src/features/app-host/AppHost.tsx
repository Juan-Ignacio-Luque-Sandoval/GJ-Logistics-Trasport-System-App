import { Suspense, lazy, useMemo, type ComponentType, type ReactNode } from 'react'
import { getRouteApi, useLocation } from '@tanstack/react-router'
import { Spinner } from '@zp/ui'
import { appById, sectorById } from '~/ecosystem/registry'
import { NotFound } from '~/features/sector/SectorPage'
import type { PrototypeModule, PrototypeProps } from '~/apps/types'
import { Card, CardBody, PageHeader, SpecNote, StageBadge } from '~/ui-local'

const route = getRouteApi('/_app/apps/$appId')

// `src/apps/<id>/index.tsx` is how a prototype mounts; no registration beyond the folder.
const LOADERS = import.meta.glob<PrototypeModule>('../../apps/*/index.tsx')

function loaderFor(id: string) {
  return LOADERS[`../../apps/${id}/index.tsx`]
}

export function AppHost() {
  const { appId } = route.useParams()
  const app = appById(appId)
  const { pathname } = useLocation()
  const basePath = `/apps/${appId}`
  const load = loaderFor(appId)
  const Prototype = useMemo<ComponentType<PrototypeProps> | null>(
    () => (load ? lazy(load) : null),
    [load],
  )

  if (!app) return <NotFound what="app" />
  if (Prototype) {
    return (
      <Suspense fallback={<p className="row muted"><Spinner label={`Loading ${app.title}`} /> Loading {app.title}…</p>}>
        <Prototype basePath={basePath} subPath={pathname.slice(basePath.length)} />
      </Suspense>
    )
  }

  return (
    <div className="gj-stack">
      <PageHeader
        title={<span className="row gj-title-row">{app.title} <StageBadge stage={app.stage} /></span>}
        subtitle={app.summary}
      />
      <Card>
        <CardBody>
          <Row label="Sector">{app.sectors.map((s) => sectorById(s)?.title).join(' + ')}</Row>
        </CardBody>
      </Card>
      <SpecNote reference="Not mounted yet">
        This app has no folder in the shell. Add <code>src/apps/{app.id}/index.tsx</code> and it opens here.
      </SpecNote>
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="gj-def-row">
      <span className="muted">{label}</span>
      <span>{children}</span>
    </div>
  )
}
