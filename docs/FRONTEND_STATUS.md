# CrucibleRPG Frontend — Status Tracker

**Last Updated:** 2026-03-29

> **For Claude Code:** Read this file at the start of every new conversation before responding. After completing any frontend task, update this file with changes to page status, new site-wide rules, copy audit status, bug fixes, or deferred items. When fixing a bug, update its status to "Fixed" and fill in the "Fixed in" column. When discovering a new bug during implementation, add it to the Known Bugs table with the next available FE- number. Keep the "Last Updated" line current.

---

## Page Status

| Page | Route | Status | API Wired | Blocking Issues |
|------|-------|--------|-----------|-----------------|
| Coming Soon | `/` | Complete | Waitlist + auth-check | None |
| Landing | `/landing` | Complete | None (static) | None |
| Auth | `/auth` | Complete | Google Sign-In | None |
| Main Menu | `/menu` | Complete | Partial (mock saves) | Game creation not wired (navigates to /init without gameId) |
| Init Wizard | `/init` | Complete (reworked) | All 10 endpoints wired | Gracefully skips API when no gameId |
| Loading Screen | `/loading` | Complete | None | None |
| Saved Games | `/saved-games` | Complete | None (mock data) | Needs API wiring for real saves |
| Pricing | `/pricing` | Complete | None (static) | Dollar amounts TBD |
| Game Layout | `/play` | Rewrite Phase 4 | All gameplay + talk-to-gm + notes CRUD | Polish pass pending |
| FAQ | `/faq` | Not built | N/A | Page does not exist yet |
| Rulebook | `/rulebook` | Complete | None (static) | None |
| Legal (ToS) | TBD | Not built | N/A | Needs starter draft |
| Legal (Privacy) | TBD | Not built | N/A | Needs starter draft |

**Status definitions:**
- **Complete:** Page renders, styled per design system, all mock/live data displays correctly.
- **API Wired:** Frontend makes real API calls. "Partial" = some endpoints wired, some mock.

---

## Recent Work (This Session: 2026-03-29)

### Mobile Responsiveness Pass — Marketing & Pre-Game Pages
- **Scope:** All pages except `/play` (game layout). Covers: Landing, Coming Soon (`/`), Auth, Main Menu, Init Wizard, Pricing, Rulebook, Saved Games.
- **Design system update:** Added "Responsive / Mobile" section to `docs/design-system.md` with breakpoints (Desktop 1024+, Tablet 768-1023, Mobile <768), universal mobile rules, and tablet adjustments. This is the permanent reference for all future responsive work.
- **Breakpoint strategy:** CSS media queries at `max-width: 767px` (mobile) and `max-width: 1023px` (tablet) added to each page's CSS module. Desktop styles remain the default. Overrides use `!important` where inline styles need mobile adjustments.
- **Universal fixes across all pages:**
  - `overflow-x: hidden` on page containers to prevent horizontal scroll from decorative elements (radial glows, absolute-positioned circles).
  - Particle fields hidden on mobile (performance + clutter reduction).
  - All interactive elements (buttons, links, toggles) ensured minimum 44px tap target height.
  - Container padding minimum 20px horizontal on mobile.
- **Page-specific changes:**
  - **Landing:** Nav section links (Features, How It Works, FAQ) hidden on mobile; wordmark + Sign In remain. Section padding reduced from 100px to 60px. Feature cards forced to single-column grid. How It Works step circles reduced from 56px to 44px with adjusted vertical line position. Footer links given 44px tap target padding.
  - **Coming Soon:** Signup row stacks vertically on mobile. Email input and waitlist button go full-width. Decorative glow reduced.
  - **Auth:** Form card padding reduced on mobile. Password toggle and text links given 44px tap targets.
  - **Main Menu:** Content wrapper padding reduced to 20px. Continue card padding reduced. Settings/Logout links given 44px tap targets.
  - **Init Wizard:** All 2-column grids (era selection, custom/worlds, archetypes) collapse to single-column. Bottom nav padding reduced. Back/Continue buttons given 44px tap targets. Selection cards and stat step buttons given mobile tap targets.
  - **Pricing:** Price cards gain `max-width: 100%` so they go full-width on mobile (300px fixed → full-width, capped at 400px). Top-up cards stack single-column.
  - **Rulebook:** TOC sidebar collapses above content on mobile (from fixed 260px sidebar to full-width scrollable section). Content area switches from fixed-height scrollable to natural flow. Nav links hidden except Sign In. Injected content styles adjusted (list indent, callout padding).
  - **Saved Games:** Save card padding reduced. All action buttons (Load, Delete, Back) given 44px tap targets.
- **What was NOT changed:** No hamburger menus added (TODO comments left in Landing and Rulebook CSS for future implementation). No redesigns — desktop layout, colors, fonts, content unchanged. No changes to `/play`. No API calls, state management, or component logic modified. CSS-only changes with minimal JSX additions (classNames on containers).
- **Viewport meta tag:** Confirmed Next.js App Router auto-injects the standard viewport meta tag — no manual addition needed.
- **Files changed:** `docs/design-system.md`, `app/landing/page.js` + `.module.css`, `app/page.module.css`, `app/auth/page.js` + `.module.css`, `app/menu/page.js` + `.module.css`, `app/init/page.js` + `.module.css`, `app/pricing/page.js` + `.module.css`, `app/rulebook/page.js` + `.module.css`, `app/saved-games/page.js` + `.module.css`.

## Previous Session Work (2026-03-26)

### Scroll Fade Indicator on Init Wizard and Landing Page
- **Feature:** A subtle gradient fade at the bottom edge of the viewport signals "there's more content below" without any visible UI element. The gradient is 60px tall, fades from transparent to the page background color (`#0a0e1a`), and disappears smoothly when the user scrolls to the bottom.
- **Init wizard:** Gradient sits just above the sticky bottom nav bar. A ref measures the nav's height dynamically so the gradient is always positioned correctly, even if the nav wraps on narrow screens. Re-evaluates on every phase change (some phases are short enough to fit without scrolling). The nav gets `z-index: 6` to stay above the gradient (`z-index: 5`).
- **Landing page:** Gradient is fixed at the bottom of the viewport on initial load (hero section fills the screen). Disappears when the user scrolls to the bottom, reappears if they scroll back up.
- **Behavior:** Uses `pointer-events: none` so it never blocks clicks. Checks on mount, scroll, and resize. If content fits entirely in the viewport, the gradient doesn't show. Opacity transition over 300ms, with `prefers-reduced-motion` respected (instant toggle, no transition).
- **Files:** `app/landing/page.js` (ScrollFade component), `app/landing/page.module.css` (`.scrollFade`), `app/init/page.js` (scroll fade state + effect with `bottomNavRef`), `app/init/page.module.css` (`.scrollFade`).

### Fix: Status Badge [object Object] in Narrative Panel
- **Bug:** When the backend sends inventory changes as objects (e.g., `{ name: "Crystal Shard", slotCost: 0.5, ... }`) instead of plain strings, the status badges at the bottom of a turn rendered `+[object Object]` instead of `+Crystal Shard`.
- **Root cause:** `StatusBadges` used `item.name || item` to extract display names. If `item` is an object with a falsy or missing `name`, the `||` fallback returned the raw object, which coerces to `[object Object]` in string context.
- **Fix:** All six badge paths (conditions added/removed/modified, inventory added/removed/modified) now use `typeof item === 'string' ? item : (item.name || 'Unknown item')`. This handles both string entries and object entries safely, with a visible fallback instead of `[object Object]`.
- **Files:** `TurnBlock.js` (StatusBadges function).

### Fix: EntityPopup Item Stats Not Showing
- **Bug:** PROPERTIES section never rendered for inventory items despite API sending `equipmentCategory` and mechanical fields.
- **Root cause (InventoryTab):** The click handler manually copied specific field names from the item object. Instead of passing the full item data through, it created a new object with explicit keys — any field name mismatch or omission silently dropped the data. Changed to spread the entire item object (`{ ...item, term: item.name, type: 'item' }`), so ALL API fields (current and future) flow through automatically.
- **Additional fix (EntityPopup):** Category matching (`cat === 'weapon'`) was case-sensitive — made it case-insensitive via `.toLowerCase()`. Also fixed `quality` vs `qualityBonus` field name mismatch: the `/character` endpoint sends `qualityBonus` but the PROPERTIES code read `entity.quality`. Now checks both (`entity.quality ?? entity.qualityBonus`).
- **Files:** `InventoryTab.js` (spread item in onEntityClick), `EntityPopup.js` (case-insensitive category, quality/qualityBonus fallback).

## Previous Session Work (2026-03-25)

### EntityPopup: Mechanical Item Properties Display
- **Feature:** When a player clicks an inventory item, the EntityPopup now shows a "PROPERTIES" section with the item's mechanical stats between the durability bar and player notes.
- **Data flow:** InventoryTab's `onEntityClick` now passes mechanical fields from the item object (`equipmentCategory`, `damageModifier`, `armorMitigation`, `armorType`, `channelModifier`, `quality`, `tags`, `elementTag`) through to the EntityPopup.
- **Display by category:** Weapons show Damage/Quality Bonus/Tags/Element. Armor shows Mitigation/Type/Quality Bonus. Implements show Channel/Quality Bonus/Element. Shields show Defense (+1.0 fixed)/Quality Bonus. General items with no `equipmentCategory` show no PROPERTIES section.
- **Styling:** "PROPERTIES" label in Cinzel 11px 600wt muted, property labels in Alegreya Sans secondary, numeric values in JetBrains Mono with gold for positive and danger-orange for negative, element names in gold bold. Subtle top border separates from definition text.
- **Graceful fallback:** If the backend hasn't deployed expanded item fields yet, `equipmentCategory` will be undefined and the section won't render. No errors, no empty sections.
- **Files:** `EntityPopup.js` (PROPERTIES section with category-based rendering), `EntityPopup.module.css` (`.propertiesSection`, `.propertiesLabel`, `.propertyRow`, `.propertyName`, `.propertyValue`, `.propertyText`, `.propertyElement`), `InventoryTab.js` (passes mechanical fields through `onEntityClick`).

## Previous Session Work (2026-03-23)

### Cache Scenarios by Intensity Level
- **Problem:** Switching scenario intensity fired a new `POST /api/init/:gameId/generate-scenarios` every time, even for intensities the player already viewed. Each switch cost ~$0.01 and 15-30s, and returned different scenarios for the same intensity.
- **Fix:** Replaced `generatedScenarios` + `scenariosFetchedIntensity` state with a `scenarioCache` object keyed by intensity. On intensity change, displays cached scenarios immediately if available; only fetches when the cache entry is empty. Navigating back from the scenario phase clears the entire cache (character/world may have changed). Failed fetches don't write a cache entry, so the player can retry.
- **Files:** `app/init/page.js` (`scenarioCache` state replaces `generatedScenarios`/`scenariosFetchedIntensity`; `fetchScenarios` writes to cache; useEffect checks cache before fetching; back button clears cache on phase 5; Phase6 reads from `scenarioCache[intensity]`).

## Previous Session Work (2026-03-22)

### World Briefing Display (Prologue above Turn 1)
- **Feature:** Displays `gameState.worldBriefing` as the first block in the narrative panel, above the session recap and Turn 1. Renders as a subtle prologue — italic Alegreya text in `--text-secondary` color, no card border, with a small "PROLOGUE" label in dim uppercase Cinzel. Scrolling past it into Turn 1 is seamless.
- **Graceful fallback:** If `worldBriefing` is null or absent (backend hasn't deployed yet), nothing renders — no placeholder or reserved space.
- **Files:** `page.js` (passes `worldBriefing` prop from `gameState`), `NarrativePanel.js` (accepts `worldBriefing` prop, renders above session recap), `NarrativePanel.module.css` (`.worldBriefing`, `.briefingLabel`, `.briefingText` styles).

### Debug Panel Redesign — Two-View Layout (Designer + Developer)
- **Layout restructure:** Panel now has three fixed regions above the scrollable content: header bar (unchanged), sticky cost bar (new), and view toggle tabs (new). Scrollable content area renders either Designer or Developer view.
- **Sticky Cost Bar:** Always visible at top of panel. Shows `Game Total: $X.XXXX` (from `_debug.gameTotalCost`, shows "—" if not yet available from AD-366) and `Last Turn: $X.XXXX` (from most recent POST /action entry's `_debug.turnCost`, falls back to `_debug.ai.estimatedCost`). When `_debug.turnCostBreakdown` is available, shows per-task breakdown in parentheses with middot separators.
- **Designer View (default):** Filters to turn-advancing entries only (POST /action, POST /talk-to-gm). Each turn is a card with summary line: `Turn N: "action" — Outcome (Tier) — STAT — $cost — Xs`. Expanded cards show 5 sections (only when data present): **Resolution** (formatted math line + FB/margin/tier, not k-v grid), **State Changes** (emoji-prefixed, grouped by category: conditions ⚠/✅, inventory 📦, clock 🕐, NPCs 👤, locations 📍, skills ⚔), **NPCs Active** (from context.npcs, handles both string and object formats with disposition), **Context Budget** (one-line L1-L4 token counts), **AI Calls** (per-task breakdown from turnCostBreakdown when available, single-call fallback to _debug.ai).
- **Developer View:** Existing flat chronological list of all API calls, preserved. Added: Cost Breakdown section in expanded entries when `turnCostBreakdown` is present (shows per-task costs + turn total). `turnCost` preferred over `ai.estimatedCost` for summary cost display. Timing labels now show seconds (e.g., "AI: 11.2s") instead of raw ms. Cached token count shown in AI Call section.
- **View toggle:** Two tab buttons (Designer/Developer) below cost bar. Selection persisted in `localStorage` as `crucible_debug_view`. Switching views clears the expanded entry.
- **Copy output:** Added `[ai-cost]` line to plain text export. When `turnCostBreakdown` available: `[ai-cost] classify: $0.0018 | narrative: $0.0112 | total: $0.0130`. Fallback: `[ai-cost] narrative: model-name $0.0112`.
- **AD-366 graceful fallback:** All new fields (`gameTotalCost`, `turnCost`, `turnCostBreakdown`) show "—" or are omitted when not present. Existing `_debug.ai` data used as fallback throughout. Added `turnCost`, `turnCostBreakdown`, `gameTotalCost` to `KNOWN_DEBUG_KEYS` so they don't appear in raw JSON fallback.
- **Unchanged:** Debug mode activation (Ctrl+Shift+D), `_debug` stripping in `lib/api.js`, resize handle, collapse behavior, Copy All plain text format compatibility.
- **Files:** `DebugPanel.js` (full rewrite: CostBar, DesignerTurnCard, DesignerResolution, DesignerStateChanges, DesignerNpcs, DesignerContextBudget, DesignerAiCalls components; view state with localStorage; turnEntries filter; [ai-cost] in entryToText), `DebugPanel.module.css` (added: costBar, viewToggle/viewTab, contentArea, turnCard/turnCardSummary/turnCardDetail, designer section styles).

### Condition Penalty/Buff Display Sign (Bugfix)
- **Problem:** Condition values displayed as bare numbers with no sign (e.g., "0.1"), making it ambiguous whether the condition helps or hurts.
- **Fix:** Conditions now show signed values with color: penalties display as "−0.5" in orange (`var(--color-danger)`), buffs display as "+1.0" in green (`var(--color-success)`). Uses `isBuff` field from API when present; falls back to treating positive values as penalty magnitudes and negative values as buffs (per API convention). Value rendered in JetBrains Mono to match stat number styling.
- **Files:** `CharacterTab.js` (sign/color logic in condition display), `CharacterTab.module.css` (`.conditionPenalty`, `.conditionBuff` classes).

### Wire Skill & Gear Requests to Proposal Generation
- **Problem:** The Requests box (Skills/Starting Gear textareas) existed in the Phase 4 UI but was uncontrolled (no `value`/`onChange`), values were never captured, and `generateProposal()` sent an empty POST body. Additionally, the Requests box only appeared after the proposal loaded, so the player couldn't fill it before the first generation.
- **State wiring:** Added `skillRequests` and `gearRequests` state in InitWizardInner. Textareas are now controlled inputs wired to these state values via props to Phase4.
- **API wiring:** `generateProposal()` now builds a request body with `skillRequests` and `gearRequests` (trimmed, only included if non-empty) and passes it to `POST /api/init/:gameId/generate-proposal`.
- **Regenerate button:** Added "REGENERATE PROPOSAL" button below the Requests textareas. Disabled when both fields are empty or while regenerating. Calls `generateProposal()` which re-fires the POST with the request values. Shows "REGENERATING..." during loading. Ghost button style matching design system.
- **Flow:** First proposal generates automatically without requests (as before). Player reviews proposal, fills in skill/gear requests, clicks Regenerate to get an updated proposal incorporating their wishes.
- **Files:** `app/init/page.js` (InitWizardInner: `skillRequests`/`gearRequests` state, `generateProposal` sends request body, new props to Phase4; Phase4: new props in signature, controlled textareas, Regenerate button).

### Phase 4a Proposal Display — Innate Traits, Skill Modifiers, Stat Warnings, Stat Editing UX
- **Foundational skills — show modifier values:** Updated display from `scope (breadthCategory) STAT` to `Name +modifier (breadthCategory) STAT`. Uses `fs.name` (falls back to `fs.scope`) and shows `fs.modifier` in gold/monospace. Modifier values range 1.0–3.0 per backend AD-362/AD-363 changes.
- **Innate traits — new display section:** New card between backstory skills and foundational skills. Shows trait name (underscore→space, title case), source in italic. Detail line for traits with `effect`, `value`, `penalty`, or `stat` fields. Penalty traits render in amber (`#e8a04a`). Section hidden entirely when `innateTraits` array is empty (humans/all-human settings). No toggle/remove controls — review-only, use Requests box to negotiate.
- **Soft warnings for stat values:** `generateProposal` now stores `validation.softWarnings` and `validation.hardErrors` from the API response in `proposalValidation` state. Soft warnings display as amber notices below the stat card. Hard errors display as red notices and disable the CONTINUE button. Editing any stat clears hard errors (stale after adjustment; backend re-validates on `adjust-proposal` submit).
- **Stat editing layout fix:** Wrapped +/- buttons and value display in a fixed-width (168px) container. Offset label (`+9.5`) now always occupies its 44px space with `visibility: hidden` when unchanged, preventing reflow when offset appears/changes. Buttons no longer shift when the label toggles.
- **Stat click-to-type:** Clicking the stat value number in edit mode opens a text input (pre-filled with current value). Enter or blur commits, Escape cancels. Values clamped to 1.0–20.0 and rounded to nearest 0.5. +/- buttons still work alongside. Hint text updated to mention click-to-type.
- **Files:** `app/init/page.js` (Phase4 component: new props `innateTraits`, `softWarnings`, `hardErrors`, `onHardErrorsClear`; `editingStatName`/`editInputValue` state for click-to-type; `handleStatDirectEdit` handler; `formatTraitName` helper; fixed-width stat editing layout; innate traits section; validation display. InitWizardInner: `proposalValidation` state; validation stored from `generateProposal`; `canAdvance` blocks on hardErrors; new props passed to Phase4 invocation).

### Restore Turn Header Details (Regression Fix)
- **Root cause:** Turn headers only showed the turn number because (1) `gameState.world` was never populated, so `currentLocation` was always null; (2) `handleTurnResponse` used `stateChanges.clock` directly which only has `{ day, hour, minute }` with no weather, and fell back to null when absent instead of using the existing game state clock; (3) the first-turn auto-trigger had the same issue.
- **Fix — store world data:** The `/api/game/:id/state` fetch now stores `state.world` (including `currentLocation`) into `gameState`, making location available for `handleTurnResponse` to snapshot onto each new turn.
- **Fix — merge clocks:** `handleTurnResponse` and the first-turn trigger now merge `stateChanges.clock` onto `gameState.clock` instead of using it standalone. This preserves `weather`, `currentDay`, and other base clock fields that the action response doesn't repeat. If `stateChanges.clock` is absent entirely (narrative-only turns), falls back to the full `gameState.clock`.
- **Historical turns:** Turns loaded from `recentNarrative` on page reload still show only the turn number. The `recentNarrative` API response (`GET /api/games/:id`) does not include per-turn location, weather, or structured clock data — only `{ turn, role, content, timestamp }`.
- **Files:** `page.js` (state fetch stores world, handleTurnResponse clock merge, first-turn clock merge).

### Dice Size + Animation Polish + Auto-Scroll
- **Larger dice during animation:** New turns now show dice at 80px (single/crucible) and 72px (mortal dice) during roll animation, up from 42-52px. Crucible die shrinks to 56px when mortal dice appear. Dice area spacing increased to 28px gap with 24px padding during animation. Historical turns keep compact sizes (52px main, 42px mortal). Sizes and spacing match `dice-dynamic-sizing-mockup.jsx`.
- **Dice shrink-out transition:** After the roll resolves and holds for ~1s, the entire dice panel transitions out (scale 0.6, translateY -20px, fade to 0) over 400ms matching the mockup's state 6 transition. The resolution block then appears in its place via `onComplete`. CSS classes `.dicePanelAnimated` (transition properties) and `.dicePanelShrunk` (collapsed state) handle this. Respects `prefers-reduced-motion`.
- **Fixed spin animation (bug):** The `diceSpin` keyframe was defined in the CSS module (scoped name) but referenced via inline `animation` style (unscoped), so the browser couldn't find it and dice never visually spun. Fix: replaced inline style with `.dieSpinning` CSS class that references the scoped keyframe. Spin animation now plays correctly during the spinning phases.
- **Auto-scroll to new turn header:** When a new turn arrives, the narrative panel scrolls the turn's header (location, day, time, weather, turn number) to the top of the visible area, not the bottom of all content. Uses `scrollIntoView({ block: 'start' })` on the TurnBlock element via `forwardRef`. Initial page load still scrolls to the bottom of history. Removed the old `scrollIntoView` from InlineDicePanel (scroll is now the panel's responsibility, not the dice component's). IntersectionObserver still gates animation start.
- **`fadeInUp` keyframe in module:** Added local `@keyframes fadeInUp` to InlineDicePanel.module.css for robustness, since CSS modules scope keyframe names and the global definition in globals.css may not resolve inside the module.
- **Files:** `InlineDicePanel.js` + `.module.css` (sizes, spin fix, transition, scroll removal), `TurnBlock.js` (forwardRef for scroll targeting), `NarrativePanel.js` (scroll-to-turn-header logic).

---

## Previous Session Work (2026-03-19)

### World Tab: Full API Wiring (Checkpoints, Snapshots, Sharing)
- **Removed all "Coming Soon" badges** and disabled states from World tab.
- **Checkpoints:** Fetches `GET /api/game/:id/checkpoints` on tab open. Maps response onto 3 slots (populated show name + turn number, empty show "Slot N — Empty"). Save sends `POST /action { command: "checkpoint" }` with auto-generated name. Load sends `{ command: "restore_checkpoint", target: name }` with confirmation dialog ("Your progress since turn N will be lost"). Delete sends `{ command: "delete_checkpoint", target: name }` with confirmation. Re-fetches list after save/delete. Load triggers full page reload via `onGameStateReload`. Error state with retry link on fetch failure.
- **Save World Snapshot:** Sends `POST /api/game/:id/snapshot { name, type: "branch", visibility: "private" }`. Name pre-filled with campaign name + turn number. Success shows green check for 2.5s.
- **Share This World:** Two-mode picker (As it began = `fresh_start`, As it is now = `branch`), both with `visibility: "unlisted"`. Response's `shareToken` displayed as `/snapshot/{token}` URL in monospace field. Copy Link button with clipboard feedback. Back button returns to picker.
- **Props threaded:** `gameId`, `gameState`, `onGameStateReload`, `onClose` from SettingsModal. `onGameStateReload` implemented as `window.location.reload()` in page.js (simplest reliable way to re-fetch all game state after checkpoint restore).
- **Error handling:** All sections show inline red error text that auto-clears after 5s. Buttons disabled during requests. Checkpoint restore has confirmation dialog with cancel option.

### TopBar Clock Display + Turn Header Overhaul
- **TopBar clock:** New `clock` prop from `gameState.clock`. Displays `Day N · H:MM AM/PM · Weather` in compact format between setting name and icon buttons. JetBrains Mono for numbers, Alegreya Sans for weather. Middle-dot separators. Updates live as `gameState.clock` changes after each turn.
- **Turn header overhaul:** Replaced minimal "TURN N · time" header with full contextual row matching mockup pattern: location pin, day, time (with time-of-day emoji: sunrise/sun/sunset/moon based on hour), weather (with weather emoji: sun/cloud/rain/snow/fog/storm/wind), turn number. Each piece is a `headerChip` with emoji + value. Subtle bottom border. Wraps to two lines on narrow viewports.
- **Weather/location on turns:** `handleTurnResponse` now snapshots `gameState.clock.weather` and `gameState.world.currentLocation` (when available) onto each new turn entry. Historical turns from page load show just the turn number (no location/weather since that data isn't in `recentNarrative`).
- **Files:** `page.js` (weather/location on turn entries, clock prop to TopBar, gameState in handleTurnResponse deps), `TopBar.js` + `.module.css` (clock display), `TurnBlock.js` + `.module.css` (header overhaul with emoji helpers).

### Dice Roll Animation Visibility (Bugfix)
- **Auto-scroll:** InlineDicePanel scrolls into view (`scrollIntoView({ behavior: 'smooth', block: 'center' })`) on new turns before animation starts. 400ms pause after scroll before dice begin spinning.
- **Slower timings:** Matched: 800ms spin (was 500ms). Outmatched/Dominant: crucible 600ms, mortal appear 1000ms, mortal land 1600ms, resolve 2100ms (was 400/600/1000/1300ms). Total ~2.5s for full sequence (was ~1.3s).
- **Result hold:** 1s hold after dice land before resolution block + narrative text appear. TurnBlock delays rendering `ResolutionBlock`, narrative, and status badges until `onComplete` callback fires from InlineDicePanel.
- **Natural Extreme flash:** Gold glow pulse (`flashGold` keyframes) for nat20, red glow pulse (`flashRed`) for nat1. Applied as CSS class on the dicePanel container. 600ms ease-out animation. Respects `prefers-reduced-motion`.
- **Historical vs new turns:** page.js marks turns from `handleTurnResponse` and first-turn trigger with `_isNew: true`. NarrativePanel passes `isNew` to TurnBlock. TurnBlock passes `animate={isNew && hasResolution}` to InlineDicePanel. Historical turns (page reload) skip animation entirely and show final state immediately.
- **Files:** `InlineDicePanel.js` (scroll + timing + flash + animate/onComplete props), `InlineDicePanel.module.css` (flash keyframes), `TurnBlock.js` (content gating on animation completion), `NarrativePanel.js` (isNew pass-through), `page.js` (_isNew flag on new turns).

### Map Tab: Viewport Size + Scroll Zoom + Drag Pan
- **Canvas height:** Removed `aspect-ratio: 1.22` (~260px), replaced with `min-height: 450px`. ResizeObserver reads actual container height with 450px floor.
- **Mouse wheel zoom:** 0.5x to 3.0x range. Non-passive wheel listener prevents page scroll. Zoom targets cursor position (point under cursor stays fixed). Step: 0.15 per tick. SVG `viewBox` computed dynamically as `panX panY width/zoom height/zoom`.
- **Click-drag pan:** Active when zoomed past 1.0x. `grab`/`grabbing` cursor via CSS module classes. Drag tracked on `document mouseup` for reliability. Hover tooltips and node clicks suppressed during drag.
- **Reset view button:** Third button in zoom control stack (crosshair icon). Resets zoom to 1.0x, pan to (0,0). Disabled when already at default. Auto-resets on level navigation.
- **Zoom indicator:** Shows `1.5x` next to level label when zoomed.
- **Files:** `MapTab.js`, `MapTab.module.css`.

### Glossary Tab: Category Filter Tabs
- **Replaced** `<select>` dropdown with horizontal tab row: All, People (`npc`), Places (`location`), Factions (`faction`), Items (`item`), Other (mechanics, species, etc.).
- **Styling:** Cinzel 11px, gold underline + bold on active tab, muted on inactive. Count badges per tab (except All).
- **Filter logic:** `KNOWN_CATEGORIES` set defines the four named categories; anything not in the set groups under Other. Search input still works in combination with tab filter.
- **Files:** `GlossaryTab.js`, `GlossaryTab.module.css`.

### Settings Panel: Full Tabbed Rewrite
- **SettingsModal.js** rewritten from display-only modal (theme/font/size) to full 3-tab settings panel matching `docs/GameLayout/settings-panel-mockup.jsx`.
- **Tab 1: Game Settings** (live API wiring):
  - Storyteller selector: 7 options (Chronicler, Bard, Trickster, Poet, Whisper, Noir, Custom). Custom shows textarea with 500-char counter. Saves on button click (`PUT /api/game/:id/settings/storyteller`), custom directive saves on blur. Initial value from `gameState.storyteller`.
  - Difficulty: 4 preset buttons (Forgiving/Standard/Harsh/Brutal) with design-system color coding. Individual dials: DC Offset (slider -4 to +6), Progression Speed (slider 0.25x to 3.0x, converted to/from percentage for API), Encounter Pressure (Low/Standard/High selector), toggles for Survival, Durability, Fortune's Balance, Simplified Outcomes. Selecting a preset sets all dials + sends `PUT /api/game/:id/settings/difficulty { preset }`. Individual changes switch label to "Custom" + send `{ overrides: { dial_name: value } }`. Debounced 400ms for slider changes. Initial values from `gameState.dials` + `GET /api/init/:id/difficulty-presets` for current preset.
  - Note at bottom: "Changes take effect on the next relevant game event. No retroactive recalculation."
  - Loading dots on section headers during API saves. Error messages below each section.
- **Tab 2: Display** — migrated existing theme/font/text size controls with identical localStorage persistence via `settings`/`onSave` props. Styled to match mockup (wider buttons, font preview, gold active states).
- **Tab 3: World** — UI structure from mockup: checkpoints (3 slots), save world snapshot, share this world. All buttons disabled with "Coming Soon" badges. Ready for future API wiring (checkpoints, snapshots, share links).
- **Shared sub-components** (from mockup): SectionLabel, Toggle, SliderControl, SelectorRow. Used across Game Settings tab.
- **SettingsModal.module.css** rewritten for panel structure (520px, centered, tabbed). Range slider thumb styling via scoped CSS selector. Saving indicator animation, error text, coming-soon badge styles.
- **page.js** updated to pass `gameId` and `gameState` props to SettingsModal.
- **API wiring status:** `PUT /settings/storyteller` and `PUT /settings/difficulty` now wired.

### Rulebook Page (New Page)
- **Route:** `/rulebook` at `app/rulebook/page.js` + `page.module.css`
- **Content:** All 22 sections (Quick Start + 21 rule sections) ported verbatim from approved mockup `rulebook-full.jsx`. Static content, no API calls.
- **Layout:** Matches pricing page pattern: inline styles + CSS module for hover/animation states. Wordmark links to `/`, nav links to Pricing/FAQ/Rulebook (active)/Sign In, footer with copyright.
- **TOC sidebar:** Sticky 260px sidebar with "CONTENTS" header, scroll-linked section numbers. Quick Start (section 00) uses green accent (`#8aba7a`), all others gold (`#c9a84c`). Active section highlighted with color + font weight.
- **Scroll spy:** `contentRef` + `sectionRefs` array. On scroll, determines visible section and updates TOC highlight. Click-to-scroll on TOC links with smooth behavior.
- **Content styling:** Injected `<style>` tag for `.content-section` child selectors (h3, p, ul, ol, li, strong), `.mechanic-callout` (gold left border), `.quickstart-callout` (green left border). Custom scrollbar on content area.
- **Quick Start distinction:** Green accent throughout (header, TOC link, callout borders). "START HERE" badge not "00" number.
- **Bottom CTA:** "Every Hero Needs a Crucible." / "Yours is waiting." / START PLAYING button linking to `/auth`.
- **Animations:** Staggered fade-in on load (hero, subtitle, section count, main area) using loaded state + transition delays.

### AI Model Selector (New Feature, Playtester-Only)
- **AiModelSection** component added to Game Settings tab, gated on `user.isPlaytester`. Section hidden entirely for non-playtesters (no error, no placeholder). If `GET /api/game/:id/settings/ai-model` returns 403 or fails (endpoint not deployed yet), section hides gracefully.
- **Simple mode** (default): "All AI Tasks" dropdown sets `overrides.all` for every AI task. Reset to defaults button clears all overrides. Note shown when per-task overrides exist with expand link.
- **Advanced mode** (expandable): "Configure per task" toggle reveals per-task dropdowns for 9 task types (Narrative, Summarization, Zone Generation, Classification, NPC Flesh-out, Campaign Summary, Session Recap, Briefing, Character Proposal). Each shows "Default (model name)" as first option. When `all` override is set and task has no individual override, shows "via All Tasks: model" inheritance label.
- **Dropdowns**: Native `<select>` with `<optgroup>` provider grouping (OpenAI/Anthropic/Google). Styled with dark theme, custom dropdown arrow SVG, gold focus border. Tier badges shown inline (fast/nano).
- **Save behavior**: Changes save immediately on selection (same pattern as storyteller). Optimistic update with revert on failure. Success checkmark per dropdown, saving dot on section header, error message on failure. Loading skeleton while initial GET is in-flight.
- **ModelSelect** shared component: Reusable grouped dropdown with default option, provider grouping, tier display, inherited styling.
- **CSS additions**: `.devBadge` (playtester indicator), `.modelSelect` (styled native select), `.modelRow`/`.modelRowLabel`/`.modelRowInherited` (task row layout), `.resetButton`, `.loadingSkeleton`.
- **API endpoints**: `GET /api/game/:id/settings/ai-model` + `PUT /api/game/:id/settings/ai-model` (partial update: sends only changed keys).

### Init Wizard: Proposal Skills/Loadout Display (Bugfix)
- **Root cause:** Phase 4 (attributes review) had hardcoded placeholder skills text ("Streetwise 1.0, Lockpicking 1.0, Blade Work 1.0") instead of using the AI-generated proposal data. `generateProposal()` stored `foundationalSkills`, `startingLoadout`, `factionStandings` but not `skills`, `narrativeBackstory`, `innateTraits`, or `species`. Phase4 component only received `stats` prop, not the rest of the proposal.
- **Fix:** `generateProposal()` now stores all proposal fields (skills, foundationalSkills, startingLoadout, factionStandings, narrativeBackstory, innateTraits, species) with `Array.isArray()` guards. Phase4 receives and renders: backstory skills (comma list), foundational skills (scope + breadthCategory + stat), starting loadout (name + slotCost + materialQuality), faction standings (name + signed standing). `saveAttributes()` now passes all proposal fields through to `POST /api/init/:id/adjust-proposal` (removed spurious `accepted: true`).

### InventoryTab: Equipped Items Visual Distinction (Bugfix)
- **Root cause:** InventoryTab already split `equipped`/`carried` arrays into separate PanelSections, but had no visual distinction between equipped and carried items.
- **Fix:** Equipped items now have a gold left border (`2px solid var(--accent-gold)`) and a gold dot indicator. Heirloom items show a "heirloom" badge. ItemRow accepts `isEquipped` prop; equipped section passes `isEquipped` to each item.

### MapTab: Interactive Node Map (Rewrite)
- **Full rewrite** of `MapTab.js` (82 lines to 470 lines) from flat text list to interactive SVG node map based on `docs/GameLayout/node-map-v2.jsx` mockup.
- **Force-directed layout:** Adapted from mockup. Computes node positions from location/route data using repulsion + spring + center-pull physics (250 iterations). Responsive to sidebar width via ResizeObserver.
- **SVG rendering:** MapNode (status-based sizing: current 16px/visited 12px/discovered 9px, gold glow animation on current, dashed stroke on discovered, "+" indicator on zoomable). MapRoute (terrain-typed dash patterns: road/trail/wilderness/mountain/water/underground, danger-colored with hover brightening, travel days label).
- **Hierarchical zoom:** Clicking a `hasChildren` location fetches `GET /api/game/:id/map?level=<locationId>` for sub-level data. Zoom out uses `mapData.parent`. Breadcrumb navigation from API response. Zoom +/- buttons. Sidebar passes `gameId` prop to MapTab.
- **Tooltips:** Fixed-position hover tooltips showing location name/type/danger/faction or route travel days/danger/terrain. Escapes sidebar overflow via `position: fixed`.
- **Location list:** Below the SVG canvas, sorted by status (current > visited > discovered). Clicking zoomable locations navigates, others trigger `onEntityClick`.
- **Legend:** Node status indicators + danger level color key with terrain line samples.
- **Danger level handling:** Supports both numeric (from API: 0-4) and string (from mockup: "safe"/"low"/etc.) danger levels.
- **MapTab.module.css:** Full rewrite with styles for canvas, breadcrumbs, zoom controls, legend, location list, tooltips.

---

## Previous Session Work (2026-03-18)

### Debug Panel (New Feature)
- **DebugPanel** (`DebugPanel.js` + `.module.css`): Slide-up developer tools drawer at bottom of play page. Dark theme (browser devtools style, `#1a1a2e` background) regardless of game theme. JetBrains Mono throughout.
- **Toggle:** Ctrl+Shift+D toggles debug mode on/off. Persists in localStorage (`crucible_debug`). "DEBUG" badge shown in TopBar when active.
- **Header injection:** `lib/api.js` modified to conditionally add `X-Debug: true` header on all API calls when debug mode is active. Module-level `setDebugMode()`, `onDebugResponse()`, `setNextActionLabel()` exports.
- **Collection:** Every API response containing `_debug` is logged to session-level array (newest first). Each entry stores timestamp, method, URL, HTTP status, client-side duration, the full `_debug` payload, and action label. `_debug` is stripped from response data before returning to components. Action labels set before POST /action calls (`choice: A`, `custom: I stealth`, `command: long_rest`). Turn numbers enriched via `handleTurnResponse`.
- **Panel display:** Resizable height via drag handle on top edge (min 100px, max viewport-100px). Collapsible to 36px bar showing "DEBUG — X entries".
- **Entry summary row:** `[HH:MM:SS] — METHOD /path — status — duration — $cost — Turn N: "action text"`. Status color-coded (green/yellow/red). For GETs, shows row counts instead of action text.
- **Expandable detail sections** (rendered from `_debug` keys if present): Timing (segmented proportion bar: AI/DB/Parse/Other), AI Call (provider, model, task, tokens, cost, attempts), Resolution (full mechanical breakdown), State Changes (DB tables, conditions, inventory, NPCs, locations, clock, skills), Narrative (response length, options, parse errors, JSON repair flag), Context Budget (L1-L4 layer chips, NPCs/locations in context, anchors), Row Counts (for GET endpoints). Unknown `_debug` keys rendered as raw JSON fallback.
- **Copy features:** "Copy Entry" per expanded entry, "Copy All" at panel header, "Clear" to reset log. Plain text format designed for pasting into Claude chat (matches spec: `=== TURN N — date ===` header, labeled sections with indented key-value pairs).
- **Files changed:** `lib/api.js` (debug mode + header injection + timing + callback), `TopBar.js` + `.module.css` (debug badge), `page.js` (state, keyboard listener, callback registration, action labels, turn enrichment, panel render).

### Bugfixes (Playtesting)
- **Wordmark links to /menu:** TopBar wordmark wrapped in Next.js `<Link href="/menu">`.
- **Missing narrative on reload:** `recentNarrative` parsing flipped to treat any non-player role as narrative (fixes backend using `assistant` instead of `narrator`).
- **Stat labels redundant:** CharacterTab stat display changed from "STR Strength" to just "STR" (full name available in title tooltip).
- **Notification badge phantom count:** Removed `stateChanges.stats` from notification trigger (always present, caused +1 badge on every turn).
- **Font/text size settings not working:** Added `font-family: var(--body-font)` to `.pageContainer` so children inherit the override. Replaced hardcoded `font-size: 15px` with `var(--narrative-size, 15px)` in TurnBlock, ActionPanel, NarrativePanel. Replaced hardcoded `font-size: 13px` with `var(--ui-size, 13px)` across all 6 sidebar tab CSS modules.
- **Talk to GM submitting as player action:** Added auto-focus to GM input when panel opens (prevents typing into ActionPanel's custom input by mistake). Added `e.stopPropagation()` and `e.preventDefault()` on Enter key handler.

---

## Previous Session Work (2026-03-17)

### Play Page Rewrite — Phase 4 (Settings, Talk to GM, Entity Popup)
- **SettingsModal** (`SettingsModal.js`): Display settings with three controls: Theme (Dark/Light/Sepia), Body Font (Lexie Readable/System/Alegreya/Georgia/Monospace), Text Size (Small/Medium/Large/X-Large). Persists to localStorage. Applied as CSS variable overrides on the pageContainer element. Settings gear button added to TopBar.
- **TalkToGM** (`TalkToGM.js`): Full two-phase interaction replacing the stub. Phase 1: POST /api/game/:id/talk-to-gm with free question. Displays response by source type: command (formatted data), rulebook (title + section + content), no match (suggestion + escalate button). Phase 2: POST /api/game/:id/talk-to-gm/escalate processes as a turn response via shared handleTurnResponse. Loading states, Escape to close.
- **EntityPopup** (`EntityPopup.js`): Modal overlay for entity details. Looks up term in glossary data. Shows: Cinzel header, category, definition. Items show durability bar with color coding. Player notes section at bottom with textarea + save (POST /api/game/:id/notes). Wired to clickable elements: glossary entries, NPC cards, inventory items, stat names, condition names, map locations.
- **page.js refactored**: Extracted shared `handleTurnResponse` callback (used by both submitAction and TalkToGM escalation). Added display settings state with localStorage persistence. Theme CSS variables applied as inline styles on pageContainer. Entity popup state managed at page level.
- **Sidebar tabs updated**: All tabs accept `onEntityClick` prop, clickable items trigger EntityPopup.
- **NarrativePanel cleaned up**: GM stub replaced with TalkToGM component import. Receives `onTurnResponse` for escalation handling.
- **Theme system**: 3 complete theme definitions (dark/light/sepia) with full CSS variable overrides. Font and text size applied via `--body-font`, `--narrative-size`, `--ui-size` variables.

### Play Page Rewrite — Phase 3 (Dice, Resolution, Status Badges)
- **InlineDicePanel** (`InlineDicePanel.js`): SVG d20 dice display within turn blocks. Fortune's Balance category tag (Matched/Outmatched/Dominant). Matched: single spinning d20 that reveals dieSelected. Outmatched/Dominant: crucible roll center, two mortal dice with kept/discarded resolution (Outmatched keeps highest with gold glow, Dominant keeps lowest with tarnished glow). Natural Extreme indicators for nat20/nat1 on crucible. Phase-based animation with timeouts. MiniD20 SVG component with glow rings, ghost faces, desaturation.
- **ResolutionBlock** (`ResolutionBlock.js`): Expandable resolution display. Collapsed: one-line JetBrains Mono summary (action | STAT + skill + d20 = total vs DC | margin: tierName). Expanded: 2-column grid with labeled rows (Action, Stat, Skill, Equipment, Fortune's Balance, Crucible Roll, d20 Roll, DC, Total, Result, Debt). Click anywhere on compressed bar or "?" button to toggle. Green-tinted resolution background/border.
- **Status badges reworked**: Type-specific badge styling per mockup's StatusChangeBadge. Conditions: added/escalated = orange warning, removed/cleared = green success, CON-related = red danger. Inventory: added = gold, removed = orange, modified = blue. Each badge shows relevant detail text (penalty, stat, escalation).
- **TurnBlock updated**: Replaced inline ResolutionSummary with InlineDicePanel (above narrative) + ResolutionBlock (below dice, above narrative). Status badges use new type-specific classes.

### Play Page Rewrite — Phase 2 (Sidebar Tabs)
- **Sidebar container** (`Sidebar.js`): 6 SVG icon tabs (Character, Inventory, NPCs, Glossary, Map, Notes), notification badges on data changes, drag-to-resize handle on left edge, collapsible via TopBar toggle button
- **CharacterTab**: Stats with progress bars (effective/20 scale, penalized stats shown in orange), skills grouped by active/foundational, conditions with penalty badges and escalation info. Data: `GET /api/game/:id/character`. Stat keys lowercase from API, displayed uppercase.
- **InventoryTab**: Header with usedSlots/maxSlots + encumbrance label, `currency.display` only (never raw), equipped/carried item lists with durability bars color-coded (76%+ green, 51-75% yellow, 26-50% orange, 1-25% red, 0% dark red with strikethrough). Data: same `/character` endpoint.
- **NPCTab**: Filters glossary entries where `category === "npc"`. Shows NPC name, definition, discovered turn. Empty state when no NPCs in glossary.
- **GlossaryTab**: Search input + category dropdown filter, shows term/definition/category/discoveredAt. Data: `GET /api/game/:id/glossary`.
- **MapTab**: Location list with current location highlighted (gold dot + "(here)"), discovered/undiscovered styling, routes between locations with terrain and travel days. Data: `GET /api/game/:id/map`.
- **NotesTab**: Full CRUD. Lists notes with entity name, type, delete button. Add form with entity type dropdown + textarea. `POST /api/game/:id/notes` to create, `DELETE /api/game/:id/notes/:noteId` to delete. Refetches after mutations.
- **PanelSection**: Shared collapsible section component used by all tabs (Cinzel header, toggle arrow).
- **TopBar updated**: Sidebar toggle icon button (gold when open, muted when closed).
- **page.js updated**: Added sidebar state (characterData, glossaryData, mapData, notesData, sidebarOpen, notifications). Step 2 supplementary fetches now wired (character, glossary, map, notes). Turn response handler refetches character on stateChanges and adds notification badges. Layout changed from column to row (narrativeColumn + Sidebar).
- **Notification system**: stateChanges.conditions changes badge Character tab, stateChanges.inventory changes badge Inventory tab. Clicking a tab clears its badge.

### Play Page Rewrite — Phase 1 (Page Shell + Data Loading)
- **Full rewrite** of `app/play/page.js`: replaced 3249-line monolith with 338-line orchestrator + 4 components
- **File structure:** `page.js` + `components/` directory with TopBar, NarrativePanel, TurnBlock, ActionPanel (each with CSS module)
- **Load flow (Steps 1–4):** Auth guard, GET /api/games/:id for game state, GET /api/game/:id/state for available actions (fire-and-forget), SSE for `connected` + `command:response` only, auto-triggers Turn 1 on fresh games
- **Turn response handling (Step 5):** Sync POST /api/game/:id/action processes turnAdvanced responses, updates turns array, updates actions from nextActions, updates clock from stateChanges
- **TopBar:** Wordmark + setting name + SSE connection indicator
- **NarrativePanel:** Session recap, recentNarrative grouped by turn number, auto-scroll on new turns
- **TurnBlock:** Turn header (number + clock + weather), player action line, one-line resolution summary (stat + dice + total vs DC + tier), narrative paragraphs, status change badges (conditions/inventory added/removed/modified)
- **ActionPanel:** A/B/C option buttons, custom text input with Enter submit, disabled state while submitting, error display
- **Key rules followed:** No mock data, no SSE for turn content, field names from API_CONTRACT.md, no rgba for visible elements, React Strict Mode cancelled flag pattern
- **Not built yet (future phases):** Sidebar (6 tabs), InlineDicePanel, expandable ResolutionBlock, SettingsModal, TalkToGM, EntityPopup, TurnTimeline, bookmarks

---

## Previous Session Work (2026-03-16)

### Design System Enforcement
- Eliminated all `rgba()` violations across 7 CSS modules and 7 page JS files
- Added 6 new solid gold-tinted CSS variables to `globals.css` (`--border-gold-faint`, `--border-gold-subtle`, `--border-gold-light`, `--bg-gold-faint`, `--bg-gold-subtle`, `--bg-gold-light`)
- Fixed secondary button text color (`--text-muted` to `--accent-gold`) on landing, menu, pricing
- Fixed secondary button borders (rgba to `--border-card`)
- Fixed input backgrounds and placeholder colors per spec

### Init Wizard Rework (4 Prompts)
- **Prompt 1:** Added 18 prebuilt worlds (3 per era), 29 archetypes across 6 eras, updated sub-question labels
- **Prompt 2:** Phase 2 restructured with Custom + Your Worlds cards, prebuilt world expand/collapse, "or shape your own" divider
- **Prompt 3:** Phase 3 restructured with archetype/full-custom mode toggle, archetype card grid with personality pills and stat leanings
- **Prompt 4:** All 10 API endpoints wired (storyteller, setting, world-status polling, character, generate-proposal, adjust-proposal, difficulty, scenarios, select-scenario, world-snapshots). Controlled textareas, loading/error states, Suspense boundary.

### /play Page (Old — Replaced)
- The original 6-prompt /play page was a 3249-line monolith with assumed API contracts. It was fully replaced by the Phase 1-4 rewrite above (36 component files).

### Init Wizard Fixes
- **Phase 4 gameId flow fix:** `app/init/page.js`. Root cause: gameId was read from `?gameId=` param but `/menu` navigates with `?id=` or no param. `generateProposal()` never fired, falling back to hardcoded SAMPLE_STATS every time. Fix: read both `?gameId=` and `?id=`, create game via `POST /api/games/new` on mount if no URL gameId, store in `createdGameId` state. All Phase 1-6 API calls now fire. Commit 048008a.
- **Phase 4 saveAttributes fix:** `app/init/page.js`. Root cause: Phase4 component managed adjusted stats in local state but never propagated back to parent. `saveAttributes()` sent original proposal, not user-adjusted values. Fix: Phase4 accepts `onStatsChange` callback, parent stores `adjustedStats`, `saveAttributes` sends adjusted values.
- **Full API integration audit:** Audited every page and component. Results: Gameplay page (`/play`) fully wired. Init wizard phases all conditional on gameId (now working post-fix). Saved Games page entirely mock data. Loading page hardcoded. Glossary/map/notes silent fail by design.
- **Offline banner:** `app/init/page.js`. Shows persistent amber warning banner when `POST /api/games/new` fails. Includes "Retry Connection" button. Banner auto-dismisses on successful retry or if gameId arrives via URL. Wizard still navigable in offline mode.
- **Phase 6 scenario generation wired to API:** `app/init/page.js`. Root cause: `saveScenario()` called `generate-scenarios` and `select-scenario` at the same time on Continue click. The generate-scenarios response was never used; users always saw hardcoded SCENARIOS. Fix: `fetchScenarios()` now fires when entering Phase 6 or when intensity changes (gated on gameId). API response mapped to SCENARIOS shape. Loading state shown during fetch. Intensity changes clear selection and re-fetch. Hardcoded SCENARIOS kept as fallback. `saveScenario()` now only calls `select-scenario`.
- **Init API base path fix:** `app/init/page.js`. All 9 init wizard API calls used `/api/games/{gameId}/init/...` but the backend mounts at `/api/init/{gameId}/...`. Every call was 404ing. Find-and-replace across all init endpoints.
- **Storyteller selection capitalization fix:** Backend expects capitalized storyteller names (e.g., 'Bard'), frontend was sending lowercase ids (e.g., 'bard'). Added capitalization to POST body.
- **Setting POST body field name fix:** `saveSetting()` in `app/init/page.js`. Three mismatches: `settingType` renamed to `selection` (now sends display name via SETTINGS lookup, e.g., 'Sword & Soil'), `freeformText` renamed to `customText`, `parameters` renamed to `answers`.
- **Remaining init API contract fixes:** Three phases fixed in `app/init/page.js`. (1) `saveCharacter`: `pronouns` renamed to `gender`, uses `customPronouns` value when present. (2) `fetchScenarios`: intensity value capitalized before sending (e.g., 'calm' → 'Calm'). (3) `saveScenario`: `scenarioKey` renamed to `scenarioIndex`, values remapped (A→0, B→1, C→2, D→'custom'), `customStart` wrapped in `{ description: "..." }` object.
- **World-status polling response field fix:** `pollWorldStatus()` in `app/init/page.js`. Checked `res.world_gen_status` but backend returns `{ status: 'complete', ready: true }`. Changed to `res.status === 'complete'`.
- **Generate-proposal response handling fix:** `generateProposal()` in `app/init/page.js`. Extracts `res.proposal`, transforms `stats` from backend object format (`{ STR: 4, DEX: 5.5, ... }`) into array format Phase4 expects (`[{ name, abbr, emoji, value }]`). Includes POT (Potency) when present. Stores `foundationalSkills`, `startingLoadout`, `factionStandings` on proposal object for future use. Falls back to SAMPLE_STATS if transform yields empty array.
- **Adjust-proposal stats format fix:** `saveAttributes()` in `app/init/page.js`. Transforms stats array back to object format (`{ STR: 4, DEX: 5.5, ... }`) before POSTing, using `abbr` field as key. Backend expects object, frontend was sending display array.
- **Loading page gameId passthrough fix:** `app/loading/page.js`. Page ignored `?gameId=` param from init wizard and linked to `/play` with no gameId, causing redirect to `/menu`. Now reads gameId from URL params and passes it to `/play?gameId=...`. Falls back to `/menu` if no gameId. Added Suspense wrapper for `useSearchParams`.
- **Play page API contract audit:** Full audit of `app/play/page.js` against verified backend response shapes. Fixes: (1) Game state fetch: extract `recentNarrative` (not `narrative`/`turns`), transform to turns format, extract `gameSettings` from response, remove fields not in this endpoint. (2) Added `GET /api/game/:id/character` fetch for character+inventory+skills+conditions. (3) Character stats: `transformStats()` converts `{ STR: { base, effective } }` object to array. (4) Skills: `skill.modifier` not `skill.value`. (5) Conditions: `condition.durationType` not `condition.duration`. (6) Inventory: `carried`/`usedSlots`/`maxSlots`/`slotCost`/`currency.raw` instead of `items`/`current`/`max`/`slots`/`coins`. (7) Map: `loc.status === 'current'` not `loc.current`; routes use `origin`/`destination` IDs with name lookup. (8) SSE: `turn:resolution` extracts `event.turn.number`; `turn:narrative` prefers `event.chunk`; `turn:state_changes` processes structured `{ conditions, inventory }` objects into badge array. (9) Actions: `opt.id` not `opt.key`. (10) `worldName` reads `gameState.setting` (plain string). (11) Settings: storyteller capitalized, difficulty dials nested as `{ dials }`. (12) `Array.isArray()` guards on all API data. (13) Added `transformResolution()` to map backend resolution fields to display format.

---

## Site-Wide Rules

These apply to every page. Claude Code should check new work against this list.

### Colors and Accessibility
- No `rgba()` for text, card backgrounds, or borders. Solid hex only.
- `rgba()` is reserved for overlays, shadows, modal backdrops, and focus/glow effects.
- All text must meet WCAG 2.1 AA: 4.5:1 for normal text, 3:1 for large text and UI components.
- Italic text uses `#8a9ab8` (not `#7082a4`) for extra contrast headroom.
- Full color reference: `docs/design-system.md`

### Typography
- Cinzel: headers, labels, buttons, option keys
- Alegreya: narrative body text
- Alegreya Sans: UI labels, stat names, metadata, body copy
- JetBrains Mono: numbers, mechanical resolution, timestamps
- Lexie Readable: default accessibility body font
- All game layout text must respect user font settings. Only hardcode Cinzel on structural headers and JetBrains Mono on pure numbers.

### Minimum Sizes
- Category labels (SETTING, STORYTELLER, etc.): 11px Cinzel 600wt minimum
- Detail values below category labels: 15px minimum
- Difficulty badges: 12px Cinzel 700wt with 4px 12px padding

### Wordmark (all pages)
- "CRUCIBLE" in Cinzel 22px 900wt `#c9a84c`
- "RPG" in Cinzel 12px 600wt `#9a8545` (solid hex, not rgba)

### Copy Rules
- No em dashes in visible copy (reads as AI-generated). Use commas, periods, or semicolons.
- No filler phrases ("dive into", "it's important to note", "whether you're a...")
- Brand voice: confident but not corporate, accessible but not childish, fantasy-flavored without cheesy.
- Locked slogans: "Every hero needs a crucible." / "Your story. Your choices. No table required."

### Frontend Architecture
- Frontend never calculates. It displays what the server sends.
- API client at `lib/api.js` handles auth token management and base URL.
- Auth guard via `lib/useAuth.js` hook for protected pages.
- `useSearchParams` requires Suspense boundary wrapper on pages that read URL params.

---

## Pending Site-Wide Fixes

| Fix | Affected Pages | Status |
|-----|---------------|--------|
| Wordmark RPG color: rgba to solid `#9a8545` | All pages | **Done** (all pages updated) |
| Footer text: rgba to solid `#a08a48` | Landing, Coming Soon, Pricing | **Done** |
| Stat label rgba to solid `#9a8545` | Main Menu | **Done** |
| Secondary button text: `--text-muted` to `--accent-gold` | Landing, Menu, Pricing | **Done** |
| Secondary button border: rgba to `--border-card` | Landing, Menu, Pricing | **Done** |
| Input backgrounds: rgba to `--bg-input` | Coming Soon, Auth | **Done** |
| Input placeholder color: `--text-secondary` to `--text-muted` | Coming Soon | **Done** |

All pending rgba/color fixes from previous sessions have been completed.

---

## Known Bugs

| ID | Description | Page/Component | Severity | Status | Fixed In |
|----|-------------|----------------|----------|--------|----------|

**Severity levels:**
- **Blocking** — Prevents playtesting or core functionality. Fix before launch.
- **Annoying** — Noticeable during play but doesn't stop anything. Fix before launch if time allows.
- **Cosmetic** — Visual polish. Defer to post-launch unless trivial.

---

## ADA Compliance

### Done
- Color contrast audit: all text meets WCAG 2.1 AA (4.5:1)
- All rgba text/UI colors replaced with solid hex across all pages
- Resolution block respects user font settings
- Minimum sizing standards established
- prefers-reduced-motion media query in globals.css
- ARIA labels on icon-only buttons in /play (sidebar tabs, settings gear, sidebar toggle, bookmark stars)
- Keyboard shortcuts: Escape closes modals, Ctrl+Shift+D for debug

### Ready for Implementation
- Semantic HTML (remaining div/span with onClick to proper button/a elements on non-/play pages)
- Focus indicators (replace outline:none with visible :focus-visible)
- Keyboard navigation on remaining pages (tabIndex, onKeyDown)
- Form labeling (label or aria-label on inputs across all pages)
- Skip-to-content links on all pages
- ARIA live regions for tab switches, popups, narrative feed

### Deferred (Post-Launch)
- Full screen reader testing
- Comprehensive device/browser accessibility testing
- Live region announcements for narrative feed during gameplay

---

## Copy Audit Status

| Page | Audited | Em Dashes Fixed | Filler Removed | Notes |
|------|---------|-----------------|----------------|-------|
| Landing | Yes | Yes | Yes | Session 4 |
| Pricing | Yes | Yes | Yes | Session 4 |
| Coming Soon | No | -- | -- | |
| Auth | No | -- | -- | |
| Main Menu | No | -- | -- | |
| Loading Screen | No | -- | -- | |
| Saved Games | No | -- | -- | |
| Init Wizard | No | -- | -- | Rework complete, needs copy review |
| Game Layout | No | -- | -- | Built this session, needs copy review |

---

## API Wiring Status

### Init Wizard (`/init`)
| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/init/:id/storyteller` | POST | Wired (skipped when no gameId) |
| `/api/init/:id/setting` | POST | Wired |
| `/api/init/:id/world-status` | GET | Wired (polls every 2s) |
| `/api/init/:id/character` | POST | Wired |
| `/api/init/:id/generate-proposal` | POST | Wired (fallback to SAMPLE_STATS) |
| `/api/init/:id/adjust-proposal` | POST | Wired |
| `/api/init/:id/difficulty` | POST | Wired |
| `/api/init/:id/generate-scenarios` | POST | Wired (fires on phase entry + intensity change, fallback to hardcoded) |
| `/api/init/:id/select-scenario` | POST | Wired |
| `/api/world-snapshots` | GET | Wired (fails silently if unavailable) |

### Game Layout (`/play`) — Rewritten
| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/games/:id` | GET | Wired (initial game state load) |
| `/api/game/:id/state` | GET | Wired (restores availableActions on reload) |
| `/api/game/:id/stream` | GET (SSE) | Wired (connected + command:response only) |
| `/api/game/:id/action` | POST | Wired (choice/custom/command, sync response) |
| `/api/game/:id/character` | GET | Wired (sidebar CharacterTab + InventoryTab, refetch on stateChanges) |
| `/api/game/:id/glossary` | GET | Wired (sidebar GlossaryTab + NPCTab filter) |
| `/api/game/:id/map` | GET | Wired (sidebar MapTab) |
| `/api/game/:id/notes` | GET/POST/DELETE | Wired (sidebar NotesTab CRUD, refetch on mutation) |
| `/api/game/:id/talk-to-gm` | POST | Wired (Phase 1 free lookup, displays command/rulebook/no-match) |
| `/api/game/:id/talk-to-gm/escalate` | POST | Wired (Phase 2 escalation, processes as turn response) |
| `/api/game/:id/settings/storyteller` | PUT | Wired (Settings panel Game Settings tab) |
| `/api/game/:id/settings/difficulty` | PUT | Wired (Settings panel Game Settings tab, presets + individual dials) |
| `/api/game/:id/settings/ai-model` | GET/PUT | Wired (Settings panel AI Models section, playtester-only, graceful fallback if endpoint not deployed) |
| `/api/game/:id/checkpoints` | GET | Wired (Settings World tab, fetch on tab open) |
| `/api/game/:id/snapshot` | POST | Wired (Settings World tab, save + share with visibility control) |
| `/api/bug-report` | POST | Not yet |
| `/api/suggestion` | POST | Not yet |

---

## Deferred Items

Items flagged for post-launch or future sessions. Not blocking progress.

### Design
- ~~Mobile responsiveness pass on all pages~~ Marketing & pre-game pages done (2026-03-29). `/play` game layout still pending.
- Genre-adaptive backgrounds (game layout adapts to story genre)
- Custom difficulty badge color logic
- ~~Interactive node map~~ (done: MapTab rewrite 2026-03-19)
- Community section on main menu
- Tutorial card on main menu

### Content
- FAQ page: needs to be built
- ~~Rulebook page~~ (done: 22-section rulebook at /rulebook, 2026-03-19)
- Legal pages: ToS and Privacy Policy starter drafts
- In-game rulebook: stripped version without marketing chrome
- Copy audit on Init Wizard and Game Layout pages

### Features
- Game creation flow from /menu (POST /api/games/new, then navigate to /init?gameId=...)
- Saved games page API wiring (real data instead of mock)
- Free trial risk strategy (what happens when turns run out)
- Ambient sound toggle
- Achievement system
- Share Your Story / export features
- Stream/watch mode
- Multi-language support

### Polish
- Particle animation performance optimization
- Page transition animations between routes
- Skeleton loading states for sidebar tabs while data fetches
- A/B/C/D keyboard shortcuts for action selection in /play
- Landing page: confirm footer opacity is correct (no 0.5 opacity found in code)

---

## Reference Files

| File | Purpose |
|------|---------|
| `docs/design-system.md` | Authoritative design spec (colors, fonts, sizes, components) |
| `docs/FRONTEND_STATUS.md` | This file. Build status, rules, and task tracking. |
| `docs/GameLayout/BUILD_PROGRESS.md` | Backend API layer status and endpoint reference |
| `docs/GameLayout/game-layout-updated.jsx` | Game layout visual mockup (styling reference) |
| `docs/GameLayout/dice-roller-mockup.jsx` | Dice animation component reference |
| `docs/GameLayout/dice-dynamic-sizing-mockup.jsx` | 8-state dice animation flow spec |
| `docs/GameLayout/settings-panel-mockup.jsx` | Settings modal 3-tab structure |
| `docs/GameLayout/journal-tab-mockup.jsx` | Journal/objectives panel reference |
| `docs/GameLayout/debug-panel-mockup.jsx` | Debug drawer 6-tab reference |
| `docs/GameLayout/bug-report-mockup.jsx` | Bug report and suggest modal reference |
| `docs/GameLayout/node-map-v2.jsx` | Interactive node map (deferred) |
| `lib/api.js` | API client with auth token management |
| `lib/useAuth.js` | Auth guard hook for protected pages |
