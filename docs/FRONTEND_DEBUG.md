# Frontend Debug Log

Tracks bugs investigated in the frontend, what was tried, what worked, and what didn't — so fixes aren't repeated across sessions.

## How to Use
- Add an entry when investigating a bug
- Log what you tried, even if it didn't work
- Mark entries RESOLVED or OPEN
- Reference commit hashes when a fix lands

---

## Log

### FE-5: Announcements from /admin don't appear on /menu (2026-04-09) — RESOLVED

**Symptom:** Admin posts an announcement via /admin Settings tab, but players never see the banner on /menu.

**Root cause:** `lib/api.js` `getAnnouncement()` was calling `/api/announcement` — a non-existent endpoint. The API contract specifies `/api/games/announcement` as the public announcement endpoint. The request was silently 404-ing and the `.catch(() => {})` swallowed the error.

**Fix:** Changed the endpoint in `getAnnouncement()` from `/api/announcement` to `/api/games/announcement`.

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
