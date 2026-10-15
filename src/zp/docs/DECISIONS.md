# Decisions — where this library differs from the original brief

The original brief is kept untouched in `specs/`. **Behaviour: the specs win. Look: this library wins.** These are the deliberate changes:

| Topic | Brief | This library | Why |
|---|---|---|---|
| Primary | solid `lavender.600` #7F6DD3 | **lavender gradient** #7564D8 → #6F5CC9 → #4A3A92 (135°); solid `color.primary` = #6F5CC9 | product owner request; #7F6DD3 only reaches 4.2:1 with white |
| Gradient mesh stops | peach, rose, dusty mauve, lavender, cream | **lavender, violet, white only** | product owner request — no coral/peach anywhere |
| `color.border-strong` | neutral.300 | neutral.400 #948A92 | input borders must reach 3:1 |
| Neutral scale | "warm grey, slight mauve" (no values) | values defined in `tokens.json` | needed concrete values |
| `color.surface-sunken` | neutral.50 | neutral.100 | visible on white |
| Avatar tints | soft tints of the gradient stops | lavender tints | follows the stop change |
| Instance card | sections, two columns | sections are **field groups**: bordered cards with a lavender header band (icon in a gradient chip, title, description, field count, collapse), on `color.canvas`. Example groups: **General** (identity), **Commercial** (target cost, retail price, margin, price tier, supplier, MOQ), **Fabric** | product owner request |
| Card rail | anchors + workflow slot | adds the Instance’s **primary image** at the top as a **portrait 3:4 thumbnail (132 px wide)**, `Primary` badge and `1 / n` count; click opens the lightbox; placeholder "No image yet" | product owner request — uses the `image` attribute’s primary mark, already in the model |
| Multi-path workflow | never draw branches not taken or other routes | **proposal only** (page "Multi-path workflow"): a `Path / Full map` view of every branch and route, read-only off the path; a hover preview of the branches on the last step before a fork | product owner request — **not yet validated**; if adopted, update the Don’t lists of the pipeline specs. Move rules are unchanged: only a direct next (or previous) step is actionable |
| UI language | English, data in English + Russian | same | — |
| Background gradients | mesh on sidebar, mini-block, current step | **none** — plain surfaces; the light sidebar uses one bordered card per section | product owner request |
| Themes | light + dark | **7 switchable themes** (Lavender, Lavender · dark, Midnight, Bubblegum, Ocean, Olive, Graphite), same tokens, chosen per user from account menu → Appearance | product owner request |
| History | list of versions | **timeline**: dotted spine, borderless event cards (who · action · when · version), changed values as a dotted tree | product owner request |
