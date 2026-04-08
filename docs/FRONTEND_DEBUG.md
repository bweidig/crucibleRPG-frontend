# Frontend Debug Log

Tracks bugs investigated in the frontend, what was tried, what worked, and what didn't — so fixes aren't repeated across sessions.

## How to Use
- Add an entry when investigating a bug
- Log what you tried, even if it didn't work
- Mark entries RESOLVED or OPEN
- Reference commit hashes when a fix lands

---

## Log

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
