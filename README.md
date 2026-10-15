# GJ Logistics Transport System — Driver app prototype

The mobile driver app of the store-to-store transport project (*Technical Sheet: Transport App for
Store-to-Store Movements*, v1.0, 13 Oct 2026), built on the GJ Prototype System shell. Sample data
only; camera, GPS and maps are simulated. The full prototype plan is in [docs/PLAN.md](docs/PLAN.md).

```bash
pnpm install
pnpm dev          # http://localhost:5192
```

- `#/apps/driver-app`: the phone beside the demo controls (connection, traffic delay, Bluetooth scanner, skip, reset).
- `#/device`: the app alone, full screen, to open on a real phone on the same network.

The app itself is in `src/apps/driver-app/`: `data.ts` (route, stores, cartons, rules), `store.tsx`
(state, status records, sync queue, ETA and delay rules), `i18n.ts` (English / Russian), `screens/`.

---

# GJ Prototype System

An empty reference shell for new Gloria Jeans prototypes. It gives you the chrome (sidebar,
header, breadcrumbs, environment bar, theme picker) on the Zabriskie Point design system
(`@zp/ui`, 7 themes), and a place to plug a prototype in. The example app is the component
library.

React 19 · TypeScript (strict) · Vite 6 · TanStack Router (file-based, hash history) · pnpm.
No Tailwind: style with the design system's components and tokens (`var(--color-…)`,
`var(--space-…)`, `var(--type-…)`), never hex.

```bash
pnpm install
pnpm dev          # http://localhost:5190
pnpm typecheck
pnpm lint
pnpm build
```

## Add a prototype

1. Add a sector and an app to `src/ecosystem/registry.ts` (icons are `@zp/ui` icon names). The
   sidebar, home page and routes follow.
2. Create `src/apps/<app-id>/index.tsx` whose default export takes `PrototypeProps` (`src/apps/types.ts`).
   It is lazy-loaded at `#/apps/<app-id>/…`; with no folder the shell shows a "not mounted yet" page.
3. Prefix the prototype's internal links with `basePath`; read the rest of the location from `subPath`.
4. Build with `@zp/ui` components; read `src/zp/docs/AGENT_GUIDE.md` first.

## Layout

| Path | What |
| --- | --- |
| `src/zp/` | Design system, vendored. Not edited. |
| `src/shell/` | The chrome, built from `@zp/ui`. |
| `src/ui-local/` | Our own small components (card, page header, spec note, stage badge). |
| `src/ecosystem/` | The registry: the one file to edit to add sectors and apps. |
| `src/features/` | The shell's own screens. |
| `src/apps/` | One folder per prototype. |
| `src/routes/` | Thin route files; `routeTree.gen.ts` is generated and committed. |
| `src/globals.css` | The shell's own styles, tokens only. |

See `src/VENDORED.md` for what is copied from the design system and how to re-sync.
