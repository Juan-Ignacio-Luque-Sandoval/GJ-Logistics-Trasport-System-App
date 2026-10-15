import { Link, Outlet, createRootRoute } from '@tanstack/react-router'
import { EmptyState } from '@zp/ui'

export const Route = createRootRoute({
  component: Outlet,
  notFoundComponent: () => (
    <div className="gj-not-found">
      <EmptyState
        title="There is no page at this address"
        action={<Link to="/" className="btn secondary"><span>Back to home</span></Link>}
      />
    </div>
  ),
})
