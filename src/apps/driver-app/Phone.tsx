import { cx } from '@zp/ui'
import { Glyph, type GlyphName } from '~/ui-local'
import { hhmm } from './data'
import { Snack } from './parts'
import { Fail, Issues, Report, Close, Closed, More } from './screens/Other'
import { Flow } from './screens/Flow'
import { Consent, SignIn, Today } from './screens/Start'
import { StopDetail, Stops } from './screens/Stops'
import { useDriver, type Screen } from './store'

/** The phone: a status bar on the demo clock, the current screen, the tab bar on top-level screens. */
export function Phone() {
  const { s } = useDriver()
  const sc = s.screen
  const top = ['today', 'stops', 'issues', 'more'].includes(sc.name)
  return (
    <div className="da-phone" data-lang={s.lang}>
      <div className="da-status" aria-hidden>
        <span className="num">{hhmm(s.clock)}</span>
        <span className="grow" />
        {s.bt && <Glyph name="bluetooth" size={13} />}
        <Glyph name={s.online ? 'wifi' : 'wifi-off'} size={13} />
        <span className="da-batt"><span /></span>
      </div>
      <div className="da-viewport">
        {!s.signedIn ? <SignIn /> : <Current screen={sc} key={keyOf(sc)} />}
        <Snack />
      </div>
      {s.signedIn && top && s.route !== 'closed' && <TabBar />}
    </div>
  )
}

const keyOf = (sc: Screen) => ('id' in sc ? `${sc.name}:${sc.id}` : sc.name)

function Current({ screen }: { screen: Screen }) {
  switch (screen.name) {
    case 'today': return <Today />
    case 'consent': return <Consent />
    case 'stops': return <Stops />
    case 'stop': return <StopDetail id={screen.id} />
    case 'flow': return <Flow id={screen.id} />
    case 'fail': return <Fail id={screen.id} />
    case 'report': return <Report stopId={screen.stopId} />
    case 'issues': return <Issues />
    case 'close': return <Close />
    case 'closed': return <Closed />
    case 'more': return <More />
  }
}

function TabBar() {
  const { s, t, dispatch } = useDriver()
  const tabs: Array<{ screen: Screen; icon: GlyphName; label: string; count?: number; match: string[] }> = [
    { screen: s.route === 'released' ? { name: 'today' } : { name: 'stops' }, icon: 'route', label: t('tabRoute'), match: ['today', 'stops'] },
    { screen: { name: 'issues' }, icon: 'alert', label: t('tabIssues'), count: s.exceptions.length, match: ['issues'] },
    { screen: { name: 'more' }, icon: 'menu', label: t('tabMore'), count: s.queue.length || undefined, match: ['more'] },
  ]
  return (
    <nav className="da-tabs" aria-label="App">
      {tabs.map((tab) => {
        const on = tab.match.includes(s.screen.name)
        return (
          <button
            key={tab.label} type="button" className={cx('da-tab', on && 'on')} aria-current={on ? 'page' : undefined}
            onClick={() => dispatch({ type: 'tab', screen: on && s.screen.name === 'stops' ? { name: 'today' } : tab.screen })}
          >
            <span className="da-tab-ic"><Glyph name={tab.icon} size={22} />{tab.count ? <span className="da-tab-n num">{tab.count}</span> : null}</span>
            <span>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
