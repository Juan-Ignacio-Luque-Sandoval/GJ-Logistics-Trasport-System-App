import type { ReactNode } from 'react'

/**
 * A short note explaining why the prototype behaves the way it does, citing the scope document
 * (`v0.5 § 13.4 · R26`). It wraps — the reference stacks above the text rather than squeezing it.
 */
export function SpecNote({ reference, children }: { reference: string; children: ReactNode }) {
  return (
    <div className="gj-spec-note">
      <span className="gj-spec-note-ref">{reference}</span>
      <span className="gj-spec-note-text">{children}</span>
    </div>
  )
}
