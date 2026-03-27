# Play Page Rewrite: Build from Scratch

## Context

The current `app/play/page.js` is ~3000 lines of accumulated patches built against assumed API contracts. It does not work reliably. We are replacing it entirely.

**You have three source-of-truth documents. Read all three before writing any code:**

1. `API_CONTRACT.md` (in repo root) — Every endpoint, every field, every type. Verified against backend code as of March 17, 2026. If a field isn't in this document, it doesn't exist.
2. `docs/design-system.md` — Colors, fonts, spacing, WCAG rules. This overrides any colors in the mockup.
3. `game-layout-updated.jsx` (in project knowledge / project files) — The approved visual design. Use this as the design target for component layout, structure, and UX. But use design-system.md for actual color/font values.

**Critical rules:**
- NO mock data. Every piece of displayed data comes from an API call.
- NO assumed field names. Use exactly what API_CONTRACT.md says.
- NO SSE for turn content. All turn data comes from the sync POST response to `/api/game/:id/action`.
- SSE is kept alive ONLY for the `connected` event and `command:response` (non-advancing commands).
- The frontend NEVER calculates game outcomes. It displays what the server sends.
- All stat keys from the API are **lowercase** (`str`, `dex`, etc.). Display them as uppercase in the UI.

---

## File Structure

Split the page into components. Do NOT put everything in one file.

```
app/play/
  page.js              — Main page: data fetching, state management, layout shell
  components/
    TopBar.js           — Header with wordmark, campaign name, sidebar toggle, settings
    TurnTimeline.js     — Turn scrubber bar below the header
    NarrativePanel.js   — Scrollable narrative area (contains TurnBlocks)
    TurnBlock.js        — Single turn: header, dice, resolution, narrative text, status badges, actions
    InlineDicePanel.js  — Dice roll animation/display
    ResolutionBlock.js  — Mechanical resolution (compressed + expandable detail)
    StatusBadge.js      — Condition/inventory/skill change badges
    ActionPanel.js      — A/B/C options + custom text input
    Sidebar.js          — Tabbed right panel container
    CharacterTab.js     — Stats, skills, conditions
    InventoryTab.js     — Equipped/carried items, currency, encumbrance
    NPCTab.js           — NPC cards with disposition
    GlossaryTab.js      — Searchable glossary entries
    MapTab.js           — Location map with routes
    NotesTab.js         — Player notes CRUD
    TalkToGM.js         — Floating button + two-phase interaction
    EntityPopup.js      — Click-for-detail modal (glossary entry + player notes)
    SettingsModal.js    — Display settings (theme, font, text size)
    SessionRecap.js     — "Previously on..." block
```

---

## Page Load Flow

When `/play?gameId=X` loads:

### Step 1: Load game state
```
GET /api/games/:id
```
This returns: storyteller, setting, difficulty, dials, character (with stats/skills/conditions), clock, recentNarrative, sessionRecap.

- If `status` is not `"active"`, redirect to main menu or show an error.
- If `character` is null, redirect to init wizard.
- `character.stats` here uses UPPERCASE keys with `{ base, effective }` objects.

### Step 2: Load supplementary data (parallel, fire-and-forget)
```
GET /api/game/:id/character   — Full character sheet (different shape than /games/:id)
GET /api/game/:id/glossary    — Glossary entries
GET /api/game/:id/map         — Locations and routes
GET /api/game/:id/notes       — Player notes
GET /api/game/:id/state       — Current state snapshot (has availableActions for restoring options on reload)
```

**Important:** The `/character` endpoint returns stats with **lowercase** keys and `{ base, effective, conditions }` nesting. The `/state` endpoint returns stats as flat objects with lowercase keys. The `/games/:id` endpoint returns stats with UPPERCASE keys and `{ base, effective }` nesting. Pick ONE as your primary source and normalize in a transform function.

Recommendation: Use `/game/:id/character` as the primary character data source (most complete). Transform stat keys to uppercase for display.

### Step 3: Establish SSE connection
```
GET /api/game/:id/stream?token=JWT
```
Listen for:
- `connected` — SSE is live
- `command:response` — Non-advancing command results (e.g., status_report)

Do NOT listen for `turn:narrative`, `turn:resolution`, `turn:actions`, `turn:state_changes`, `turn:complete`. These events are not sent. Turn content comes from the sync POST response.

### Step 4: Auto-trigger first turn (if needed)
If `recentNarrative` is empty and `clock.totalTurn` is 0 or falsy, this is a fresh game. Auto-trigger:
```
POST /api/game/:id/action
Body: { custom: "Begin the adventure" }
```
Process the response via the standard turn response handler (Step 5 below).

**Hide "Begin the adventure" from the player.** Either don't add it to the narrative feed, or replace it with something invisible. The player should see the opening narrative without a visible "player action" line.

### Step 5: Turn response handling
All advancing actions return the same shape:
```
POST /api/game/:id/action
Body: { choice: "A" } or { custom: "free text" } or { command: "long_rest" }
```

Response (when `turnAdvanced: true`):
```json
{
  "turnAdvanced": true,
  "turn": { "number": N, "sessionTurn": N },
  "resolution": { ... } or null,
  "narrative": "prose string with real newlines",
  "stateChanges": { conditions, inventory, clock, quests, factions, stats },
  "nextActions": { "options": [{ "id": "A", "text": "..." }], "customAllowed": true }
}
```

When a turn response arrives:
1. Add the turn to the narrative feed (turn number, narrative text, resolution, status changes)
2. Update the action options from `nextActions.options`
3. Update the sidebar data from `stateChanges` (merge, don't replace wholesale)
4. Update clock display from `stateChanges.clock`
5. Update effective stats from `stateChanges.stats` (lowercase keys, flat object of numbers)
6. Scroll the narrative panel to the bottom
7. Clear any loading/submitting state

**resolution can be null** (pure narrative turns like long rest). Handle this gracefully.

---

## Component Specifications

### TopBar
- Left: CRUCIBLE RPG wordmark (Cinzel), separator, campaign/setting name
- Right: Sidebar toggle button, settings gear button
- The setting name comes from `GET /api/games/:id` → `setting` field
- Height: 44px, background: theme bgCard

### TurnTimeline
- Horizontal bar of turn indicators below the top bar
- Each turn is a small rectangle. Current turns are taller/brighter. Bookmarked turns use accent color.
- Show total turn count from clock data
- This is visual polish. Build it but don't block on it. A static bar is fine for v1.

### NarrativePanel
- Scrollable container, max-width 900px centered
- Contains all TurnBlocks in order
- "Talk to the GM" floating button at bottom-right (positioned absolute within the panel)

### TurnBlock
Each turn displays:

**Turn header line:**
- Location (from stateChanges or game state)
- Day number (from clock)
- Time (from clock, format as "HH:MM AM/PM")
- Weather (from clock if available)
- Turn number
- Bookmark star toggle

**Dice roll panel** (if resolution exists):
- Fortune's Balance category: "Matched", "Outmatched", "Dominant"
- From `resolution.fortunesBalance`
- Dice values from `resolution.diceRolled` (array) and `resolution.dieSelected`
- See InlineDicePanel component in mockup for the animation phases

**Resolution block** (if resolution exists):
- Compressed one-line summary: `{action} | {STAT} {statValue} + skill + d20({dieSelected}) = {total} vs DC {dc} | {margin}: {tierName}`
- The stat name comes from `resolution.stat` (lowercase from API, display uppercase)
- Expandable "?" button showing full breakdown:
  - Action, Stat (with value from effective stats), Skill used + modifier, Equipment quality, Fortune's Balance category, Crucible Roll, d20 Roll, DC, Total calculation, Result tier, Debt of Effort
- All resolution fields are in the API contract under `POST /action` response

**Narrative text:**
- `narrative` is a plain string with real newlines (`\n`).
- Replace `\n\n` with paragraph breaks. Replace single `\n` with `<br>`.
- Use the body font at narrative size. Line height 1.72.
- Future: X-Ray entity highlighting. For now, render as plain text.

**Status change badges** (from stateChanges):
- Parse `stateChanges.conditions.added/removed/modified` into badges
- Parse `stateChanges.inventory.added/removed/modified` into badges
- Each badge is clickable (opens EntityPopup in the future)
- Badge types and colors are defined in the mockup's StatusChangeBadge component

**Action options** (only on the LAST turn):
- Render `nextActions.options` as A/B/C buttons
- Below the options: custom text input with submit arrow
- Options use `id` field (values: "A", "B", "C")
- Submit sends `{ choice: "A" }` or `{ custom: "typed text" }`
- Valid choices are A, B, C only. D is NOT valid. Custom input is the "D" equivalent.
- Disable action buttons while a turn is processing (loading state)

### Sidebar
- 6 tabs: Character, Inventory, NPCs, Glossary, Map, Notes
- Tab icons from the mockup's TabIcons object
- Notification badges on tabs when data changes (condition added → Character badge, item added → Inventory badge, etc.)
- Resizable via drag handle on left edge of sidebar
- Collapsible via TopBar toggle button (reading mode)

### CharacterTab
Data source: `GET /api/game/:id/character`

- **Stats:** `stats` object has lowercase keys. Each stat: `{ base, effective, conditions }`. Display stat name uppercase. Show base and effective (effective colored if different from base). Progress bar showing effective/20.
- **Skills:** `skills` array. Show name + modifier. Type is "active" or "foundational".
- **Conditions:** `conditions` array. Show name, stat (uppercase for display), penalty, durationType, escalation. Color-code: CON conditions get red (CON=0 triggers Fate Check).

### InventoryTab
Data source: `GET /api/game/:id/character` → `inventory`

- **Header:** `usedSlots` / `maxSlots` with encumbrance label
- **Currency:** Use `currency.display` (NOT `currency.raw`)
- **Equipped items:** From `inventory.equipped` array. Show name, slotCost, durability/maxDurability bar, materialQuality, qualityBonus.
- **Carried items:** From `inventory.carried` array. Same display.
- **Durability color coding:** 76%+ green, 51-75% yellow, 26-50% orange, 1-25% red, 0% dark red (broken, strikethrough name)

### NPCTab
Data source: Not a dedicated endpoint yet. NPCs may appear in glossary data or game state.
For now: show a placeholder or extract NPC-type entries from glossary.

### GlossaryTab
Data source: `GET /api/game/:id/glossary`

- Searchable list of entries
- Each entry: term, definition, category
- Filter by category via search or dropdown
- Click entry to open EntityPopup

### MapTab
Data source: `GET /api/game/:id/map`

- Show locations with current location highlighted
- Show routes between locations
- `currentLocationId` identifies the player's current position
- `locations[].status`: "current", "discovered", etc.
- `routes[]`: origin/destination (IDs), travelDays, terrain, known
- Use the MiniMap component from the mockup as a starting point

### NotesTab
Data source: `GET /api/game/:id/notes`

- List of player notes with entity name
- "Add note" form: entity type dropdown, entity name/ID, text
- Delete note: `DELETE /api/game/:id/notes/:noteId`
- Create note: `POST /api/game/:id/notes`

### TalkToGM
- Floating button at bottom-right of narrative panel
- Phase 1: User types a question → `POST /api/game/:id/talk-to-gm`
- Response types: command match, rulebook match, no match
- If `canEscalate: true` and no match, show "This will cost a turn. Escalate?" prompt
- Phase 2 (escalation): `POST /api/game/:id/talk-to-gm/escalate` → returns a turn response

### EntityPopup
- Modal overlay when clicking any entity (NPC, location, item, stat, skill, condition)
- Shows glossary definition if available
- Shows durability details for items
- Player notes textarea at the bottom
- Close on overlay click or X button

### SettingsModal
**Display settings only (not game settings):**
- Theme: Dark, Light, Sepia (from THEMES in mockup)
- Font: Lexie Readable, System Default, Alegreya, Georgia, Monospace
- Text size: Small, Medium, Large, X-Large

**Game settings (difficulty dials, storyteller) go in a separate hamburger menu — NOT in this modal.** That's a future feature.

Save display preferences to localStorage. Apply via CSS variables on the root element.

### SessionRecap
- If `sessionRecap` exists in the game state, show it at the top of the narrative panel
- Styled as italic text in a distinct block: "PREVIOUSLY..." header
- Only shows once per session (not on every turn)

---

## API Field Reference (Quick Cheat Sheet)

### Stat keys
- `/api/games/:id` → `character.stats.STR.base` (UPPERCASE, nested)
- `/api/game/:id/character` → `stats.str.base` (lowercase, nested with conditions)
- `/api/game/:id/state` → `character.stats.str` (lowercase, flat number)
- `/api/game/:id/action` response → `resolution.stat` = "cha" (lowercase), `stateChanges.stats.str` = number (lowercase)

### Action options
- Field name: `id` (values "A", "B", "C")
- Submit choice: `{ choice: "A" }` — NOT `{ choice: "a" }`, NOT `{ type: "choice", value: "A" }`
- Submit custom: `{ custom: "text" }` — NOT `{ type: "custom", text: "..." }`
- Submit command: `{ command: "status_report" }`
- Valid choices are A, B, C. D is rejected by the backend. Use `custom` for freeform.

### Currency
- Use `currency.display` (string like "15 coins") for the UI
- `currency.raw` is the underlying number — use only for calculations, never display directly

### Inventory
- `/api/game/:id/character` splits into `equipped` and `carried` arrays with numeric `durability`/`maxDurability`
- `/api/game/:id/state` has a flat `items` array with string `entropy` ("intact"/"worn"/"damaged"/"broken") and `readiness`

### Resolution
- Can be `null` on narrative-only turns (long rest, some commands)
- `resolution.stat` is always lowercase
- `resolution.diceRolled` is an array (usually 1 element for Matched, 2 for Outmatched/Dominant)
- `resolution.dieSelected` is the single die value used
- `resolution.fortunesBalance` is "matched", "outmatched", or "dominant"
- `resolution.crucibleRoll` and `resolution.crucibleExtreme` are null for Matched rolls

---

## Design System Rules

1. **No rgba for text, cards, or borders.** Only solid hex values. rgba is ONLY for overlays, shadows, and modal backdrops.
2. **WCAG 2.1 AA compliance.** All text meets 4.5:1 contrast ratio. Large text and UI components meet 3:1.
3. **Fonts:**
   - Cinzel: headers, labels, buttons, option keys
   - User's chosen body font (default: Lexie Readable): all body text, narrative
   - Alegreya Sans: UI labels, stat names, metadata
   - JetBrains Mono: numbers, dice values, mechanical resolution, timestamps
4. **Theme via CSS variables.** All colors set as CSS variables on the root element. Components use `var(--theme-*)`. Theme switching changes only the root variables.
5. **Read `docs/design-system.md` for exact color values.** The mockup may have older colors. The design system document is the authority.

---

## What NOT To Do

- Do NOT import or reference the old `app/play/page.js` code
- Do NOT create mock/sample/placeholder data objects
- Do NOT use SSE events for turn content delivery
- Do NOT add `turn:narrative`, `turn:resolution`, `turn:actions`, `turn:state_changes`, `turn:complete` SSE handlers
- Do NOT assume field names — always check API_CONTRACT.md
- Do NOT use `currency.raw` for display (use `currency.display`)
- Do NOT use rgba for text or card backgrounds (WCAG rule)
- Do NOT calculate game outcomes (no DC math, no tier calculations, no dice rolling)
- Do NOT hardcode "D" as a choice option (backend rejects it — use `custom` instead)
- Do NOT use `max_completion_tokens` or any AI parameters on the frontend
- Do NOT create or modify BUILD_PROGRESS.md, DESIGN_DECISIONS.md, DEBUG_LOG.md, or TEST_LOG.md (those are backend tracker files)
- Do NOT combine the entire page into a single file. Split into components as specified above.

---

## Auth

All API calls need `Authorization: Bearer <token>` header. The token is in localStorage as `crucible_token`. The API client wrapper at `lib/api.js` should already handle this. Verify it does.

SSE connection uses query param: `?token=<JWT>` (not the Authorization header).

---

## React Strict Mode

Next.js dev mode runs React Strict Mode, which double-fires effects. Use the `cancelled` flag pattern:
```js
useEffect(() => {
  let cancelled = false;
  async function load() {
    const data = await fetchGameState(gameId);
    if (!cancelled) setGameState(data);
  }
  load();
  return () => { cancelled = true; };
}, [gameId]);
```

---

## Error Handling

- All API calls wrapped in try/catch
- All catch blocks log to console.error (never silently swallow)
- Show a user-visible error message if the game state fails to load
- Show a subtle error if a supplementary fetch fails (glossary, map, notes) — these are non-critical
- If an action submission fails, re-enable the action buttons and show the error

---

## Testing Checklist (After Build)

1. Fresh game: Does Turn 1 auto-trigger and display narrative?
2. Player action: Can you click A/B/C and get Turn 2 back?
3. Custom action: Can you type a custom action and submit?
4. Resolution display: Does the roll breakdown show correct values?
5. Sidebar: Do stats, inventory, conditions render from real API data?
6. Currency: Does it show the formatted string (not a raw number)?
7. Page reload: Do narrative and action options restore correctly?
8. Session recap: Does "Previously..." show when resuming a saved game?
9. Multiple turns: Can you play 3-4 turns without errors?
10. Theme switching: Do Dark/Light/Sepia themes apply correctly?
