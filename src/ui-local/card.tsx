import type { ReactNode } from 'react'
import { Icon, cx, type IconName } from '@zp/ui'

/**
 * A plain bordered surface (radius lg, elevation 1). @zp/ui has no generic card — its record cards
 * are `FieldGroup` — so this is composed from tokens, as the design system asks. No gradient.
 */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('gj-card', className)}>{children}</div>
}

export function CardHeader({ icon, title, description, action }: {
  icon?: IconName
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="gj-card-header">
      <div className="row gj-card-title-row">
        {icon && <span className="faint gj-card-icon"><Icon name={icon} size={16} /></span>}
        <h3 className="gj-card-title grow">{title}</h3>
        {action}
      </div>
      {description && <p className="gj-card-description">{description}</p>}
    </div>
  )
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('gj-card-body', className)}>{children}</div>
}
