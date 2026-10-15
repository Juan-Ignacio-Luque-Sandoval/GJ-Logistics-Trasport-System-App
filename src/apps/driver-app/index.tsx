import { PageHeader, StageBadge } from '~/ui-local'
import type { PrototypeProps } from '../types'
import { DemoPanel } from './DemoPanel'
import { Phone } from './Phone'
import { DriverStore } from './store'
import './driver.css'

/**
 * The driver app of the store-to-store transport project (Technical Sheet v1.0, § 4.5 and § 10),
 * shown on a phone beside the demo controls. Below 1100 px the phone takes the whole width, as it
 * would on a real device.
 */
export default function DriverApp(_props: PrototypeProps) {
  return (
    <DriverStore>
      <div className="gj-stack da">
        <PageHeader
          title={<span className="row gj-title-row">Driver app <StageBadge stage="prototype" /></span>}
          subtitle="One simple mobile app for every stop: the day's route, carton scans, seals, signatures and photos as proof, failed stops and issues, working offline."
        />
        <div className="da-stage">
          <Phone />
          <DemoPanel />
        </div>
      </div>
    </DriverStore>
  )
}
