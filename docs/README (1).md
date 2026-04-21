# Handoff: CrucibleRPG Play Page

The in-session "play" screen for CrucibleRPG — a text-driven tabletop RPG web app. This is the main screen the player inhabits during a live session: a narrative stream on the left, the character sheet on the right, an always-visible action dock at the bottom, and an in-line dice-rolling challenge that resolves into the prose itself.

## About the Design Files

The HTML/CSS/JSX files in the accompanying bundle (or viewable at `ui/play_app_polish_with_dice.html` and the dice files it imports) are **design references, not production code**. They exist to pin down layout, timing, visual states, color treatment, and animation curves. Your job is to **recreate this page in the live CrucibleRPG codebase**, using its existing React (or whatever framework it uses) patterns, component conventions, state management, and routing.

Do not paste the reference HTML directly into the app. Use it as a spec: every spacing value, gradient stop, timing number, and keyframe is intentional and should be preserved — but the wiring (where state lives, how data flows in from the backend, how choices submit) should follow the codebase's existing conventions.

## Fidelity

**High-fidelity.** Colors, typography, animation curves, and timing are final. The reference already consumes the app's design tokens (`colors_and_type.css`), so the palette/typography should match pixel-perfectly. Recreate the layout, spacing, shadows, and animations as specified.

## Overall Layout

A fixed-viewport CSS grid, no page scroll:

```
┌──────────────────────────────────────────────────────────┐
│ TOPBAR  48px                                             │  ← grid row 1, spans both cols
├────────────────────────────────────────┬─────────────────┤
│                                        │                 │
│  MAIN COLUMN (narrative + dock)         │ SIDEBAR 360px   │
│  fills remaining width                  │  (fixed width)  │
│                                        │                 │
│                                        │                 │
└────────────────────────────────────────┴─────────────────┘
```

```css
.app {
  display: grid;
  grid-template-rows: 48px 1fr;
  grid-template-columns: 1fr 360px;
  height: 100vh;
  min-height: 820px;
}
```

The `min-height: 820px` is important — below this, the layout isn't meant to flex. This is a desktop-first screen.

Two floating elements sit above the grid:
- **GM FAB** (the "?" button) — fixed, `right: 384px; bottom: 180px` (clears the sidebar)
- **Tweaks panel** — fixed bottom-right, dev-only, should not ship to production

## Screens / Views

This handoff covers **one screen**: the in-session play view. There are no sub-routes here — the sidebar tabs swap the sidebar body, not the URL.

### Screen: "Play" (the only screen)

**Purpose:** Host the live session. The player reads the GM's narration, sees their character state, makes a choice, optionally triggers a dice roll, and reads the outcome — all in one continuous scroll.

---

## Components

Component-by-component spec. Follow the reference file for exact HTML structure; the notes below cover the *what* and *why*.

### 1. TopBar (`.topbar`, 48px tall)

Full-width strip pinned to the top.

**Left side:**
- `CRUCIBLE RPG` wordmark — Cinzel, gold accent on "CRUCIBLE" (17px 900), muted gold "RPG" (10px 600, tracked 0.2em)
- Vertical gold divider
- Campaign name ("The Ironroot Expanse") + session number in muted italic

**Right side:**
- **Turn counter pill** — Cinzel "TURN" label + JetBrains Mono number (e.g. `042`). Bordered navy pill.
- **Clock** — JetBrains Mono `DAY 08 · 14:22 · overcast`. Day is gold, "overcast" is italic Alegreya (weather hints use prose voice).
- **DEBUG pill** (only in dev builds; drop in prod)
- **Settings icon button** — toggles the Tweaks panel in the reference; in production, this is the actual settings/account menu.

**Warmth treatment** (the `topbarWarmth` tweak): the bottom border uses a gold-tinted dark (`#2a2418`) plus a subtle outer glow `0 8px 24px -12px rgba(201,168,76,0.08)`. Same treatment mirrors onto the sidebar tabs strip. **Keep this on by default.**

### 2. Main Column (`.main`)

The central narrative stream. Contains an atmospheric backdrop, a scroll surface, and the action dock pinned to the bottom.

**Atmospheric layers** — two absolutely-positioned pseudo-elements at `z-index: 0`:
- `::before` — a subtle radial vignette (ellipse 80% 70% at 50% 35%, `rgba(20,26,44,0.35)` center → transparent → `rgba(0,0,0,0.35)` edges)
- `::after` — a noise texture (inline SVG `feTurbulence`, `baseFrequency='0.9'`, `numOctaves='2'`, colored to `rgb(0.78, 0.75, 0.62)` @ 3.5% alpha, `mix-blend-mode: screen`, tiled at 240px)

Both toggle with 0.4s opacity transitions; keep both on by default. The sidebar gets a narrower-tuned version of the same layers.

**Scroll area** (`.scroll`):
- `padding: 36px 64px 0`
- `padding-bottom: var(--dock-h, 240px)` — this CSS var is set by JS to match the action dock's current height + 32px breathing room, recomputed on resize. Without this, the latest turn hides behind the dock.
- Custom scrollbar: 10px width, transparent track, `#1a1f32` thumb with 2px main-bg border.

**Stream** (`.stream`):
- `max-width: 720px; margin: 0 auto` — text column has a comfortable reading measure
- `display: flex; flex-direction: column; gap: 32px`

### 3. Session Recap (`.recap`)

The first thing in the stream. Small card, navy background, gold "LAST TIME" label, italic Alegreya body. One-line narrative summary from the end of the previous session. Padding `16px 20px`, rounded 4px, `var(--border-primary)` border.

### 4. Scene Header (`.scene-header`)

- Kicker: `SCENE · FOGBOUND RAILS` — Cinzel 11px, muted gold, tracked 0.25em
- Title: e.g. *"The factory bells haven't rung since the uprising"* — Cinzel 28px 700, `--text-heading`, letter-spacing 0.02em, line-height 1.25

### 5. Turn Block (`.turn`) — CORE COMPONENT

Each player action + GM response is a "turn." The narrative stream is a vertical sequence of turns.

**Structure:**
```
.turn
├── .turn__header       (TURN 042 · DAY 08 · 14:22 + gold gradient rule)
├── .narrative          (GM prose — one or more <p>)
├── .gm-aside           (optional — inline mechanical note)
├── [dice component]    (optional — either live challenge or compact chip)
├── .narrative          (optional post-roll reveal prose)
└── .consequences       (chip row — status conditions, stat changes, items)
```

**Visual treatment** (when `turnContainers` tweak is on — keep on by default):
- `padding: 24px 20px 24px 28px`
- Faint vertical gold line on the left edge (`border-left: 1px solid rgba(201,168,76,0.06)` plus a centered `::after` pseudo-element with a gold gradient that fades at top and bottom)
- Very faint warm container tint: `background: linear-gradient(180deg, rgba(255,245,220,0.012), rgba(255,245,220,0.006))` — almost invisible but gives containers identity
- Between turns: a horizontal gold-gradient hairline rule (`::before` on turn+turn, 12% from each side, gradient `transparent → 0.18 → 0.28 → 0.18 → transparent`)

**Turn header:**
- `TURN 042` — Cinzel 11px 700, gold, tracked 0.28em
- `DAY 08 · 14:22` — JetBrains Mono 10px, dim gray, tracked 0.1em
- Gradient rule filling remaining width (gold → transparent)

**Narrative paragraphs:**
- Font: Alegreya 18px regular, `--text-narrative` (cream/off-white), line-height 1.85
- NPC speech or attribution: `<span class="npc">"..."</span>` — gold italic
- Paragraph gap: `var(--para-gap, 18px)` — exposed as a tweak (12-24px range). 18px is right.

**GM aside** (inline):
- Navy card, gold accent left border (`2px solid rgba(201,168,76,0.35)`)
- "GM ASIDE" label (Cinzel 10px gold) with info-circle icon
- Body in italic Alegreya 14px
- Used for out-of-prose mechanical notes ("Your reputation with the Wardens has dropped to **Suspicious**")

**Consequences row** (`.consequences`):
- A small chip strip after the turn resolves
- `THIS TURN` label (Cinzel 10px gold-muted, tracked 0.14em)
- Chips in four variants — each has a tinted background, matching border, matching text:
  | Class | Use | Color family |
  |---|---|---|
  | `.chip--cond` | New condition gained (e.g. "+ Wary") | warm danger (brown/orange) |
  | `.chip--stat` | Stat change (e.g. "WIS −1") | red |
  | `.chip--good` | Positive outcome (e.g. "✓ Insight") | green (`--color-success`) |
  | `.chip--item` | Item acquired (e.g. "+ Warden seal") | gold |

**New-turn entrance animation** (keep on):
```css
@keyframes turn-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.app[data-turn-entrance="on"] .turn.turn--new {
  animation: turn-in 380ms var(--ease-standard) both;
}
```
When a new turn mounts, add the `.turn--new` class; remove it from previous turns at the same time.

### 6. Dice Roller (inline in the turn) — LIVE ROLL + COMPACT CHIP

The headline feature. A tappable d20 challenge that replaces the current static `.resolution` line with a live, animated throw that collapses into a compact historical chip.

**Two-phase roll with three "Fortune's Balance" modes:**

| Mode | When (stat vs tier) | Dice rolled | Kept |
|---|---|---|---|
| **Matched** | stat = tier | 1 (crucible only) | crucible |
| **Outmatched** | stat < tier | crucible + 2 mortals | highest mortal |
| **Dominant** | stat > tier | crucible + 2 mortals | lowest mortal |

**Phase 1 — Crucible d20:** throws, tumbles, lands. If it's a `20` (CRUCIBLE FAVORS) or `1` (CRUCIBLE TURNS), the roll stops there — those are "extreme" results. Matched mode also stops after phase 1.

**Phase 2 — Mortal dice** (only on non-extreme Outmatched/Dominant): the crucible fades and blurs out, two mortal dice drop in from above with overshoot, tumble, land. The kept die gets a gold glow; the discarded die tarnishes (desaturated + darkened).

**Total:** `statValue + skillValue + kept`

**Timing table** (from tap, all in ms):

Extreme or matched (stops at phase 1):
```
   0 → p1-throw
 180 → p1-tumble
 730 → p1-land
1150 → p1-settled
2100 → stage "collapsing"
2650 → stage "compact"  (fires onResolved callback)
```

Non-extreme outmatched/dominant:
```
   0 → p1-throw
 180 → p1-tumble
 730 → p1-land
1150 → p1-settled
1650 → p1-exit
2200 → p2-drop
2680 → p2-tumble
3180 → p2-land
3600 → p2-settled
4600 → stage "collapsing"
5150 → stage "compact"  (fires onResolved callback)
```

**Key components** (see `dice.jsx` for the reference impl):

- `Die` — single die. Top-down hexagonal face with interior triangle facets, rendered as pure SVG (viewBox `0 0 100 100`, center at `(50,50)`, hex radius `48`). Face number is Cinzel 700 38px, painted with a dark stroke. Six hex vertices at angles `(π/3)·i − π/2`. Edge highlight polyline on upper-left hex edges (indices 4→5→0→1) suggests overhead lighting.
  
  Props: `n` (face value), `size` (px, default 80), `state` (one of `ready` / `throw` / `tumble` / `land` / `kept` / `discarded` / `crit` / `fumble` / `drop-in` / `crucible-exit`), `onClick`.

- `Tray` — flex-row container that orchestrates which dice render in which phase (`gap: 18px`, `padding: 32px 24px 38px`, align-items flex-end). Crucible is larger (88px), mortals are 72px. Props: `mode`, `crucible`, `mortal1`, `mortal2`, `phase`, `onTap`.

- `TurnRoll` — top-level. Renders the challenge panel + Tray. Drives the phase state machine over wall-clock time. At the end, collapses and switches to rendering `CompactChip`. Props: `challenge: {stat, statValue, skill, skillValue, mode, prompt, actionLabel}`, `onResolved: (result) => void`.

- `CompactChip` — the historical inline result. Thin gold-bordered card: kept die(s) on left, JetBrains Mono meta on the right (`WIS 13.4 · Insight +2.0 · kept 14 · Total 29.4 · Tier 2`).

**Critical: do NOT remount `TurnRoll` between rolling and compact stages.** The collapse animation plays on an element that then gets replaced — if the component is re-keyed on result change, the Tray unmounts mid-collapse and the chip never appears. The reference uses a `rollEpoch` counter so resets explicitly bump the key, but normal resolution never remounts. Mirror this pattern: only remount on explicit user reset or when the challenge itself changes (different stat/skill/mode).

**Crucible challenge panel** (the full live state):
- Gold-bordered rectangle, `border-radius: 8px`, `padding: 28px 24px 24px`
- Background: `linear-gradient(180deg, #0e1425 0%, #0a0e1a 100%)`
- Shadows: `inset 0 1px 0 rgba(201,168,76,0.15), 0 0 60px rgba(201,168,76,0.08)`
- Entry animation: 500ms fade-up from `translateY(14px)`
- Content stack: kicker ("A ROLL IS REQUIRED") → italic prose prompt → action label ("READ HER INTENT") → meta pill (stat · skill · mode) → `Tray` → tap hint (2.4s pulse)

**Collapse keyframe:**
```css
@keyframes challenge-collapse {
  0%   { transform: scale(1) translateY(0); opacity: 1; }
  100% { transform: scale(0.35) translateY(-30px); opacity: 0;
         height: 0; padding: 0; margin: -30px 0 0; border-width: 0; }
}
/* 550ms cubic-bezier(0.4, 0, 0.2, 1) */
```
The negative top margin at the end vacuums the panel up into the prose that follows.

**Compact chip animation in:**
```css
@keyframes chip-in {
  0%   { opacity: 0; transform: translateY(-10px) scale(0.96); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
/* 600ms cubic-bezier(0.34, 1.56, 0.64, 1) — overshoot */
```

**Post-roll staggered reveal:** after the chip appears, the post-roll narrative + consequences fade up in sequence:
```css
.post-roll > * { animation: fade-up 0.5s var(--ease-standard) both; }
.post-roll > *:nth-child(1) { animation-delay: 0.15s; }
.post-roll > *:nth-child(2) { animation-delay: 0.30s; }
.post-roll > *:nth-child(3) { animation-delay: 0.45s; }
```

**Where the random number lives:** in production, the backend should resolve the roll at tap time (anti-cheat) and return the full result to the client. The client then just animates toward a predetermined outcome. The timing is independent of who rolls the number.

**Gradient defs:** all die fill gradients are defined in SVG `<defs>` — see `dice-svg-defs.html` in the reference bundle. Inline these at the app root (or in a hidden helper component) so every `fill: url(#dgrad)` reference resolves.

### 7. Action Dock (`.dock-wrap`) — "THE DECISION ZONE"

Sticky-bottom panel, always visible. Contains the choices and composer.

**Structure:**
- `.fade-mask` — 48px gradient from transparent to `var(--bg-main)` above the dock, so the scrolling narrative dissolves into the dock rather than being visually clipped
- `.dock` — the dock surface itself

**Dock treatment** (when `actionDock` is on — keep on):
- Background: `#0c1220` (subtly lighter than main bg)
- Shadows: `0 -1px 0 rgba(201,168,76,0.15), 0 -1px 40px -8px rgba(201,168,76,0.08), inset 0 1px 0 rgba(201,168,76,0.04)`
- A gold gradient hairline `::before` across the top (12% insets, `transparent → 0.35 → 0.5 → 0.35 → transparent`)

**Inner layout** (`max-width: 720px; margin: 0 auto` — matches stream width):
- **Label row** — "YOUR MOVE" centered Cinzel, gold, tracked 0.28em, with gradient rules on both sides
- **Choices grid** — `display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px` — three options. Each button (`.choice`) has a keystroke label (`A` / `B` / `C` in Cinzel gold), a one-line description, and a small meta line (`WIS · social`, `CHA · risky`, `DEX · stealth`) in JetBrains Mono 10px. Hover: `transform: translateY(-1px)`, border lifts to `--border-card-hover`.
- **Composer row** — a text input with "OR" label + a gold GO button

**Composer:**
- Wrap is a dark rounded rect. Focus-within: gold border + `var(--glow-focus)` shadow.
- "OR" label in Cinzel muted gold
- `<input>` is Alegreya Sans 15px with italic muted placeholder
- **GO button** — gold gradient, Cinzel 13px 700 tracked 0.15em, `padding: 0 28px`. Keep the **shimmer** animation (`shimmerGo` tweak on by default): a 3.4s infinite shimmer across the gradient + an over-the-top diagonal sheen (`::after` pseudo) that sweeps across on a 3.4s cycle.

### 8. Sidebar (`.sidebar`, 360px)

Fixed-width right column. Has its own tuned vignette + noise, plus an optional inset shadow on the left edge (`inset 8px 0 16px -8px rgba(0,0,0,0.55)` — keep on).

**Tabs strip** (at the top of the sidebar, mirrors topbar warmth):
- Six icon-only tabs: Character, Inventory, NPCs, Glossary, Map, Notes
- Active tab: gold bottom border, gold-tinted icon stroke
- Inactive icons use `#7082a4` stroke
- Tabs can show a badge (`.tab__badge` — red circle, JetBrains Mono white number)

**Tab bodies** (`.sidebar__body`, padding `24px 22px 28px`, gap 24px, scroll-y):

Each tab has its own body block; only the active one is visible (use `[hidden]`).

**Character tab:**
- Portrait card: 52px circle portrait (Cinzel initials in muted gold, subtle gold double-ring shadow) next to name (Cinzel 15px gold-cream tracked 0.06em), subtitle (italic Alegreya 12px brown-muted), and a "tier" pill ("HARSH · lvl 4", JetBrains Mono 10px bordered pill)
- **Attributes section** — Cinzel "ATTRIBUTES" label + gold fading rule + count. Each stat row: name (left), value with max in parens (`9.2 (12)`, JetBrains Mono), then a 4px progress bar beneath. Low stats flag with `.low` modifier (red text + orange bar gradient). Active roll stat gets a gold-lit bar.
- **Conditions section** — warm-tinted cards with orange left accent. Name (bold red), effect (mono muted), italic note.
- **Directives section** — dashed-line separated items. Gold bullet (`◆`), bold name, italic sub-line below.

**Inventory tab:**
- Carrying list — navy rows, name on left, meta on right (`+1 close · 1 wt`). "Key" items get a gold-tinted variant border + gold name.
- Encumbrance bar below with `hint` (italic brown, "Past 8 you take −1 to DEX rolls.")

**NPCs tab:**
- "NEARBY" section — cards for present NPCs with name, tag row (mono gold-muted: `unknown · wary of you`), italic note
- "KNOWN TO YOU" section — same format. Dead NPCs show `† dead` in red italic.

**Glossary tab:**
- "SEEN THIS SESSION" — list of terms used in recent narration. Term: Cinzel gold tracked 0.1em. Definition: Alegreya, `--text-secondary`. Dashed underlines between.

**Map tab:**
- A sketchy hand-drawn SVG — dashed rail lines, bordered foundry rectangle, your position as a gold circle with pulsing halo, italic location labels (`chapel †`, `→ ashen quarter`). `.hint` footer: "Sketch only. Full map unlocks at session end."

**Notes tab:**
- Player's own session notes — timestamp + italic body. "+ ADD NOTE" dashed-border button at the bottom.

**Section headers** (shared across tabs): Cinzel "ATTRIBUTES" label, gold fading rule, JetBrains Mono count. Consistent rhythm anchors all tabs.

### 9. Talk to GM FAB + Panel

A floating gold action button, fixed position (`right: 384px; bottom: 180px` — clears the sidebar and sits comfortably above the dock).

**FAB** (`.gm-fab`, 48px circle):
- Gold gradient background, dark "?" glyph in Cinzel 20px
- **Breathing halo** (keep on): two expanding box-shadow rings on `::before` and `::after`, 4.2s and 6.2s cycles, out of phase. Gives the FAB subtle living presence without being distracting.

```css
@keyframes breathe {
  0%   { box-shadow: 0 0 0 0   rgba(201,168,76,0.45); }
  50%  { box-shadow: 0 0 0 14px rgba(201,168,76,0); }
  100% { box-shadow: 0 0 0 0   rgba(201,168,76,0); }
}
```

**Panel** (opens on FAB click, fixed at `right: 384px; bottom: 240px`, 320px wide):
- Navy card, `border-radius: 10px`
- Entry: `opacity 0 + translateY(8px) scale(0.98) → final`, 320ms
- Head: gold help icon + "TALK TO THE GM" (Cinzel 12px 700 tracked 0.18em)
- Body: italic Alegreya, explaining this is out-of-character
- Suggested prompts (clickable, fill the textarea): each a small navy button
- Bottom: textarea + "ASK" gold button (Cinzel 10px 700 tracked 0.18em)
- Closes on outside click

## Interactions & Behavior

### Global interactions
- **Sidebar tabs** — clicking a tab swaps which `.sidebar__body` is `[hidden]`, repaints the active-tab underline, and recolors the active icon to gold. No URL change.
- **Settings icon (topbar)** — in production, opens the account/settings menu. (In reference, it toggles the dev Tweaks panel.)
- **GM FAB** — toggles the GM panel. Panel closes on outside click or when focus moves.
- **Scroll behavior** — `scroll-behavior: smooth`. On new turn append, scroll to bottom with smooth behavior. `--dock-h` CSS var is kept in sync with the dock's measured height via `ResizeObserver` so the latest turn is never hidden behind the dock.

### Turn resolution flow
1. A new turn mounts (with `.turn--new` class) showing the GM's narration and possibly a GM aside.
2. If the turn requires a roll, mount the live `<TurnRoll>` inside the turn block.
3. Player taps the crucible die. The roll animates through phases per the timing table.
4. `onResolved(result)` fires. The parent component stashes `result`, which triggers the post-roll prose + consequences to render below the (now collapsing) challenge.
5. The challenge collapses into the compact chip (same React tree, just different render output — do not remount).
6. The player can now make their next choice from the dock. A new `.turn` block mounts, the previous loses `.turn--new`.

### Choice submission (dock)
- Clicking a choice, or typing in the composer and pressing GO/Enter, submits the action to the backend.
- While the backend is thinking, show a subtle loading state (the GO shimmer already suggests motion; you could intensify it or swap in a different affordance).
- On response, a new turn block mounts at the bottom with the new narration.

### Keyboard
- `A` / `B` / `C` should trigger the respective choice button (shown via Cinzel keystroke labels on each button).
- `Enter` in the composer submits.
- `Esc` closes the GM panel.

### Dice keyboard (optional, but nice)
- `Space` or `Enter` with focus on the live crucible triggers the throw.

## State Management

Minimal, all per-session:

```ts
type Choice = { key: 'A'|'B'|'C'|'custom'; label: string; stat?: string; flavor?: string };

type Challenge = {
  stat: string;        // "WIS"
  statValue: number;   // 13
  skill?: string;      // "Insight"
  skillValue?: number; // 2
  mode: 'matched' | 'outmatched' | 'dominant';
  prompt: string;      // italic narrative prompt
  actionLabel: string; // "READ HER INTENT"
};

type RollResult = {
  kept: number;
  total: number;
  crucible: number;
  mortal1: number | null;
  mortal2: number | null;
  winner?: 1 | 2;
  isCrit: boolean;
  isFumble: boolean;
  mode: string;
};

type TurnStatus =
  | { kind: 'narrative-only'; narration: string; gmAside?: string; consequences?: Chip[] }
  | { kind: 'pre-roll'; narration: string; challenge: Challenge; gmAside?: string }
  | { kind: 'resolved'; narration: string; challenge: Challenge; result: RollResult;
      postRoll: string; consequences: Chip[]; gmAside?: string };

type SessionState = {
  sessionId: string;
  campaignName: string;
  sessionNumber: number;
  recap: string;
  scene: { kicker: string; title: string };
  character: CharacterSheet;  // sidebar data
  turns: TurnStatus[];        // oldest → newest
  currentTurn: TurnStatus;    // same as turns[turns.length - 1]
  choices: Choice[];          // what the dock offers right now
  clock: { day: number; time: string; weather: string };
};
```

The rule of thumb: **resolve the roll server-side at tap time**, return the `RollResult`, and animate toward it client-side. The client never picks the numbers.

## Design Tokens

All values come from the existing `colors_and_type.css` in the codebase. Key subset used on this screen:

### Colors
| Token | Use |
|---|---|
| `--accent-gold` (#c9a84c) | Primary gold accent; crucible border; turn headers; active tab |
| `--gold-muted` | Secondary gold; labels; muted tracked text |
| `--bg-main` (#0a0e1a) | App background |
| `--bg-card` | Topbar, asides, navy cards |
| `--bg-panel` | Sidebar background |
| `--bg-resolution` | Compact chip background |
| `--bg-gold-subtle` | Hover tint on gold elements |
| `--border-primary` | Navy hairlines |
| `--border-card` / `--border-card-hover` | Gold-tinted dark card borders |
| `--border-light` | Structural dividers (main/sidebar) |
| `--text-heading` | Cinzel cream for headings |
| `--text-primary` | Body off-white |
| `--text-narrative` | Narration (slightly warmer cream) |
| `--text-secondary` / `--text-secondary-bright` | Mono meta, recap text |
| `--text-muted` / `--text-dim` | De-emphasized text, clock separators |
| `--text-stat-bright` | Bold stat values in mono |
| `--brown-muted` | Italic flavor text (sub-lines, hints, notes) |
| `--color-success` / `--color-danger` | Good / bad chip variants |
| `--dice-success` / `--dice-failure` | Roll total text colors |
| `#e8c870` | Brighter gold for kept-die numbers, crit text |
| `#fff5d4` | Crit face number (nearly white) |
| `#ffd0c4` | Fumble face number (pale red) |
| `#7a7060` | Discarded die number |

### Typography
| Token | Use |
|---|---|
| `--font-cinzel` | All UPPERCASE tracked labels, die face numbers, headings |
| `--font-alegreya` (italic) | Narrative prose, prompts, flavor |
| `--font-alegreya-sans` | UI copy, buttons, choice labels |
| `--font-jetbrains` | Numeric meta, clock, stat values, chip text |

### Easing
```css
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1);  /* overshoot */
```

### Shadows
- `--glow-focus` — composer focus ring (gold glow)
- `--shadow-cta-hover` — GO button lift

### Spacing
- Reading column: `max-width: 720px`
- Scroll padding: `36px 64px`
- Turn block padding: `24px 20px 24px 28px`
- Between turns: `gap: 32px` on `.stream`, plus a 4px additional margin and the `::before` rule

## Assets

**None external.** All visuals are CSS + SVG — no image files. Fonts are from the existing stack:
- Cinzel
- Alegreya
- Alegreya Sans
- JetBrains Mono

The atmospheric noise texture is an inline SVG data-URI (`feTurbulence`), not an image file. Same for the map sketch and die faces.

## Files in the reference bundle

| File | Role |
|---|---|
| `ui/play_app_polish_with_dice.html` | **The canonical reference.** Complete page with every polish pass applied and the live dice integrated. Open in a browser to see all interactions. |
| `ui/dice.jsx` | `Die` + `Tray` React components for the dice system. |
| `ui/dice.css` | All dice visual states, keyframes, and tray layout. |
| `ui/dice-svg-defs.html` | The SVG `<defs>` block with all gradients used by dice fills. Inline at the app root. |
| `ui/dice_roller.html` | Design-canvas showing every dice state side-by-side (idle, throw sequence, all modes, crit, fumble, compact chip, size scale). Use for pixel-level visual reference. |
| `colors_and_type.css` | Design tokens. Should already exist in the codebase — the reference consumes the same file. |

## Acceptance checklist

- [ ] Grid layout: topbar (48px), main column, sidebar (360px); no page scroll; min-height 820px enforced
- [ ] Atmospheric vignette + noise render in both main and sidebar
- [ ] Turn blocks have gold left-edge treatment, faint warm tint, and horizontal gold rule between them
- [ ] New-turn entrance animation plays on the latest turn
- [ ] Live crucible roll mounts inside the active turn block
- [ ] Crucible tap triggers the full phase-1 → phase-2 sequence per the timing table
- [ ] NAT 20 (gold flash + "CRUCIBLE FAVORS YOU") and NAT 1 (red shake + "CRUCIBLE TURNS") stop at phase 1
- [ ] Matched mode stops at phase 1 without extreme effects
- [ ] Outmatched/Dominant with non-extreme crucible: crucible fades out, mortals drop in, winner glows gold, loser tarnishes
- [ ] Challenge panel collapses smoothly into the compact chip (no remount flicker)
- [ ] Post-roll narrative and consequences fade up in staggered sequence after the chip appears
- [ ] Historical turns render with compact chips directly, no animation
- [ ] Action dock stays pinned at the bottom with the gold hairline top + fade mask above; `--dock-h` keeps the scroll area sized correctly
- [ ] GO button shimmer runs on loop; composer has a gold focus glow
- [ ] Sidebar tabs swap bodies on click; active tab gets gold underline + gold icon stroke
- [ ] Character tab shows portrait card, attributes with bars, conditions with warm accent, directives with gold bullets
- [ ] All six sidebar tabs (Character, Inventory, NPCs, Glossary, Map, Notes) render their content
- [ ] GM FAB shows the breathing halo; clicking opens the GM panel; outside click closes
- [ ] Topbar warmth (gold underglow) is on; turn counter pill displays current turn number
- [ ] All typography (Cinzel / Alegreya / Alegreya Sans / JetBrains Mono) loads and renders correctly
- [ ] All design tokens resolve (no undefined CSS variables)

## Notes for the implementer

- The polish treatments in this design (vignette, noise, turn containers, warm tints, gold rules, breathing halo, shimmer, etc.) are each individually **subtle**. They compound: removing any one loses a little; removing all of them leaves a cold generic dark-mode UI. Implement them all.
- The reference file exposes each treatment as a data-attribute toggle (`data-vignette="on"` etc.) so individual passes can be compared. You do **not** need to ship these toggles — they're a dev aid. In production, the "on" state is the default state.
- The Tweaks panel in the reference is dev-only. Do not ship it.
- The "DEBUG" pill in the topbar is dev-only. Do not ship it.
- Recap text, directives, notes, and NPC notes are all italic Alegreya. The narration is upright Alegreya. Keep this distinction — italic is the "player-facing-but-out-of-prose" voice; upright is "in the world."
- Every UPPERCASE tracked label uses Cinzel with intentional letter-spacing (varies 0.08em – 0.3em by size). Don't normalize these; they carry the aesthetic.
