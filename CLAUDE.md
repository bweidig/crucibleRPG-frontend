# CLAUDE.md — CrucibleRPG Frontend

## Project Overview
React/Next.js frontend deployed on Vercel (auto-deploys on push to master). Backend is a separate repo — not accessible from this terminal.

## Key Reference Files
Read these before making changes:
- `docs/design-system.md` — Colors, fonts, spacing, component styling rules
- `docs/API_CONTRACT.md` — Source of truth for all API integration
- `docs/FRONTEND_STATUS.md` — Progress tracker for frontend work

## After Every Task

### 1. Update FRONTEND_STATUS.md
After completing any frontend task, add an entry under "Recent Work" in `docs/FRONTEND_STATUS.md` with:
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
| `app/play/page.js` + `app/play/components/*` | `play-full.js` (concatenated) |

If you create a new file, create its claude-upload copy too. If a copy doesn't exist yet for a modified file, create it.

### 3. Build verify
Run `npx next build` and confirm it passes before committing.

## Code Style
- Use CSS variables from `app/globals.css` (e.g., `var(--accent-gold)`) instead of hardcoded hex where a token exists
- Use design system fonts via variables: `var(--font-cinzel)`, `var(--font-alegreya)`, `var(--font-alegreya-sans)`, `var(--font-jetbrains)`
- No `rgba()` for text colors, card backgrounds, or borders — use solid hex per design system rules
