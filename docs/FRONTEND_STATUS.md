# CrucibleRPG Frontend — Status Tracker

**Last Updated:** 2026-03-16

> **For Claude Code:** After completing any frontend task, update this file with changes to page status, new site-wide rules, copy audit status, or deferred items. Keep the "Last Updated" line current.

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
| Game Layout | `/play` | Complete (6 prompts) | SSE + all gameplay endpoints | Needs live backend for full testing |
| FAQ | `/faq` | Not built | N/A | Page does not exist yet |
| Rulebook | `/rulebook` | Not built | N/A | Page does not exist yet |
| Legal (ToS) | TBD | Not built | N/A | Needs starter draft |
| Legal (Privacy) | TBD | Not built | N/A | Needs starter draft |

**Status definitions:**
- **Complete:** Page renders, styled per design system, all mock/live data displays correctly.
- **API Wired:** Frontend makes real API calls. "Partial" = some endpoints wired, some mock.

---

## Recent Work (This Session: 2026-03-16)

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

### /play Page (6 Prompts)
- **Prompt 1:** Page shell, auth guard, game state loading, top bar, sidebar shell, 3-theme system (dark/light/sepia), font/size selectors, draggable resize handle
- **Prompt 2:** SSE connection (EventSource with auto-reconnect), narrative panel, TurnBlock (header, resolution, narrative text with entity hover, status badges, actions), streaming cursor, turn timeline scrubber, bookmarks (localStorage), auto-scroll
- **Prompt 3:** Character tab (stat bars with condition penalties, skills, abilities, conditions), Inventory tab (paperdoll grid, resource boxes, capacity bar, carried items with durability), Entity popup modal with glossary + player notes
- **Prompt 4:** NPCs tab (disposition badges, relationship bar), Glossary tab (debounced search, category filters), Map tab (list view with current location), Journal tab (objectives with abandon flow, entity notes, scratchpad)
- **Prompt 5:** Dice animation (MiniD20, 8-state InlineDicePanel, 3 timing modes), Settings modal (3 tabs: game/display/world with storyteller, difficulty dials, checkpoints), Talk to GM (chat bubble with free/escalation flow)
- **Prompt 6:** Debug panel (6-tab drawer activated by ?debug=true or Ctrl+Shift+D), Bug Report + Suggest modals, ErrorBoundary, connection status indicator, keyboard shortcuts

### Init Wizard Fixes
- **Phase 4 gameId flow fix:** `app/init/page.js`. Root cause: gameId was read from `?gameId=` param but `/menu` navigates with `?id=` or no param. `generateProposal()` never fired, falling back to hardcoded SAMPLE_STATS every time. Fix: read both `?gameId=` and `?id=`, create game via `POST /api/games/new` on mount if no URL gameId, store in `createdGameId` state. All Phase 1-6 API calls now fire. Commit 048008a.
- **Phase 4 saveAttributes fix:** `app/init/page.js`. Root cause: Phase4 component managed adjusted stats in local state but never propagated back to parent. `saveAttributes()` sent original proposal, not user-adjusted values. Fix: Phase4 accepts `onStatsChange` callback, parent stores `adjustedStats`, `saveAttributes` sends adjusted values.
- **Full API integration audit:** Audited every page and component. Results: Gameplay page (`/play`) fully wired. Init wizard phases all conditional on gameId (now working post-fix). Saved Games page entirely mock data. Loading page hardcoded. Glossary/map/notes silent fail by design.
- **Offline banner:** `app/init/page.js`. Shows persistent amber warning banner when `POST /api/games/new` fails. Includes "Retry Connection" button. Banner auto-dismisses on successful retry or if gameId arrives via URL. Wizard still navigable in offline mode.
- **Phase 6 scenario generation wired to API:** `app/init/page.js`. Root cause: `saveScenario()` called `generate-scenarios` and `select-scenario` at the same time on Continue click. The generate-scenarios response was never used; users always saw hardcoded SCENARIOS. Fix: `fetchScenarios()` now fires when entering Phase 6 or when intensity changes (gated on gameId). API response mapped to SCENARIOS shape. Loading state shown during fetch. Intensity changes clear selection and re-fetch. Hardcoded SCENARIOS kept as fallback. `saveScenario()` now only calls `select-scenario`.

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
| `/api/games/:id/init/storyteller` | POST | Wired (skipped when no gameId) |
| `/api/games/:id/init/setting` | POST | Wired |
| `/api/games/:id/init/world-status` | GET | Wired (polls every 2s) |
| `/api/games/:id/init/character` | POST | Wired |
| `/api/games/:id/init/generate-proposal` | POST | Wired (fallback to SAMPLE_STATS) |
| `/api/games/:id/init/adjust-proposal` | POST | Wired |
| `/api/games/:id/init/difficulty` | POST | Wired |
| `/api/games/:id/init/generate-scenarios` | POST | Wired (fires on phase entry + intensity change, fallback to hardcoded) |
| `/api/games/:id/init/select-scenario` | POST | Wired |
| `/api/world-snapshots` | GET | Wired (fails silently if unavailable) |

### Game Layout (`/play`)
| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/games/:id` | GET | Wired (initial game state load) |
| `/api/game/:id/stream` | GET (SSE) | Wired (EventSource with auto-reconnect) |
| `/api/game/:id/action` | POST | Wired (option + custom actions) |
| `/api/game/:id/glossary` | GET | Wired (cached on load) |
| `/api/game/:id/map` | GET | Wired |
| `/api/game/:id/notes` | GET/POST/DELETE | Wired (entity popup + journal tab) |
| `/api/game/:id/talk-to-gm` | POST | Wired (free lookup) |
| `/api/game/:id/talk-to-gm/escalate` | POST | Wired (AI escalation) |
| `/api/game/:id/settings/storyteller` | PUT | Wired (settings modal) |
| `/api/game/:id/settings/difficulty` | PUT | Wired (settings modal) |
| `/api/game/:id/checkpoints` | GET | Wired (settings modal world tab) |
| `/api/game/:id/snapshots` | POST | Wired (share + save snapshot) |
| `/api/game/:id/character` | GET | Not yet (uses initial load data + SSE) |
| `/api/bug-report` | POST | Wired |
| `/api/suggestion` | POST | Wired |

---

## Deferred Items

Items flagged for post-launch or future sessions. Not blocking progress.

### Design
- Mobile responsiveness pass on all pages
- Genre-adaptive backgrounds (game layout adapts to story genre)
- Custom difficulty badge color logic
- Interactive node map (replace list view in /play Map tab with `node-map-v2.jsx`)
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
