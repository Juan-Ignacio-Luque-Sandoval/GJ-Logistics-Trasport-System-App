# Themes — 7 switchable colour themes

## The model
- A theme is **only a set of token values**. Every theme defines exactly the same CSS variables. Components read variables; they **never** check which theme is active.
- The active theme is `data-theme="<id>"` on `<html>`. Ids: `lavender` (default), `lavender-dark`, `midnight`, `bubblegum`, `ocean`, `olive`, `graphite`. Legacy ids `sage` → `olive`, `light` → `lavender`, `dark` → `lavender-dark`.
- Load order: `tokens/tokens.css`, then `tokens/themes.css`, then `css/zp-components.css`. Tailwind: the preset in `tokens/tailwind.preset.js` already maps to these variables, so `bg-primary`, `text-text-muted`, `border-border` etc. follow the theme automatically.

## Tokens you must use (names identical in every theme)
| Purpose | Variable |
|---|---|
| Page / card / well / raised | `--color-canvas` · `--color-surface` · `--color-surface-sunken` · `--color-surface-raised` |
| Lines | `--color-border` (decorative) · `--color-border-strong` (inputs, checkboxes, switches — ≥ 3 : 1) |
| Text | `--color-text` · `--color-text-muted` · `--color-text-faint` · `--color-text-disabled` |
| Primary — **fills** | `--gradient-primary` (hover `--gradient-primary-hover`, pressed `--gradient-primary-pressed`) |
| Primary — text, borders, icons | `--color-primary` · `--color-primary-hover` (links, primary text) · `--color-primary-pressed` |
| Primary — tints | `--color-primary-subtle` (selected row, current step, hover fills) · `--color-primary-subtle-hover` |
| Label on a primary fill | `--color-on-primary` — **white in some themes, dark in others** (Lavender · dark, Midnight, Olive). Never hard-code `#fff` on a primary fill. |
| SVG gradients | `--gradient-primary-from` / `--gradient-primary-to` (use as `stop-color`) |
| Focus | `--color-focus-ring` — 2 px solid, 2 px offset |
| Status | `--color-success|warning|danger|info` + `-text` + `-subtle` (+ `--color-danger-hover`) |
| Backdrop | `--color-backdrop` (dialogs / bottom sheets only) |
| Shadows | `--elevation-1|2|3` |

## Rules
1. **Primary fills always use `--gradient-primary`** as `background-image` (button primary, checked checkbox / radio dot / switch track, count badge, progress bar, selected calendar day, current step glyph, connector fill). Solid `--color-primary` is never a fill.
2. **No background gradients elsewhere** — sidebar, mini-block, current step row, empty states and cards are plain surfaces. `--gradient-mesh` is reserved for the sign-in screen.
3. Text on `--color-primary-subtle` uses `--color-text` or `--color-primary-hover`, never `--color-on-primary`.
4. Status colours mean status and always come with a word or a glyph. In Olive, success is **teal** on purpose (so it never blends with the olive primary) — don't "fix" it to green.
5. Don't add per-theme CSS in components. If a component looks wrong in one theme, the fix is a token value in `themes.css`, re-checked against `CONTRAST.md` minimums (text 4.5 : 1, input borders 3 : 1, label on gradient 4.5 : 1 at both stops).
6. Set `color-scheme` (done in `themes.css`) so native controls and scrollbars match light/dark.

## Switching
- Wrap the app in `<ThemeProvider>` (from `@zp/ui`); put `<ThemePicker />` inside a popover opened from **account menu → Appearance**.
- Inline `NO_FLASH_SCRIPT` in `<head>` so the saved theme paints before React loads.
- "Follow the system" toggle: when on and the OS is dark, a light pick is painted as `lavender-dark` (`resolveTheme`). Dark picks stay as chosen.
- Persist the choice per user (localStorage in the sample; move it to user settings server-side when available).

## Done when
Every screen renders correctly in all 7 themes with no component code branching on the theme, and each pair in `CONTRAST.md` still passes.
