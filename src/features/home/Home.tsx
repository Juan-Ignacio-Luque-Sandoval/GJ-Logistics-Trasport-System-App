import { Link } from '@tanstack/react-router'
import { APPS, SECTORS, appsIn } from '~/ecosystem/registry'
import { Card, CardBody, CardHeader, PageHeader, SpecNote } from '~/ui-local'

export function Home() {
  const built = APPS.filter((a) => a.stage === 'prototype').length
  return (
    <div className="gj-stack">
      <PageHeader
        title="Prototype shell"
        subtitle="The sectors and the apps on each. Every prototype opens inside this shell."
      />
      <div className="gj-grid">
        {SECTORS.map((sector) => (
          <Card key={sector.id}>
            <CardHeader
              icon={sector.icon}
              title={<Link to="/sectors/$sectorId" params={{ sectorId: sector.id }} className="gj-link">{sector.title}</Link>}
              description={sector.summary}
            />
            <CardBody>
              <ul className="gj-app-list">
                {appsIn(sector.id).map((app) => (
                  <li key={app.id}>
                    <Link to="/apps/$appId" params={{ appId: app.id }} className="gj-link">{app.title}</Link>
                    <span className="sm faint">{app.stage === 'prototype' ? 'Prototype' : 'Concept'}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ))}
      </div>
      <SpecNote reference="Empty shell">
        {built} of {APPS.length} apps mounted. Sectors and apps are defined in ecosystem/registry.ts.
      </SpecNote>
    </div>
  )
}
