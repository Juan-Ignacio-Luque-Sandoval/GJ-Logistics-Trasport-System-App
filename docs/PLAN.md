# Transport App for Store-to-Store Movements — Prototype plan

Source: *Technical Sheet: Transport App for Store-to-Store Movements*, v1.0 draft, 13 Oct 2026.
Both prototypes are copies of the **GJ Prototype System** shell (React 19, Vite, TanStack Router,
`@zp/ui` Zabriskie Point design system, 7 themes). Sample data only; nothing talks to a backend.

| Folder | What | Port | Run |
| --- | --- | --- | --- |
| `prototype-app/` | **Driver app** (mobile, § 4.5, § 10) shown in a phone frame inside the shell | 5192 | `pnpm dev` |
| `prototype/` | **Transport system** (desktop: planner, control tower, dispatcher, carriers, finance, admin) | 5191 | `pnpm dev` |

Build order: this plan → driver app (`prototype-app/`, **done**) → desktop system (`prototype/`, shell copied, not built yet).

Driver app: `#/apps/driver-app` shows the phone with the demo panel; `#/device` shows the app alone, full screen, for opening on a real phone on the same network.

---

## 1. What the sheet asks for, in short

- The transport leg only: orders come in ready for pickup from the transfer tool; the app plans,
  dispatches, executes and proves the movement; status, scans and POD go back (§ 1, § 3).
- Eight roles (§ 2). Drivers use a phone; everyone else a responsive web app (§ 10).
- Statuses (§ 7): **Order** Received → Planned → Dispatched → Picked up → In transit → At cross-dock →
  Delivered → Closed (+ On hold, Failed, Cancelled). **Route** Draft → Released → Started → Completed →
  Closed. **Stop** Pending → Arrived → Completed / Failed. Every change records user, time, GPS, reason.
- Calculation rules (§ 5): fill %, chargeable weight, stop time, ETA, route cost, cost per carton,
  mode choice, consolidation release, nearest-insertion route building, delay alert.
- Phase 1 acceptance (§ 14) is what both prototypes must make visible.

## 2. Shared sample data (both prototypes)

One pilot region (§ 13): Moscow north-west, ~6 stores, 1 cross-dock, 3 drivers, 15 Oct 2026.

- **Locations:** GJ Aviapark, GJ Atrium, GJ Evropeisky, GJ Mega Khimki, GJ Zelenograd, Khimki cross-dock — opening hours, dock notes, GPS.
- **Vehicles:** GAZelle Next 16 m³ / 1,500 kg (own fleet), Ford Transit 12 m³ / 1,100 kg (own), 3PL 20 m³ truck.
- **Drivers:** Alexey Smirnov (own), Dmitry Orlov (own), Sergey Kuznetsov (3PL "VolgaTrans").
- **Transport orders:** ~10 transfers (`TR-482xx`) with cartons, kg, m³, windows, priority, special handling.
- **Route of the day for the driver app:** `R-1015-MSK-03`, 6 stops — 2 pickups, 3 store deliveries, 1 cross-dock.

## 3. Driver app — `prototype-app/` (built first)

Shown as a phone (390 × 844) inside the shell page, with a **demo panel** beside it (connection
on/off, sync queue, Bluetooth scanner, reset, jump to scenario, spec notes). Below 1100 px the
phone fills the screen. Big touch targets (≥ 44 px, primary actions 56 px), high contrast, ≤ 3 taps
per scan or confirmation (§ 10). English / Russian switch (§ 10).

| # | Screen | Sheet ref | What it shows / does |
| --- | --- | --- | --- |
| 1 | Sign in | § 4.5 | Driver ID + PIN, language EN/RU, last sync time |
| 2 | Today | § 4.5, § 3 | Route card (route ID, vehicle, plate, carrier, stops, cartons, kg, m³, planned start/end), Start route |
| 3 | Tracking consent | § 11 | One-time notice: location tracked only during active routes; consent recorded |
| 4 | Stop list | § 4.5, § 4.6 | Timeline of stops: type (pickup / delivery / cross-dock), window, ETA, cartons, status; delay flag when ETA > window end (§ 5) |
| 5 | Stop detail | § 4.5 | Address, window, contact, dock / access notes, Navigate (map link), Call store, Arrived |
| 6 | Pickup flow | § 3, § 4.5 | Arrive → scan cartons (x / y) → check seal → photo if damaged → store signature → depart |
| 7 | Delivery flow | § 4.5 | Arrive → scan and compare with manifest → shortages / extras / damage → signature or photo POD → complete |
| 8 | Cross-dock stop | § 3 | Unload scan / reload scan with the operator's signature |
| 9 | Failed stop | § 4.5, § 4.8 | Reason code (store closed, refused, wrong address), photo, app proposes next step |
| 10 | Report an issue | § 4.8 | Delay, damaged carton, missing carton, vehicle breakdown, other — comment, photo; creates an exception with owner and deadline |
| 11 | Issues | § 4.8 | Exceptions raised on this route and their status |
| 12 | Close route | § 3, § 7 | Summary (stops done / failed, cartons, POD count, exceptions), confirm end of route |
| 13 | More | § 10 | Sync queue, Bluetooth scanner, language, call dispatcher, sign out |

Behaviour that the prototype simulates:
- **Scanning:** a camera viewfinder with a Scan button (each tap = one carton read), manual carton
  entry, and an optional Bluetooth scanner. Wrong / unknown / duplicate cartons are refused with a reason.
- **Proof:** a real signature pad (finger / mouse), signer name, simulated photos; each proof stamps
  time and GPS (§ 6 Proof).
- **Offline (§ 4.5, § 14):** route, stops and cartons are cached; every driver action goes into a sync
  queue. Offline, the queue grows and a banner says so; online, it drains. A full route can be done offline.
- **Status trail:** every action writes the § 7 status with user, time and GPS (visible on the stop).

## 4. Transport system — `prototype/` (desktop, built second)

Sector "Transport" with one app, internal navigation by the shell's sub-paths.

| Area | Role (§ 2) | Sheet ref | Content |
| --- | --- | --- | --- |
| Control tower (home) | Planner, dispatcher | § 4.6, § 9 | KPI tiles (on-time pickup / delivery, fill %, cost per carton, first-attempt success, POD return time), live route list with progress and ETA, alert feed (delay > threshold) |
| Order intake | Planner | § 4.1 | Orders from the transfer tool; validation results; rejected orders with reason; statuses § 7 |
| Route planning | Planner | § 4.2, § 5 | Unplanned orders grouped by city and window; suggested routes (nearest insertion); fill % volume / weight bars; capacity and time-window checks; move stops between routes (drag and drop); release when fill ≥ threshold or cut-off |
| Route detail | Planner, dispatcher | § 4.2, § 4.6, § 4.7 | Stops with planned vs actual times, ETA, scans and POD per stop, map placeholder, documents (route sheet, waybill, manifest, POD), re-plan |
| Dispatch | Dispatcher | § 3, § 4.2 | Release routes, re-plan on the day (urgent order, breakdown), driver messages |
| Vehicles and drivers | Planner, admin | § 4.3 | Availability, capacity, cost rates, licence validity, working hours; assignment with conflicts flagged |
| Carriers and tenders | Carrier manager | § 4.4, § 9 | Own fleet / 3PL / couriers; load tender with timer, accept / reject, fallback to the next carrier by reliability; scorecard |
| Exceptions | Control tower | § 4.8 | Reason code, owner, deadline, status; task list |
| Costs | Finance | § 4.9, § 5 | Cost per route / stop / carton / kg from the rate card, planned vs actual with variance flagged; mode choice comparison |
| Reports | Finance, logistics | § 4.10, § 9 | KPI pack, delay reasons, damage / shortage by carrier and lane, export |
| Settings | Admin | § 5, § 6 | Locations, lanes, rate cards, vehicle types, rule parameters (fill threshold, cut-off, delay minutes, stop times), users |

## 5. Calculation rules to implement in the prototypes (§ 5)

Shared `rules.ts`, used by the desktop planner and the driver app ETA:

- fill_vol = Σ carton m³ ÷ usable m³; fill_kg = Σ kg ÷ payload
- chargeable_kg = max(kg, L × W × H ÷ 5000)
- stop_min = fixed_min + per_carton_min × cartons
- ETA = departure + distance ÷ speed × traffic factor + stop times + breaks
- route_cost = fixed + km × rate_km + hours × rate_h + tolls; cost_per_carton = route_cost ÷ cartons delivered
- delay alert = ETA > window end or > N min behind plan
- release when fill ≥ threshold or at cut-off; urgent bypasses

## 6. Out of scope for the prototypes

Real maps and GPS (a stylised map placeholder), real camera scanning, real integrations (§ 8),
authentication, persistence beyond the browser session, the Phase 3 optimiser.

## 7. Points to confirm (§ 15) that change the prototypes

- Mix of own fleet / 3PL / couriers, and whether carrier drivers use our app → carrier login in the driver app?
- Documents required (TTN, CMR) → which documents the driver app shows and signs.
- Volumes per day → list density and whether the planner needs a map view in Phase 1.
- Store opening hours and dock rules → stop detail content.
