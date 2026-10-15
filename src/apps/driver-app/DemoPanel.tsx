import { Badge, Button, Switch } from '@zp/ui'
import { Card, CardBody, CardHeader, SpecNote } from '~/ui-local'
import { STOPS, hhmm } from './data'
import { useDriver } from './store'

/**
 * Beside the phone, outside the app: the controls a demo needs (connection, traffic, a Bluetooth
 * scanner, fast-forward, reset) and what the control tower would be receiving. English only: it is
 * for the audience, not the driver.
 */
export function DemoPanel() {
  const { s, x, dispatch } = useDriver()
  const done = STOPS.filter((st) => ['completed', 'failed'].includes(s.stops[st.id]!.status)).length
  return (
    <div className="da-panel">
      <Card>
        <CardHeader icon="sliders" title="Demo controls" description="Change the conditions the driver works in." />
        <CardBody className="da-panel-body">
          <div className="da-panel-row">
            <span className="grow">
              <b>Connection</b><br />
              <span className="sm muted">Offline: everything still works; records queue and sync when it returns (§ 4.5, § 14).</span>
            </span>
            <Switch checked={s.online} onChange={(v) => dispatch({ type: 'online', online: v })} label={s.online ? 'Online' : 'Offline'} />
          </div>
          <div className="da-panel-row">
            <span className="grow">
              <b>Bluetooth scanner</b><br />
              <span className="sm muted">Optional hardware scanner instead of the camera (§ 10).</span>
            </span>
            <Switch checked={s.bt} onChange={(v) => dispatch({ type: 'bt', on: v })} label={s.bt ? 'On' : 'Off'} />
          </div>
          <div className="da-panel-row">
            <span className="grow">
              <b>Traffic on the next leg</b><br />
              <span className="sm muted">Adds minutes to the next drive. Over {20} min behind plan, or after the window, raises a delay alert (§ 5).</span>
              {s.traffic > 0 && <><br /><Badge tone="warning">+{s.traffic} min pending</Badge></>}
            </span>
            <Button variant="secondary" size="sm" icon="clock" onClick={() => dispatch({ type: 'traffic', minutes: 30 })}>+30 min</Button>
          </div>
          <div className="row" style={{ flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            <Button variant="secondary" size="sm" icon="arrow-right" onClick={() => dispatch({ type: 'fastForward' })} softDisabled={done >= 4}>
              Skip to stop 5
            </Button>
            <Button variant="ghost" size="sm" icon="refresh" onClick={() => dispatch({ type: 'reset' })}>Reset demo</Button>
            <a className="btn ghost sm" href="#/device" target="_blank" rel="noreferrer"><span>Open full screen (for a phone)</span></a>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon="refresh" title="Sent to the control tower" description={s.queue.length ? `${s.queue.length} waiting on the phone${s.online ? ', syncing…' : ' (offline)'}` : 'Status, scans and proof as they arrive (§ 7, § 8).'} />
        <CardBody>
          <ol className="da-feed">
            {s.queue.slice().reverse().map((q) => (
              <li key={q.id} className="waiting"><span className="num">{hhmm(q.at)}</span><span className="grow">{x(q.what)}</span><Badge tone="warning">queued</Badge></li>
            ))}
            {s.synced.slice(0, 12).map((q) => (
              <li key={q.id}><span className="num">{hhmm(q.at)}</span><span className="grow">{x(q.what)}</span><Badge tone="success">received</Badge></li>
            ))}
            {s.queue.length + s.synced.length === 0 && <li className="muted">Nothing yet. Sign in and start the route.</li>}
          </ol>
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon="info" title="Things to try" />
        <CardBody>
          <ul className="da-try">
            <li>Sign in with any 4-digit PIN, start the route, accept location tracking.</li>
            <li>At a stop: <b>{"I've arrived"}</b> → <b>Scan</b> (one tap per carton) → seals → sign with the mouse.</li>
            <li>Type a carton that is not on the list (e.g. <span className="mono">99999-01</span>) to see a refused scan.</li>
            <li>Mark a scanned carton damaged, or continue with cartons missing: a shortage report is raised.</li>
            <li>Turn the connection off, finish a stop, then turn it on and watch the queue drain.</li>
            <li>Fail a stop (store closed) and see the proposed next step.</li>
            <li>Switch the phone to Russian under <b>More</b>.</li>
          </ul>
        </CardBody>
      </Card>

      <SpecNote reference="Tech sheet § 4.5 · § 10 · § 14">
        Phase 1 driver app: scan, signature and photo at every handover, status updates with time and GPS, failed-stop flow,
        full route offline. Camera, GPS and maps are simulated.
      </SpecNote>
    </div>
  )
}
