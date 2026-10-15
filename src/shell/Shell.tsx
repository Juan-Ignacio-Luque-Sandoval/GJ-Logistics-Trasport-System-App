import { useState, type ReactNode } from 'react'
import { AppSidebar, Breadcrumb, type AppSidebarProps } from '@zp/ui'
import { isTestEnvironment } from './appEnvironment'
import { Appearance } from './Appearance'
import { EnvironmentBar } from './EnvironmentBar'

export interface Crumb {
  label: string
  /** Router path (`/sectors/x`); the header links to it through the hash. */
  href: string
  isLast: boolean
}

interface ShellProps {
  brand: NonNullable<AppSidebarProps['brand']>
  sections: AppSidebarProps['sections']
  selectedId?: string
  onSelect: AppSidebarProps['onSelect']
  breadcrumbs: Crumb[]
  /** What this deployment is. Shown in the foot bar everywhere but production. */
  environmentLabel: string
  children: ReactNode
}

const COLLAPSED_KEY = 'gj.sidebar.collapsed'

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * The chrome every prototype sits in: the design system's sidebar on the left, a header with the
 * breadcrumbs, the scrolling page, and the environment bar at the foot outside production.
 */
export function Shell({ brand, sections, selectedId, onSelect, breadcrumbs, environmentLabel, children }: ShellProps) {
  const [collapsed, setCollapsed] = useState(readCollapsed)
  // The host cannot change without a document load, so this is read once.
  const [isTestEnv] = useState(() => isTestEnvironment())

  function changeCollapsed(value: boolean) {
    setCollapsed(value)
    try {
      localStorage.setItem(COLLAPSED_KEY, value ? '1' : '0')
    } catch {
      // No storage: the choice lasts for this visit.
    }
  }

  return (
    <div className="gj-root">
      <div className="gj-frame">
        <AppSidebar
          brand={brand}
          sections={sections}
          selectedId={selectedId}
          onSelect={onSelect}
          collapsed={collapsed}
          onCollapsedChange={changeCollapsed}
          footer={<Appearance />}
        />
        <div className="gj-column">
          <header className="gj-header">
            <Breadcrumb
              items={breadcrumbs.map((c) => (c.isLast ? { label: c.label } : { label: c.label, href: `#${c.href}` }))}
            />
          </header>
          <main className="gj-main">
            <div className="gj-page">{children}</div>
          </main>
        </div>
      </div>
      {isTestEnv && <EnvironmentBar label={environmentLabel} />}
    </div>
  )
}
