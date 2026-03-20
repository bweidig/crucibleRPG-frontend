# CrucibleRPG Frontend — Status Tracker

**Last Updated:** 2026-03-19

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
| Rulebook | `/rulebook` | Not built | N/A | Page does not exist yet |
| Legal (ToS) | TBD | Not built | N/A | Needs starter draft |
| Legal (Privacy) | TBD | Not built | N/A | Needs starter draft |

**Status definitions:**
- **Complete:** Page renders, styled per design system, all mock/live data displays correctly.
- **API Wired:** Frontend makes real API calls. "Partial" = some endpoints wired, some mock.

---

## Recent Work (This Session: 2026-03-19)

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
| `/api/game/:id/checkpoints` | GET | Not yet |
| `/api/game/:id/snapshot` | POST | Not yet |
| `/api/bug-report` | POST | Not yet |
| `/api/suggestion` | POST | Not yet |

---

## Deferred Items

Items flagged for post-launch or future sessions. Not blocking progress.

### Design
- Mobile responsiveness pass on all pages
- Genre-adaptive backgrounds (game layout adapts to story genre)
- Custom difficulty badge color logic
- ~~Interactive node map~~ (done: MapTab rewrite 2026-03-19)
- Community section on main menu
- Tutorial card on main menu

### Content
- FAQ page: needs to be built
- Rulebook page: needs to be built with full content (12 sections)
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
