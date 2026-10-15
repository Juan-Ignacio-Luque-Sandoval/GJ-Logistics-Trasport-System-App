# Vendored: the Zabriskie Point design system (`@zp/ui`)

Source: `GJ Design System/zp-design-system` (the folder next to this project), version `1.0.0` of
its `react/package.json`, copied on 2026-10-12. It is copied rather than installed with
`file:../…` so the shell builds on any machine without that folder beside it. **Do not edit these
files in place**, beyond the patches listed below. A change goes upstream, or into `ui-local/`. To
re-sync, copy the same paths from a newer drop, re-apply the patches and update the date here.

| Here | From | Notes |
| --- | --- | --- |
| `zp/react/src/` | `react/src/` | The React components. Patched: see below. |
| `zp/tokens/tokens.css`, `zp/tokens/themes.css` | `tokens/` | Unedited. `styles.css` imports them by relative path, so the layout mirrors the source. |
| `zp/css/zp-components.css` | `css/` | Unedited. |
| `zp/docs/` | `docs/` | Unedited. Read `AGENT_GUIDE.md` before building a prototype. |

Not copied: `reference/` (the 75 visual reference pages), `specs/` (behaviour specs), `starter/`,
the JSON token files, the Tailwind preset and the shadcn theme. Open them in the source folder.

## Patches

The package is typed for React 18; this shell runs React 19. Type-only changes in
`zp/react/src/overlays.tsx`, no behaviour change:

- `React.useRef<number>()` → `React.useRef<number | undefined>(undefined)` (React 19 requires the argument).
- `Tooltip` `children`, `Popover` / `DropdownMenu` `trigger`: `React.ReactElement` → `React.ReactElement<Record<string, unknown>>`, so `cloneElement` may add `aria-*` props.
- `Dialog` `initialFocus`: `RefObject<HTMLElement>` → `RefObject<HTMLElement | null>`.

## Imports

`@zp/ui` and `@zp/ui/styles.css` are aliases to `zp/react/src/` (`vite.config.ts`, `tsconfig.json`),
so code reads exactly as it would in an app that installs the package. The shell's own code uses
`~/` for `src/`.

## Typechecking and lint

`tsconfig.json` relaxes `exactOptionalPropertyTypes`, `noUnusedLocals` and `noUnusedParameters`
because the package is written against plain `strict`. ESLint skips `src/zp/`.
