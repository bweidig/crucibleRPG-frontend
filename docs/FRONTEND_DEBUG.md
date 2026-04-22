# Frontend Debug Log

Tracks bugs investigated in the frontend, what was tried, what worked, and what didn't — so fixes aren't repeated across sessions.

## How to Use
- Add an entry when investigating a bug
- Log what you tried, even if it didn't work
- Mark entries RESOLVED or OPEN
- Reference commit hashes when a fix lands

---

## Log

### FE-8: Backend taxonomy tags leaking in entity definitions (2026-04-21) — RESOLVED (defensive)

**Symptom:** Glossary entries for NPCs showed backend taxonomy tags like `potential_ally` as the first word of the definition. User reported: `"Roric the Fen-Grown"` displayed `potential_ally Gaunt man in his 40s...`.

**Investigation:**
- Source of the leak is the AI narrator — on entity-creation prompts, it emits an internal role tag at the start of the definition string. That's bookkeeping, not player prose.
- Three places render `entity.definition` / `npc.definition` / `match.definition` raw: `GlossaryTab.js:106`, `NPCTab.js:28`, `EntityPopup.js:75`. First fix attempt touched only GlossaryTab — user confirmed the leak still appeared, meaning it was either NPCTab or EntityPopup surfacing it (or the GlossaryTab regex didn't match the actual surface form, e.g. `"potential_ally"` quoted, `potential_ally:` colon-separated).
- Broadened the regex to handle `potential_ally`, `"potential_ally"`, `[potential_ally]`, `potential_ally: ...`, `potential_ally - ...` — all require at least one underscore segment so single lowercase words and Capital-case definitions are untouched.

**Fix:**
- Moved `cleanDefinition` from `GlossaryTab.js` into `lib/renderLinkedText.js` as a named export.
- Applied it in all three render sites: `GlossaryTab`, `NPCTab`, `EntityPopup`.
- Broadened the regex to `^["\[]?(snake_case)["\]]?\s*[:\-]?\s+`.

**Root cause is backend** — narrator prompt should not emit the taxonomy tag in player-facing text. This is a frontend defensive strip. Flag to backend team if they want it fixed upstream.

---

### FE-7: Glossary tab hides action dock / scrolls narrative to top (2026-04-21) — RESOLVED

**Symptom:** Opening the Glossary sidebar tab hid the action dock (it dropped below the visible viewport) and the narrative column scrolled to the top (showing the prologue). Other sidebar tabs didn't trigger this. User asked to compare what was different about GlossaryTab vs the other tabs.

**First-pass fix (insufficient):** Dropped `min-height: 820px` on `.pageContainer` on the theory that short laptop viewports were making the body scroll and hiding the dock on focus. User reported the issue still happened after that fix, so the min-height was related but not the whole story.

**Second investigation — the real root cause:**
Compared GlossaryTab, CharacterTab, NPCTab, InventoryTab. The distinctive thing about GlossaryTab was **how much content it renders** — 20–30+ entries is typical — not the search input or the category filter row. The other tabs show only a handful of items.

The layout bug was in `Sidebar.module.css`:
```css
.tabContent {
  flex: 1;
  overflow-y: auto;
  ...
}
```
This is a flex child inside `.sidebar` (a flex column), and it's supposed to scroll internally when the content is tall. But **flex children default to `min-height: auto`**, which equals the content's intrinsic height. So when `.tabContent` had 2000px of glossary content, its minimum height became 2000px — `flex: 1` couldn't shrink below that, the sidebar itself grew to 2000px to contain it, the grid row on `.mainContent` stretched to match (grid implicit row auto-sizes to the tallest child), `.narrativeColumn` therefore also stretched to 2000px, and the `ActionPanel` at the bottom of the narrative column sat at y≈2000 — far below the viewport.

Tabs like CharacterTab didn't trigger this because their content was short enough to fit in the natural `.tabContent` height.

**Fix:**
- Added `min-height: 0` to both `.sidebar` and `.tabContent` so flex children can shrink below content height and `overflow-y: auto` on `.tabContent` actually engages.
- Added `overflow: hidden` on `.sidebar` as a safety rail.
- Added `contain: layout paint` on `.tabContent` so internal reflows can't cascade to ancestors.

**Lesson:** Any flex child that has `overflow` (and therefore needs to scroll internally) MUST also set `min-height: 0` (or `min-width: 0` for row direction). Without it, the flex child refuses to shrink below its content size, which defeats the whole point of overflow scrolling in a flex layout. This is one of the more common flexbox gotchas and worth a CLAUDE.md note for future components.

---

### FE-6: Debug panel on /play shows no entries (2026-04-18) — OPEN (backend)

**Symptom:** On `/play` with debug mode toggled on, the DebugPanel drawer renders but the entry count stays at 0. No turn cards or API entries appear, even after taking advancing actions.

**Investigation:**
- Walked the full frontend path: `lib/api.js:60-105` sends `X-Debug: true` header when `_debugMode` is true, strips `_debug` from the response body, and invokes `_debugCallback` with a synthesized entry. `app/play/page.js:151-169` registers the callback and pushes each entry onto `debugLog`, which feeds `<DebugPanel entries={debugLog} />`.
- useEffect ordering is fine: the debug registration effect (line 151) runs before the game-load effect (line 503), so `_debugCallback` is set before any API call fires.
- Verified via browser DevTools Network tab: the request does include `X-Debug: true` in the request headers, but the response body has no `_debug` object at the top level. So the frontend is doing its part — the backend simply isn't attaching the payload.

**Root cause (suspected):** Per `docs/API_CONTRACT.md:1407` and AD-487, the backend only attaches `_debug` when the authenticated user has both `isPlaytester: true` AND `isDebug: true`. The most likely cause is that the user's `isDebug` flag got toggled off on the backend, or the cached JWT / `crucible_user` in localStorage is stale relative to the DB. The Sidebar "Debug" toggle shows based on the cached `getUser().isDebug`, so the UI can look fully debug-enabled while the backend disagrees.

**Next steps for the user:**
1. Log out and sign back in (refreshes JWT + cached user).
2. If that doesn't fix it, check `/admin` → Users → own user → confirm "Playtester: Yes" and "Debug: Yes". Toggle Debug on if needed, then re-login.
3. If both flags are correct and `_debug` still doesn't come back, the fix is in the backend repo (something dropped the `_debug` attach step) — not this terminal.

**Status:** OPEN pending user verification of backend user flags. No frontend code change needed.

---

### FE-5: Announcements from /admin don't appear on /menu (2026-04-09) — RESOLVED

**Symptom:** Admin posts an announcement via /admin Settings tab, but players never see the banner on /menu.

**First-pass fix (insufficient):** `lib/api.js` `getAnnouncement()` was calling `/api/announcement` — a non-existent endpoint. Changed it to `/api/games/announcement` per the API contract. Also fixed `postedAt` → `updatedAt` on the menu banner and added `console.log/error` on fetch so failures wouldn't be swallowed. The banner still never appeared — the original bug was real but wasn't the whole story.

**Real root cause (2026-04-09, second investigation):** The API contract documents `GET /api/games/announcement` as a JWT-only public endpoint, but **that endpoint is not actually implemented on the backend**. Requests to `/api/games/announcement` are caught by the `/api/games/:id` route handler, which treats the word "announcement" as a game ID.

Production API verification (with a real JWT for a non-playtester test account):
- `GET /api/games/announcement` → `403 {"error":"Your account is pending playtester access."}`
- `GET /api/games/abc` → identical 403 response
- `GET /api/games/999` → identical 403 response

All three hit the same handler, which is the `:id` handler (it checks `isPlaytester` before looking up the game). For a playtester user the request would pass the playtester gate and then fail to find a game with id='announcement', returning 404 or 400 — either way, no announcement data comes back. The `/api/admin/announcement` endpoint works fine (admin can post and read), but there is no corresponding public read endpoint.

**Status:** Frontend is correct per the contract; the fix is on the backend. Either (A) register a dedicated `/api/games/announcement` route BEFORE `/api/games/:id` in the Express router, or (B) mount the public read at a non-colliding path (e.g. `/api/site-announcement`) and update both the contract and `lib/api.js` `getAnnouncement()` to match.

**Frontend state left in place:** `getAnnouncement()` still points at `/api/games/announcement` (matches contract). The `console.log`/`console.error` debug hooks on `/menu` stay until the backend fix is verified in production.

**Final resolution (2026-04-09):** Backend registered the dedicated `/api/games/announcement` route before `/api/games/:id`. Verified working from production — admin posts now appear on `/menu` as expected. No frontend code changes needed.

---

### FE-4: Custom character causes "World generation ran into a problem" (2026-04-08) — RESOLVED

**Symptom:** Custom character backstory causes "World generation ran into a problem" errors on the Character step's Continue click. Template characters work fine. Backend confirms world gen completes successfully in both cases.

**Investigation:**
- The setting POST (`/api/init/{gameId}/setting`) contains NO character data — character is saved separately after world gen completes. The setting endpoint cannot distinguish custom vs template characters.
- World-status polling is identical for both paths — no branching on character fields.
- The init wizard is a single component (`InitWizardInner`). Phase transitions are state changes, not route changes — no remounts, so polling survives step transitions.
- `worldGenStatusRef` is synced from state via `useEffect`, not synchronously. There's a render-cycle gap after `setWorldGenStatus('complete')` before the ref updates.
- **Root cause:** The Phase 2 `handleNext` handler checked `worldGenStatusRef.current` and treated anything other than 'complete' as an implicit pass-through to the overlay. But the real issue was timing: if world gen was still 'generating' when the user clicked Continue, the overlay started, but something in the overlay's world-gen message animation sequence could fail or show the error if timestamps weren't populated yet. Custom characters take longer to fill out (backstory, appearance, personality), so users were more likely to click Continue while world gen was still running.

**Fix:** Changed the Phase 2 handler to explicitly wait for world gen to complete before activating the overlay. Shows "BUILDING WORLD..." on the button and "Finishing world generation…" in gold text while waiting. Only shows the error if polling actually returns 'failed' or times out (180s).

---

### FE-3: `ez` ReferenceError — Play page crash (2026-04-07) — RESOLVED

**Symptom:** `Uncaught ReferenceError: can't access lexical declaration 'ez' before initialization` — crashes the entire /play page.

**Investigation:**
- `ez` not found in any source file — it's a minified variable name in production builds
- No circular imports found in the play page dependency graph
- Root cause: temporal dead zone (TDZ) violation in `app/play/page.js`
  - `handleTurnResponse` (line ~236) referenced `addDirectiveToast` and `refetchDirectiveState` in its `useCallback` dependency array
  - Those `const` declarations appeared ~150 lines later (lines ~390 and ~420)
  - JavaScript hoists `const` declarations but keeps them in the TDZ until the declaration line executes
  - `useCallback` evaluates its dependency array immediately, triggering the TDZ read
  - The minifier shortened one of these variable names to `ez`

**Fix:** Moved all directive handler declarations (`refetchDirectiveState`, `handleDeleteDirective`, `handleRestoreDirective`, `addDirectiveToast`, `dismissDirectiveToast`) above `handleTurnResponse`.

**Lesson:** When adding variables to a `useCallback` dependency array, ensure they're declared ABOVE that callback. `const`/`let` hoisting + TDZ means ordering matters in function components.

---

### FE-2: World snapshots 404 console message (2026-04-07) — NON-ISSUE

**Symptom:** `World snapshots not available: Request failed (404)` appears in browser console while on /play page.

**Investigation:**
- Searched all `/play` files — no world snapshot fetch exists on the play page
- The message comes from `app/init/page.js:2530` which fetches `/api/world-snapshots`
- Init page already catches this gracefully (try/catch → console.log)
- The message persists in the browser console when navigating from /init to /play
- Not a /play bug — console messages from previous pages don't clear on client-side navigation

**Fix:** None needed. Logged as non-issue in Known Bugs table.
