import { Button, Popover, ThemePicker } from '@zp/ui'

/** The sidebar's "Appearance" entry: the design system's theme picker in a popover above it. */
export function Appearance() {
  return (
    <div className="gj-appearance">
      <Popover
        title="Appearance"
        width={560}
        placement="top"
        trigger={<Button variant="ghost" size="sm" icon="sliders" className="gj-appearance-trigger">Appearance</Button>}
      >
        <p className="sm muted gj-appearance-note">Choose a theme. It applies to every screen, in this browser only.</p>
        <ThemePicker />
      </Popover>
    </div>
  )
}
