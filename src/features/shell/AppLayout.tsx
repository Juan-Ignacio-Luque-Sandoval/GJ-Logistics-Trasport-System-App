import { Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { Shell } from '~/shell/Shell'
import { useBreadcrumbs } from '~/features/breadcrumbs'
import { NAV, navIdFor } from './nav'

/** One shell for every prototype: the sidebar lists sectors and apps, the outlet is the app. */
export function AppLayout() {
  const breadcrumbs = useBreadcrumbs()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  return (
    <Shell
      brand={{ initials: 'GJ', name: 'Gloria Jeans' }}
      sections={NAV}
      selectedId={navIdFor(pathname)}
      onSelect={(node) => void navigate({ to: node.id })}
      breadcrumbs={breadcrumbs}
      environmentLabel="Transport · Driver app prototype"
    >
      <Outlet />
    </Shell>
  )
}
