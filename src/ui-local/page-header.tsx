import type { ReactNode } from 'react'

/** The page title (type.display) and the subtitle under it, once. */
export function PageHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="gj-page-header">
      <div className="grow">
        <h1 className="gj-page-title">{title}</h1>
        {subtitle && <p className="gj-page-subtitle">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
