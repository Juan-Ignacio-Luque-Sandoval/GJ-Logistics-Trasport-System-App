# Tokens

Source of truth: `tokens/tokens.json` (shared tokens + every theme) and `tokens/themes.json`. CSS: `tokens/tokens.css` (shared) then `tokens/themes.css` (one block per theme, switched with `data-theme` on `<html>`). Also `tokens/tailwind.preset.js` and `tokens/shadcn-theme.css`. Themes: see `THEMES.md`.

## Rules that matter
- **Primary is a gradient.** Any *fill* that means "primary" — primary button, checked checkbox / radio dot / switch track, count badge, progress bar, selected calendar day, current-step glyph, connector fill — uses `--gradient-primary` (hover `--gradient-primary-hover`, pressed `--gradient-primary-pressed`). Solid `--color-primary` is for **text, borders, focus, icons** only.
- **No background gradients.** Sidebar, mini-block, current step row, cards and empty states are plain surfaces. The only gradient fills are primary controls (`--gradient-primary`); `--gradient-mesh` is reserved for the sign-in screen. Never animated.
- **Status colours mean status** (success / warning / danger / info) and always come with a word or a glyph. No sixth status colour.
- **Contrast:** label on the primary gradient ≥ 4.5:1 at both stops in every theme (`CONTRAST.md`). Input borders (`--color-border-strong`) ≥ 3:1. Body text ≥ 4.5:1.
- **Type:** Manrope (400 / 500 / 600 only) + IBM Plex Mono for article numbers, HEX, codes. Tabular numerals wherever numbers line up. No size under 12 px. Size layouts on Russian samples (~30 % longer).
- **Radius:** sm 4 (table cells, checkboxes) · md 8 (inputs, buttons, menu items) · lg 12 (cards, panels, dialogs, sheets) · full (badges, chips, avatars, step glyphs).
- **Elevation:** 0 page/rows · 1 raised cards, pipeline side panel · 2 popovers, menus, tooltips · 3 dialogs/bottom sheets — the only level with a backdrop.
- **Motion:** instant 0 · fast 120 · base 200 · slow 320 (the connector fill only). Every animation has a reduced-motion fallback. No loops except loading.
- **Controls:** 28 / 36 / 44 px. One height per toolbar. Hit area ≥ 44 px on touch.

## Internal names in `css/zp-components.css`
The reference CSS uses short internal variable names; they hold exactly the token values:

| Internal var | Token |
|---|---|
| `--canvas` | `color.canvas` |
| `--surface` / `--surface-raised` / `--surface-sunken` | `color.surface*` |
| `--surface-hover`, `--brand-soft` | `color.primary-subtle` |
| `--brand-soft-hover` | `color.primary-subtle-hover` |
| `--border` / `--border-strong` | `color.border*` |
| `--ink` / `--ink-muted` / `--ink-faint` / `--ink-disabled` | `color.text*` |
| `--brand` / `--brand-hover` / `--brand-pressed` | `color.primary*` |
| `--brand-ink` | `color.primary-hover` (primary text) |
| `--on-brand` | `color.on-primary` |
| `--brand-grad*` | `gradient.primary*` |
| `--mesh`, `--mesh-veil` | `gradient.mesh`, mesh-subtle veil |
| `--focus-ring` | `color.focus-ring` |
| `--success*` / `--warning*` / `--danger*` / `--info*` | `color.<status>*` |
| `--released-*` / `--review-*` / `--blocked-*` / `--draft-*` | success / warning / danger / neutral aliases |
| `--overlay` | `color.backdrop` |
| `--shadow-sm` / `--shadow-md` / `--shadow-lg` | `elevation.1` / `.2` / `.3` |
| `--f-sans` / `--f-mono` | `font.sans` / `font.mono` |
