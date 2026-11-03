# Extensio AI — Design: "Workbench"

Read this before changing any UI. Tokens live in `frontend/src/index.css` and `frontend/tailwind.config.js`; components in `frontend/src/components/ui/`.

## World

An engineer's bench. Warm paper and graphite, ruled hairlines, one signal-orange accent used for the single most important action on a screen. The product makes small, precise objects (Chrome extensions), so the interface behaves like a well-kept workshop: labelled parts, measured spacing, nothing decorative that doesn't explain something.

- **Light by default.** Most people read prompts, docs and diffs in daylight. Dark mode is tuned for long editing sessions in Code Studio, not as a "developer costume".
- **Orange means "do this".** One primary action per view. Never use the accent for decoration, borders on cards, or text emphasis.
- **Drawings explain.** The only illustration is the exploded drawing of an extension on the landing page, because it teaches what the generator produces.

## Type

| Role | Face | Use |
|---|---|---|
| Display | Bricolage Grotesque Variable | Page titles, landing headlines, wordmark |
| Body/UI | Geist Variable | Everything else |
| Mono | JetBrains Mono Variable | Code, filenames, paths, versions, keys, counts in status lines — never as "technical" decoration |

Scale (rem): 0.75 · 0.8125 · 0.875 · 1 · 1.125 · 1.375 · 1.75 · 2.5 · 3.5. Display tracking −0.03em; body 0. Body measure 60–72ch. More space above a heading than below it. Tabular numerals for any number that changes or aligns.

## Colour

| Token | Light | Dark | Notes |
|---|---|---|---|
| `bg` paper | #F5F3EE | #141310 | |
| `surface` | #FFFFFF | #1B1A16 | editors, inputs, raised panels |
| `surface-2` | #ECE9E1 | #24221D | hover, selected rows |
| `fg` ink | #1C1A16 | #ECE9E1 | 15.7 / 15.3 :1 |
| `muted` | #5E5A51 | #A39E92 | 6.2 / 7.0 :1 — secondary text |
| `subtle` | #6E695F | #8A857A | ≥4.5 :1 — meta text only |
| `rule` | #DAD5CA | #2E2B25 | hairlines, decorative only |
| `control` | #8F897D | #757066 | input and button borders (≥3:1) |
| `primary` | #C2410C | #FF7A45 | white text 5.2 / bg text 7.2 |
| `success` `danger` `warning` | #15803D #B42318 #92400E | #4ADE80 #F87171 #FBBF24 | always paired with an icon or word |

## Shape, depth, motion

- Radius: 6px controls, 10px panels and dialogs. No pills except toggles.
- Depth: hairline rules first; shadows only with offset + blur (`0 1px 2px`, `0 12px 32px -16px`). No coloured glows.
- Motion: 120 / 200 / 320 ms, ease-out-expo for entrances. One authored moment — the extension drawing assembles once on the landing page. Everything honours `prefers-reduced-motion`.
- Browser surfaces are themed: selection, caret, focus ring (2px primary, 2px offset), scrollbars, link underline offset.

## Motion catalogue

Every animation explains a state change. All use the motion tokens and honour `prefers-reduced-motion`.

| Where | What moves | Why |
|---|---|---|
| Route change | `.animate-page` fade-rise of the page body | Signals that the view changed |
| AI Builder | Crew rows: waiting dot → pulsing dot + sweeping hairline → check that draws in; planner features stagger in | Shows real progress from the streamed agent events |
| Landing drawing | Parts settle once on load; hover/focus lifts a part and highlights its callout | Teaches what each part does |
| Landing walkthrough | Fragments reveal once on scroll (`data-reveal`) | Paces the explanation; visible without JS |
| Lists | `.stagger-item`, 40 ms steps, capped at 8 rows | Lets the eye find the first items |
| Assistant | Proposal card slides in; changed files stagger | Draws attention to something that needs a decision |
| Controls | Button press scales to 0.98; switch thumb springs; tab underline grows; save dot pulses | Confirms input |

## Components

- **Buttons:** primary = solid orange; secondary = surface with control border; ghost = text only. Icon-only buttons always have a label.
- **Tabs:** text labels with a 2px underline on the active tab — not pills.
- **Badges/status:** small text with a leading dot or 1px rule; no filled pills.
- **Lists over card grids** when content is a list (projects, templates, findings). Cards only for genuinely separate objects; never nested.
- **Empty states:** one sentence of what this is, one action. Icon inline and small.
- **Errors:** name the problem and the recovery, in the product's words.

## Refuse

Eyebrow labels above headings · section numbers that carry no information · equal icon+heading+text card grids · gradient text · glass/blur decoration · coloured left borders on callouts · hard offset shadows · emoji as icons · monospace as costume · fabricated stats or testimonials.
