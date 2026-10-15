# Agent guide — building an app with the Zabriskie Point design system

You are building a UI with this design system. It can be the PLM app or any other Zabriskie Point app: the tokens, themes and components are generic; the PLM-specific parts are marked as such.

## Precedence
1. `specs/` define **behaviour** (what exists, which states, what is absent vs disabled). When a spec and anything else disagree on behaviour, the spec wins.
2. `reference/` + `tokens/` + `css/zp-components.css` define **look**. When they disagree with the specs on look, they win (see `DECISIONS.md`).
3. For the PLM app only: `specs/00-agent-brief.md` lists things the data model does **not** hold — never build them (deadlines or assignees on steps, skipped steps, priority/SLA, % complete of a chain).

## Setup (do this first)
- **React:** install `react/` as `@zp/ui`, `import "@zp/ui/styles.css"` once, wrap the app in `<ThemeProvider>` (+ `<ToastProvider>`), put `className="zp"` on the app root. Inline `NO_FLASH_SCRIPT` in `<head>` (see `starter/index.html`). Copy `starter/` if you start from scratch.
- **Other stacks:** load `tokens/tokens.css`, `tokens/themes.css`, `css/zp-components.css` in that order; `class="zp"` on the root; `data-theme="<id>"` on `<html>`. Reproduce the markup from `docs/COMPONENTS.md` / the reference pages.
- **Tailwind / shadcn:** `tokens/tailwind.preset.js`, `tokens/shadcn-theme.css`; then restyle primary controls to use `--gradient-primary`.
- Fonts: Manrope 400/500/600 + IBM Plex Mono 400. Tabular numerals wherever numbers line up.

## Use the components, don't re-invent them
| Need | Component (`@zp/ui`) | Reference page |
|---|---|---|
| Actions | `Button` (primary · secondary · ghost · danger · link; sm/md/lg; `loading`, `softDisabled`), `IconButton` (always a `label`) | Button, IconButton |
| Text entry | `Input` (prefix/suffix, `numeric`, `onClear`), `Textarea` | Input, Textarea |
| Choice | `Select` (single/multiple, `searchable`), `Checkbox`, `RadioGroup` (`card` for option cards), `Switch` | Select, Combobox, Checkbox, Radio, Switch, Choice |
| Forms | `FormField` (label, required, description, error, note, calculated, highlight) + `ReadValue` for read mode | FormField, CardEditMode |
| Status | `Badge` (tones), `CountBadge`, `Chip`, `Avatar`, `Alert`, `Banner`, `Toast` (`useToast`) | Badge, Avatar, Toast |
| Overlays | `Tooltip`, `Popover`, `DropdownMenu`, `Dialog`, `AlertDialog`, `Sheet` (side panel / bottom sheet) | Tooltip, Popover, DropdownMenu, Dialog, AlertDialog, Sheet |
| Structure | `AppSidebar` (sections + tree + account), `Tabs`, `Breadcrumb`, `DataTable`, `FieldGroup`, `EmptyState`, `Skeleton`, `Spinner` | AppSidebar, Tabs, Breadcrumb, Table, InstanceCard, EmptyState, Skeleton, Spinner |
| Workflow (PLM) | `Pipeline` + `StepGlyph` (10 step states), `MiniBlock` | Step, Connector, MiniBlock, PipelinePanel |
| History (PLM) | `HistoryTimeline` + `HistoryDiff` | InstanceHistory |
| Themes | `ThemeProvider`, `useTheme`, `ThemePicker` (the Appearance panel) | Themes, Color* |

If a screen needs something that is not here, compose it from these pieces and tokens; match the closest reference page. Every new visual value must be a token.

## Non-negotiable rules
- **Primary fills are the theme gradient** (`--gradient-primary`), never a flat colour. Solid primary only for text, borders, icons, focus.
- **No background gradients** elsewhere: sidebar, cards, panels, mini-block, empty states are plain surfaces.
- **Tokens only.** No hex in components. Components never branch on the theme; `--color-on-primary` is dark in some themes — never hard-code white on a primary fill.
- **Absent vs disabled.** No right to an action → the control is **absent**. Refused because of the data (e.g. required fields empty) → **disabled with the reason shown**, still focusable.
- **One edit mode per record**: Edit → editors everywhere → Save / Cancel. No field saves on its own; switches don't save on toggle. Read mode shows values (`ReadValue`), empty = `—`.
- **No pagination** — virtual rows + silent infinite scroll.
- **Accessibility:** visible focus ring (2 px `--color-focus-ring`, 2 px offset); every icon-only control has an accessible name; colour never carries meaning alone; contrast 4.5 : 1 for text, 3 : 1 for input borders.
- **Breakpoint 1100 px:** below it, menus, popovers and select lists become bottom sheets (`Popover`, `DropdownMenu`, `Sheet` do it automatically), side panels become bottom sheets, two-column field grids become one column.
- **Copy:** verbs on buttons (`Move to Costing`, never `OK`); errors say what blocks and the way out; toasts in the past tense naming the object. Test layouts with Russian data (~30 % longer).

## PLM app specifics
Build order: primitives → patterns (`specs/03-patterns`) → PLM screens (`specs/04-plm`: sidebar, list, instance card with rail + field groups, history, notifications, 13 attribute types) → workflow pipeline (`specs/05-workflow-pipeline`, then the 14 scenarios in `scenarios.md` as acceptance tests). Moves go one step at a time, forward to a direct next (choice at a fork) or back; moving back is never gated; every move writes a version. The workflow move control is absent in edit mode and on an old version.

## Done when
Each reference frame `<component> / <variant> / <state>` you use has a matching implementation, it renders correctly in all 7 themes with no theme-specific code, and the contrast pairs in `CONTRAST.md` still pass.
