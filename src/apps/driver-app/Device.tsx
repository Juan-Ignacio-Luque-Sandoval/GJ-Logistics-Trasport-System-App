import { Phone } from './Phone'
import { DriverStore } from './store'
import './driver.css'

/** Full screen, no shell and no demo panel: open `#/device` on a phone. */
export default function Device() {
  return (
    <DriverStore>
      <div className="da da-device"><Phone /></div>
    </DriverStore>
  )
}
