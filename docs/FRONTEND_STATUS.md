# CrucibleRPG Frontend — Status Tracker

**Last Updated:** 2026-04-16

> **For Claude Code:** Read this file at the start of every new conversation before responding. After completing any frontend task, update this file with changes to page status, new site-wide rules, copy audit status, bug fixes, or deferred items. When fixing a bug, update its status to "Fixed" and fill in the "Fixed in" column. When discovering a new bug during implementation, add it to the Known Bugs table with the next available FE- number. Keep the "Last Updated" line current.

---

## Page Status

| Page | Route | Status | API Wired | Blocking Issues |
|------|-------|--------|-----------|-----------------|
| Coming Soon | `/` | Complete | Waitlist + auth-check | None |
| Landing | `/landing` | Complete | Auth-aware CTA routing | None |
| Auth | `/auth` | Complete | Google Sign-In | None |
| Main Menu | `/menu` | Complete (redesigned) | Delete games + auto-fetch hero stats | Single-column layout. Snapshots/display settings removed from this page. |
| Init Wizard | `/init` | Complete (reworked) | All 10 endpoints wired | Gracefully skips API when no gameId |
| Loading Screen | `/loading` | Removed (merged into /play) | N/A | N/A |
| Saved Games | `/saved-games` | Removed | N/A | N/A |
| Pricing | `/pricing` | Complete | None (static) | Dollar amounts TBD |
| Game Layout | `/play` | Rewrite Phase 4 | All gameplay + talk-to-gm + notes CRUD | Polish pass pending |
| FAQ | `/faq` | Complete | None (static) | None |
| Rulebook | `/rulebook` | Complete | None (static) | None |
| Legal (ToS) | `/terms` | Complete | None (static) | None |
| Legal (Privacy) | `/privacy` | Complete | None (static) | None |
| Settings | `/settings` | Complete | Partial (display settings localStorage, profile edit graceful fallback) | Subscription section uses mock data |
| Admin | `/admin` | Complete | All admin endpoints wired | Not discoverable from UI (direct URL only) |
| Admin Playtester | `/admin/playtest` | Complete | All autoplay endpoints wired | Admin-only, linked from admin dashboard |

**Status definitions:**
- **Complete:** Page renders, styled per design system, all mock/live data displays correctly.
- **API Wired:** Frontend makes real API calls. "Partial" = some endpoints wired, some mock.

---

## Recent Work (This Session: 2026-04-16)

### Admin Playtester: raise autoplay turn cap to 250
Backend bumped `POST /api/admin/autoplay/start`'s `targetTurns` range from 10–100 to 10–250. Frontend change: the Turn Count slider's `max` is now 250 (step stays at 5, default still 30). Default wasn't raised — keeps existing one-click behavior, admins who want long runs drag the slider explicitly.

**Cost estimate made more prominent.** At 250 turns in smart mode the upper bound lands in the $15–$20 range (250 × $0.015 × 4x). The `.costEstimate` text got a size bump (13 → 14px, weight 500 → 600, color lightened from slate to bone) so it reads as a live running total rather than a muted footnote. Added a `.costEstimateHigh` variant (composes from `.costEstimate`, amber color) that kicks in whenever the computed `costMax >= 5` — this way the admin's eye catches the dollar figure before they click Confirm. Threshold chosen arbitrarily: $5 is the point where an accidentally-long run starts to feel expensive relative to a normal $1–2 run.

**Not done this pass.** The backend team flagged that the in-memory run map orphans runs on server restart, and that 1–3 hour 250-turn runs are more likely to hit this. Did not add a "stale in-progress" badge on the run list (they suggested "consider" rather than "ship") — flagging here in case we want to follow up: we could mark `status === 'running'` rows as suspect when `startedAt` is older than, say, 4 hours, with a tooltip linking to the backend restart caveat.

**API_CONTRACT.md updated** — `targetTurns` range documented as 10–250.

**Files modified:** `app/admin/playtest/page.js`, `app/admin/playtest/page.module.css`, `docs/API_CONTRACT.md`
**Files synced:** `claude-upload/admin-playtest-page.js`, `claude-upload/admin-playtest-page.module.css`, `claude-upload/API_CONTRACT.md`, `claude-upload/FRONTEND_STATUS.md`

---

### Admin Playtester: bot mode selector + run-list mode column (AD-625 frontend relay)
Backend AD-625 added a `botMode` toggle to the autoplay engine (`"cheap"` = Gemini Flash Lite, default; `"smart"` = Gemini Flash with moderate thinking budget, ~3–5x cheap per-turn cost). The autoplay admin UI now surfaces that choice on three surfaces.

**1. New-run form — "Bot Intelligence" pill group.** Added a new field in `ConfigPanel` at `/admin/playtest`, placed after Turn Count so the cost estimate and the control that moves it sit adjacent. Matches the existing `pillGroup` pattern used by Play Style — two pills (Cheap / Smart) inside the shared bordered container, with selected-state colors that match the badges below: slate for Cheap, violet (`#a895d6`) for Smart. Helper text under the pills explains each mode ("Flash Lite. Fast, low-cost…" / "Flash. More realistic play, higher cost…"). Default selection: `cheap`, preserving pre-AD-625 behavior. The `botMode` field is now included in the `startAutoplay` POST body alongside `playStyle`, `archetypeId`, etc. When Smart is selected, a persistent amber callout renders below the config grid: "Smart mode runs cost substantially more per turn — budget accordingly." The confirm bar also mentions mode ("Start Normal run in Sword & Soil for 30 turns on Smart bot?") so the admin sees it before clicking Confirm.

**Cost estimate updates with mode.** The existing `Est. cost: $X.XX – $Y.YY` readout now multiplies by 4x when `botMode === 'smart'` (midpoint of backend's 3–5x guidance), so the displayed range tracks the selected mode.

**2. Run History table — new Mode column.** Added a Mode column between Style and Turns. Bumped `grid-template-columns` from 10 cols to 11 (inserting a fixed 72px Mode cell) and bumped the `min-width` from 960px to 1032px — the table already has `overflow-x: auto`, so narrow viewports scroll horizontally as before. Each row renders `<span className={botModeBadge(run.botMode)}>{botModeLabel(run.botMode)}</span>`: cheap uses `.badgeCheap` (slate on dark slate, same palette family as the Cancelled status badge), smart uses `.badgeSmart` (violet on dark violet). Neither green (success) nor red (error) is used, per the spec.

**3. Active Runs + Run Detail.** Active run cards show the mode badge inline next to the play-style badge. The run detail panel's summary grid gets a new "Bot Mode" tile, positioned right after "Difficulty" so configuration fields cluster. When the selected run is smart-mode, the same amber "per-turn costs are higher than cheap mode baselines" callout renders above the Diagnostic Flags section so cost comparisons across runs are read in context.

**Defensive handling for pre-AD-625 runs.** Added a `normalizeBotMode(mode)` helper that treats anything other than `"smart"` as `"cheap"`. Every badge/label call routes through `botModeBadge`/`botModeLabel` which use the normalizer, so older runs (where the backend response may not include `botMode`) render as Cheap without breaking. Matches the backend contract: "If omitted, the backend defaults to cheap."

**API_CONTRACT.md updated.** `POST /api/admin/autoplay/start` request body documents `botMode` (optional, defaults to cheap). Run list and detail responses document the new `botMode` field. The `GET /runs/:id/progress` polling shape wasn't updated — polling only carries in-flight progress metadata and the mode was decided at start time, so the admin can rely on the initial list/detail shape for that value.

**Backend verification deferred.** This terminal can't reach the Railway backend to live-probe the response shape (admin endpoints are JWT-gated and the backend repo is separate per CLAUDE.md). Implementation assumes the task description's claim that AD-625 is live on production. If `botMode` is absent from the response, the defensive `normalizeBotMode` helper still renders everything as Cheap — so the UI degrades cleanly, and we'll know the backend hasn't shipped if every run in the list is tagged Cheap including ones submitted with Smart.

**Files modified:** `app/admin/playtest/page.js`, `app/admin/playtest/page.module.css`, `docs/API_CONTRACT.md`
**Files synced:** `claude-upload/admin-playtest-page.js`, `claude-upload/admin-playtest-page.module.css`, `claude-upload/API_CONTRACT.md`, `claude-upload/FRONTEND_STATUS.md`

---

### Admin Playtester: fix archetype selection being silently ignored
The archetype dropdown on `/admin/playtest` was non-functional — picking "Hedge Knight" would still produce a randomly-chosen archetype. Two bugs compounded:

1. **Payload key mismatch.** `ConfigPanel.handleConfirm` was POSTing `{ archetype, difficulty }`, but per `docs/API_CONTRACT.md` the backend expects `{ archetypeId, difficultyPreset }`. The unknown keys were dropped server-side, so `archetypeId` fell through as null and `pickArchetype(setting, null)` picked randomly from the pool. `difficultyPreset` similarly defaulted.
2. **Option value was the display name, not the id.** Even after renaming the payload key, the `<select>` was emitting `"Hedge Knight"` as the option value. The backend matches against ids like `"hedge_knight"`, so the match would still fail.

Fix: renamed the payload keys to `archetypeId` / `difficultyPreset` (lowercased to match the contract's `forgiving|standard|harsh|brutal` shape, consistent with how `playStyle` is already lowercased on the adjacent line), and changed the archetype `<option>` to `<option value={a.id}>{a.name}</option>`. The `archetype` state already held the raw value emitted by the option, so it now carries the id end-to-end.

**Files modified:** `app/admin/playtest/page.js`, `claude-upload/admin-playtest-page.js` (synced)

### Admin Game Log: wrap turn scrubber + broaden cost tally AI-call detection
Admin reported two issues on the Game Log tab for long playthroughs: "events and snapshots and server log do not wrap and as such turns disappear off screen for long games" and "the cost tally also does not appear to be displaying correctly: it is showing straight zeros. zero ai calls, zero tokens, zero $".

**1. Turn scrubber wrapping.** The `.turnScrubber` class (shared by the Events & Snapshot sub-tab, the Server Logs sub-tab, and the playtester Run Detail panel's embedded Server Logs viewer) was a single-row flex container with `overflow-x: auto` and a thin 4px horizontal scrollbar. For any game past ~40 turns the later-turn buttons scrolled off the right edge and the scrollbar was almost invisible — turns effectively disappeared. Fix: dropped `overflow-x: auto` and added `flex-wrap: wrap` so the row wraps onto as many lines as the game needs. All three places that use this class (admin Game Log Events view, admin Game Log Server Logs view, `/admin/playtest` run detail Server Logs view) share the fix because ServerLogsPanel already imports `app/admin/page.module.css`.

**2. Cost Tally showing zeros.** `turnCostTally` (and `turnSummary`) were strictly matching `event_type === 'ai_call'` to decide which events to aggregate, and `extractAiMetrics` only looked at a narrow set of field names (`input_tokens`/`inputTokens`/`tokens.input|prompt`, `cost`/`totalCost`/`estimatedCost`). When the backend emits cost/token data under a different event type name (`narrative_generated`, `classifier_call`, `gm_call`, etc.) or nests usage inside an Anthropic-style `usage: { input_tokens, output_tokens }` blob, the tally saw zero matches and rendered $0 for every row.

Fix: broadened `extractAiMetrics` to also accept `usage.input_tokens`/`usage.prompt_tokens` (Anthropic + OpenAI SDK shape), `usage.output_tokens`/`usage.completion_tokens`, and `cost_usd`/`costUsd` aliases. Added a small `hasAiMetrics(m)` helper that returns true if any of `model`, `inT`, `outT`, `cost` is present. Both `turnCostTally` and `turnSummary` now count an event as an AI call if its `event_type` is literally `ai_call` **or** `hasAiMetrics(extractAiMetrics(event_data))` is true — so cost/token aggregation stays correct regardless of what event-type label the backend uses. The per-event compact AI stats row (model → in → out → $) got the same treatment, so narrative-generated events that carry metrics now also show the inline summary.

**Files modified:** `app/admin/page.js`, `app/admin/page.module.css`, `claude-upload/admin-page.js` (synced), `claude-upload/admin-page.module.css` (synced)

### Admin Playtester — Server Logs, Narrative Expand, Wider Layout
Three improvements to the auto-playtester diagnostic workflow at `/admin/playtest`.

**1. Server logs inside the run detail panel.** The playtester now has parity with the main admin Game Detail for log-diving. Extracted `ServerLogsPanel` (the pill-bar + shift-click + copy-selected AD-583 viewer) out of `app/admin/page.js` into a new shared file at `app/admin/components/ServerLogsPanel.js` and imported it in both places. The new file carries all its helpers (`groupLogLines`, `relMs`, `isInitEntry`, `turnLabelFor`, `formatLogLineForCopy`, `formatTurnForCopy`, `reqTypeBadgeClass`) and re-uses `app/admin/page.module.css` by importing that module directly — no CSS duplication. On the playtester `RunDetailPanel`, a new "Server Logs (Game #N)" section appears below the turn log whenever `run.gameId` is present on the run (which it always is per API_CONTRACT §Auto-Playtest).

**2. Turn narrative expand UX.** The turn log previously capped narrative text at 40px height plus a 120-char slice, which cut off mid-sentence with no visible indication you could click to see more. Raised the preview to 240 characters and added a proper "▼ Show More" / "▲ Show Less" button in Cinzel gold underneath long narratives. Short narratives (≤240 chars) render in full with no button at all — the affordance only appears when there is actually more to reveal. Body text still toggles on click for users who prefer clicking the text, but there is now a clearly labelled button so the expand behavior is discoverable. Added `.narrativeExpandBtn` class to `admin/playtest/page.module.css`.

**Full narrative fetch.** `turn.narrativeSnippet` is already backend-truncated to ~300 chars, so even with the "Show More" button the expanded text was still clipped. `RunDetailPanel` now fires an additional `getAdminGameNarrative(run.gameId)` request once the run detail loads, groups entries by `turnNumber` (joining multi-entry AI turns with `\n\n` — same grouping pattern as the main admin Game Detail), and stores the map as `fullNarratives` state. The render picks the full text when available and falls back to the snippet during the brief window before the fetch resolves or if the fetch fails. Expanding a turn now reveals the complete narration.

**3. Wider detail panel + reading mode.** The run detail push panel widened from 480px to 760px so the narrative preview and the new server logs viewer have meaningful horizontal room. The outer page layout (header and main content wrapper) stays at the original 1280px cap — only the panel is wider. Run history is hidden whenever a run is selected (the detail panel takes the focus) so its 960px-min-width grid doesn't cause a horizontal scroll bar when the main content shrinks to fit the wider panel. Config and Active Runs stay visible. New intermediate breakpoint at ≤1439px steps the panel down to 560px, and ≤1023px steps it further to 420px.

**Reading mode:** when the user clicks "Show More" on any turn narrative, the detail panel transitions to `min(1200px, 80vw)` so long paragraphs actually have room to breathe — no more five-word-wide columns. `RunDetailPanel` computes `anyExpanded = Object.values(expandedTurns).some(Boolean)` and pushes it up to `PlaytestPage` via a new `onReadingModeChange` callback. While any narrative is expanded the page lifts the outer wrapper's `maxWidth` to `'none'` and the panel gets a `.pushPanelWide` class (added after the pushPanel media query overrides so it wins at every breakpoint). The main content stays visible beside the wide panel and flex-shrinks into whatever space is left. Collapsing the last expanded narrative or closing the panel resets reading mode and restores the original layout. CSS transition on `width` (250ms ease) smooths the widen/shrink.

**Files modified:** `app/admin/page.js`, `app/admin/playtest/page.js`, `app/admin/playtest/page.module.css`
**Files created:** `app/admin/components/ServerLogsPanel.js`
**Files synced:** `claude-upload/admin-page.js`, `claude-upload/admin-playtest-page.js`, `claude-upload/admin-playtest-page.module.css`, `claude-upload/admin-ServerLogsPanel.js`, `claude-upload/FRONTEND_STATUS.md`

---

### Admin User Detail — Delete Account Button (AD-585)
Added a red "Delete Account" button to the admin user detail panel (`app/admin/page.js`), wired to `DELETE /api/admin/users/:id`. Sits in a new "Danger Zone" section at the bottom of the detail panel, below the user's Games list — admin can see any games in the way before they even open the confirm dialog.

**Confirmation dialog.** New `DeleteUserModal` component that mirrors the existing `DeleteGameModal` pattern exactly (same `deleteModal`/`deleteModalCard` classes, same type-to-confirm UX, same shake-on-mismatch, same red "Delete Forever" button). Confirm word is the user's email since it's the most unique/unambiguous identifier — an admin would have to type it exactly to proceed. Escape key cancels. Disabled when currently-logged-in admin tries to delete their own account.

**Error handling covers all documented status codes.** On `400` with `gameCount > 0` the dialog shows an inline message like "This user still owns 3 games. Close this dialog and delete their games from the Games list above, then try again." On `404` the admin is returned to the users list, the list is refreshed, and a red banner says "User not found. The list has been refreshed." On `500`/network error the dialog stays open with a generic "Something went wrong. Please try again." message so the admin can retry. On success the detail panel closes, the user is removed from the local list, and a green banner says "Deleted {name}." Banners auto-dismiss after 3.5s (success) / 5s (error) via a `useEffect` hook.

**API plumbing.** Added `deleteAdminUser(userId)` to `lib/adminApi.js` wrapping `DELETE /api/admin/users/${userId}`. Also added `err.body = data` to the shared `request()` function in `lib/api.js` so error callers can read structured fields like `gameCount` off the response body — previously only `err.status` and `err.message` were exposed, which wasn't enough to show the game-count-specific error copy.

**Files modified:** `app/admin/page.js`, `lib/adminApi.js`, `lib/api.js`
**Files synced:** `claude-upload/admin-page.js`, `claude-upload/lib-adminApi.js`, `claude-upload/lib-api.js`, `claude-upload/FRONTEND_STATUS.md`

---

### Snapshot Landing Page Heading + Save Snapshot Name Pre-fill — use worldName
Two related changes that lean on the new `worldName` field coming from the backend on the snapshot preview and game state responses.

**Snapshot landing page heading (`app/snapshot/[token]/page.js`).** The main card heading now shows `snapshot.worldName` (e.g. "The Fraying Throne") as the large Cinzel title when it is present, with `snapshot.name` ("Sword & Soil — Turn 1") rendered below it as a smaller muted Alegreya Sans subtitle. When `worldName` is null the heading falls back to the previous behavior (snapshot.name as the title, no subtitle). The Setting row in the metadata table below is now suppressed whenever `worldName` is shown as the heading — the setting is already visible inside the snapshot name subtitle, so the row was redundant. When `worldName` is null, the Setting row still renders.

**Save Snapshot name pre-fill (`app/play/components/SettingsModal.js`).** The World tab's Save Snapshot name input was pre-filling with `"{setting} — Turn {n}"`. It now uses `gameState.worldName` when present and falls back to the setting otherwise, so a shared snapshot from a named world arrives on the landing page with a subtitle like "The Fraying Throne — Turn 42" instead of just "Sword & Soil — Turn 42". Added a `worldLabel` helper in `WorldTab` (`gameState?.worldName || campaignName`) and the snap name `useState` now reads from it. Share-handler snapshot name is unchanged.

**API contract:** `docs/API_CONTRACT.md` updated — `GET /api/games/snapshots/:token` response now documents a `worldName` field (nullable) and notes how frontends should render it.

**Files modified:** `app/snapshot/[token]/page.js`, `app/play/components/SettingsModal.js`, `docs/API_CONTRACT.md`
**Files synced:** `claude-upload/snapshot-page.js`, `claude-upload/play-full.js`, `claude-upload/API_CONTRACT.md`, `claude-upload/FRONTEND_STATUS.md`

---

### Save Snapshot — Description Field
Added an optional description field to the "Save World Snapshot" section on the `/play` settings panel World tab (`app/play/components/SettingsModal.js`). New "Description (optional)" label and textarea (3 rows, max 500 chars) sit between the existing name input and the Save button, with placeholder "Describe this world for future you or other players..." and a JetBrains Mono character counter ("X characters remaining") that turns orange when ≤ 50 characters remain — same pattern as the storyteller custom directive counter. New `snapDescription` state defaults to empty (no pre-fill). `handleSaveSnapshot` now sends the trimmed description in the POST body (or `null` when empty), replacing the previous hardcoded `description: null`. Backend already accepts the field per existing API contract — no backend change needed.

**Files modified:** `app/play/components/SettingsModal.js`
**Files synced:** `claude-upload/play-full.js`, `claude-upload/FRONTEND_STATUS.md`

---

### Share Snapshot — Drop "(shared)" Suffix
The share flow in `SettingsModal.js` previously created snapshots with `name: \`${campaignName} (shared)\``, which baked the literal "(shared)" suffix into the stored snapshot name. On the shared-snapshot landing page, the heading then showed "Sword & Soil (shared)" below the already-present "SHARED WORLD" label — redundant. The `/snapshot/[token]/page.js` heading always rendered `snapshot.name` as-is, so the fix had to happen at the CREATION site, not at display. Changed the share handler to post `name: campaignName` unchanged. New snapshots get a clean name; existing snapshots in the DB still carry the suffix and would need a rename through the snapshot management UI or a one-off cleanup.

**Files modified:** `app/play/components/SettingsModal.js`
**Files synced:** `claude-upload/play-full.js`, `claude-upload/FRONTEND_STATUS.md`

---

### Snapshot Landing Page — Faction & Location Names
Backend now returns `factionNames` and `locationNames` (string arrays) on `GET /api/games/snapshots/:token`. Added a new "names" zone to the snapshot preview card on `app/snapshot/[token]/page.js`, sitting between the stat counts row and the metadata table. Renders a small Cinzel uppercase "FACTIONS" / "LOCATIONS" label (matching the StatBlock label style) with the names below as a single comma-separated Alegreya Sans line in muted blue-gray (#b0bec5). Each section is conditional — empty arrays render nothing — and if both arrays are empty the card layout falls back to the original two-zone (counts → details) appearance with no extra divider. The metadata table's existing `border-gold-faint` top border doubles as the divider between the names zone and the details zone, giving the card three visual zones when names are present.

**Files modified:** `app/snapshot/[token]/page.js`
**Files synced:** `claude-upload/snapshot-page.js`, `claude-upload/FRONTEND_STATUS.md`

---

### Snapshot Landing Page + Init Wizard Snapshot Import Fix
Two related snapshot bugs fixed in one pass.

**Bug 1 — Shared snapshot share URL 404'd.** Players sharing a world via snapshot got a link like `/snapshot/{shareToken}`, but that route didn't exist. Built a new public landing page at `app/snapshot/[token]/page.js` that fetches the preview via `GET /api/games/snapshots/{token}` (no auth required) and shows a card with world name, description, setting, storyteller, faction/NPC/location counts, snapshot type, creator, and date. "Import This World" button routes logged-in players through `POST /api/games/snapshots/{token}/import` then `/init?gameId={newGameId}`; logged-out players get bounced to `/auth?redirect=/snapshot/{token}` so they can sign up first and return. 404 from the preview fetch shows "This world is no longer available" with a back-to-home link. Import failures render inline and leave the button available to retry. Uses NavBar + Footer + ParticleField for site consistency, CSS variables throughout, no rgba for text/borders.

**Bug 2 — "Your Worlds" in init wizard sent through setting save.** When a player picked a saved snapshot from "Your Worlds" in Phase 2 (Settings), the Continue handler called `saveSetting()` which POSTed the snapshot's display name (e.g. "Sword & Soil") as a `selection` value to `/api/init/:gameId/setting`. The backend rejected it as an invalid setting identifier. Fixed by intercepting the snapshot path in `handleContinue` case 1 before `saveSetting()` is reached: calls `POST /api/games/snapshots/{snapshotId}/import-mine`, fire-and-forgets a `DELETE /api/games/{oldGameId}` for the abandoned init game, clears the `crucible_init_gameId` session key, and `router.replace`s to `/init?gameId={newGameId}`. The existing init resume logic then walks the new game's phase markers and lands the player at character creation (Phase 2). Import failures keep the current game intact and surface the error via the standard error banner.

**API helpers added:** `fetchSnapshotPreview(token)`, `importSharedSnapshot(token)`, `importMySnapshot(snapshotId)` in `lib/api.js`.

**Files created:** `app/snapshot/[token]/page.js`
**Files modified:** `lib/api.js`, `app/init/page.js`
**Files synced:** `claude-upload/lib-api.js`, `claude-upload/init-page.js`, `claude-upload/snapshot-page.js`, `claude-upload/FRONTEND_STATUS.md`

---

## Recent Work (Previous Session: 2026-04-11)

### Rulebook Content Update to v3.0
Updated the entire rulebook page content from v2 to v3.0 (24 sections, up from 22). New sections: Stealth (09), Companions (19), Traps/Locks/Puzzles (21). Sections reordered (Storytellers/Settings/Difficulty moved to 02). Significant content updates to Skills, Supernatural Abilities, Survival & Recovery, and Exploration & Travel. All styling, scroll-spy, and interactive behavior preserved.

**Files modified:** `app/rulebook/page.js`
**Files synced:** `claude-upload/rulebook-page.js`

---

### Require Backstory on Character Creation (Phase 3)
Continue button now requires a backstory concept in addition to a name. Selecting an archetype counts (backstory is pre-filled). Custom mode requires the player to write something. Hint text shown below empty backstory field.

**Files modified:** `app/init/page.js`
**Files synced:** `claude-upload/init-page.js`

---

### Auto-Playtester Display Fixes
Fixed tier badges not showing (coerce to Number), latest action text from progress polling (read `latestTurn.botAction`), table column overlap (wider grid with horizontal scroll), and cost extraction in game log (shared `extractAiMetrics` helper for nested field patterns).

**Files modified:** `app/admin/playtest/page.js`, `app/admin/playtest/page.module.css`, `app/admin/page.js`
**Files synced:** `claude-upload/admin-playtest-page.js`, `claude-upload/admin-playtest-page.module.css`, `claude-upload/admin-page.js`

---

### Admin Game Detail — NPCs Section
Added an NPCs section to the admin game detail panel, lazy-loaded when the panel opens.

- NPC count badge in section header (e.g., "NPCs (7)")
- Each NPC is an expandable card (collapsed by default) showing name, tier badge, disposition badge, wound state badge (color-coded), alive/dead indicator
- Expanded view: stats grid (2-col), durability bar with percent fill (color matches wound state), combat profile (intelligence, morale, break behavior, awareness, resistances/weaknesses as colored tags), capabilities/passives/innate traits as tag lists, voice print snippet
- Dead NPCs visually dimmed (opacity 0.5), "No combat yet" shown when durability is null
- New `getAdminGameNpcs(gameId)` API wrapper added

**Files modified:** `app/admin/page.js`, `lib/adminApi.js`
**Files synced:** `claude-upload/admin-page.js`, `claude-upload/lib-adminApi.js`

---

### Admin Auto-Playtester Page (`/admin/playtest`)
New admin-only page for configuring, launching, monitoring, and reviewing automated playtest runs.

- **Config Panel:** Play style toggle pills (Normal/Chaotic/Adversarial), setting/storyteller/archetype/difficulty dropdowns, turn count slider with estimated cost, confirmation step before launch
- **Active Runs:** Live cards showing character info, play style badge, progress bar, flag count, latest action text, cancel button. Polls every 4s per active run.
- **Run History:** Table of completed/failed/cancelled runs with status badges, character info, turns, flags, cost, duration, end reason. View and Delete actions with confirmation modal.
- **Detail Panel:** Inline push panel (same pattern as admin game detail) showing full run summary, diagnostic flag breakdown (color-coded by severity), and scrollable turn log with tier badges, flag badges, expandable narrative, and error display.
- **API Client:** 7 new autoplay endpoint wrappers added to `lib/adminApi.js`
- **Navigation:** "Auto-Playtester" link added to admin dashboard header nav
- **Auth Guard:** Same pattern as `/admin` — redirects non-admins to `/menu`

**Files created:** `app/admin/playtest/page.js`, `app/admin/playtest/page.module.css`
**Files modified:** `app/admin/page.js`, `lib/adminApi.js`
**Files synced:** `claude-upload/admin-playtest-page.js`, `claude-upload/admin-playtest-page.module.css`, `claude-upload/admin-page.js`, `claude-upload/lib-adminApi.js`

---

### Admin Game Log — Running Cost Tally + Multi-Turn Select
Added a collapsible "Cost Tally" table and multi-turn selection to the Game Log tab.

**Running Cost Tally:**
- New `turnCostTally` useMemo computes per-turn cost breakdown (AI calls, input/output tokens, cost) from the bulk events array, plus a running cumulative sum
- Collapsible section sits between the turn scrubber and the type filters
- Table columns: Turn, AI calls, Input Tokens, Output Tokens, Cost, Running Total
- Grand total shown in the collapse toggle label and in a footer row

**Multi-Turn Selection:**
- Converted `selectedTurn` (single number) to `selectedTurns` (Set) for multi-select
- **Click** a turn button to select a single turn (replaces selection)
- **Shift+Click** to range-select all turns between the last clicked and the current
- **All** button selects every turn; **Clear** button deselects (appears when 2+ selected)
- Live selection label shows "Turn 5", "Turns 3–8 (6 turns)", or "4 turns selected"
- Events column shows combined events from all selected turns; Turn Summary aggregates across the selection
- Snapshot column only shows for single-turn selections (shows guidance message for multi)
- Per-turn fetch (`?turn=N`) only used for single-turn selections; multi falls back to bulk events
- Cost tally table rows and turn scrubber buttons both support shift+click

**Files modified:** `app/admin/page.js`
**Files synced:** `claude-upload/admin-page.js`

---

## Recent Work (Previous Session: 2026-04-09)

### Admin Server Logs Viewer (AD-583)
Backend now captures server console output per game per turn into a `server_logs` table. Built the admin UI to view those captures and toggle per-game logging.

**New Game Log sub-tab.** The Game Log tab now has a sub-tab toggle: "Events & Snapshot" (the existing view) vs "Server Logs" (new). Selecting Server Logs renders a `ServerLogsPanel` that fetches `/api/admin/games/:id/server-logs?limit=200` once for the game (Option A from the spec — single fetch, client-side filtering — fine for playtester games under ~100 turns).

**Turn pill bar.** Each captured log entry becomes a pill labeled with the turn number (or "Init" for null/0 turn). A small request-type badge sits inside each pill: blue for `turn`, purple for `init`, red for `error`, gold for `bug_report_flush`, green for `gm_question`, orange for `rewind`. Selection works three ways:
- **Click** a pill to toggle that single entry
- **Shift+Click** another pill to range-select all entries between the previously clicked and the just-clicked turn (numeric turns only — Init pills are never part of a range)
- **Select All / Clear** buttons act on every pill

A live label below the bar reads "Selected: Turn 14", "Selected: Turns 7–12 (6 turns)" (when contiguous), or "Selected: 4 entries" (non-contiguous).

**Grouped, collapsible log display.** For each selected entry, a card shows the turn header (label, request-type badge, captured-at timestamp, line count) plus a `[Copy Turn]` button. The lines themselves are bucketed by `[tag]` prefix into named groups: Resolution, Context Curation, AI Call, AI Raw Response, State Changes, Classification, Errors (any line with `level: error`), and Other (everything that doesn't match). Each group is independently collapsible and has its own `[Copy]` button. Errors auto-expand if non-empty; everything else starts collapsed for fast initial render even on 100+ line turns. Inside the `<pre>`, each line shows `+Nms` relative to the first line of that turn, the `[level]`, and the message — color-coded (errors red, warns orange, default tan) in JetBrains Mono.

**Three levels of copy.** Every copy button uses the same plain-text format designed to paste cleanly into a Claude chat:
```
=== Turn 5 (turn) — 2026-04-09 8:15:32 PM ===
+0ms [log] [executeTurn] Starting turn 5...
+234ms [log] [context-curator] L1: 2100 tokens...
```
- **"Copy Selected"** (top-right, prominent gold button): all selected turns, prepended with `Server logs for Game #58, Turns 7–12, captured 2026-04-09:`
- **"Copy Turn"** (per-turn header): just that one turn
- **"Copy"** (per-group): just the lines in that group (e.g. only AI Raw Response)

All buttons swap to `✓ Copied!` for 2s on success. Designed so Ben can grab a slice in one click and drop it into a debug chat without manually selecting log text.

**Game detail toggle.** The Games tab game-detail slide-over now has a "Capture Server Logs" toggle below the View Game Log button. Calls `PATCH /api/admin/games/:id/logging`. Reads current state from `gameDetail.game.loggingEnabled` (with `playerIsPlaytester` / `isPlaytester` fallback fields, since the spec calls out that the backend should return this and it's a backend gap to flag if it doesn't). For playtester games the toggle renders as a non-interactive "always on" indicator with the helper text "Always on for playtester games."

**Empty state.** When no logs exist: "No server logs captured for this game. Logs are automatically captured for playtester games and games with logging enabled. For other games, logs are saved when a bug report is filed."

**Files modified:** `lib/adminApi.js` (added `getServerLogs`, `toggleGameLogging`), `app/admin/page.js` (new `ServerLogsPanel` component, new helper functions for log grouping / formatting / copy text, sub-tab wired into `GameLogTab`, logging toggle added to `GamesTab` detail panel), `app/admin/page.module.css` (sub-tab styles, pill styles, scroller, request-type badges in purple/gold/green/orange/blue, tinyBtn, serverLogPre).
**Files synced to claude-upload:** `lib-adminApi.js`, `admin-page.js`, `admin-page.module.css`.

### Admin Game Log: Turn Summary Card
Follow-up to the per-turn fetch / expand-all change. Admin reported the Railway logs surface "cost per turn, tokens called, classification, etc." that the panel doesn't show — but the data is mostly already in the events, just buried inside individual `event_data` JSON blobs that the admin would have to read one by one.

**Fix:** New `turnSummary` memo aggregates the per-turn events into a Turn Summary card rendered above the individual events list. Pulls from `turnEvents` (the per-turn full-set fetch) when available, falls back to `filteredEvents` otherwise. Surfaces:

- **Totals row:** event count, AI call count, total tokens (in → out), total cost
- **By type:** chip list of `event_type × N` (e.g. `ai_call × 4`, `narrative_generated × 1`), sorted by frequency
- **AI calls:** per-call breakdown — `task_type` / `model` / input tokens / output tokens / cost — pulled defensively from `event_data` (snake_case + camelCase fallbacks since the JSONB shape isn't part of the contract)
- **Classification:** any `classification` or `directive_type` fields found anywhere in the event data, surfaced as chips

The card only renders when a turn is selected and we're not in Errors-Only mode. It's purely a frontend aggregation — no new endpoints, no backend changes. If a Railway log line is *not* persisted to `game_event_log`, the summary still won't show it; that would be a backend logging gap.

**Files modified:** `app/admin/page.js`, `claude-upload/admin-page.js` (synced)

### Admin Game Log: Per-Turn Fetch + Expand-All Default
Admin reported "there is far more information in the railway logs. can we get a complete output for each turn?" Two reasons the panel was sparse compared to Railway:

1. **The bulk endpoint is hardcoded `LIMIT 500`** ordered by `created_at DESC` (per API_CONTRACT line 2536). For any game past ~10–15 turns, earlier turns get truncated and the events panel only shows a slice of what actually happened.
2. **`event_data` was hidden behind per-event "Show data" clicks.** Only the compact AI-call summary (model + tokens + cost) was visible by default; the full JSONB blob — which is where most of the Railway-log-level detail lives — required a click on every single row.

**Fix:**
- **Per-turn fetch.** When a turn is selected (auto-selected on load OR clicked in the scrubber), the panel now fires a second request: `getGameLog(gid, { turn: N })`. The backend already supported the `?turn=` query param via `adminApi.js`. Querying by turn returns the COMPLETE event log for that turn — the LIMIT 500 cap stops mattering because no single turn exceeds that. New `turnEvents` state holds the per-turn results; `filteredEvents` prefers them over the bulk-list client-side filter when present. The panel header shows `full set` next to the count when per-turn data is in use.
- **Expand-all default.** New `expandAll` state, default `true`. When on, every event renders its full `event_data` JSON inline without requiring a click. New "Collapse all / Expand all" pill in the type-filter row toggles it. Per-event "Show data" click-toggling still works when expand-all is off.
- **Errors-Only mode is unaffected** — it still uses the bulk events list because errors span all turns and are rare enough that the cap doesn't matter.

**Files modified:** `app/admin/page.js`, `claude-upload/admin-page.js` (synced)

### Admin Game Log: Empty Events Panel (Field-Name Contract Mismatch)
Admin reported the Game Log tab "doesn't populate with anything." The events panel showed "No events for this selection." even on games that definitely had events.

**Root cause:** Per `API_CONTRACT.md`, the `/api/admin/game-log/:gameId` response uses **snake_case** field names on event records (`turn_number`, `event_type`, `event_data`, `created_at`) — and the contract explicitly notes "Field names on the response match DB column names ... not camelCase." Snapshots, by contrast, use camelCase. The frontend handled `event_type`/`event_data` correctly but read `e.turnNumber` everywhere — which is always `undefined` because the backend sends `turn_number`. As soon as the turn scrubber auto-selected the latest snapshot turn, the events filter `e.turnNumber === selectedTurn` filtered every event out.

**Fix:** Read the documented snake_case fields first, with camelCase fallbacks for safety. Affected sites:
- `loadGame()` — extract turn numbers from events when no snapshots exist
- `turnNumbers` memo — build the union turn list
- `filteredEvents` memo — both the `selectedTurn` filter and the timestamp sort comparator (used `created_at`, not `timestamp`/`createdAt`)
- Event row rendering — `ts` and the errors-only "Turn N" label both used the wrong field

The turn-scrubber and snapshot rendering were already correct because the snapshots endpoint actually does return camelCase.

**Files modified:** `app/admin/page.js`, `claude-upload/admin-page.js` (synced)

### Init Resume: Progressive Phase Gating (FE-8)
Player reported: resumed a save that had quit out on the character screen, wizard jumped straight to Scenario Select and failed. Railway logs confirmed world gen was still running in the background — so the backend state was definitely mid-Phase-1, yet the frontend resumed to Phase 5.

**Root cause:** Same bug class as the Phase 3 stats issue (FE-7), different marker. The backend returns a default value for `game.difficulty` (observed: `"standard"`) even before `POST /difficulty` has been called. My resume logic was checking each phase marker independently — so `hasDifficulty === true` advanced resumePhase to 5 regardless of whether character/attributes had actually been completed.

**Fix:** Progressive gating. Each later phase now ONLY counts as complete if the previous phase was also complete:

```js
if (game.storyteller) { resumePhase = 1; }
if (resumePhase >= 1 && game.setting) { resumePhase = 2; ... }
if (resumePhase >= 2 && game.character) { resumePhase = 3; ... }
if (resumePhase >= 3 && game.clock) { resumePhase = 4; }
if (resumePhase >= 4 && game.difficulty) { resumePhase = 5; ... }
```

No Phase 4 without a real Phase 3, no Phase 5 without a real Phase 4, and so on. This is a defense-in-depth fix: even if the backend starts returning defaults for other fields in the future, the resume can never jump past a phase the player hasn't actually completed.

The existing `[init] Resume decision:` diagnostic log was already in place from FE-7 and didn't need changes.

**Files modified:** `app/init/page.js`, `claude-upload/init-page.js` (synced)

### Announcement Banner Preserves Line Breaks
Admin writes announcements in a `<textarea>` (newlines preserved), but both the `/menu` banner and the `/admin` preview rendered `{announcement.text}` inside a plain `<div>` — HTML/React collapses whitespace by default, so any line breaks disappeared and multi-line announcements became one run-on paragraph.

**Fix:** Added `whiteSpace: 'pre-wrap', overflowWrap: 'break-word'` to both render sites. Preserves typed line breaks without affecting other formatting; `overflowWrap` protects against very long unbroken strings.

**Files modified:** `app/menu/page.js`, `app/admin/page.js`, `claude-upload/menu-page.js`, `claude-upload/admin-page.js` (synced)

### Talk to GM: Three Tabs → Two (Rules + My Story)
Consolidated the Talk to GM panel from three tabs (Rules / My Story / My Directives) down to two. The third tab was redundant — directives are part of telling the GM your story, not a separate concept, and splitting them confused the mental model.

**What moved:**
- Removed the `My Directives` tab button and its rendering block entirely.
- The three narrative quick-prompt chips (`Where can I go?`, `Remind me of my goals`, `What do I know about this place?`) moved from the Rules tab chip row to the top of the My Story tab — they were never rules questions to begin with, and they now hit the free `/talk-to-gm/meta` endpoint instead of the rulebook-lookup-then-escalate flow. The contextual `How do rolls work?` / `How does combat work?` / etc. chip stays on the Rules tab.
- The directives display (Goals, Preferences, Recently Completed with delete/restore controls) was inlined into the My Story tab between the chip row and the result area. It's only rendered when at least one directive exists, so the tab stays clean for new games. Players now see their active directives in the same place they create them.
- `handleAskStory` now accepts an optional `questionText` argument (matching `handleAskRules`) so the new chip buttons can pass a pre-written prompt instead of going through the input field.
- Hint text under the input updated: "Ask about your surroundings, tell the GM your goals, or share preferences. No turn is spent." — frames the tab as handling both preferences and directives.

All existing APIs, handlers, and directive props (`directiveState`, `onDeleteDirective`, `onRestoreDirective`) were reused as-is — no parent page changes needed. Rulebook lookup → GM escalation flow on the Rules tab is untouched.

**Files modified:** `app/play/components/TalkToGM.js`
**Files synced:** `claude-upload/play-full.js`

### /menu Announcement Banner — Larger Type, Design System Colors
Player reported the banner was cramped and the copy was hard to read. Bumped padding from `14px 20px` to `20px 26px`, body text from 14px to 17px, timestamp from 11px to 12px, and the close `×` from 12px to 18px so it's actually tappable. The gold accent stripe went from 3px to 4px to scale with the bigger box.

Also replaced the hardcoded warm-brown background `#1a1814` (which was **not** from the design system and clashed with the cool dark blue palette used everywhere else) with `var(--bg-gold-subtle)` (#13151d), the gold-tinted dark background already in use on the pricing subscription card and CTA hover states. Remaining hardcoded hex values (`#3a3328`, `#c9a84c`, `#c8c0b0`, `#7082a4`) were swapped for their design-system tokens (`--border-card`, `--accent-gold`, `--text-primary`, `--text-muted`) so future palette tweaks flow through automatically.

FE-5 (announcements missing on /menu) and FE-6 (same, viewed as a status-table entry) are both marked resolved — backend deployed the dedicated `/api/games/announcement` route ahead of the `:id` collision, and announcements now reach /menu as intended. The `console.log` debug hooks from the earlier commit were left in place; they can come out on a future cleanup pass.

**Files modified:** `app/menu/page.js`, `docs/FRONTEND_DEBUG.md`, `docs/FRONTEND_STATUS.md`
**Files synced:** `claude-upload/menu-page.js`, `claude-upload/FRONTEND_DEBUG.md`, `claude-upload/FRONTEND_STATUS.md`

### Init Resume: Phase 3 Detection Fix (FE-7)
Player reported: exited the wizard mid-character-screen, refreshed, was placed at Phase 4 (Difficulty) instead of Phase 2/3 — skipped past Attributes entirely.

**Root cause:** The resume logic gated "Phase 3 complete" on `game.character.stats.STR.base > 0`. That was built on a wrong assumption — the backend returns `character.stats` with default values (e.g., 5.0 across the board) as soon as the character row exists (`POST /character`), not just after `adjust-proposal`. So the check fired true mid-Phase-3 and the resume advanced to Phase 4.

**Fix:** Switched the Phase 3 marker to `!!game.clock`. Per API_CONTRACT, `adjust-proposal` is the side effect that initializes `world_clock` (along with scene_state, chronicle, context_budget_config), and GET `/api/games/:id` returns `clock: null` until that happens. That gives a reliable boundary between "character exists" (Phase 3 in progress) and "character finalized" (Phase 4+).

**Also added:** One-shot `console.log('[init] Resume decision:', {...})` that prints `resumePhase` plus the per-marker booleans (`hasStoryteller`, `hasSetting`, `hasWorldName`, `hasCharacter`, `hasClock`, `hasDifficulty`). If another resume-to-wrong-phase bug surfaces, the log tells us which marker was wrong without guessing.

Phase 4 detection (via `game.difficulty`) was left alone — the player landed on Phase 4 rather than skipping all the way to Phase 5, so that marker is correctly null mid-init.

**Files modified:** `app/init/page.js`, `claude-upload/init-page.js` (synced)

### World Gen Poll Timeout Bumped Past Backend Safety Net
The frontend poll count was `>= 60` with a 2000ms interval — effectively 120s, which *matches* the backend's stuck-status safety net (AD-582) exactly. The frontend would give up at the same moment the backend was firing its retryable `failed` response, usually timing out before the response could arrive.

**Change:** Bumped the cap from 60 to 75 iterations → 150s effective. That gives a 30s buffer past the backend's 120s threshold, so the retryable `failed` response reliably reaches the poller and triggers the Try Again UI instead of the generic client-side timeout branch. Custom world gen (40–60s in practice) now has plenty of headroom, and the backend — not this counter — is the authoritative timeout.

**Files modified:** `app/init/page.js`, `claude-upload/init-page.js` (synced)

### Init Wizard — Resume From Correct Phase + Refresh Resilience
Previously, clicking "Continue Setup" on an in-progress game (or refreshing mid-wizard) would dump the player back at Phase 0 (Storyteller) even though all their prior choices were already saved on the backend. The menu was correctly passing `/init?id={id}`, but the init page had an open TODO to read that id's state and jump to the right phase.

**What changed:**
- **Init resume logic** (`app/init/page.js`): new `useEffect` that, when mounted with an existing `gameId`, fetches `GET /api/games/:id` and walks the response to determine the furthest completed phase:
  - `storyteller` set → past Phase 0
  - `setting` set → past Phase 1 (plus: if `worldName` present, world gen is complete; otherwise start polling world-status)
  - `character` exists → past Phase 2 (populates the custom character form from the saved fields)
  - `character.stats.STR.base > 0` → past Phase 3 (adjust-proposal has written stats)
  - `difficulty` set → past Phase 4
  - `status === 'active'` → game is already past init, redirect to `/play` instead
- **Phase 3 edge case:** when resuming *exactly* at Phase 3, the resume effect triggers `generateProposal()` because proposals aren't persisted on the backend — they're normally generated inside the Phase 2→3 overlay which the resume flow skips.
- **sessionStorage refresh resilience:** `crucible_init_gameId` is written whenever the wizard's `gameId` resolves and read on mount before the fallback `POST /api/games/new` path. A mid-wizard page refresh now recovers the gameId even if the URL param was lost. Cleared on successful Phase 5 → `/play` navigation and when the resume fetch 404s (stale/deleted game).
- **Menu NEW GAME buttons** (`app/menu/page.js`): new `startNewGame()` helper clears `crucible_init_gameId` before navigating to `/init`, so clicking NEW GAME after abandoning a prior wizard correctly creates a fresh game instead of resuming the abandoned one. Both the "BEGIN YOUR STORY" empty-state button and the "NEW GAME" button use it. The "CONTINUE SETUP" / "RESUME" path (via `navigateToGame`) was already correct — it was always passing the gameId; the bug was purely on the init side ignoring it.

**Files modified:**
- `app/init/page.js` — resume effect, sessionStorage read/write/clear, `resumedGameId` state
- `app/menu/page.js` — `startNewGame()` helper wired to both new-game buttons
- `claude-upload/init-page.js`, `claude-upload/menu-page.js` (synced)

### Announcements Still Not Appearing on /menu — Diagnosed as Backend Bug (FE-6)
Re-investigated after the previous endpoint fix didn't actually make announcements appear. Used a real JWT against production to hit `GET /api/games/announcement` directly and confirmed it's not a real endpoint — the request falls through to the `/api/games/:id` handler, which returns an identical 403/404 for `announcement`, `abc`, and `999`. The API contract documents it as a public endpoint, but the backend either never implemented it or registered `/api/games/:id` first in the Express router.

Frontend code is correct per the contract and no changes were made to application code this pass. Documentation was updated: FE-5 in `docs/FRONTEND_DEBUG.md` is now marked BLOCKED ON BACKEND with the full investigation, and a new FE-6 row was added to the Known Bugs table. Backend fix options: register a dedicated `/api/games/announcement` route before `/api/games/:id`, or move the public read to a non-colliding path (e.g. `/api/site-announcement`) and update both the contract and `lib/api.js`.

**Files modified:** `docs/FRONTEND_DEBUG.md`, `docs/FRONTEND_STATUS.md`
**Files synced:** `claude-upload/FRONTEND_DEBUG.md`, `claude-upload/FRONTEND_STATUS.md`

### World Gen Retry UI (backend contract: AD-582 timeout safety net)
Backend now returns `{ status: "failed", retryable: true, message: "…" }` when world generation stalls (or otherwise fails with a known recoverable state). Frontend wasn't reading the new fields, so players saw a generic error with no way to recover short of going back and changing setting.

**What changed:**
- `pollWorldStatus` now captures `res.message` and `res.retryable` from failed responses and stores them in `worldGenErrorRef` (sync access) plus a `worldGenRetryable` state flag. The poller already stopped on `status === 'failed'`; no change there.
- The three hardcoded `setError('World generation ran into a problem…')` sites now prefer the backend-supplied message, falling back to the old string when absent (old backend compatibility).
- New `retryWorldGen()` function clears error state, resets timestamps/poll counters, and re-calls `saveSetting()` → `pollWorldStatus()`. Safe because `POST /setting` is idempotent (AD-577) and re-triggers generation on a prior failure.
- New "TRY AGAIN" button in the bottomNav, rendered only when `worldGenStatus === 'error' && worldGenRetryable`. Outlined gold style, distinct from the primary Continue button. Hidden by default so old-backend `failed` responses (no `retryable` field) fall back to current "go back and change setting" behavior.

**Files modified:**
- `app/init/page.js`
- `claude-upload/init-page.js` (synced)

### Scene Visualization Feature
Full implementation of the scene visualization system. Players can generate AI illustrations of their current scene during gameplay, view them in a lightbox, and browse all generated images in a gallery.

**What was added:**
- **Visualize button** in the action panel (paintbrush icon, next to compass) — playtesters only, shows atmospheric loading text while generating
- **Inline scene images** in narrative turns — generated images appear below the narrative text, clickable to expand in lightbox
- **Image lightbox** — fullscreen dark overlay with image, blurb caption, and turn number
- **Gallery modal** — accessible from sidebar footer (image icon), shows all generated images in a 2-column grid with blurb/turn/style metadata
- **Image style settings** in SettingsModal Game tab — preset dropdown (Dark Fantasy, Cyberpunk, Watercolor, Ink & Wash, Comic Book, Oil Painting, Pencil Sketch) + custom freeform text field
- **API integration** — POST /visualize, GET /gallery, GET+PUT /settings/image-style

**Gating:** All visualization features are hidden for non-playtesters (no disabled/locked UI shown). Button, gallery, and settings sections check `isPlaytester`.

**Files created:**
- `app/play/components/ImageLightbox.js` + `.module.css`
- `app/play/components/GalleryModal.js` + `.module.css`

**Files modified:**
- `app/play/page.js` — visualization state, handlers, lightbox/gallery modals, prop passing
- `app/play/components/ActionPanel.js` + `.module.css` — visualize button, loading state
- `app/play/components/TurnBlock.js` + `.module.css` — inline scene image display
- `app/play/components/NarrativePanel.js` — onImageClick prop passthrough
- `app/play/components/SettingsModal.js` — ImageStyleSection (preset dropdown + custom text)
- `app/play/components/Sidebar.js` — gallery button in footer
- `docs/API_CONTRACT.md` — new Scene Visualization section with 4 endpoints

---

### Fix: Announcements Not Appearing on Menu Page
The `getAnnouncement()` function in `lib/api.js` was calling `/api/announcement` instead of the correct `/api/games/announcement` endpoint from the API contract. Classic contract mismatch — admin could post announcements but players never saw them.

- **Files modified:** `lib/api.js`
- **Files synced:** `claude-upload/lib-api.js`

---

## Recent Work (Previous Session: 2026-04-08)

### Init Wizard — Wait for World Gen on Character Continue
Fixed a bug where clicking Continue on the Character step would show "World generation ran into a problem" even when world gen was still in progress. The old code treated any non-complete status (including "still generating") as a failure. Now the handler waits for the polling loop to finish before proceeding — showing "BUILDING WORLD..." on the button and "Finishing world generation…" as an info message in gold. Only shows the error if polling actually returns failed or times out.

- **Files modified:** `app/init/page.js`
- **Files synced:** `claude-upload/init-page.js`

### Right Sidebar Default Width Increase
Increased the default sidebar width on `/play` from 340px to 380px so glossary entries are readable without manual resizing.

- **Files modified:** `app/play/components/Sidebar.js`, `docs/FRONTEND_STATUS.md`

### ParticleField Inside Modals + Summary Chip Truncation Fix
Two visual fixes for the init wizard:

- **ParticleField moved into modals.** Removed the page-level `<ParticleField />` (hidden behind the opaque PhaseModal backdrop, wasting resources). Added ParticleField as an absolute-positioned background layer inside both PhaseModal and FieldModal cards. All content sections get `position: relative; z-index: 1` to render above the particles. Particle wrapper uses `border-radius: inherit` to stay contained within rounded corners.
- **Summary chip truncation removed.** Chips no longer truncate long names with ellipsis (`maxWidth: 140` removed). Text wraps naturally. Chip container uses `flexWrap: wrap` for graceful multi-row layout on narrow screens. Removed per-chip `borderRight` dividers and `title` tooltip attribute.

- **Files modified:** `app/init/page.js`, `docs/FRONTEND_STATUS.md`

### Init Wizard — Three Character/Save Fixes
Three bundled fixes for Phase 2 and the save logic:

- **Fix 1: Character name moved to main Phase 2 view.** Name input was buried inside FieldModals, making it unclear why Continue was disabled after closing the popup. Now renders between the PhaseTitle and path cards, always visible. Name syncs to the other path if that path's name is blank. Card summaries updated: archetype card shows archetype name only, custom card shows "Backstory added" when configured.
- **Fix 2: Custom world setting answers sent to backend.** The Custom path in `saveSetting()` was dropping `settingAnswers`. Added `answers: settingAnswers` to the Custom body. *(Already fixed in prior commit, no change needed.)*
- **Fix 3: Personality fields concatenated before save.** `saveCharacter()` now joins trait pills and freeform text into one `personality` field (joined with `. `). Removed `personalityCustom` and `customPronouns` from the payload since the backend doesn't use them as separate fields.

- **Files modified:** `app/init/page.js`, `docs/FRONTEND_STATUS.md`

### Init Wizard — Phase 3 (Attributes) Restructure + Supernatural Powers Field
Two bundled changes: a new "Powers Beyond the Ordinary?" field in character creation, and a full restructure of Phase 3 (Attributes/Proposal) into a read-only summary with popup actions.

**Part A — Supernatural Powers Field:**
- **New CharacterForm field:** "Powers Beyond the Ordinary?" toggle (Yes/No) inserted after Backstory, before Personality. Selecting "Yes" reveals a freeform textarea for describing the character's powers.
- **State:** `powersFlag` and `powersDescription` added to both `archetypeChar` and `customChar` state objects.
- **Save payload:** `saveCharacter` now sends `powersFlag` and `powersDescription` to the backend. Backend can use these to shape POT stat and supernatural skills in proposal generation. Fields are ignored until backend work is done — no breakage.
- **Archetype behavior:** Archetype selection does NOT pre-fill powers — always a manual player choice.

**Part B — Attributes Restructure:**
- **Read-only Phase4 summary:** Stats display as a clean read-only card (emoji + name + tier + value + bar) with a stat total footer. Innate traits, skills, loadout, factions, inventory slots shown as info cards below.
- **StatEditor component:** Extracted the full stat editing UI (steppers, direct edit, deviation warning) into a standalone `StatEditor` component rendered inside a "Adjust Stats" FieldModal.
- **Requests FieldModal:** Skill and gear request textareas moved into a "Request Changes" FieldModal. Regenerate button in the footer. Auto-closes after successful regeneration.
- **Action buttons:** "ADJUST STATS" and "REQUEST CHANGES" buttons on the summary view open their respective FieldModals. Request Changes button shows an amber dot when there are unsubmitted requests.
- **`attrFieldModal` state:** New state (`null | 'stats' | 'requests'`) tracks which attributes FieldModal is open. Cleaned up on phase transitions.

- **Files modified:** `app/init/page.js`, `app/init/page.module.css`, `docs/FRONTEND_STATUS.md`

### Init Wizard — Phase 2 (Character) Restructure
Restructured Phase 2 (Character) of the init wizard to use the FieldModal popup pattern from Phase 1. The PhaseModal now shows two clean path cards (Archetype and Full Custom), each opening a focused FieldModal for its flow.

- **Dual character state:** Split single `character` state into independent `archetypeChar` and `customChar` objects. Switching between paths no longer leaks data — each path preserves its own name, backstory, personality, appearance, and pronouns independently.
- **Two-card layout:** Phase3 component replaced inline mode toggle, archetype grid, and character form with two tappable path cards. Each shows a summary line (archetype name + character name, or just custom name) when configured.
- **Archetype FieldModal:** Opens with the archetype grid (2-column). Selecting an archetype pre-fills backstory and personality into the archetype form while preserving any name/appearance/pronouns already entered. Character form appears below a separator once an archetype is chosen.
- **Custom FieldModal:** Opens with a blank CharacterForm for freeform character creation.
- **Auto-open:** When no archetypes are available (e.g., Custom world), the Custom FieldModal auto-opens on Phase 2 entry, skipping the single-card screen.
- **Phase transition cleanup:** Both FieldModals auto-close on phase advance. The character→attributes overlay also closes the charFieldModal before activating.
- **Save logic:** `saveCharacter` now reads from the active path's state and only sends `archetypeId` when in archetype mode.

- **Files modified:** `app/init/page.js`, `docs/FRONTEND_STATUS.md`

### Init Wizard — Phase 1 Polish (4 fixes)
Four targeted polish fixes for the Phase 1 settings wizard:

- **Fix 1: "Anything else?" moved inside expanded template** — textarea now renders inside the gold-bordered expanded section of prebuilt world cards (after subTags), instead of below the card where it looked detached. PrebuiltWorldCard now accepts anythingElseText/onAnythingElseChange props.
- **Fix 2: Footer removed** — `<Footer variant="minimal" />` and its import removed from init page entirely. The copyright line was bleeding above the PhaseModal. The modal has its own bottom nav so no page footer is needed.
- **Fix 3: Advanced button made visible** — replaced invisible text link with a bordered card-style button. Includes gear icon, "Factions & NPCs" heading, subtitle, seed count badge, and chevron. Uses selectionCard CSS for hover states. 44px min tap target.
- **Fix 4: Custom world guided questions** — Custom FieldModal now shows Technology (6 options) and Supernatural Elements (4 options) toggle pills above the freeform textarea. Stored in settingAnswers state (same pattern as era questions). Toggles deselect on re-tap.

- **Files modified:** `app/init/page.js`

### Init Wizard — Phase 1 Restructure + FieldModal Foundation
Major restructure of the init wizard layout and Phase 1 (Settings). PhaseModal now serves as the hub with stacked sub-popups (FieldModals) for configuration.

**PhaseModal header:** StepIndicator and summary chips moved from behind the modal backdrop into a pinned header slot inside the modal card. On mobile (<=768px), the full 6-step bar collapses to a compact "Step X of 6" label. Summary chips use smaller fonts on mobile.

**FieldModal component:** New reusable stacked popup for sub-content. Portal-rendered to `document.body` at z-index 20 (above PhaseModal 10/11, below confirmation modal 60). Title bar with close X, scrollable content, optional footer. On mobile, renders as a bottom sheet (anchored to bottom, rounded top corners, max-height 85vh). Backdrop click closes.

**Phase 2 (Settings) restructure:** Phase2 component simplified to just the era grid + Custom/Your Worlds row + Advanced button. All sub-content moved into four FieldModal instances:
- **Era FieldModal:** Prebuilt template cards + "Shape Your Own" SettingQuestions + "Anything else?" textarea
- **Custom FieldModal:** Freeform world description textarea + "Anything else?"
- **Your Worlds FieldModal:** WorldSnapshotList with saved worlds
- **Advanced FieldModal:** AdvancedSeedTab (factions + NPCs)

Each card on the grid shows a brief gold summary when configured (prebuilt name, custom text preview, snapshot name). "Advanced: Factions & NPCs" button below grid shows seed count badge. FieldModals have "Done" footer buttons.

- **Files modified:** `app/init/page.js`, `app/init/page.module.css`
- **New components:** `PhaseModal` (header prop added), `FieldModal`

### Fix: Duplicate Proposal Calls During Init (FE-5)
Added `proposalInFlight` ref guard to `generateProposal()`. The function had no synchronous in-flight check — `proposalLoading` state is async so concurrent calls weren't blocked. Changed catch-block retry from `return generateProposal(true)` to `await generateProposal(true)` so the ref flag stays true through the entire retry chain.

- **Root cause:** No ref guard + async state + built-in auto-retries (empty stats retry + catch retry) = up to 4 API calls per invocation, doubled if called concurrently
- **Files modified:** `app/init/page.js`
- **Bug logged:** FE-5 (fixed)

### Admin Health: AI Fallbacks Card
Added "AI Fallbacks" StatCard to Health tab, positioned after Errors and before Stuck Games. Shows last24h count as the value, with "X this week · Y all time" sub text. Green when 0, amber when > 0. Skipped entirely if backend doesn't return `fallbacks` (backward compat).

- **Files modified:** `app/admin/page.js`

### Inventory: Group Equipped Items by Category
Equipped items in the sidebar Inventory tab are now organized by equipment category instead of a flat list. Groups display in HUD order: Weapons → Armor → Clothing → Gear → Other. Empty groups are hidden. Supports the new backend `clothing` equipment category (worn under armor, zero mechanical effect).

- **Grouping logic:** `EQUIP_GROUPS` constant defines category order with match functions. `groupEquipped()` sorts items into groups; unmatched items fall into "Other" catch-all.
- **Group labels:** Subtle uppercase labels (`equipGroup` CSS class) separate each category.
- **Backwards compatible:** Existing characters without clothing data simply won't show that group.
- **Files modified:** `app/play/components/InventoryTab.js`, `app/play/components/InventoryTab.module.css`

### Admin: Analytics Tab + Report Distiller + GM Questions Browser + GM Costs
Added Analytics tab, Report Distiller, GM Questions Browser, and GM cost display to the admin dashboard.

- **Analytics tab:** New tab with three sections — Game Patterns (StatCards, drop-off bucket bars, top settings/templates ranked lists), Cost Analytics (avg costs, cost trend arrows, monthly projection callout, init/gameplay/GM ratio bar), Engagement (avg turns, significance distribution bar chart, weekly trends with warming indicators).
- **Report Distiller:** Added to top of Reports tab. "Distill Reports" and "Distill GM Questions" buttons with optional filter controls (type, status, date range). Results display as cluster cards with severity badges, report counts, summaries, and "Show reports" links that filter the report list below.
- **GM Questions Browser:** Collapsible section in Reports tab. Shows recent GM questions with game ID (clickable), character/player info, gold-bordered question text, truncatable response, turn/cost/timestamp footer, and refinement badges. Load-more pagination.
- **GM costs in Costs tab:** Extended the init/gameplay cost breakdown line to show GM costs when present.
- **API wrappers:** Added `getAdminAnalytics`, `distillReports`, `distillGmQuestions` to adminApi.js.

- **Files modified:** `app/admin/page.js`, `lib/adminApi.js`

### Init Wizard — Modal Overlay Layout (Redo)
Rebuilt the init wizard modal as a proper `position: fixed` overlay using a `PhaseModal` wrapper component (defined inside `page.js`). The previous attempt used CSS module classes that were not producing a floating overlay in production.

- **PhaseModal component:** Uses `createPortal(…, document.body)` to render directly into `<body>`, bypassing any ancestor CSS (`transform`, `will-change`, `filter`) that breaks `position: fixed`. Waits for client mount via `useState(false)` + `useEffect` before portaling. Renders two fixed layers — backdrop (z-index 10) and centering container (z-index 11) with `pointerEvents: 'none'`. Card inside gets `pointerEvents: 'auto'`. Has its own scroll ref with auto-scroll-to-top via `useEffect([children])`.
- **Card:** Inline styles for layout (`width: 100%`, flex column, overflow hidden). `className={styles.phaseModalCard}` provides `border`, `border-radius`, `max-width: 720px`, `max-height: 85vh` — the properties the mobile media query needs to override.
- **Mobile (<=768px):** CSS override with `!important` makes card full-screen (`max-width: 100%`, `max-height: 100%`, `height: 100%`, no border/radius).
- **Bottom nav:** Phase counter + Continue button moved into `bottomNav` prop, pinned at bottom of card via `flexShrink: 0`.
- **Fade transition:** 150ms opacity wrapper around children preserved inside PhaseModal.
- **Removed:** `modalScrollRef` (PhaseModal manages its own scroll ref), unused CSS rules (`phaseModalBackdrop`, `phaseModalScroll`, `phaseModalNav`, `scrollFade`).
- **Preserved:** Confirmation modal (z-index 60), character overlay (z-index 100), step indicator + summary bar behind backdrop.

- **Files modified:** `app/init/page.js`, `app/init/page.module.css`

### Fix: Init Wizard Crash — setContentFading Not Defined (FE-4)
Fixed a `ReferenceError: setContentFading is not defined` crash in the init wizard. When the modal overlay layout was added, the `contentFading` state was renamed to `modalFading`, but one reference in the world-gen error handler (Phase 2, `handleContinue`) was missed. Hitting "Continue" after a world gen failure crashed the page. Replaced with `setModalFading(false)`.

- **Files modified:** `app/init/page.js`

### Pricing Page — Equal Height Cards (Fix)
Added `display: 'flex'` to the ScrollReveal wrapper `style` prop on both pricing cards. The previous fix (`alignItems: 'stretch'` on the parent + `height: '100%'` on wrappers and cards) didn't work because the ScrollReveal wrapper div wasn't a flex container — the card inside couldn't fill the stretched height. Now both cards match height and CTA buttons align.

- **Files modified:** `app/pricing/page.js`

### Pricing Page — Button Hover States
Moved inline `background`, `border`, and `color` styles from all three CTA buttons into the CSS module base rules (`.btnPrimary`, `.btnSecondary`). Inline styles override CSS `:hover` rules due to specificity, so the "Try It Free" ghost button had no visible hover state. Now both button classes own their hover-relevant properties in CSS where `:hover` can override them.

- **Files modified:** `app/pricing/page.js`, `app/pricing/page.module.css`

### Mobile-Responsive /play Layout
Full mobile responsiveness pass for the game screen. The majority of players are on mobile phones.

- **Sidebar → drawer on mobile:** At ≤768px the sidebar renders as a full-screen slide-over drawer (position: fixed, slides from right) instead of inline. Close button (✕) in top-right. Backdrop overlay locks body scroll. `overscroll-behavior: contain` on drawer content.
- **TopBar responsive:** Setting name and clock hidden on mobile to save space. Icon buttons enlarged to 44×44px tap targets. Wordmark font sizes reduced.
- **Overscroll-behavior: contain:** Added to `html`/`body` in globals.css, plus `pageContainer`, `narrativeScroll`, sidebar `tabContent`, and action panel `options` container. Prevents pull-to-refresh from hijacking scroll on mobile.
- **Narrative fills screen:** On mobile, `.mainContent` becomes a single column. Narrative column takes full width. ActionPanel remains pinned at bottom via `flex-shrink: 0`.
- **Scroll-to-top on enter:** `handleEnterWorld` now calls `window.scrollTo(0, 0)` and scrolls the narrative panel to top for new games.
- **Action options scroll:** On mobile, `.options` container gets `max-height: 40vh; overflow-y: auto` so options scroll independently while custom input row stays visible.
- **Compass → bottom sheet:** On mobile the compass popover becomes `position: fixed; bottom: 0` with full-width bottom-sheet styling and a backdrop overlay.
- **Touch-friendly targets:** All interactive elements audited for 44px min tap targets. Custom input set to `font-size: 16px` to prevent iOS auto-zoom.

- **Files modified:** `app/globals.css`, `app/play/page.js`, `app/play/play.module.css`, `app/play/components/Sidebar.js`, `app/play/components/Sidebar.module.css`, `app/play/components/TopBar.module.css`, `app/play/components/NarrativePanel.module.css`, `app/play/components/ActionPanel.js`, `app/play/components/ActionPanel.module.css`

---

## Previous Work (2026-04-07)

### Fix: Play Page Crash — TDZ Variable Ordering (FE-3)
Fixed a temporal dead zone (TDZ) error that crashed the entire /play page. The `handleTurnResponse` callback referenced `addDirectiveToast` and `refetchDirectiveState` in its dependency array before those `const` declarations appeared in the file. In production builds, the minifier renamed one of these to `ez`, surfacing as `ReferenceError: can't access lexical declaration 'ez' before initialization`. Fix: moved all directive handler declarations above `handleTurnResponse`. Also logged FE-2 (world snapshots 404 console message) — confirmed it originates from /init, not /play, and is already handled gracefully.

- **Key changes:** Reordered directive handler declarations (`refetchDirectiveState`, `handleDeleteDirective`, `handleRestoreDirective`, `addDirectiveToast`, `dismissDirectiveToast`) to appear before `handleTurnResponse`
- **Files modified:** `app/play/page.js`
- **Bugs logged:** FE-2 (non-issue), FE-3 (fixed)

### Admin — Move Game Log Button Above Narrative Log
Moved "View Game Log →" button from below the Narrative Log section to above it, directly after the Character section in the GamesTab detail panel. Same styling and behavior, just repositioned for better visibility.

**Files modified:** `app/admin/page.js`

### Init Wizard — Immediate /play Navigation + Wait Messages
- Phase 5 (scenario confirm) now navigates to `/play` immediately without waiting for `saveScenario()` to complete — scenario save fires in the background
- Removed the 300ms delay and content fade before navigation
- Added "This may take a minute or two." static message to the character→attributes overlay (init page) below the cycling lore messages
- Added same wait message to the `/play` loading overlay (PROLOGUE/WELCOME BACK screen), hidden once data is ready

**Files modified:** `app/init/page.js`, `app/play/page.js`

## Recent Work (Previous Session: 2026-04-06)

### Init Wizard — Summary Bar + Confirmation Modal
**Summary bar below step indicator.** Progressive summary chips (Voice, World, Character, Difficulty) now render between the StepIndicator and phase content, not in the bottom nav. Each chip: tiny uppercase label (10px, #4a5a70) over a value (14px, Cinzel 600, #8a94a8). Character name in accent gold. Chips separated by 1px vertical borders, centered horizontally with top/bottom border lines. World chip updates live when worldGenName arrives from polling. Only renders when there are chips to show (phase 1+).

**Confirmation modal on commitment phases.** Phases 1 (Setting), 2 (Character), and 3 (Attributes) show a centered modal overlay before proceeding. Phase-specific messages explain what's being locked in. Phase 3 variant warns about unsubmitted skill/gear requests when `requestsRegenerated` is false. "Go Back" dismisses. "Confirm" proceeds with save. Modal dismisses on backdrop click or input change. No confirmation on phases 0, 4, or 5.

**Back button removed.** Bottom nav simplified to phase counter + Continue button, right-aligned. No back navigation anywhere in the wizard.

**Files modified:** `app/init/page.js`

### Init Wizard — Tab Visibility + Skills Redundancy Fixes
**Bug 1a: Tab bar repositioned.** World/Advanced tab bar moved from below all setting content to directly after the setting grid (era cards + Custom + Your Worlds row). Now visible immediately after selecting a setting.

**Bug 1b: Tab content toggling fixed.** Setting-specific content (custom textarea, Your Worlds list, era prebuilt cards, SettingQuestions) now wrapped in `settingTab === 'world'` condition. AdvancedSeedTab wrapped in `settingTab === 'advanced'`. Only the active tab's content renders.

**Bug 1c: SettingQuestions hidden when prebuilt selected.** The "or shape your own" divider and SettingQuestions component now wrapped in `!selectedWorld` guard. When a prebuilt world is selected, only its "Anything else?" textarea shows.

**Bug 2: Skills box redundancy removed.** Removed the comma-separated "Skills" box from Phase 4. Renamed "Foundational Skills" label to "Skills" since it's now the only skills display.

**Files modified:** `app/init/page.js`

### Init Wizard — Background World Gen Overlay Fixes
Two targeted fixes for the combined character→attributes overlay sequence:

**Fix 1: Move saveCharacter() after world gen completes.** Previously `saveCharacter()` was called immediately when the overlay appeared, before world gen messages played. The backend rejects this if `world_gen_status` isn't `'complete'` yet. Moved to after the world gen completion wait loop, right before the proposal phase transition. Error handling fades the overlay and surfaces the error message.

**Fix 2: Double-submission guard verified.** `handleNext` already has `if (!canAdvance() || saving) return;` as its very first line, and the Continue button uses `disabled={!buttonEnabled}` where `buttonEnabled = canAdvance() && !saving`. Both the handler guard and the HTML disabled attribute prevent double-clicks. No code change needed — guard was already correct.

**Files modified:** `app/init/page.js`

### My Directives Tab + Fulfillment Toast + Restore Flow
Added third tab "My Directives" to the Talk to GM panel for directive management. Two sections (Goals, Preferences) show active directives with dismiss buttons; "Recently Completed" shows fulfilled directives with line-through text, AI reason, and Restore link. Empty state guides players to use My Story tab. Directive data fetched from `GET /api/game/:id/state` (directives field). Delete calls `DELETE /api/game/:id/talk-to-gm/meta/directive?lane=...&index=...`. Restore sends a meta question and refetches state. Fulfillment toast appears when `directivesRemoved` arrives on a turn response — shows "Goal completed: [text]" with "Removed in error?" restore link, auto-dismisses after 8s with fade animation. Auto-detection depends on backend deployment; manual dismiss works immediately.

**Files modified:** `app/play/page.js`, `app/play/play.module.css`, `app/play/components/TalkToGM.js`, `app/play/components/TalkToGM.module.css`, `app/play/components/NarrativePanel.js`

### Rewind Feature — Undo Last Turn
Added single-turn rewind to the gameplay UI. Compact rewind button (↩) in the action panel beside the compass button. Disabled when `rewindAvailable` is false (before first turn, after a rewind, etc.). Inline confirmation prompt on click ("Undo your last turn?" with Confirm/Cancel). On confirm, calls `POST /api/game/:id/rewind`, removes the last TurnBlock from narrative, updates character/inventory/clock from returned state, disables rewind button. On 400 error, shows error message and disables button. `rewindAvailable` read from turn responses, game state load, and first turn auto-trigger.

**Files modified:** `app/play/page.js`, `app/play/components/ActionPanel.js`, `app/play/components/ActionPanel.module.css`

### NPC Wound State Display in TurnBlock
Added `NpcWoundStates` component to render enemy health state badges on combat turns. Reads `npcStates` array from turn data. Defeated NPCs show with grey strikethrough styling, staggering shows warning in red, bloodied shows in amber. Fresh NPCs are hidden. Section labeled "Enemy Status" with Cinzel gold label, visually distinct from player conditions (orange) and enemy conditions (steel-blue). Renders nothing when `npcStates` is missing or empty. Resolves the backend gap flagged in the playtest fixes session below.

**Files modified:** `app/play/components/TurnBlock.js`, `app/play/components/TurnBlock.module.css`

### Playtest Fixes — Narrative Item Popups, Condition Tags, Unknown Items
Addressed frontend bugs identified during the 4/5 external playtest session.

**Key changes:**
- **Narrative item popups now show full stats:** Created centralized `handleEntityClick` in page.js that enriches item entities with inventory mechanical data (durability, damage, equipment category, etc.) before opening the popup. Previously, clicking an item name in narrative prose showed only the glossary entry; now it shows the full item card matching the inventory popup.
- **Enemy vs player condition display:** Added `target`/`owner` field support to StatusBadges. When the backend includes a target field on condition stateChanges, enemy conditions render with ⚔ icon and steel-blue styling instead of ⚠ orange. Pending: backend needs to add `target` field to condition stateChanges.
- **Unknown Item fallback improved:** Broadened item name extraction in StatusBadges to check `name`, `itemName`, and `displayName` fields, with inventory ID lookup as final fallback.
- **NPC defeat indicators:** Investigated — backend does not surface NPC wound states or defeat flags in the turn response. Flagged as backend gap.

**Files modified:** `app/play/page.js`, `app/play/components/TurnBlock.js`, `app/play/components/TurnBlock.module.css`, `app/play/components/NarrativePanel.js`
**Files created:** `claude-upload/component-TurnBlock.module.css`

---

## Recent Work (Previous Session: 2026-04-05)

### Admin Panel — Game Log Tab + Stat Display Fix
Added a full Game Log tab to the admin panel for inspecting per-game event logs and turn snapshots.

**Key changes:**
- Added `getGameLog`, `getGameLogSnapshot`, `getGameLogSnapshots` API wrappers to `lib/adminApi.js`
- Fixed stat display order in GamesTab detail panel: now shows effective/base (current/max) instead of base/effective; shows single number when equal
- Added "View Game Log →" button in GamesTab detail sidebar (between Narrative Log and Delete)
- Built full `GameLogTab` component with: game ID selector, turn timeline scrubber, event type filters (All, ai_call, turn_start, turn_end, error) with dedicated "Errors Only" panic button, two-column layout (snapshot on left, events on right)
- Snapshot column shows: player stats with orange penalty highlighting, conditions as orange pills, NPC mini-cards, resources, scene state, collapsible world threads
- Events column shows: colored event type badges, expandable JSON data, ai_call events display model/tokens/cost inline, error events have red background + left border + warning icon
- Added 'Game Log' to TABS array (after Games), wired with pendingGameLogId state for cross-tab navigation

**Files modified:** `app/admin/page.js`, `app/admin/page.module.css`, `lib/adminApi.js`

### Init Wizard — Background World Gen + Phase-Aware Loading Overlay
Major restructuring of the Setting→Character→Attributes flow:
- **Background world gen:** After setting submission, the wizard advances to the character phase immediately. World gen polls silently in the background while the player fills out their character. No more blocking overlay during world gen.
- **Granular poll status:** `pollWorldStatus()` now handles `generating_*` sub-phases (factions, locations, npcs, anchors) and records timestamps for each phase transition.
- **Combined overlay:** When the player clicks CONTINUE on the character phase, a sequenced overlay plays 4 world gen messages (proportionally timed based on real backend durations, ~22s total) then 4 proposal messages (6-9s random each). No message ever repeats. saveCharacter() fires immediately; generateProposal() fires after world gen completes.
- **Smart pacing:** Completed phases use proportional recap (longer real phases get more screen time, ±20% randomization, 4s minimum). In-progress phases hold until the backend advances (6s minimum). Proposal messages end when the API returns (waits for current message to finish).
- **Error handling:** World gen errors show inline on the character phase via the existing error state. Proposal failures during the overlay fade it out and show the existing retry UI.
- **Cleanup:** Removed PHASE_TRANSITION_MESSAGES entries 1 and 2, removed "Forging your character" loading state from Phase 3, removed auto-proposal trigger useEffect, removed worldGen error/timeout blocks from Phase 2 rendering.

**Files modified:** `app/init/page.js`.

### Admin Panel — Game Log Tab + Stat Display Fix
Added a full Game Log tab to the admin panel for inspecting per-game event logs and turn snapshots.

**Key changes:**
- Added `getGameLog`, `getGameLogSnapshot`, `getGameLogSnapshots` API wrappers to `lib/adminApi.js`
- Fixed stat display order in GamesTab detail panel: now shows effective/base (current/max) instead of base/effective; shows single number when equal
- Added "View Game Log →" button in GamesTab detail sidebar (between Narrative Log and Delete)
- Built full `GameLogTab` component with: game ID selector, turn timeline scrubber, event type filters (All, ai_call, turn_start, turn_end, error) with dedicated "Errors Only" panic button, two-column layout (snapshot on left, events on right)
- Snapshot column shows: player stats with orange penalty highlighting, conditions as orange pills, NPC mini-cards, resources, scene state, collapsible world threads
- Events column shows: colored event type badges, expandable JSON data, ai_call events display model/tokens/cost inline, error events have red background + left border + warning icon
- Added 'Game Log' to TABS array (after Games), wired with pendingGameLogId state for cross-tab navigation

**Files modified:** `app/admin/page.js`, `app/admin/page.module.css`, `lib/adminApi.js`

### Init Wizard — Fix "Try Another" Button Visibility on Scenario Cards
The "try another" button on Phase 6 scenario cards had invisible text because `onMouseLeave` reset `color` to `''` (empty string), falling back to inherited black from the parent `<button>`. Fixed: `onMouseLeave` now resets to `var(--text-dim)` (matching the base style), `onMouseEnter` now sets `var(--accent-gold)` for a clear hover signal.

**Files modified:** `app/init/page.js`.

### Init Wizard — Design System Variable Cleanup + Lexie Readable Support
**Part 1:** Replaced ~20 hardcoded hex color values in inline styles with CSS variables: `#7082a4`→`var(--text-muted)`, `#6b83a3`→`var(--text-dim)`, `#b0b8cc`→`var(--text-stat-bright)`, `#8aba7a`→`var(--color-success)`, `#e8845a`→`var(--color-danger)`, `#c84a4a`→`var(--color-danger)` (style props only, not DIFFICULTIES array), `#9a8545`→`var(--gold-muted)`, `#c9a84c`→`var(--accent-gold)` (overlay wordmark/label only, not FIREFLY_EMBERS or particle dots), `#d0c098`→`var(--text-heading)`. Excluded: panel bg `#0d1120`, error/warning semantic colors, connection banner, deviation warning, stat bar gradients, ember data array.

**Part 2:** Added Lexie Readable support. Reads `crucible_display_settings` from localStorage on mount, listens for `display-settings-changed` and `storage` events. When `font === 'lexie'`, overrides `--font-alegreya`, `--font-alegreya-sans`, `--font-jetbrains` on the page container. Transition overlay resets these variables to standard fonts so it's unaffected by Lexie.

**Files modified:** `app/init/page.js`.

### Pricing Page — Polish Pass #2
Hero tagline and sub-tagline copy updated. Removed all JetBrains Mono from the page: turn count lines now use Alegreya Sans, top-up card numbers now use Cinzel 700. Removed hover effects from pricing cards and top-up cards (non-interactive containers). btnSecondary hover state and base transition were already correct.

**Files modified:** `app/pricing/page.js`, `app/pricing/page.module.css`.

### Init Wizard — Design System Color Audit (No Changes Needed)
Audited all hardcoded hex values in `app/init/page.js` Phase 3/4 proposal review sections. All six info blocks (skills, innate traits, foundational skills, starting loadout, faction standings, inventory slots), stat bar container, stat bar tracks, and inner dividers already use the correct CSS variables (`var(--bg-card)`, `var(--border-primary)`, `var(--border-card-separator)`). Remaining hardcoded hex values are all in exclusion categories: `#0d1120` (panel bg), error/warning semantic colors, connection banner, transition overlay embers, and stat bar gradient.

**Files modified:** None (already aligned).

### Init Wizard — Transition Overlay Labels + Lore Text
Updated PHASE_TRANSITION_MESSAGES to describe what's happening now (not what comes next). Phase 3 changed from "Calibrating the world's teeth" to "Your path is set…", phase 4 from duplicate of 3 to "The world sharpens its edges…". Gold phase label now uses OVERLAY_LABELS keyed to current transitionPhase instead of STEP_NAMES[transitionPhase + 1].

**Files modified:** `app/init/page.js`.

### Character Sheet — Skill Subcategory Breakdown
Foundational skills in CharacterTab now show subcategory scope and governing stat. Broad mundane: "(broad: Tracking & Hunting + Streetwise) WIS". Narrow mundane: "(narrow: Ranged Technique) DEX". Magic skills show scopeReference instead. Falls back to bare breadth label if taxonomy fields are missing.

**Files modified:** `app/play/components/CharacterTab.js`.

### Mobile Tap Target Fixes — NavBar + GameplayShowcase
Fixed undersized tap targets on mobile. NavBar: hamburger button expanded to 44x44 (icon lines repositioned to stay visually centered), wordmark link gets 8px vertical padding for 44px+ tap area, AuthAvatar wrapped in 44x44 Link with inner span for 32px visual circle, mobile gap between hamburger/avatar increased to 16px. GameplayShowcase: NEXT SCENARIO button gets min-height 44px, pagination dots changed to 44x44 invisible tap zones with ::after pseudo-element for the 10px visual dot.

**Files modified:** `components/NavBar.module.css`, `components/AuthAvatar.js`, `app/landing/GameplayShowcase.module.css`.

### Privacy Policy & Terms of Service — Content Rewrite + Design System Alignment
Complete content replacement on both legal pages with final production copy. Design system fixes applied: body text fallback 15px→16px, SIZE_MAP medium 15px→16px, bold label color `#b0a890`→`var(--text-heading)`, section border `#1e2540`→`var(--border-primary)`. All email links use `legalLink` class. Privacy page third-party service links are real `<a>` tags with `target="_blank"`. Lexie Readable support was already present — retained as-is.

**Files modified:** `app/terms/page.js`, `app/privacy/page.js`.

### Pricing Page — Real Prices + Design System Alignment
Pricing page updated with real prices (Free: 25 turns/1 world, Hero: $9.99/225 turns/5 worlds, turn packs: 25/$1.49, 50/$2.49, 100/$4.49). Tier renamed from Adventurer to Hero. Recommended badge removed. Full design system alignment pass completed.

**Files modified:** `app/pricing/page.js`.

### Announcements — Admin Panel + Menu Display
Admin Settings tab now has an Announcement section above Invite Code: shows current announcement text with timestamp, textarea to post a new one (1000 char max with counter), Post/Clear buttons with inline feedback. Settings tab fetch loads both invite code and announcement in parallel. Menu page shows a gold-bordered banner when an announcement is active, with dismiss button (session-only, reappears if text changes). API client functions added: `getAnnouncement`/`setAnnouncement`/`clearAnnouncement` in adminApi.js, `getAnnouncement` in api.js.

**Files modified:** `lib/adminApi.js`, `lib/api.js`, `app/admin/page.js`, `app/menu/page.js`.

### Age Verification Checkbox on Auth Signup
Added "I am 18 years of age or older" checkbox to the signup form, matching the Terms checkbox styling. Validated in handleSubmit after the terms check. Resets on mode switch.

**Files modified:** `app/auth/page.js`.

### Mobile: Hamburger Menu, Particles, Chevron Threshold
- Added hamburger menu for mobile nav (both landing and standard variants). Three-line icon transitions to X, slide-down panel with stacked links, closes on link tap or toggle.
- Re-enabled particles on mobile — removed `display: none` media query, capped count at 20 on mobile for performance.
- Chevron scroll-out threshold changed from hardcoded 100px to `window.innerHeight * 0.3` so it doesn't flicker on small phones.

**Files modified:** `components/NavBar.js`, `components/NavBar.module.css`, `components/ParticleField.js`, `components/ParticleField.module.css`, `app/landing/HeroSection.js`, `docs/design-system.md`.

### Landing Hero: Nav Mobile Fix, Chevron Flow, iOS Viewport
Three related mobile/viewport fixes on the landing hero:
- Nav bar section links (FEATURES, HOW IT WORKS, FAQ) now hidden on mobile via `!important` override — previously the `.navLink { display: inline-flex }` rule was winning over `.sectionLink { display: none }`.
- Scroll chevron moved from absolute positioning to normal document flow (margin-top spacing, flex-centered). Prevents overlap on short viewports.
- Hero minHeight changed from `100vh` to `100dvh` so iOS Safari browser chrome doesn't steal space from the visible hero area.

**Files modified:** `components/NavBar.module.css`, `app/landing/page.module.css`, `app/landing/HeroSection.js`.

### Showcase Dice Bar Font Update
Showcase dice bar font changed from Alegreya Sans to JetBrains Mono to match /play resolution display.

**Files modified:** `app/landing/GameplayShowcase.module.css`, `docs/design-system.md`.

### Advanced Difficulty Dials on Phase 5
Added Difficulty/Advanced tab bar to Phase 5 (same pill style as Phase 2 world seeds). Difficulty tab shows the four preset cards as before. Advanced tab exposes seven individual dials: DC Offset (slider), Progression Speed (slider), Encounter Pressure (selector pills), Survival (toggle), Durability (toggle), Fortune's Balance (toggle), Simplified Outcomes (toggle). Local `SliderDial`, `ToggleDial`, `SelectorDial` components built inline (not imported from play settings). Preset selection resets overrides to null; any dial change initializes overrides from the current preset. When custom overrides are active, no preset card is highlighted and a "Custom settings active" note shows. `saveDifficulty()` sends `{ preset, overrides }` when overrides exist. `PRESET_DIALS` constant defines default values per preset.

**Files modified:** `app/init/page.js`.

### Removed /saved-games Page
Deleted the saved-games page (redundant, mock data only). Removed route from middleware PUBLIC_ROUTES. No navigation links pointed to it.

**Files deleted:** `app/saved-games/page.js`, `app/saved-games/page.module.css`, `claude-upload/saved-games-page.js`.
**Files modified:** `middleware.js`.

### Rulebook Structural Rewrite + Color Alignment
Rewrote rulebook page to natural page scroll (removed maxHeight/overflowY from content area, scroll spy now uses window scroll instead of container scroll). Added ParticleField with zIndex layers on hero/main/CTA. Removed metadata "21 sections" span from hero. Fixed all text colors to design system tokens: body text #b0b8cc → #8a94a8, mechanic-callout #8a9ab8 → #8a94a8, h3/border colors to CSS variables, subtitle/CTA colors to --text-secondary, section titles to --text-heading, TOC inactive links to --text-muted, page background to --bg-main. Sticky TOC top adjusted to 24px with tocScroll maxHeight updated.

**Files modified:** `app/rulebook/page.js`.

### Privacy & Terms Color Fix
Replaced --text-secondary-bright with --text-secondary in Section and LegalList components on both pages (banned on marketing pages per design system).

**Files modified:** `app/terms/page.js`, `app/privacy/page.js`.

### /play Font System: Alegreya Serif Default + Lexie Toggle
Changed --body-font default in globals.css from Lexie Readable to Alegreya. FONTS array family updated from Alegreya Sans to Alegreya serif across SettingsModal and /settings page. buildThemeStyle() overrides --font-alegreya, --font-alegreya-sans, and --font-jetbrains when Lexie is enabled. Display settings changes now dispatch a `display-settings-changed` custom event for cross-page sync. Removed dead FONT_OPTIONS/SIZE_OPTIONS arrays from menu page.

**Files modified:** `app/globals.css`, `app/play/page.js`, `app/play/components/SettingsModal.js`, `app/settings/page.js`, `app/menu/page.js`.

### Settings Page Display Section Overhaul
Updated SIZE_PX to match play page SIZES (13/15/17/19px). Section label font bumped to 14px. Preview paragraph changed to non-italic, uses Alegreya serif. Added scope note: "Applies to gameplay and reading pages (rulebook, terms, privacy)." Event dispatch added on settings change.

**Files modified:** `app/settings/page.js`.

### Rulebook Lexie Toggle + Font/Size Support
Added Lexie Readable toggle to rulebook TOC sidebar. Reads crucible_display_settings from localStorage on mount. Content body text (p, ul, ol, mechanic-callout) uses CSS variables (--rulebook-body-font, --rulebook-body-size) that respond to the toggle. Listens for display-settings-changed and storage events for live cross-tab sync.

**Files modified:** `app/rulebook/page.js`.

### Terms & Privacy Silent Font Reading
Converted both pages to client components. Read crucible_display_settings from localStorage on mount. When Lexie is enabled, override --font-alegreya-sans on the page container. Body text font size responds to textSize setting via --legal-body-size CSS variable. Listen for display-settings-changed and storage events.

**Files modified:** `app/terms/page.js`, `app/privacy/page.js`.

### Design System: Font Scope & Defaults
Updated Font Stack (Lexie Readable description), replaced Font Inheritance Rule with new Font Scope subsection defining per-context font behavior (marketing pages, game layout, reading pages, settings page), and clarified the inheritance rule around --body-font defaults and Lexie overrides.

**Files modified:** `docs/design-system.md`.

### Showcase Narrative Font: Italic to Upright
Showcase narrative and result text changed from Alegreya italic to Alegreya regular to match /play default font. Hero tagline and feature card epigraphs remain italic (marketing narrator voice).

**Files modified:** `app/landing/GameplayShowcase.module.css`, `docs/design-system.md`.

### Display Settings: Lexie Readable Toggle + Font Variable Cleanup
Replaced the 5-option font picker and theme toggle in both the /play SettingsModal Display tab and the /settings page with a single Lexie Readable on/off toggle. When enabled, the font setting value is 'lexie' and the buildThemeStyle function overrides --font-alegreya, --font-alegreya-sans, and --font-jetbrains CSS variables to 'Lexie Readable', making every element using those variables switch automatically. Cinzel remains fixed for headers.

- Removed theme toggle UI from SettingsModal Display tab and /settings page (dark-only for now; THEMES export kept)
- FONTS array reduced to 2 entries: alegreya (default) and lexie
- Converted all hardcoded font-family strings across /play components and CSS modules to CSS variables (var(--font-alegreya-sans), var(--font-alegreya), var(--font-jetbrains))
- SVG font attributes in MapTab.js and InlineDicePanel.js converted from fontFamily="..." to style={{ fontFamily: "var(...)" }}
- Default font changed from 'lexie' to 'alegreya' in both play and settings DEFAULT_SETTINGS
- /settings page preview paragraph responds to toggle (renders in Lexie Readable or Alegreya Sans)

**Files modified:** `app/play/page.js`, `app/play/components/SettingsModal.js`, `app/play/components/SettingsModal.module.css`, `app/play/components/MapTab.js`, `app/play/components/InlineDicePanel.js`, `app/play/components/ReportModal.js`, `app/play/components/DebugPanel.module.css`, `app/play/components/TopBar.module.css`, `app/settings/page.js`, `app/settings/page.module.css`.

### AuthAvatar: Links Instead of Buttons
Replaced `<button onClick={router.push()}>` with `<Link href>` in both the signed-in (avatar circle → /settings) and signed-out ("Sign In" → /auth) states. Enables middle-click/right-click "open in new tab". Removed `useRouter` import. Added `textDecoration: 'none'` and `display: 'flex'` to preserve visual parity with the old button rendering.

**Files modified:** `components/AuthAvatar.js`.

### Design System Document Overhaul
Design system document overhauled — marketing text rules, type scale discipline (font/weight columns added), weight rules scoped to marketing pages, hover/interaction patterns (non-interactive cards no longer lift, focus-visible standard, universal timing), interactive gameplay showcase specs, storyteller voices reference, text color consolidation note, contrast warning on --text-muted, Chrome autofill override, border-radius updates (6px buttons/inputs, 8px cards), input focus state update, particle field expanded to all pages.

**Files modified:** `docs/design-system.md`.

### Admin Detail Panel — Inline Push Instead of Overlay
Changed the admin detail panel (user detail, game detail) from a fixed-position overlay to an inline flex element that pushes the table content to the right. The panel is now sticky-positioned at the top of the viewport, sits inside the existing flex layout, and scrolls independently. Removed the backdrop overlay and the content area maxWidth cap so the panel + table use the full viewport width.

**Files modified:** `app/admin/page.js`, `app/admin/page.module.css`.

### Universal Glossary Linking
Extended `renderLinkedText` from narrative-only to every component that displays prose or definitions.

- **Shared `renderNarrative` export** added to `lib/renderLinkedText.js` — consolidates the paragraph/linebreak/linking logic that was duplicated in TurnBlock and ReflectionBlock
- **ReflectionBlock**: replaced local `renderText()` with shared `renderNarrative`; now receives `glossaryTerms` and `onEntityClick` props
- **NarrativePanel**: GM aside content and session recap text now parsed for glossary links
- **TalkToGM**: all prose responses (briefing, meta, rulebook content, story tab) now parsed for glossary links via `renderProse` and inline `renderLinkedText`
- **EntityPopup**: glossary definition text now parsed — clicking a linked term in one popup navigates to that entity's popup
- **GlossaryTab**: entry definitions now parsed for glossary links
- **NPCTab**: NPC definitions now parsed for glossary links
- **ActionPanel (CompassPopover)**: quest/objective descriptions now parsed for glossary links
- **Props threading**: `glossaryTerms` now flows from page.js → Sidebar, ActionPanel, EntityPopup, and through NarrativePanel → TalkToGM

**One utility, one import path.** No component has its own glossary rendering logic. Sidebar UI items (stats, skills, items, NPCs) keep their existing direct-click-to-popup behavior — only prose/definition text uses bracket-notation parsing.

**Files modified:** `lib/renderLinkedText.js`, `app/play/page.js`, `app/play/components/NarrativePanel.js`, `app/play/components/TurnBlock.js`, `app/play/components/ReflectionBlock.js`, `app/play/components/TalkToGM.js`, `app/play/components/EntityPopup.js`, `app/play/components/GlossaryTab.js`, `app/play/components/NPCTab.js`, `app/play/components/ActionPanel.js`, `app/play/components/Sidebar.js`.

### Playtest Access Restructure
Multi-file restructure gating site access behind playtest approval system.

1. **Root route swap**: `/` now serves the landing page (re-exports from `/landing`). Coming Soon page retired.
2. **Auth page**: Invite code removed. Playtest request checkbox + about/source fields added to signup. Post-signup confirmation for requesters ("You're on the list"). Google OAuth redirects by playtester status.
3. **NavBar**: Playtester-aware — wordmark links to `/menu` for playtesters, `/` otherwise. "PLAYTEST ACCESS PENDING" label for logged-in non-playtesters. Rulebook/Pricing hidden from non-playtesters.
4. **Route guards**: Playtester check added to menu, init, play, saved-games, settings, pricing, rulebook. Non-playtesters redirect to `/`.
5. **Landing CTA**: Two-card layout — "Stay in the Loop" (mailing list) + "Join the Playtest" (request access link).
6. **Menu page**: `isPlaytester` default changed from `true` to `false`.
7. **Admin**: Playtest request info (about/source) in user detail panel. "Pending Requests" filter pill in Users tab.

**Files modified:** `app/page.js`, `app/auth/page.js`, `components/NavBar.js`, `app/landing/CTASection.js`, `app/landing/page.module.css`, `app/menu/page.js`, `app/init/page.js`, `app/play/page.js`, `app/saved-games/page.js`, `app/settings/page.js`, `app/pricing/page.js`, `app/rulebook/page.js`, `app/admin/page.js`.

### World Seeds (Phase 2) + Scenario Rework (Phase 5)
**Part 1: World Seeds — Advanced tab on Phase 2 (Setting)**
- Tab bar (World / Advanced pills) below setting selection, visible when a setting is chosen
- Advanced tab: faction seeding (up to 3) and NPC seeding (up to 5) with inline forms
- Faction form: name, description, disposition (Unknown/Friendly/Neutral/Hostile)
- NPC form: name, description, relationship (Neutral/Companion/Ally/Contact/Rival/Enemy), faction dropdown
- Saved items render as compact cards with colored badges, expandable descriptions, remove buttons
- `playerSeeds` added to saveSetting payload (backend will silently ignore until wired)

**Part 2: Scenario Rework — Phase 5**
- INTENSITIES array and all references removed (intensity toggle, intensity state, intensity-keyed cache)
- SCENARIOS replaced with pacing types: Slow Burn, Turning Point, Into the Fire, Custom Start
- Per-card "try another" refresh: stores alt in scenarioAlts, dot indicators toggle between original/alt
- `pacingType` field added to saveScenario payload (TODO: backend acceptance)
- Scenario type italic text removed from cards (pacing label is sufficient)

**Files modified:** `app/init/page.js`.

### Playtest Findings: Glossary Linking, Talk to GM Flow, Glossary Refetch
Three features from 2026-04-04 playtest findings:

**1. Bracket notation → clickable glossary links in narrative**
- New utility `lib/renderLinkedText.js`: parses `[Bracketed Terms]` into gold clickable spans that open EntityPopup
- `buildGlossaryTermSet()` creates a fast-lookup Set from glossary entries
- Integrated into TurnBlock (narrative text) and NarrativePanel (world briefing)
- Props threaded: page.js → NarrativePanel → TurnBlock (glossaryTerms + onEntityClick)
- Bracket terms not found in glossary render as plain text (brackets stripped)

**2. Talk to GM — meta before escalation + persistent chips**
- Suggested question chips now remain visible after a result (previously hidden)
- When keyword lookup misses: "Ask the GM (free)" button calls `/talk-to-gm/meta` endpoint (no turn cost)
- "Escalate (costs a turn)" button still available alongside for in-world actions
- Meta response renders as GM aside with gold left-border styling
- After meta response, escalation still offered below if needed

**3. Glossary refetch after turns**
- Added `refetchGlossary()` callback (parallel to `refetchCharacter()`)
- Called on every stateChanges response so new glossary entries from gameplay are available

**Session recap (Item 4):** Already implemented — `GET /api/games/:id` is called on load, `sessionRecap` is extracted and passed to NarrativePanel, displays as "PREVIOUSLY..." card. No changes needed.

**Files created:** `lib/renderLinkedText.js`.
**Files modified:** `app/play/page.js`, `app/play/components/NarrativePanel.js`, `app/play/components/TurnBlock.js`, `app/play/components/TalkToGM.js`.

### Play Screen Polish Pass (Bucket 1)
Seven targeted UI fixes from a play screen audit:

1. **Narrative max-width when sidebar collapsed**: `.narrativeExpanded` class adds `max-width: 48rem; margin: 0 auto` when sidebar is hidden, preventing ultra-wide line lengths
2. **Scroll position — new vs saved game**: Single first turn (`turns.length === 1 && _isNew`) scrolls to top of panel (shows prologue), subsequent turns scroll to header, saved game loads scroll to bottom
3. **Settings modal dark theme hardening**: Overlay backdrop darkened to 0.7 opacity, panel/tab/close styles hardcoded to dark theme values (not CSS vars) so modal stays dark regardless of display theme
4. **Custom scrollbar**: Themed thin scrollbar (`#3a3328` thumb, transparent track, `#564b2e` hover) on narrative scroll, sidebar tab content, and settings modal
5. **Bug/Suggest footer buttons**: Icon-only (11px), `#6b83a3` dim color, no border/background, CSS tooltip on hover. Debug button keeps text label.
6. **GM button positioning**: Shrunk from 44px to 38px, repositioned to `right: 4px; bottom: 12px` to reduce text overlap
7. **Inventory column headers**: DUR/QUAL/WT header row above items in Equipped and Carried sections, fixed-width right columns for alignment

**Files modified:** `app/play/page.js`, `app/play/play.module.css`, `app/play/components/NarrativePanel.js`, `app/play/components/NarrativePanel.module.css`, `app/play/components/Sidebar.js`, `app/play/components/Sidebar.module.css`, `app/play/components/SettingsModal.module.css`, `app/play/components/TalkToGM.module.css`, `app/play/components/InventoryTab.js`, `app/play/components/InventoryTab.module.css`.

### Play Overlay: Returning game awareness + wordmark link
Loading overlay now distinguishes new vs returning games. Phase label shows "WELCOME BACK" for returning games, "PROLOGUE" for new. Lore ready text shows "Your story continues..." vs "Your story begins...". Wordmark is now a Link to /menu as an escape hatch.

- `isReturningGame` derived from `gameState.recentNarrative` or `clock.totalTurn`
- Phase label: WELCOME BACK / PROLOGUE
- Ready text: "Your story continues..." / "Your story begins..."
- Wordmark wrapped in `<Link href="/menu">` with `textDecoration: 'none'`

**Files modified:** `app/play/page.js`.

### Init Wizard: World Gen Overlay for Phase 1→2 Transition
Phase 1 (Setting) now uses the full ember overlay during world generation instead of a blank crossfade. Overlay stays up until worldGenStatus resolves (complete/error/timeout), then fades to reveal Character form. Inline "Generating your world..." message removed from Phase 2 (error/timeout messages preserved).

- `useOverlay` now includes `phase === 1` alongside `phase === 2`
- Added `worldGenStatusRef` (ref mirroring state) so polling promise can read current status
- case 1 in handleNext awaits world gen completion via 500ms interval checking the ref
- On error/timeout: overlay dismisses normally, user lands on Phase 2 with error/timeout UI
- Removed inline "Generating your world..." text from Phase 2 (redundant after full overlay)

**Files modified:** `app/init/page.js`.

### Loading Overlay: ENTER text, lore flash fix, more tips
Three fixes to the play page loading overlay: ENTER button now prefers currentLocation from game state over sessionStorage worldName. Lore fragment cycling stops when data is ready (fixes "Your story begins..." blinking). Added 8 new tips (total 18).

- ENTER button: `gameState?.world?.currentLocation || loadingSummary?.worldName || 'THE WORLD'`
- Lore cycling useEffect now returns early when `dataReady` is true
- 8 new tips: crucible tagline, magic/potency, rest requirements, difficulty dials, escape option, skill check math, bug reports, condition stacking

**Files modified:** `app/play/page.js`.

### Init Wizard: ParticleField + Design System Color Alignment
Added ParticleField background to init wizard (matches landing/menu pages). Replaced ~20 hardcoded hex values with CSS variables throughout Phase 3/4 proposal review components.

- Added `<ParticleField />` as first child of page container
- `#111528` → `var(--bg-card)` (info block backgrounds: skills, loadout, factions, traits, sub-tags)
- `#1e2540` → `var(--border-primary)` (block borders, stat stepper buttons, stat bar track, row dividers)
- `#1a1e30` → `var(--border-card-separator)` (inner dividers between traits/items)
- Preserved `#0d1120` (bg-panel), error/warning colors, transition overlay, stat bar gradient

**Files modified:** `app/init/page.js`.

### Admin Page: Sidebar Overlay Layout Fix
Admin detail panel changed from flex push layout to fixed overlay. Table always uses full width regardless of sidebar state. Backdrop click closes panel.

- `.pushPanel` changed from `position: sticky` flex child to `position: fixed` overlay with `z-index: 10`
- Added `.panelBackdrop` (fixed inset, z-index 9) — clicking it closes the panel
- Box shadow added for depth (`4px 0 20px rgba(0,0,0,0.3)`)
- Slide-in animation preserved (0.25s ease-out)
- DetailPanel component now renders backdrop + panel as siblings via fragment

**Files modified:** `app/admin/page.js`, `app/admin/page.module.css`.

### Wire Talk to GM Meta Endpoint + Directive Awareness
My Story tab now wired to `POST /talk-to-gm/meta` (replacing Phase 1 fallback). Response parsing simplified to `res.response`. Directive feedback shown when GM stores a goal or preference. Rate limit (429) handled with warning text.

- Endpoint switched from `/talk-to-gm` to `/talk-to-gm/meta`
- Response extraction: single `res.response` field instead of multi-field chain
- `storyResult` changed from plain string to object `{ text, directiveStored, directiveLane }`
- Directive confirmation line: Alegreya Sans 11px, `--text-dim`, italic
- 429 rate limit: shows warning in `--text-warning` color

**Files modified:** `app/play/components/TalkToGM.js`, `app/play/components/TalkToGM.module.css`.

### Spell Patterns Section + Skill Glossary Clicks in CharacterTab
CharacterTab now renders Spell Patterns section (after skills, before conditions) when `spellPatterns` array is non-empty. All skill names (foundational, active, passive masteries, spell patterns) are clickable — opens existing EntityPopup with glossary definition. Skills grouped under labeled sub-headers (Foundational, Active, Passive Masteries). Hover highlights skill name in gold.

- Spell Patterns section: renders pattern name + modifier, only when array is non-empty, clickable for glossary popup
- Passive Masteries: new skill type filter (`s.type === 'passive'`), renders in its own labeled group
- Skill sub-group labels: Cinzel 10px uppercase headers for each skill category
- Click handler: `onEntityClick({ term: name, type: 'skill' | 'spell' })` — reuses existing EntityPopup + glossary lookup
- New CSS: `.skillGroup`, `.skillGroupLabel`, `.skillNameClickable` with hover color transition

**Files modified:** `app/play/components/CharacterTab.js`, `app/play/components/CharacterTab.module.css`.

### End-of-Day Reflection Display at Long Rest
New ReflectionBlock component renders inline in turn output when `reflection` is present in the API response. Shows AI narrative, gains table, overflow line, quest bonuses, and blocked state. Positioned after ResolutionBlock, before narrative text.

- ReflectionBlock: gold left-border card with header, italic narrative, gains table (skill/stat/spell icons), overflow line, quest bonus callout
- Blocked state: shows thematic starvation message, no table
- Absent reflection: renders nothing
- Turn response handler updated to extract `reflection` from `mechanicalResults` or `stateChanges`

**Files created:** `app/play/components/ReflectionBlock.js`, `app/play/components/ReflectionBlock.module.css`.
**Files modified:** `app/play/components/TurnBlock.js`, `app/play/page.js`.

### Init Wizard: Replace The Long Empire with The Worn Cobble
Removed "The Long Empire" world template from Sword & Soil era. Added "The Worn Cobble" — a sprawling medieval city with noble courts, criminal syndicates, and layered social structure. Sword & Soil now has three templates: The Fraying Throne, The Green Tribunal, The Worn Cobble.

**Files modified:** `app/init/page.js`.

### Audit Cleanup: Five Fixes from 7.45 Audit
Audit cleanup — FAQ answer text updated to match body text system (16px/400/#8a94a8), hero sub-tagline contrast and weight fixed, showcase container border/bg opacity increased for visibility, typewriter speed increased 1.6x on repeat scenarios, showcase entrance fade-in added.

- FAQ answer paragraphs: fontSize 17→16, fontWeight 300→400, color var(--text-muted)→var(--text-secondary)
- Hero sub-tagline: fontWeight 300→400, color var(--text-dim)→var(--text-secondary) (5.9:1 contrast)
- Showcase .inner container: border opacity 0.06→0.12, background opacity 0.3→0.5
- Typewriter narrative speed 50ms→30ms per word, result speed 40ms→25ms per word (firstView unaffected)
- Showcase fade-in transition adjusted to 0.6s; prefers-reduced-motion override added (opacity: 1)

**Files modified:** `app/landing/FAQSection.js`, `app/landing/HeroSection.js`, `app/landing/GameplayShowcase.js`, `app/landing/GameplayShowcase.module.css`.

### Showcase Polish: Totals, Navigation, Scroll, Reset Transition
Showcase polish: dice bar now shows roll totals, NEXT SCENARIO and dots visible without picking a choice, TRY ANOTHER scrolls to showcase top and fades out result before resetting choices.

- Dice bar segments now include "Total: X.X" between Roll and Tier for all 9 results
- NEXT SCENARIO button and scenario dots visible from phase 4 (choices visible), no longer gated behind result
- TRY ANOTHER only appears after a result renders; fades out dice/result/itself over 250ms while scrolling to showcase top, then resets choices
- Reduced motion: TRY ANOTHER resets instantly (no fade, no scroll)
- Choice cards smoothly transition from dimmed (0.35) back to full opacity on reset via existing CSS transition

**Files modified:** `app/landing/GameplayShowcase.js`, `app/landing/GameplayShowcase.module.css`.

### Showcase: TRY ANOTHER Button + FirstView Transition Fix
Showcase: TRY ANOTHER button added for replaying choices within same scenario. FirstView result transition fixed — dice and result now fade in instead of popping.

- TRY ANOTHER button in controls block (left of NEXT SCENARIO), uses crossfade transition to reset to phase 4 with height lock
- Two-button row layout with gap 16px; stacks vertically on mobile with full-width buttons
- FirstView click now staggers phase progression (7→9→11 with short delays) so each element's fadeUpIn animation is visible
- Narrative text preserved during TRY ANOTHER transition (no re-typing)

**Files modified:** `app/landing/GameplayShowcase.js`, `app/landing/GameplayShowcase.module.css`.

### Interactive Gameplay Showcase
Gameplay showcase now interactive — visitors click choice cards to see different outcomes per scenario. Nine prefab results (3 per scenario) covering Tier 2/3/4/5 outcomes across Bard, Noir, and Whisper voices. Auto-selection removed, hover states added to choice cards.

- Choice cards are clickable with hover states (gold border/background tint) and keyboard accessible (tabIndex, Enter/Space, focus-visible)
- Auto-advance timers for phase 4→5→6 removed; sequence pauses at phase 4 until user clicks a choice
- Each scenario has a `results` object keyed by choice ID (A/B/C); `selected` field removed
- New dice color classes: `.diceMercy` (gold, Tier 4) and `.diceFailure` (orange, Tier 5)
- Custom action row always dimmed (opacity 0.35) with "Available in game" label
- firstView starts at phase 4 (not 11) — narrative/choices render instantly, dice/result appear on click with CSS fade-in
- Updated all three scenario narratives and added 9 prefab results with approved copy

**Files modified:** `app/landing/GameplayShowcase.js`, `app/landing/GameplayShowcase.module.css`.

### Showcase Transition Jank Fix
Showcase transition jank fixed — container height preserved during scenario changes, crossfade added between scenarios.

- Before resetting phase, innerRef captures current offsetHeight and locks it as minHeight on .inner, preventing layout collapse
- Crossfade: transitioning state applies opacity:0 via CSS class, 200ms fade-out completes before scenario swap and phase reset, then fades back in
- minHeight cleared when phase reaches 4 (choices visible — enough content to fill the space), with 0.3s ease transition for smooth height adjustment
- firstView behavior unchanged — still renders scenario 0 instantly

**Files modified:** `app/landing/GameplayShowcase.js`, `app/landing/GameplayShowcase.module.css`.

### Showcase Pacing Overhaul
Showcase pacing overhaul — section label added, first scenario renders immediately without typewriter delay (subsequent scenarios still animate), section padding reduced, container treatment added, hero-to-showcase gap tightened.

- "SEE IT IN ACTION" label added above showcase in page.js (matches FEATURES/HOW IT WORKS pattern), wrapped in section#showcase with scrollMarginTop
- First scenario renders fully at phase 11 on mount — no typewriter, no staggered animations, just the complete scene. IntersectionObserver triggers a gentle 0.8s opacity fade-in. Clicking NEXT SCENARIO or a dot sets `firstView=false` and runs the full animated sequence for subsequent scenarios
- Showcase padding reduced 80→48px top/bottom; .inner gets subtle container treatment (border, background, border-radius, padding)
- Hero bottom padding reduced 80→48px to tighten the dark gap between hero and showcase

**Files modified:** `app/landing/GameplayShowcase.js`, `app/landing/GameplayShowcase.module.css`, `app/landing/page.js`, `app/landing/HeroSection.js`.

### Landing Page Polish Pass (6 fixes)
Landing page polish pass — tagline contrast fix, feature body text readability fix, feature card hover softened (no longer reads as clickable), storyteller label contrast fix, focus-visible states added, type scale tightened from 13 sizes to 10.

1. Hero tagline color #9a9480 → #b0a480 (warmer parchment gold, better contrast)
2. Feature + step body text: color var(--text-muted) → var(--text-secondary) (5.9:1 vs 3.3:1), weight 300 → 400, size 17 → 16px
3. Feature card hover: removed translateY(-2px) and box-shadow (false button affordance), kept border-color and background shift
4. Storyteller label in showcase: #564b2e → #9a8545 (matches --gold-muted token)
5. Added focus-visible outlines to .ctaPrimary and .ctaSecondary; confirmed existing focus-visible on FAQ questions, replay button, and scenario dots
6. Type scale: hero sub-tagline clamp max 19→18px, feature/step body 17→16px, showcase result 17→18px (matching narrative)

**Files modified:** `app/landing/HeroSection.js`, `app/landing/page.js`, `app/landing/page.module.css`, `app/landing/GameplayShowcase.module.css`.

### Fix: Session Recap Card Rendering Every Turn (v2)
The "Previously..." recap card was still re-appearing after the initial recapShownRef fix — the ref resets if NarrativePanel remounts. Added belt-and-suspenders fix: `handleTurnResponse` now clears `sessionRecap` from `gameState` on the first player action, so the data is gone even if the component remounts. The ref still handles re-renders before the first action.

**Files modified:** `app/play/page.js`.

### Fix: Condition Penalty Display Values
Condition cards showed wrong penalty magnitudes (e.g., -0.1 instead of -0.5) because the top-level `conditions[].penalty` in the character endpoint returns a different value than the per-stat `stats[stat].conditions[].penalty` breakdown. Since the per-stat penalties are authoritative (they drive the correct effective stat values shown in the stat bars), the fix cross-references each condition against the per-stat breakdown to get the correct display value. Also fixed `isBuff` fallback to default to penalty unless API explicitly sends `isBuff: true`, and fixed the same sign-convention bug in menu page condition badges.

**Files modified:** `app/play/components/CharacterTab.js`, `app/menu/page.js`.

### Gameplay Showcase Component (Landing Page)
New `GameplayShowcase` component inserted between Hero and Features sections on `/landing`. Auto-plays a scripted gameplay turn when scrolled into view to demonstrate the "Any World. Any Genre." value prop.

**Three genre scenarios cycle automatically:**
1. **Dark Fantasy** (Bard narrator) — DEX escape through a window, Tier 2 Success
2. **Industrial Sci-Fi** (Noir narrator) — CHA + Forgery bluff, Tier 3 Costly Success
3. **Noir Mystery** (Whisper narrator) — WIS observation, Tier 2 Success

**Animation sequence per scenario:**
- Genre label + storyteller fade in → narrative word-by-word typewriter (50ms/word) → 800ms pause → choices A/B/C slide in with 120ms stagger → custom action row (D) slides in last → 1.5s pause → selected choice highlights (gold), others dim to 35% → dice result bar fades up → result text typewriter (40ms/word) → replay controls fade in

**Visual details:**
- Narrative: Alegreya italic 18px, color #b8ad94, pipe cursor during typing
- Choice cards: flex letter+text, slide-in from left, selected gets gold border/warm bg
- Custom row (D): input-style div + GO button, dims with unselected choices
- Dice bar: centered flex row with dot separators, green for Success, amber for Costly Success
- Controls: "NEXT SCENARIO" button + 3 clickable scenario dots, changes to "REPLAY" after all three play
- `prefers-reduced-motion`: skips typewriter (shows all text immediately), removes translateX/Y transforms

**Trigger:** IntersectionObserver at threshold 0.3, fires only once. Replay button handles subsequent plays.

**Files created:** `app/landing/GameplayShowcase.js`, `app/landing/GameplayShowcase.module.css`.
**Files modified:** `app/landing/page.js`.

### Compass Hint Button, Talk to GM Overhaul, GM Aside Rendering
Three interconnected features added to the /play game layout:

**1. Compass Button + Direction Popover (ActionPanel)**
- Ghost-styled compass button added to the right of the GO button in the custom action row
- Clicking toggles a floating popover anchored above the action panel (no overlay/backdrop)
- Popover shows: current location (from `gameState.world.currentLocation`), active quests (server ◆ and player ○ markers, capped at 5 with overflow note), and empty state guidance
- "Ask the GM for guidance" escalation button at bottom (costs 1 turn) — calls `POST /talk-to-gm/escalate` directly
- Closes on click-outside or Escape key

**2. Talk to GM — Two-Tab Restructure**
- Panel now has "Rules" and "My Story" tabs with independent state
- **Rules tab:** Existing free-lookup behavior plus 4 quick-question chips:
  - 3 static: "Where can I go?", "Remind me of my goals", "What do I know about this place?"
  - 1 contextual (sparkle icon): adapts based on `lastResolution` — priority: combat → social encounters → Fortune's Balance → skill checks → conditions → fallback "How do rolls work?"
  - Chips behave as if the player typed the text and hit Enter. Hidden while loading/showing a response
- **My Story tab:** Out-of-character narrative steering (does not advance turn)
  - Rotating placeholder cycles through 6 example prompts every 4 seconds
  - Subtle "The GM will respond without advancing your turn" hint below input
  - Response displayed inline as GM aside (Alegreya italic, gold left border)
  - Response also injected into narrative panel as `gm_aside` entry
  - Wired to `POST /talk-to-gm/meta` (non-advancing meta endpoint)
  - Directive feedback: when `directiveStored: true`, shows confirmation line ("The GM noted your goal/preference") in 11px dim italic
  - Rate limit (429): shows warning text in `--text-warning` instead of generic error

**3. GM Aside Rendering (NarrativePanel)**
- Entries with `type: 'gm_aside'` render as compact aside blocks (not TurnBlocks)
- Visual: card background, gold left accent border, compass icon + "GM" label header, Alegreya italic body
- Visually lighter than turn blocks — feels like a whispered backstage note

**Data flow:**
- `lastResolution` and `lastStateChanges` computed in page.js from last turn with a resolution, threaded to TalkToGM via NarrativePanel
- `objectives` (world data: activeQuests + objectives) and `currentLocation` threaded from gameState to ActionPanel
- `handleMetaResponse` callback adds gm_aside entries to the turns array
- `handleCompassEscalate` calls escalation endpoint directly with canned guidance question

**Files modified:** `app/play/page.js`, `app/play/components/ActionPanel.js`, `app/play/components/ActionPanel.module.css`, `app/play/components/TalkToGM.js`, `app/play/components/TalkToGM.module.css`, `app/play/components/NarrativePanel.js`, `app/play/components/NarrativePanel.module.css`.

---

## Previous Work (2026-04-02)

### Auth Polish + Landing Quick Fixes Batch
12-item design audit batch across auth and landing pages:

**Auth (items 1-6):**
1. Chrome autofill dark theme override in globals.css (prevents white input backgrounds)
2. Input focus ring: visible 3px gold spread + ambient glow (was barely visible 0.06 opacity)
3. Heading 24→28px, heading-to-subtitle gap 6→14px
4. Staggered entrance: 6 animation groups cascade 0-300ms via CSS keyframes (was single card fade)
5. Card atmospheric glow: faint gold border (rgba 0.08) + depth shadow
6. Tighter card for viewport fit: padding 40/36→32/28, field gaps 20→16px, divider 24→18px

**Landing (items 7-12):**
7. How It Works connecting line: 1→2px width + gold box-shadow glow
8. Step circle hover: gold box-shadow + border-color transition
9. CTA reveal: fadeUpSlow duration 0.8→1.2s
10. FAQ accordion: already had transitions (verified working)
11. "See all questions" hover: underline-offset 4px
12. Border-radius: already consistent (8px cards, 6px buttons) — no changes needed

**Files modified:** `app/globals.css`, `app/auth/page.js`, `app/auth/page.module.css`, `app/landing/page.js`, `app/landing/page.module.css`, `components/ScrollReveal.js`.

### Global Card Contrast Token Update
Updated global CSS tokens for card visibility across all pages: `--bg-card` #111528→#151a2c, `--bg-card-elevated` #161b30→#1a2038, `--border-primary` #1e2540→#252a40. Landing feature cards switched from hardcoded hex to `var(--bg-card)` and `var(--border-primary)`. Design system doc updated with new values.

**Files modified:** `app/globals.css`, `app/landing/page.js`, `docs/design-system.md`.

### Card Contrast and Hover Fix
Feature cards were nearly invisible against the page background. Bumped card bg #101420→#151a2c, border #1e2030→#252a40, gap 32→40px. Hover now has translateY(-2px), stronger gold box-shadow (0.12 opacity), and gold-tinted border. Hero tagline bumped from clamp max 30px to 36px to reduce the scale jump from the 80px wordmark.

**Files modified:** `app/landing/page.js`, `app/landing/page.module.css`, `app/landing/HeroSection.js`.

### Auth Page Layout Fix and Polish
Fixed broken horizontal layout (missing `flexDirection: 'column'`) and added visual polish:

1. **Layout fix:** Page container now uses flex column. NavBar at top, Footer at bottom, form card centered in remaining space via a flex-grow wrapper.
2. **Entrance animation:** Form card fades in with 16px slide-up over 0.6s ease-out on mount.
3. **Tab transitions:** Active tab gets gold treatment. Inactive tabs warm to gold on hover via CSS classes.
4. **Link hovers:** "Forgot password?", "Back to Sign In", Terms/Privacy links all shift to gold on hover.
5. **Submit button:** Already had hover state (translateY(-1px) + gold box-shadow) — verified working.
6. **Particles:** Moved `<ParticleField />` before NavBar so it renders behind all content. Google button left as Google-rendered (restyling risks breaking the OAuth flow).

**Files modified:** `app/auth/page.js`, `app/auth/page.module.css`.

### Landing Page Polish Pass (Design Audit)
Seven tuning adjustments to `/landing` based on a design audit:

1. **Typography bumps:** Feature card h3 19→27px, epigraphs 15→16px (removed opacity:0.85), step headings 22→24px, FAQ questions 17→19px.
2. **Feature card hover:** Added background shift (#101420→#12151f) and subtle gold box-shadow on hover. Added background/box-shadow to transition.
3. **Feature card defaults:** Background #101420, border #1e2030 (more visible against page bg). Grid gap 28→32px.
4. **Section spacing variation:** Features 120px top, How It Works 80px, FAQ 60/80px, CTA 120/100px. Breaks the flat 100px rhythm.
5. **ScrollReveal variants:** Added `variant` prop to ScrollReveal component. `fadeUp` (default), `fadeLeft` (How It Works steps, -20px X), `fadeOnly` (FAQ items, opacity only), `fadeUpSlow` (CTA section, 40px/0.8s). Feature card stagger increased to i*0.15.
6. **Particle will-change:** Added `will-change: transform, opacity` to `.particle` CSS for GPU compositing.
7. **Particle cursor parallax:** Particles grouped into 3 depth layers by size. Mouse movement applies opposite-direction parallax via rAF lerp loop (4/8/14px max shift). Layer wrapper divs receive transform, preserving existing float/twinkle keyframes. Disabled on touch devices and `prefers-reduced-motion`.

**Files modified:** `app/landing/page.js`, `app/landing/page.module.css`, `app/landing/FAQSection.js`, `app/landing/CTASection.js`, `components/ScrollReveal.js`, `components/ParticleField.js`, `components/ParticleField.module.css`.

### Menu Page Redesign: Single-Column Layout with Progressive Density
Complete rewrite of `/menu` from 3-column grid to single centered 680px column with progressive information density.

**Design system addition:**
- New CSS variable `--bg-card-elevated: #161b30` — elevated card/button surfaces that read clearly against bgMain. Added to `docs/design-system.md` and `app/globals.css`.

**Layout architecture (top to bottom):**
- **Empty state (0 games):** Vertically centered cinematic — "Every story starts here." heading, subtitle, body text, gold "BEGIN YOUR STORY" CTA with radial glow.
- **Welcome heading:** "Welcome back." in Cinzel gold, italic subtitle below.
- **CONTINUE YOUR ADVENTURE:** Section label + hero card (always expanded, no expand/collapse).
- **Hero card:** Left gold border, elevated bg, character name + time header row, world name, full narrative blurb, auto-fetched character stats grid (6 stat boxes with danger/success coloring), condition badges, skill badges with "+X more" toggle, RESUME/CONTINUE SETUP button + metadata footer.
- **NEW GAME button:** Full-width ghost-style button (elevated bg, secondary text, warms to gold on hover).
- **YOUR GAMES:** Section label with count + full-width narrative cards (games at index 1-2). Left accent border warms to gold on hover, character name shifts to gold. Full blurb, metadata footer.
- **OLDER GAMES:** Section label with count + 2-column compact grid (games at index 3+). Name + world + metadata only, no blurb. Stacks to single column below 480px.
- **Footer:** Sticks to viewport bottom via flex layout.

**What was removed:**
- `SnapshotPickerModal` and "From Template" button (accessible via init Phase 2)
- `DisplaySettings` modal and its button (lives on /settings page)
- `HeroCard` expand/collapse behavior
- 3-column game grid and 1120px outer wrapper
- `GOLD` palette object (replaced with CSS variables)

**What was preserved:**
- Auth check + redirect, game sorting, `GameDetailModal`, `DeleteConfirmModal`, `SettingIcon`, `formatTimeAgo`, `ParticleField`, font/size localStorage persistence.

**DiffBadge updated:** Now uses design system badge colors exactly (solid hex, no rgba).

**Games in setup:** Render in their natural position by recency with "New Character" name, "Setting up..." world, "Character creation in progress." blurb (full cards) or no blurb (compact), "SETUP" JetBrains Mono badge.

**Files modified:** `app/menu/page.js`, `app/menu/page.module.css`, `app/globals.css`, `docs/design-system.md`.

### Menu Page Entrance Animations
Added staggered fade-in-up entrance animations to all menu page content sections. Each section uses opacity + translateY transitions keyed to a `loaded` state, with increasing delays (0.05s–0.5s) and cubic-bezier(0.16, 1, 0.3, 1) easing. Applied to both empty state (heading, subtitle, body, CTA) and returning player layout (welcome, hero card, NEW GAME button, YOUR GAMES, OLDER GAMES). No ScrollReveal — all above-fold content animates on page load.

**Files modified:** `app/menu/page.js`.

### Card Grain Texture Experiment
New `CardNoise` component (`components/CardNoise.js`) adds a subtle feTurbulence SVG filter noise overlay to card surfaces. `NoiseFilter` SVG defined once in `app/layout.js`. Applied to hero card (opacity 0.03), narrative cards (0.025), compact cards (0.025), and NEW GAME button (0.02). Respects `prefers-reduced-motion` — skips rendering entirely when reduced motion is preferred. This is an experiment; easily removable if it doesn't work on real screens.

**Files created:** `components/CardNoise.js`.
**Files modified:** `app/layout.js`, `app/menu/page.js`.

### claude-upload Sync Catchup
Synced all files that were modified across the Apr 1 and Apr 2 sessions but not yet copied to claude-upload: `FRONTEND_STATUS.md`, `design-system.md`, `app-layout.js`, `component-CardNoise.js`, `faq-page.module.css`, `landing-page.module.css`, `component-NavBar.module.css`, `component-ScrollReveal.js`, `hook-useScrollReveal.js`. Removed duplicate `layout.js` (correct copy is `app-layout.js`).

### Feature Card Epigraphs + Server-Side Rendering for Marketing Pages

**Feature card epigraphs:** Added italic gold Alegreya epigraph lines above each feature card heading on /landing. Four atmospheric scene fragments that dramatize each feature.

**SSR conversion:** Converted 5 marketing pages from client-rendered to server components. Static content now reaches the browser as pre-rendered HTML (faster FCP, better SEO).
- `/terms` and `/privacy` — Removed `'use client'`. Replaced `loaded` state with new `ClientFadeIn` client component wrapper.
- `/pricing` — Removed `'use client'` and unused `loaded` state (all animations already handled by ScrollReveal).
- `/faq` — Extracted interactive content (category tabs, accordion state) into `FAQContent` client component. Page shell, header, and bottom CTA render server-side.
- `/landing` — Extracted `HeroSection`, `FAQSection`, `CTASection`, `ScrollFade` into separate client component files. `FeaturesSection` and `HowItWorksSection` stay inline as static content with ScrollReveal wrappers.
- `/rulebook` — Left as `'use client'`. Scroll spy with ref arrays across 22 sections makes clean extraction too risky.

**Files created:** `components/ClientFadeIn.js`, `app/faq/FAQContent.js`, `app/landing/HeroSection.js`, `app/landing/FAQSection.js`, `app/landing/CTASection.js`, `app/landing/ScrollFade.js`.
**Files modified:** `app/landing/page.js`, `app/faq/page.js`, `app/terms/page.js`, `app/privacy/page.js`, `app/pricing/page.js`.

### Wire New Backend Fields (lastPlayedAt, worldName)
Two backend field integrations:

**Menu page — lastPlayedAt:** Games now sort by `lastPlayedAt` (falling back to `createdAt` if null). All three `formatTimeAgo` displays (hero card, narrative cards, compact cards) use `lastPlayedAt || createdAt` so active games show recency of last play.

**Init wizard — worldName:** Added `worldGenName` state. When `pollWorldStatus` returns `status: 'complete'`, captures `res.worldName`. The phase 5 sessionStorage write now uses `worldGenName || settingName` for custom worlds, so AI-generated names (e.g. "The Fraying Throne") propagate to the /play loading screen.

**Files modified:** `app/menu/page.js`, `app/init/page.js`.

---

## Previous Work (2026-04-01)

### Scroll-Reveal Animations Across Public Pages
Added `ScrollReveal` component and `useScrollReveal` hook (IntersectionObserver-based, respects `prefers-reduced-motion`). Wrapped all below-the-fold sections on landing, FAQ, pricing, and rulebook pages.

**Key changes:**
- **`ScrollReveal` component** (`components/ScrollReveal.js`): Wraps children with fade-up animation (30px translateY, 0.7s cubic-bezier) triggered on scroll into viewport. Accepts `delay` prop for staggered reveals.
- **`useScrollReveal` hook** (`hooks/useScrollReveal.js`): IntersectionObserver with 15% threshold, -60px root margin. Fires once per element. Skips animation entirely when `prefers-reduced-motion: reduce` is active.
- **Landing hero cascade:** Replaced single boolean `loaded` fade-in with 5-stage staggered reveal (80ms–900ms). Each element (wordmark, tagline, sub-tagline, CTAs, chevron) has independent distance/duration/easing. Scroll chevron now tied to stage 5 instead of a separate timer.
- **Landing sections:** Features grid, How It Works steps, FAQ accordion, and bottom CTA all wrapped in `ScrollReveal` with per-item stagger delays.
- **FAQ page:** Header, category tabs, and each FAQ item wrapped in `ScrollReveal`.
- **Pricing page:** Hero, price cards, top-up packs, FAQ items, and bottom CTA wrapped in `ScrollReveal`.
- **Rulebook page:** Hero section replaced manual fade-in with `ScrollReveal`.
- **Landing CSS additions:** Feature card hover (border-color + gold h3 transition), step item hover (circle border + gold h3), FAQ question border hover, `prefers-reduced-motion` overrides for all animated elements. Tablet and mobile responsive rules for section spacing.
- **NavBar landing variant:** Added in-page anchor links (Features, How It Works, FAQ) with `.sectionLink` class hidden on mobile. Underline hover animation on all nav links.

**Files created:** `components/ScrollReveal.js`, `hooks/useScrollReveal.js`.
**Files modified:** `app/landing/page.js`, `app/landing/page.module.css`, `app/faq/page.js`, `app/faq/page.module.css`, `app/pricing/page.js`, `app/rulebook/page.js`, `components/NavBar.js`, `components/NavBar.module.css`.

### Init Phase Crossfade + /play Loading Screen Updates
Three changes to the init-to-play transition flow:

**1. Init phase crossfade for non-generation transitions:**
- Phases 0→1, 1→2, 3→4, 4→5 now use a light content crossfade (300ms fade-out with slight upward slide, then fade-in) instead of the full 2-second ember overlay.
- Phase 2→3 (character → proposal generation) keeps the full ember overlay since real AI generation is happening.
- New `contentFading` state drives the crossfade on the main content wrapper div.

**2. Phase 5 → /play: skip init overlay:**
- "BEGIN ADVENTURE" on Phase 5 now fades out init content and navigates directly to `/play`. No redundant init ember overlay in between.
- Enhanced `crucible_loading_summary` sessionStorage write: now includes `settingArchetype`, `isPrebuilt`, and resolved prebuilt world name.

**3. /play loading screen updates:**
- Added "PROLOGUE" gold Cinzel label above ember particles, matching init overlay style (same font, size, weight, color, letter-spacing).
- Summary bar World field: prebuilt worlds show just their name ("The Fraying Throne"), custom/archetype worlds show "Sword & Soil" or "Name (Archetype)" format.
- ENTER button: uses resolved world name ("ENTER THE FRAYING THRONE" for prebuilt).
- Updated cycling lore messages to match Prologue theme: "The world takes shape...", "Setting the stage...", "Preparing your first scene...", etc.

**Files modified:** `app/init/page.js`, `app/play/page.js`.

## Previous Work (2026-03-31)

### Admin Dashboard Full Rewrite
Complete rewrite of `app/admin/page.js` and `app/admin/page.module.css` for consistent spacing, sizing, and clean code organization. Replaced ~15 incremental prompt layers with a single cohesive implementation.

**Key changes from previous version:**
- **Consistent layout:** Header 16px 40px with bottom border, tab bar 0 40px, content 24px 40px. No more mixed 48px/40px padding.
- **Adjusted typography:** Tab bar 13px (was 14), StatusBadge 10px/2px 8px (was 11px/3px 10px), SortHeader 11px (was 12), StatCard value 24px (was 28), StatCard label 11px (was 12).
- **Detail panel:** 480px (was 500px), padding 24px 28px (was 28px 32px). Removed prev/next arrows from user detail — close and click another row.
- **Reusable components:** Extracted `StatCard` (with compact/accent/onClick props), `Toggle` (self-contained save/fail feedback, replaces per-tab toggleStatus state objects).
- **Dim rows:** Games with 0 turns or no character at 0.55 opacity (was 0.6).
- **Health tab order fixed:** Status → Counts → Retention → Storyteller → Setting → Stuck Games → Errors. Added explanation line for stuck games section.
- **Header nav:** Links with `·` separators and CSS hover class (headerLink). "Signed in as" far right.
- **CSS cleanup:** Uses `deleteModal`/`deleteModalCard` classes (was inline), removed unused `dangerBtnSolid`, responsive panel 380px (was 400px).
- **Game detail layout:** Cost split into "Total" line + "Init · Gameplay" line + "turns · created · last played" line. Backstory truncated at 300 chars with expand toggle.
- **adminApi.js fix:** `updateInviteCode` now sends `{ inviteCode }` (was `{ code }`) to match backend field name.

**All features preserved:** Cross-tab navigation (5 source points), checkbox bulk delete with progress, client-side report filtering, toggle save/fail feedback, type-to-confirm delete modals, sortable tables, status filter pills, narrative log grouping.

**Files modified:** `app/admin/page.js`, `app/admin/page.module.css`, `lib/adminApi.js`, `docs/FRONTEND_STATUS.md`.

### NavBar & Footer Polish
- **NavBar standard links:** Updated to FAQ, Rulebook, Pricing, AuthAvatar (added FAQ link before Rulebook).
- **NavBar active page highlighting:** `currentPage` prop applies gold accent (#c9a84c) via `.navLinkActive` class. Works for faq, rulebook, pricing, and settings (AuthAvatar active border).
- **Landing variant:** Excludes FAQ page link — the section anchor `#faq` already covers it.
- **Footer verified:** All 11 pages confirmed to have Footer imported and rendered (standard or minimal variant). Footer CSS already includes `position: relative; z-index: 1` on both variants.
- **Files modified:** `components/NavBar.js`, `app/menu/page.js`, `docs/FRONTEND_STATUS.md`.

### Menu Page: Delete Game + New from Template
- **Delete game:** Added delete button to ContinueCard (top-right, hover danger color) and GameRow expanded section (text button next to Resume Game). Both open a type-to-confirm DeleteConfirmModal.
- **DeleteConfirmModal:** Overlay modal matching DisplaySettings pattern. Shows game context (character name, setting). Player must type character name (or setting name, or "DELETE" for pending games) to confirm. Disabled button until match, shake animation on mismatch, loading state during API call, error display.
- **Delete API:** Calls `DELETE /api/games/${gameId}` via `del()` from lib/api.js. On success, removes game from local state (list re-renders naturally).
- **New from Template:** "New from Template" button below NewGameButton, only shown when `hasGames && isPlaytester`. Opens SnapshotPickerModal.
- **SnapshotPickerModal:** Fetches `GET /api/games/snapshots` on open. Shows loading state, empty state with explanation, or scrollable card list. Each card shows snapshot name, setting, faction/NPC/location counts, type badge, created date. Clicking a card calls `POST /api/games/snapshots/${id}/import-mine`, navigates to `/init?id=${gameId}` on success.
- **Files modified:** `app/menu/page.js`.

### Admin Dashboard: Sortable Tables + Push Panels + Delete from User Detail
- **Sortable columns:** Both Users and Games tables now sort by clicking column headers. `sortField`/`sortDirection` state with `useMemo`-sorted data. Arrow indicators on active column. Default: Games by ID desc, Users by Joined desc. Generic `sortData()` comparator handles numeric, alpha (case-insensitive), and date types with nulls-last.
- **SortHeader component:** Reusable clickable header with hover gold color and arrow indicator.
- **Status column width:** Games table grid changed from `110px` status column to `85px`. Full grid: `50px 2fr 1.2fr 1.2fr 85px 60px 90px 80px 90px 40px`.
- **Push layout panels:** User and Game detail panels converted from fixed overlay + backdrop to inline flex push layout. Panel renders as first flex child (500px fixed width), table content shifts right. No dark backdrop overlay. Panel has `border-right: 1px solid #1e2540`, sticky positioning, scrollable.
- **Delete games from user detail:** Each game row in user detail panel now has a trash icon delete button. Opens shared `DeleteGameModal` (type-to-confirm). On success, removes game from user detail list, decrements game count, and invalidates Games tab cache via `onGameDeleted` callback.
- **DeleteGameModal (type-to-confirm):** Replaces old simple confirm modal. Player types character name (or `game-{id}` if no character) to confirm. Shake animation on mismatch, disabled button until match, loading state, error display. Used by both Games tab row delete and User detail panel delete. Close on Escape.
- **Files modified:** `app/admin/page.js`, `app/admin/page.module.css`.

### Landing Page Full Refresh
- **CTA routing:** Both "START YOUR ADVENTURE" (hero) and "CREATE YOUR CHARACTER" (bottom CTA) now check `getToken()`. Token exists: navigate to `/menu`. No token: navigate to `/auth`. Both are `<button onClick>`, not `<Link>`.
- **Scroll chevron:** Downward-pointing SVG chevron below CTAs, ~64px from bottom of hero viewport. Color: `var(--accent-gold)` at 0.4 opacity, gold drop-shadow glow. Gentle 3s float animation (7px translateY oscillation). Delayed fade-in (0.8s after hero elements load). Fades to opacity 0 when user scrolls >100px. `pointer-events: none` when hidden. Respects `prefers-reduced-motion`.
- **Feature grid 2x2:** Changed from `repeat(auto-fit, minmax(260px, 1fr))` to `repeat(2, 1fr)`. Reduced section maxWidth from 1200px to 1000px. Single-column on mobile (existing 767px breakpoint).
- **Copy updates:** Sub-tagline changed to "A solo tabletop RPG powered by AI..." Step 04 desc updated. Bottom CTA body text updated ("reacts to everything you do").
- **FAQ section:** New `FAQSection` component with `id="faq"` between How It Works and CTA. Gold "FAQ" label, 4 accordion questions (one open at a time), Cinzel 17px question text with rotating chevron, Alegreya Sans 17px answers with height/opacity transitions, separator lines. "See all questions" link to `/faq`.
- **Nav bar:** Added Rulebook (`/rulebook`) and Pricing (`/pricing`) as `<Link>` elements. FAQ anchor now points to `#faq` (on-page section).
- **Footer:** Links now have real hrefs: FAQ `/faq`, Rulebook `/rulebook`, Pricing `/pricing`, Privacy `/privacy`, Terms `/terms`. Added copyright line: "2026 CrucibleRPG" in Alegreya Sans 13px `var(--text-dim)`.
- **Particle visibility boost:** All pages updated from size 0.5-2.5px/opacity 0.03-0.23 to size 0.8-3.3px/opacity 0.08-0.33. Standardized across 11 page files. Design system doc updated.
- **Particle float keyframe:** Added `@keyframes float` to landing page CSS module (was missing, other pages had it).
- **Files modified:** `app/landing/page.js`, `app/landing/page.module.css`, `app/auth/page.js`, `app/page.js`, `app/faq/page.js`, `app/privacy/page.js`, `app/terms/page.js`, `app/menu/page.js`, `app/pricing/page.js`, `app/settings/page.js`, `app/saved-games/page.js`, `app/play/page.js`, `docs/design-system.md`.

### FAQ Page
- **New page:** `/faq` with 6 category tabs and 32 questions covering The Game, Gameplay, World & Character, Pricing & Billing, Free Trial, and Technical & Privacy.
- **Layout:** Matches `/privacy` and `/terms` pattern: inline styles + CSS module, ParticleField, shared nav (Home, Pricing, FAQ active, Rulebook), standard footer.
- **Interaction:** Pill-style category tabs with active gold highlight. Accordion FAQ items with rotating chevron, height/opacity transitions. Switching categories closes all open items.
- **Bottom CTA:** "Ready to begin?" heading with gold "START YOUR ADVENTURE" button linking to `/auth`.
- **Mobile responsive:** Particles hidden, nav links hidden, 44px tap targets on tabs/questions/CTA, full-width CTA button.
- **Also added:** Rulebook link to `/menu` nav bar and `/play` TopBar (book icon, opens in new tab).

### Font Audit - Eliminate Faux Bold/Italic
- **Problem:** Browser faux bold/italic on text where CSS requested weights or styles not loaded from Google Fonts. Confirmed fuzzy text on loading screen (Alegreya italic weight 600, which doesn't exist).
- **Alegreya italic weight 600 fix:** Changed to weight 700 in loading page (the only instance).
- **Alegreya Sans italic fixes (6 instances):** Switched font from Alegreya Sans to Alegreya for all italic text, since Alegreya Sans has no italic variant loaded. Affected files: `app/init/page.js` (2), `app/play/components/MapTab.js` (1), `app/play/components/ReportModal.js` (1), `app/play/components/SettingsModal.js` (2).
- **JetBrains Mono:** Loaded as variable font (no explicit weight array in next/font/google config), so all weights 100-800 are available. No fixes needed.
- **Design system update:** Added "Font Import - Required Weights" section to `docs/design-system.md` documenting all loaded weights/styles and the key rule about using Alegreya (not Alegreya Sans) for italic text.

### Replace Loading Screen with In-Page Loading State
- **Eliminated `/loading` route:** Deleted `app/loading/page.js` and `app/loading/page.module.css`. The standalone loading page with fake progress bar is gone.
- **New loading overlay in `/play`:** Full-viewport overlay rendered ON TOP of the game layout (position fixed, z-index 100) instead of an early return. Game layout mounts and loads data underneath.
- **Overlay features:** Character summary bar (from sessionStorage), 8 firefly ember dots with unique CSS keyframe wandering paths (14-21s linear loops), lore fragment cycling (6 phrases, 3s interval, 300ms fade), tips section (10 tips, 5.5s interval, 400ms fade), background particle field + radial glow.
- **Loading completion flow:** When data finishes loading: lore switches to "Your story begins..." in gold weight 700. After 1.5s hold, "ENTER {WORLDNAME}" button fades in with gold gradient shimmer animation. On click, overlay fades out over 600ms revealing the game layout beneath.
- **Init wizard update:** Before navigating to `/play`, the init wizard writes `crucible_loading_summary` to sessionStorage with `characterName`, `worldName`, `storyteller`, `difficulty`. Navigation changed from `/loading?gameId=...` to `/play?gameId=...`.
- **Files deleted:** `app/loading/page.js`, `app/loading/page.module.css`.
- **Files modified:** `app/play/page.js`, `app/play/play.module.css`, `app/init/page.js`.

### Bug Report Wiring + Admin Reports Tab
- **Bug report modal wired:** New `ReportModal` component at `app/play/components/ReportModal.js`. Supports both "bug" and "suggestion" modes. Submits to `POST /api/bug-report` with type, category, message, gameId, and auto-attached context (turn number, character, setting, storyteller, difficulty, last action, browser). Handles success state (checkmark + thank you), 429 rate limit, and validation errors.
- **Sidebar footer buttons:** Added "Bug" and "Suggest" buttons to the sidebar footer in `/play`. Bug button highlights danger orange on hover, suggest button highlights gold.
- **Admin Reports tab:** 6th tab added to admin dashboard between Health and Settings. Report cards (not table rows) with type badge (BUG/SUGGESTION), category badge, status badge (Open/Reviewed/Resolved/Dismissed), player info + game context, expandable message, collapsible context fields. Admin can change status via pill buttons (optimistic PATCH), add/edit notes, and view associated game.
- **Type + status filters:** Dual filter rows with pill buttons. Type: All/Bugs/Suggestions. Status: Open/Reviewed/Resolved/Dismissed. Both filters active simultaneously. Re-fetches on filter change.
- **Tab badge:** Reports tab shows gold count badge when open reports > 0 (sourced from health endpoint).
- **Health tab integration:** Added "Open Reports" stat card showing bug + suggestion counts. Clickable to switch to Reports tab.
- **New files:** `app/play/components/ReportModal.js`.
- **Modified files:** `app/play/page.js`, `app/play/components/Sidebar.js`, `app/play/components/Sidebar.module.css`, `app/admin/page.js`, `lib/adminApi.js`.

### Settings Page + Auth-Aware Nav Bar
- **New page:** `/settings` with 4 zones: Identity (avatar + editable display name + meta), Display Preferences (theme toggle, font picker, size picker, live preview), Subscription (mock data for free/subscriber/cancelled states, turn usage bar, top-up packs), Account + Legal (sign out, delete account with DELETE confirmation, legal links).
- **AuthAvatar component:** New shared component at `components/AuthAvatar.js`. Renders avatar circle with user initial (links to /settings) when logged in, or "Sign In" text link (to /auth) when not. Accepts `size` prop (default 32, 28 for compact TopBar) and `active` prop (gold border on /settings itself).
- **Nav bar updates across 7 pages:**
  - `/menu`: Removed gear icon, "Settings" button, "Log Out" button, DisplaySettings modal component, and old inline avatar. Replaced with AuthAvatar circle linking to /settings.
  - `/landing`: Replaced "SIGN IN" nav link with AuthAvatar (shows Sign In if logged out, avatar if logged in).
  - `/pricing`: Replaced "SIGN IN" button with AuthAvatar.
  - `/rulebook`: Replaced "SIGN IN" nav link with AuthAvatar.
  - `/saved-games`: Added AuthAvatar next to "Main Menu" back link.
  - `/init`: Added AuthAvatar to right side of header bar.
  - `/play` (TopBar): Added 28px AuthAvatar between sidebar toggle and connection dot.
- **Display settings persistence:** Settings page reads/writes `crucible_display_settings` localStorage key (same shape as /play: `{ theme, font, textSize }`). Added `theme` key to the existing object.
- **Graceful fallback endpoints:** `PUT /api/auth/profile` and `DELETE /api/auth/account` are called but may not exist on backend yet. Profile edit falls back to localStorage update on 404. Account delete shows "not available yet" message on 404.
- **Files created:** `app/settings/page.js`, `app/settings/page.module.css`, `components/AuthAvatar.js`.
- **Files modified:** `app/menu/page.js`, `app/landing/page.js`, `app/pricing/page.js`, `app/rulebook/page.js`, `app/saved-games/page.js`, `app/init/page.js`, `app/play/components/TopBar.js`.

### Admin Dashboard — Cost Split Display + Layout Fixes
- **Cost split display:** Backend now returns `initCost` and `gameplayCost` alongside `totalCost`. Games tab AI Cost column shows tooltip on hover with "Init: $X.XXXX - Gameplay: $X.XXXX" breakdown (only when initCost > 0). $/Turn column now uses backend `costPerTurn` (gameplay-only) instead of client-side `totalCost / turns`. Game Detail panel header shows "Total: $X.XXXX" with init/gameplay breakdown line below. Costs tab stat card "Avg Cost/Turn" sub-text changed to "Gameplay only"; added init/gameplay totals line below stat cards.
- **Content area widened:** max-width 1100px to 1400px for better use of wide screens.
- **Games table grid widened:** Column template changed to `50px 1.8fr 1.2fr 1.2fr 110px 70px 90px 80px 100px 50px` (was `50px 1.5fr 1fr 1fr 80px 70px 80px 70px 90px`). Status column 80px to 110px. Added 50px delete column at end.
- **Status badge abbreviation:** "INITIALIZING" shortened to "INIT" in badge display. Badge font reduced to 9px/0.06em letter-spacing for better fit.
- **Row delete button:** Each game row now has a trash icon in the last column. Click opens a confirmation modal with game context. On confirm, calls `DELETE /api/admin/games/:id` and removes from local state.
- **Detail panel moved to left:** Slide-over panel now enters from the left edge (`left: 0`, `border-right`, `translateX(-100%)` animation) instead of right.
- **Last Played field:** Frontend now checks both `lastPlayedAt` and `lastPlayed` field names. If both are null, displays "Never" — this may indicate a backend query issue (flagged, not fixed here).
- **Files changed:** `app/admin/page.js`, `app/admin/page.module.css`.

### Admin Dashboard — /admin (initial build, 2026-03-29)
- **New page:** Protected admin dashboard at `/admin` with 5 tabs: Users, Games, Costs, Health, Settings.
- **Auth guard:** Two-layer protection. Standard auth check redirects to `/auth` if no token. Admin check calls `GET /api/admin/users` on mount; 403 redirects to `/menu`. No admin links exist in the UI — accessed by direct URL only.
- **Users tab:** Searchable user table with name, email, game count, playtester toggle (optimistic PATCH), join date, last active (relative time). Click a user name to open a slide-over detail panel showing total AI spend and their games list.
- **Games tab:** Searchable/filterable game table with status pill filters (All/Active/Initializing/Completed/Abandoned). Columns: ID, character, player, setting, status badge, turns, AI cost (highlighted >$0.50), $/turn, last played. Click a row to open game detail panel with character snapshot (stats grid, skills, conditions, inventory), collapsible narrative log (with "Load full narrative" for 200+ entries), and delete game with confirmation.
- **Costs tab:** 4 stat cards (Total Spend, Total Turns, Avg Cost/Turn, Active Games) + highest-cost games list.
- **Health tab:** Status cards (DB connection, 24h errors, stuck games), count cards (users, games, turns), stuck games list, storyteller/setting popularity bars, retention metrics (players with games, 2+ games, returning users), collapsible recent errors.
- **Settings tab:** Invite code display with source label + update form.
- **Data loading:** Each tab fetches on first visit, cached in state. Refresh button per tab forces re-fetch.
- **New files:** `app/admin/page.js`, `app/admin/page.module.css`, `lib/adminApi.js`.
- **Modified files:** `lib/api.js` (added `patch` export for PATCH method).

### Fix: /menu crash — missing CSS module import
- **Bug:** `Uncaught ReferenceError: styles is not defined` on the /menu page. The page referenced `styles.pageContainer`, `styles.contentWrapper`, and `styles.continueCard` but the `import styles from './page.module.css'` line was missing. The CSS module file existed with all class definitions — only the import was absent.
- **Root cause:** During the mobile responsiveness pass, classNames were added to JSX elements in `app/menu/page.js` but the CSS module import was not added to the file's import block.
- **Fix:** Added `import styles from './page.module.css'` to `app/menu/page.js`.

### Legal Pages — Privacy Policy & Terms of Service
- **New pages:** `/privacy` (Privacy Policy) and `/terms` (Terms of Service). Static legal pages with no API calls.
- **Pattern:** Same layout as Rulebook — `'use client'`, inline styles + CSS module for hover/animation states, ParticleField, shared nav (Home, Pricing, FAQ, Rulebook), standard footer.
- **Content:** Full legal drafts covering account data, AI-generated content, payments (Stripe), cookies, user rights, data retention, liability, disputes (CT jurisdiction), and more.
- **Auth page update:** Terms of Service and Privacy Policy links in the signup form now point to `/terms` and `/privacy` respectively, opening in a new tab.
- **Mobile responsive:** Particles hidden, nav links hidden on mobile (TODO comment for hamburger), 44px tap targets on nav links, `overflow-x: hidden` on page container.
- **Design system compliance:** All text uses CSS custom properties or solid hex. No `rgba()` on text/cards/borders. No em dashes. Footer uses `var(--gold-footer)`. WCAG AA contrast maintained.
- **Files created:** `app/privacy/page.js`, `app/privacy/page.module.css`, `app/terms/page.js`, `app/terms/page.module.css`.
- **Files modified:** `app/auth/page.js` (link hrefs updated).

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
| FE-1 | Play page only reads `?gameId=` param, ignores `?id=` from menu navigation -- causes silent redirect to /menu when resuming games | `/play` page.js | Blocking | Fixed | 2026-03-30 |
| FE-2 | World snapshots 404 console message on /play — actually originates from /init page; persists in console across navigation. Not a /play bug. | `/init` page.js | Non-issue | N/A | init already catches gracefully |
| FE-3 | `ez` ReferenceError crashes play page — TDZ violation from directive handlers (`addDirectiveToast`, `refetchDirectiveState`) referenced in `handleTurnResponse` dependency array before their `const` declarations | `/play` page.js | Blocking | Fixed | 2026-04-07 |
| FE-4 | `setContentFading is not defined` ReferenceError when world gen fails on Phase 2 (character phase) — stale reference left behind when `contentFading` was renamed to `modalFading` during modal overlay conversion. Crashes init wizard on retry/continue after world gen error. | `/init` page.js | Blocking | Fixed | 2026-04-08 |
| FE-5 | `generate-proposal` endpoint called 5+ times for a single game during init. `generateProposal()` had no in-flight guard — `proposalLoading` state is async so concurrent calls weren't blocked. Built-in auto-retries (empty stats + catch) compound the issue. Fix: added `proposalInFlight` ref guard, changed catch retry from `return` to `await` so flag stays true through retry chain. | `/init` page.js | Annoying | Fixed | 2026-04-08 |
| FE-6 | Announcements posted in `/admin` Settings never appeared on `/menu`. Frontend hit `GET /api/games/announcement` per the API contract, but that endpoint wasn't actually implemented on the backend — requests fell through to the `/api/games/:id` handler, which treated "announcement" as a game ID and returned 403/404. Backend registered the dedicated route before `/api/games/:id`; no frontend code changes needed. See FRONTEND_DEBUG.md FE-5. | `/menu` page.js (backend fix) | Annoying | Fixed | 2026-04-09 |

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
| `/api/game/:id/talk-to-gm/meta` | POST | Wired (My Story tab, non-advancing meta query) |
| `/api/game/:id/talk-to-gm/meta/directive` | DELETE | Wired (My Directives tab dismiss, query params lane+index) |
| `/api/game/:id/rewind` | POST | Wired (ActionPanel rewind button, inline confirm) |
| `/api/game/:id/settings/storyteller` | PUT | Wired (Settings panel Game Settings tab) |
| `/api/game/:id/settings/difficulty` | PUT | Wired (Settings panel Game Settings tab, presets + individual dials) |
| `/api/game/:id/settings/ai-model` | GET/PUT | Wired (Settings panel AI Models section, playtester-only, graceful fallback if endpoint not deployed) |
| `/api/game/:id/checkpoints` | GET | Wired (Settings World tab, fetch on tab open) |
| `/api/game/:id/snapshot` | POST | Wired (Settings World tab, save + share with visibility control) |
| `/api/bug-report` | POST | Wired (ReportModal in /play sidebar, handles both bug and suggestion types) |
| `/api/suggestion` | POST | Wired (uses /api/bug-report with type=suggestion) |

### Admin Dashboard (`/admin`)

| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/admin/users` | GET | Wired (Users tab, also used as admin auth check on mount) |
| `/api/admin/users/:id` | GET | Wired (User detail slide-over panel) |
| `/api/admin/users/:id/playtester` | PATCH | Wired (Playtester toggle, optimistic update) |
| `/api/admin/games` | GET | Wired (Games tab with status/search query params) |
| `/api/admin/games/:id` | GET | Wired (Game detail slide-over panel) |
| `/api/admin/games/:id` | DELETE | Wired (Game detail panel delete with confirmation) |
| `/api/admin/games/:id/narrative` | GET | Wired (Game detail "Load full narrative" button) |
| `/api/admin/costs` | GET | Wired (Costs tab stat cards + top games) |
| `/api/admin/health` | GET | Wired (Health tab all sections) |
| `/api/admin/invite-code` | GET | Wired (Settings tab code display) |
| `/api/admin/invite-code` | PUT | Wired (Settings tab code update form) |
| `/api/admin/errors` | GET | Defined in adminApi.js, not yet called from UI |
| `/api/admin/reports` | GET | Wired (Reports tab, with type/status query params) |
| `/api/admin/reports/:id` | PATCH | Wired (Report card status change + admin notes) |
| `/api/admin/reports/summary` | GET | Defined in adminApi.js, not yet called from UI |

### Settings Page (`/settings`)

| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/auth/profile` | PUT | Called for display name edit. Graceful fallback: on 404, updates localStorage only. |
| `/api/auth/account` | DELETE | Called for account deletion. Graceful fallback: on 404, shows "not available yet" message. |

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
- ~~FAQ page~~ (done: 6-category, 32-question FAQ at /faq, 2026-03-30)
- ~~Rulebook page~~ (done: 22-section rulebook at /rulebook, 2026-03-19)
- ~~Legal pages: ToS and Privacy Policy~~ (done: /terms and /privacy, 2026-03-29)
- In-game rulebook: stripped version without marketing chrome
- Copy audit on Init Wizard and Game Layout pages

### Admin
- Mobile admin layout (currently desktop-only, tables scroll horizontally on narrow screens)
- Admin activity audit log (who toggled what, when)
- Batch operations (e.g., grant playtester to multiple users)
- Paginated errors view (endpoint exists in adminApi.js, UI not wired)

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
| `components/AuthAvatar.js` | Shared auth-aware nav element (avatar circle or Sign In link) |
| `lib/api.js` | API client with auth token management |
| `lib/adminApi.js` | Admin API endpoint wrappers (12 endpoints) |
| `lib/useAuth.js` | Auth guard hook for protected pages |
