import { Badge } from '@zp/ui'
import type { Stage } from '~/ecosystem/types'

/** Where an app is: a status badge with its word, never colour alone. */
export function StageBadge({ stage, className }: { stage: Stage; className?: string }) {
  return stage === 'prototype'
    ? <Badge tone="success" dot className={className}>Prototype</Badge>
    : <Badge tone="neutral" className={className}>Concept</Badge>
}
