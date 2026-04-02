# CLAUDE.md — CrucibleRPG Frontend

## Project Overview
The frontend client for Crucible RPG, a solo tabletop RPG powered by AI narration and server-side mechanical resolution. React/Next.js deployed on Vercel. The backend is a separate Node.js/Express repo deployed on Railway — this terminal cannot access it.

## User Context
The user is the game designer, not a programmer. Explain decisions in plain language. Don't ask them to choose between technical approaches they can't evaluate — make a recommendation and explain why.

## Workflow
User brings problems or requests → investigate and fix → commit and push → user tests on production and reports back. At the end of each task, include a brief summary of what changed and any decisions made.

## Key Reference Files
Read these before making changes (all in `docs/`):
- `docs/design-system.md` — Colors, fonts, spacing, component styling rules
- `docs/API_CONTRACT.md` — Source of truth for all API integration. If a field name, value format, or response shape doesn't match this doc, the code is wrong. If it doesn't cover an endpoint you need, ask.
- `docs/FRONTEND_STATUS.md` — Progress tracker. Update after completing work.
- `docs/FRONTEND_TODO.md` — Task list. Read at the start of every session. When a task is completed during normal work, check it off (change `- [ ]` to `- [x]` and add the date).

**Do not create or write to:** BUILD_PROGRESS.md, DESIGN_DECISIONS.md, DEBUG_LOG.md, TEST_LOG.md, or PROJECT_MAP.md. Those belong to the backend repo.

## API Structure
- Auth: `/api/auth/...`
- Game management: `/api/games/...`
- Init wizard: `/api/init/{gameId}/...`
- Gameplay: `/api/game/{gameId}/...`
- Auth token stored in localStorage as `crucible_token`

**Common bug pattern:** This frontend was originally built on mock data with assumed API contracts. Contract mismatches (field names, value formats, response shapes) are the most frequent bug class. Always check API_CONTRACT.md before assuming component logic is correct.

## After Every Task

### 1. Update FRONTEND_STATUS.md
Add an entry under "Recent Work" in `docs/FRONTEND_STATUS.md` with:
- Section heading describing the change
- Key changes as bullet points
- Files modified and files created lists
- Update the "Last Updated" date and the Page Status table if relevant

### 2. Sync claude-upload/
Every source file that has a copy in `claude-upload/` must be re-synced before committing. Check every file you modified or created against this mapping:

| Source | claude-upload copy |
|--------|-------------------|
| `app/{route}/page.js` | `{route}-page.js` |
| `app/{route}/page.module.css` | `{route}-page.module.css` |
| `app/layout.js` | `app-layout.js` |
| `app/globals.css` | `globals.css` |
| `components/*.js` | `component-*.js` |
| `components/*.module.css` | `component-*.module.css` |
| `hooks/*.js` | `hook-*.js` |
| `lib/*.js` | `lib-*.js` |
| `docs/*` | same filename |
| `app/play/page.js` + `app/play/components/*` | `play-full.js` (concatenated with FILE headers) |

If you create a new file, create its claude-upload copy too. If a copy doesn't exist yet for a modified file, create it.

### 3. Build verify
Run `npx next build` and confirm it passes before committing.

## Deployment
Vercel auto-deploys on push to master. After pushing, verify the deploy completed before telling the user to test. Browser testing at www.cruciblerpg.com.

## Code Style
- Use CSS variables from `app/globals.css` (e.g., `var(--accent-gold)`) instead of hardcoded hex where a token exists
- Use design system fonts via variables: `var(--font-cinzel)`, `var(--font-alegreya)`, `var(--font-alegreya-sans)`, `var(--font-jetbrains)`
- No `rgba()` for text colors, card backgrounds, or borders — use solid hex per design system rules
