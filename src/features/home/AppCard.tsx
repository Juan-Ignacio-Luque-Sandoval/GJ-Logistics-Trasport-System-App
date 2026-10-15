import { Link } from '@tanstack/react-router'
import { appIcon } from '~/ecosystem/registry'
import type { EcosystemApp } from '~/ecosystem/types'
import { Card, CardHeader, StageBadge } from '~/ui-local'

export function AppCard({ app }: { app: EcosystemApp }) {
  return (
    <Link to="/apps/$appId" params={{ appId: app.id }} className="gj-card-link">
      <Card className="gj-fill">
        <CardHeader
          icon={appIcon(app)}
          title={app.title}
          action={<StageBadge stage={app.stage} />}
          description={<>{app.tag && <span className="gj-card-tag">{app.tag}</span>}{app.summary}</>}
        />
      </Card>
    </Link>
  )
}
