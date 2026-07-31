# Handoff: Candy Todo — "Bubblegum Arcade" redesign

## Overview
A visual + interaction redesign of a simple personal todo app (existing app: cream background, serif "Tasks" title, amber accent, 4-tab bar with Today / Tasks / Errands / Add, and a bottom "New item" sheet with Task / Errand / Inbox type chips).

The goal is motivational: the screen should be **fun enough to look at that the owner keeps returning to it**. The redesign adds three pull-back mechanics on top of the existing feature set — a reactive gumdrop mascot, a weekly streak chain, and a "sugar level" progress bar — plus a loud, saturated, sticker-like candy visual language and cheeky copy.

No new data model is required beyond a `done` flag, a `tag` (type), and a due bucket, all of which the current app already has.

## About the design files
`Candy Todo.dc.html` in this bundle is a **design reference created in HTML** — a working prototype that shows the intended look and behavior. It is not production code to copy.

The task is to **recreate this design inside the target app's existing environment** (React Native, SwiftUI, React web, whatever the app is built in), using that codebase's established components, navigation, state layer, and styling conventions. If no environment exists yet, pick the framework most appropriate for the project and implement there.

The prototype file contains three visual directions side by side. **Only direction `1a` (Bubblegum Arcade) is being implemented.** `1b` (Sour Neon) and `1c` (Fruit Stripe) are rejected alternates — ignore them, they are static and included only for context.

## Fidelity
**High fidelity.** Colors, type sizes, radii, borders, shadows, spacing, and animation timings below are final and should be matched. Copy is final. The only intentionally loose parts are: real date handling, persistence, and the exact icon set (see Assets).

---

## Design tokens

### Colors
| Token | Hex | Use |
|---|---|---|
| `ink` | `#2A1B3D` | All borders, hard shadows, primary text, mascot features |
| `pink` (accent) | `#FF3D8B` | Primary accent, FAB, Tasks tab, Task-type candy |
| `grape` | `#6A5CFF` | Secondary accent, header gradient end, Errands tab, Inbox type |
| `tangerine` | `#FF9F1C` | Today tab, Errand type |
| `mint` | `#2EE6A8` | Completed state |
| `lemon` | `#FFE45E` | Streak dots, mascot body highlight, progress bar start |
| `bgApp` | `#FFF1F7` | Screen background |
| `surface` | `#FFFFFF` | Cards, tab bar, sheet inputs |
| `muted` | `#8B7BA8` | Secondary text |
| `disabled` | `#B9AECB` | Completed task text, inactive tab labels |
| `dotIdle` | `#DCD5E8` | Inactive tab icon |
| `trackPink` | `#FFE0EE` | Progress bar track |
| `dashPink` | `#FFB3D1` | Empty-state dashed border |

Header gradient: `linear-gradient(160deg, #FF3D8B 0%, #6A5CFF 100%)`.
Progress fill gradient: `linear-gradient(90deg, #FFE45E, <accent>, #6A5CFF)` at `background-size: 200% 100%`, animated.

### Typography
Two families, both Google Fonts.
- **Display — Fredoka**, weights 400/500/600/700. Used for: screen title, streak pill, mascot line, task-less headings, tab labels, sheet title, flavour chip labels.
- **Body — Nunito**, weights 400/600/700/800. Used for: task text, meta, tags, buttons, input.

| Role | Family | Size | Weight | Notes |
|---|---|---|---|---|
| Screen title | Fredoka | 40 | 600 | line-height 1 |
| Screen subtitle | Nunito | 14 | 700 | 90% opacity on gradient |
| Streak pill | Fredoka | 15 | 600 | |
| Streak day letter | Nunito | 10 | 800 | letter-spacing 0.08em, 75% opacity |
| Mascot line | Fredoka | 19 | 600 | line-height 1.2 |
| Mascot sub | Nunito | 13 | 700 | `muted` |
| Progress caption | Nunito | 12 | 800 | uppercase, letter-spacing 0.06em, `muted` |
| Task text | Nunito | 17 | 800 | line-height 1.25 |
| Task tag | Nunito | 11 | 800 | uppercase, letter-spacing 0.08em, white on tag color |
| Task when | Nunito | 12 | 800 | `disabled` |
| Tab label | Fredoka | 13 | 600 | |
| Sheet title | Fredoka | 28 | 600 | |
| Sheet input | Nunito | 17 | 700 | |
| Sheet section label | Nunito | 12 | 800 | uppercase, letter-spacing 0.1em, `muted` |
| Flavour chip label | Fredoka | 16 | 600 | |

### Radii
`999px` pills · `44px` screen · `36px 36px 0 0` sheet · `26px` mascot card & empty state · `22px` task card · `20px` sheet input · `22px` flavour chip · `18px` tab item · `50%` circles.

### Borders & shadows
The whole system is a **sticker/arcade** look: hard 3–4px `ink` outlines with offset solid shadows, **no soft blur shadows anywhere inside the phone**.
- Task card: `3px solid #2A1B3D`, shadow `4px 4px 0 #2A1B3D`
- Mascot card: `3px solid #2A1B3D`, shadow `5px 5px 0 #2A1B3D`
- FAB: `4px solid #2A1B3D`, shadow `5px 5px 0 #2A1B3D`
- Flavour chip: `3px solid #2A1B3D`, shadow `4px 4px 0 <flavour color>`
- Sheet input: `3px solid #2A1B3D`, shadow `4px 4px 0 #FF3D8B`
- Sheet: `4px solid #2A1B3D` top border
- Tab bar: `3px solid #2A1B3D` top border
- Checked circle: `3px solid #2A1B3D` + halo `0 0 0 4px rgba(46,230,168,0.3)`

### Spacing
Screen horizontal padding 20–22px. Card padding 14–16px. Gap between task cards 12px. Gap inside a task row 14px. Header padding `20 22 14`. Content padding `18 20 24`. Tab bar padding `10 8 22` (bottom accounts for home indicator).

---

## Screen structure

One screen shell, three tabs sharing it (Today / Tasks / Errands), plus a modal sheet. Frame in the prototype is 390 × 844 (iPhone logical size).

Vertical stack:
1. **Gradient header** (fixed height by content, does not scroll)
2. **Scrolling content**: mascot card → progress bar → task list → empty state
3. **FAB**, absolutely positioned, right 20 / bottom 112 (i.e. floating above the tab bar)
4. **Tab bar** (fixed)
5. **Add sheet** (modal over everything)

### 1. Gradient header
Background: the 160° pink→grape gradient. White text.

- Left: title + subtitle, per tab:
  - Today → "Today" / "Small day. Big energy."
  - Tasks → "Tasks" / "Sweet, sweet unfinished business."
  - Errands → "Errands" / "Out-in-the-world stuff."
- Right: **streak pill** — `rgba(255,255,255,0.22)` fill, `2px solid rgba(255,255,255,0.5)`, radius 999, padding `6px 12px`; contains a 10px mint dot + "`{n}` day streak" (prototype default n = 12).
- Below, 16px down: **streak chain** — 7 equal columns, one per weekday, each a 22px circle above a day letter (M T W T F S S).
  - Completed day: `#FFE45E` fill, `2px solid rgba(255,255,255,0.9)`, plus outer glow `0 0 0 3px rgba(255,255,255,0.18)`.
  - Future/missed day: `rgba(255,255,255,0.16)` fill, `2px dashed rgba(255,255,255,0.55)`.
  - In the prototype the first 5 are filled; in production, fill days with at least one completion this week.

### 2. Mascot card
White card, ink border + 5px hard shadow, radius 26, padding `14 16`, row layout, 14px gap.

**Mascot** (62 × 62), built entirely from simple shapes — no illustration asset needed:
- Body: `border-radius: 50% 50% 46% 46%`, `linear-gradient(165deg,#FFE45E,#FF9F1C)`, `3px solid #2A1B3D`.
- Two eyes: 11px ink circles at left/right 12, top 22. Each runs a blink animation (see Interactions).
- Two cheeks: 10 × 6 pink ellipses (`#FF3D8B`, 60% opacity) at left/right 4, top 32.
- Mouth, two states:
  - Neutral: 18 × 5 ink bar, radius 4, at left 22 / top 41.
  - Happy (all tasks done): 24 × 16 ink shape, `border-radius: 0 0 14px 14px`, at left 19 / top 37.
- The whole mascot wobbles (see Interactions).

**Mascot copy** — three moods, driven by completion count of the *currently visible* list:
| Condition | Line (Fredoka 19) | Sub (Nunito 13) |
|---|---|---|
| 0 done | "I am simply sitting here." | "Tap one circle. Just one. For me." |
| some done | "Ooh, momentum." | "`{remaining}` to go and I do a little dance." |
| all done | "LOOK AT YOU GO." | "Nothing left. Go eat something." |

### 3. Progress bar ("sugar level")
- Track: height 16, radius 999, `3px solid #2A1B3D`, fill `#FFE0EE`, `overflow: hidden`.
- Fill: width = `done / total` as a %, radius 999, the 3-stop gradient at 200% width with a looping shimmer, width transition 0.45s.
- Caption row under it: left = "SUGAR LEVEL" (or "DAY CLEARED" when complete), right = "`{done} / {total}`". Both uppercase, 12px/800, `muted`.

### 4. Task card
Row, white, ink border, 4px hard shadow, radius 22, padding `14 16`, 12px gap between items.

- **Check circle** (32 × 32, tap target should be padded to ≥44px in production): `3px solid ink`; unchecked fill white, checked fill mint with the mint halo. Checkmark is a rotated L (11 × 6, 3px ink left+bottom borders, `rotate(-45deg)`), which pops in on check.
- **Middle column**: task text (strikethrough + `#B9AECB` when done), then a 6px-down meta row of a colored tag pill (TASK / ERRAND / INBOX, white on the type color) and a due label ("today", "no date", "this week") in `#B9AECB`.
- **Right candy token** (16 × 16, `2px solid ink`): a circle for Task/Inbox, a 45°-rotated rounded square for Errand. Drops to 25% opacity when done. Color = the type color.

Type → color: Task `#FF3D8B` · Errand `#FF9F1C` · Inbox `#6A5CFF` · anything completed shows mint in the circle only.

### 5. Empty state
Shown when the visible list is empty. Centered, padding `40 20`, `3px dashed #FFB3D1`, radius 26.
- Fredoka 22 `#FF3D8B`: "Nothing here. Suspicious."
- Nunito 14/700 `muted`: "Hit the big pink button and give me something to chew on."

### 6. FAB
68 × 68 pink circle, `4px solid ink`, hard shadow `5px 5px 0 ink`, white plus glyph built from two 5px-thick rounded bars (26px long). On press it translates `3px, 3px` and the shadow shrinks to `2px 2px 0` — a physical "button press". Opens the add sheet.

### 7. Tab bar
White, `3px solid ink` top border, three equal items (Today / Tasks / Errands) plus the FAB replacing the old fourth "Add" tab.
- Each item: column, 5px gap, padding `8 4`, radius 18.
- Icon is a plain shape for now: 18px circle (Today, Tasks) or 5px-radius square (Errands); white when active, `#DCD5E8` when inactive.
- Active item: filled with that tab's color (Today tangerine, Tasks pink, Errands grape), `3px solid ink`, white label. Inactive: transparent, no border, `#B9AECB` label. Transition all 0.18s.

### 8. Add sheet ("Feed me a task")
Bottom sheet over a `rgba(42,27,61,0.55)` scrim; tapping the scrim or ✕ dismisses and clears the draft.
- Sheet: `#FFF1F7`, radius `36 36 0 0`, `4px solid ink` top, padding `22 22 30`.
- Header row: "Feed me a task" (Fredoka 28) + a 38px white circular ✕ button with ink border.
- Text input, full width, placeholder "What are we chewing on?", ink border, pink hard shadow, radius 20, padding `16 18`. Should be autofocused with the keyboard up.
- Label: "PICK A FLAVOUR".
- Three flavour chips in an equal 3-column grid, 10px gap: **Task / Errand / Inbox**. Each is a white card with ink border, a colored hard shadow matching the flavour, and a 28px shape token above the label (circle / rounded square / gumdrop `50% 50% 46% 46%`).
- Tapping a flavour is what commits the task (input alone doesn't submit). If the input is empty, the tap is a no-op — consider disabling the chips visually at ~40% opacity in production.
- On commit: prepend the task, clear the draft, close the sheet, and switch to the tab the new item belongs to (Errand → Errands, otherwise Tasks).

---

## Interactions & behavior

| Interaction | Behavior |
|---|---|
| Tap check circle | Toggles `done`. Circle fills mint with halo, tick pops in (`scale 0.6 → 1.15 → 1`, 0.3s ease-out), text strikes through and greys, candy token fades to 25%. Progress bar animates over 0.45s `cubic-bezier(0.22,1.2,0.36,1)`. Mascot mood re-evaluates. Add light haptic feedback on native. |
| Tap tab | Switches the visible list; title, subtitle, progress and mascot all recompute. 0.18s transition on the tab pill. |
| Tap FAB | Opens sheet, rising from the bottom over 0.28s `cubic-bezier(0.22,1.2,0.36,1)`; scrim fades in. |
| Dismiss sheet | Tap scrim or ✕; clears the draft. Native: also allow swipe-down. |
| All tasks done | Mascot mouth switches to the happy shape and the wobble speeds from 4.5s to 0.9s. Progress caption becomes "DAY CLEARED". This is deliberately the only "reward" — no confetti, no sound. |
| Mascot idle | Continuous wobble: `rotate(-3deg) translateY(0)` → `rotate(3deg) translateY(-6px)` → back, 4.5s ease-in-out infinite (0.9s when all done). |
| Mascot blink | Eyes `scaleY(1)` until 92%, `scaleY(0.1)` at 96%, back to 1 — 5s infinite. |
| Progress shimmer | Gradient `background-position` 0% → 200%, 2.4s linear infinite. |
| Reduced motion | Respect the OS reduced-motion setting: drop wobble, blink and shimmer; keep the width and color transitions. |

## State

```
tab: 'today' | 'tasks' | 'errands'      // default 'tasks'
sheetOpen: boolean
draft: string
tasks: Array<{
  id: string
  text: string
  tag: 'Task' | 'Errand' | 'Inbox'
  when: string        // prototype uses 'today' | 'this week' | 'no date';
                      // in production derive this label from the real due date
  done: boolean
}>
streak: number        // consecutive days with ≥1 completion
weekDots: boolean[7]  // Mon–Sun, true if ≥1 completion that day
```

Derived per render: `visible` (filter by tab — Today = due today, Errands = tag 'Errand', Tasks = everything not an Errand), `doneCount`, `pct`, `allDone`, mascot mood.

Persistence: reuse whatever the current app uses. Streak and weekDots should be computed from completion timestamps, not stored as counters, so they survive edits and offline gaps.

Tweakable in the prototype (surface as settings if useful): accent color (pink / grape / tangerine / mint) and streak value.

## Assets
None. Every graphic — mascot, candy tokens, checkmark, plus glyph, tab icons — is composed from CSS shapes, so there are no image or SVG dependencies. The tab icons are deliberate placeholders: swap in the app's existing icon set (sun / checklist / briefcase, as in the current build) at 18–20px, tinted white when active and `#DCD5E8` when inactive.

Fonts: **Fredoka** and **Nunito** from Google Fonts. Bundle them for native.

## Notes on what changed from the current app
- Serif "Tasks" title → Fredoka; cream `#F5F1E8` → pink `#FFF1F7` with a gradient header.
- Amber `#C77D2A` accent → pink `#FF3D8B` primary with grape/tangerine/mint supporting.
- Flat list rows → outlined sticker cards with hard shadows.
- The fourth "Add" tab is removed; the FAB is the only add affordance.
- "New item" sheet → "Feed me a task"; the three type chips keep their names (Task / Errand / Inbox) and behavior.
- Added: mascot, streak pill + week chain, sugar-level bar, cheeky per-tab subtitles and empty state.
- Dark-mode toggle and sync icons from the original header are **not** in this design — re-add them if still needed; suggested placement is a small row of white 32px circular ghost buttons to the right of the streak pill, or move them into a settings screen.

## Files
- `screens/01-tasks-default.png` — Tasks tab, default state (mascot neutral, partial progress)
- `screens/02-tasks-all-done.png` — all complete: happy mascot, "DAY CLEARED", full bar
- `screens/03-add-sheet.png` — "Feed me a task" sheet over the scrim
- `screens/04-errands-tab.png` — Errands tab (diamond candy tokens, grape active tab)
- `Candy Todo.dc.html` — the full prototype. Direction `1a` is the design of record; `1b` and `1c` are rejected alternates in the same file.
- Open it in a browser: the `1a` phone is fully interactive (check tasks, switch tabs, add via the sheet).
