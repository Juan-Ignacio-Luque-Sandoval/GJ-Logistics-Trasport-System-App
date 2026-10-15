import { Icon } from '@zp/ui'

/**
 * Permanent strip at the foot of a non-production deployment, so nobody mistakes staging data for
 * the real thing. In normal flow under the app rather than over it: a fixed strip would hide the
 * bottom of whatever it covers. A plain warning surface; the design system allows no background
 * gradient outside primary controls.
 */
export function EnvironmentBar({ label }: { label: string }) {
  return (
    <div role="status" className="gj-envbar">
      {/* Decorative: the label already says it. */}
      <Icon name="alert" size={12} />
      {label}
      <Icon name="alert" size={12} />
    </div>
  )
}
