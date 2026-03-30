# CrucibleRPG Design System

Use this document when implementing or updating any CrucibleRPG frontend page. All values here are the single source of truth.

---

## Color Palette — WCAG 2.1 AA Compliant

### Primary Rule: No rgba for visible elements
- **NEVER** use `rgba()` for text colors. Always use solid hex.
- **NEVER** use `rgba()` for card backgrounds, borders, or any UI element the user needs to see.
- **ONLY** use `rgba()` for overlays, shadows, modal backdrops, and focus/glow effects where transparency is the intent.

### Dark Theme (Default)

**Backgrounds:**
| Role | Hex | Usage |
|------|-----|-------|
| Main background | `#0a0e1a` | Page body, full-bleed sections |
| Panel background | `#0d1120` | Sidebar, secondary panels |
| Card background | `#111528` | Cards, elevated surfaces, popups |
| Input background | `#0a0e1a` | Text inputs, textareas |
| Resolution background | `#0e1420` | Dice roll resolution blocks |

**Text Colors (all pass 4.5:1 on all dark backgrounds):**
| Role | Hex | Contrast | Usage |
|------|-----|----------|-------|
| Primary text | `#c8c0b0` | 10.0:1 | Body text, main content |
| Headings | `#d0c098` | 10.0:1 | Section headers, character names |
| Narrative body | `#d4c4a0` | 10.5:1 | In-game story text |
| Secondary text | `#8a94a8` | 5.9:1 | Stat values, descriptions |
| Brighter secondary | `#8a9ab8` | 6.6:1 | Italic subtitles, timestamps, small text needing extra legibility |
| Stat values bright | `#b0b8cc` | 8.5:1 | Card detail values (setting, storyteller, etc.) |
| Muted text | `#7082a4` | 4.7:1 | Labels, metadata, tab text |
| Dim text | `#6b83a3` | 4.7:1 | Tertiary info |
| Accent gold | `#c9a84c` | 7.9:1 | Active states, links, highlights |
| Accent bright | `#ddb84e` | 9.5:1 | CTAs, emphasis |
| Danger | `#e8845a` | 6.8:1 | Condition penalties, warnings |
| Success | `#8aba7a` | 8.1:1 | Resolution success, positive states |

**Gold Label Colors:**
| Role | Hex | Usage |
|------|-----|-------|
| Muted gold labels | `#9a8545` | Stat category labels (SETTING, TURNS, etc.) |
| Footer text | `#a08a48` | Footer copyright line |
| RPG wordmark | `#9a8545` | "RPG" next to CRUCIBLE in wordmark |

**Brown Theme Colors (sidebar/inventory):**
| Role | Hex | Usage |
|------|-----|-------|
| Brown muted | `#948373` | Glossary defs, NPC notes, timestamps |
| Brown dim | `#948270` | Sidebar secondary text, chevrons |
| Brown faint | `#948470` | Sidebar tertiary text, map locations |
| Muted gold (sidebar) | `#907f5e` | Skill values, section headers, footer buttons |

**Resolution Block:**
| Role | Hex | Usage |
|------|-----|-------|
| Detail labels | `#738660` | Expanded roll breakdown labels |
| Detail dim text | `#668954` | "?" button, secondary detail text |

**Card Borders:**
| Role | Hex | Usage |
|------|-----|-------|
| Card border | `#3a3328` | Default card/container border (gold-tinted) |
| Card border hover | `#564b2e` | Hover state for interactive cards |
| Card separator | `#2a2622` | Divider lines within cards |

**Difficulty Badge Colors:**
| Difficulty | Text | Background | Border |
|-----------|------|------------|--------|
| Forgiving | `#7aba7a` | `#142018` | `#7aba7a33` |
| Standard | `#8a94a8` | `#161a20` | `#8a94a833` |
| Harsh | `#e8c45a` | `#1e1a12` | `#e8c45a33` |
| Brutal | `#e85a5a` | `#201416` | `#e85a5a33` |

**Borders:**
| Role | Hex | Usage |
|------|-----|-------|
| Primary border | `#1e2540` | Panel borders, dividers |
| Light border | `#161c34` | Subtle separators |

---

## Fonts

### Font Stack
- **Cinzel** — Headers, labels, buttons, option keys
- **Alegreya** — Narrative body text, subtitles, italic descriptions
- **Alegreya Sans** — UI labels, stat names, metadata, body copy
- **JetBrains Mono** — Numbers, mechanical resolution, timestamps, turn counts
- **Lexie Readable** — Default body font (dyslexia-friendly), user can switch in Display Settings

### Font Import - Required Weights
When adding or modifying the font configuration in `app/layout.js`, all of these weights must be loaded to avoid faux bold/italic:
- **Cinzel**: 400, 600, 700, 900 (no italic - Cinzel has no italic variant)
- **Alegreya**: normal 400, 500, 700 / italic 400, 500, 700
- **Alegreya Sans**: normal 300, 400, 500, 700, 800 (no italic loaded - not used in the design)
- **JetBrains Mono**: variable font (all weights via next/font/google, no explicit weight array)
- **Lexie Readable**: loaded locally (Regular 400, Bold 700)

If a new weight or style is needed, add it to the import. Never use a weight/style that isn't loaded - browsers fake it and the text looks fuzzy.

**Key rule:** If you need italic text, use **Alegreya** (not Alegreya Sans). Alegreya Sans has no italic variant loaded.

### Font Inheritance Rule
All text in the game layout must respect the user's font setting via `var(--body-font)`. The `--body-font` variable is set on `:root` (defaults to Lexie Readable) and applied to `html, body`. To swap fonts at runtime, update `--body-font` via JavaScript. Only use hardcoded font families for:
- `Cinzel` on section headers and labels (decorative/structural)
- `JetBrains Mono` on pure numerical values (stat numbers, turn counts, timestamps)

Everything else inherits from the user's font choice.

---

## Wordmark

```
CRUCIBLE  RPG
  ↑         ↑
Cinzel    Cinzel
22px      12px
900wt     600wt
#c9a84c   #9a8545
```

Appears on ALL pages: Landing, Coming Soon, Main Menu, Auth, Init Wizard, Loading Screen, Game Layout, Pricing, FAQ, Saved Games, Rulebook.

---

## Buttons & CTAs

### Primary CTA (gold gradient)
- Background: `linear-gradient(135deg, #c9a84c, #ddb84e)`
- Text: `#0a0e1a` (dark on gold)
- Font: Cinzel, 13px, 700 weight, letter-spacing 0.1em
- Padding: `14px 28px`
- Border: none
- Border-radius: `4px`
- Hover: `box-shadow: 0 4px 30px rgba(201, 168, 76, 0.45)` + `translateY(-2px)`

### Secondary / Ghost Button
- Background: transparent
- Border: `1px solid #3a3328`
- Text: `#c9a84c`
- Font: Cinzel, 12px, 600 weight
- Padding: `12px 24px`
- Border-radius: `4px`
- Hover: border color `#564b2e`, background `rgba(201,168,76,0.04)`

---

## Inputs

- Background: `#0a0e1a`
- Border: `1px solid rgba(201,168,76,0.15)` (decorative, transparency OK here)
- Border-radius: `4px`
- Padding: `14px 20px`
- Font: Alegreya Sans, 16px, 400 weight
- Text color: `#c8c0b0`
- Placeholder color: `#7082a4`
- Focus: subtle gold glow `box-shadow: 0 0 0 2px rgba(201,168,76,0.2)`

---

## Spacing & Layout

### Content Max Widths
- Marketing pages (landing, coming soon): `1200px` max, centered
- Readable text blocks (body copy, descriptions): `520px–600px` max
- Game layout narrative panel: `720px` max

### Standard Spacing
- Section padding: `80px–100px` vertical, `24px–56px` horizontal (use clamp for responsiveness)
- Card padding: `24px–32px`
- Element gaps: `12px` (tight), `20px` (standard), `32px` (loose), `48px` (section breaks)

### Border Radius
- Cards, buttons, inputs: `4px`
- Modals, popups: `8px`
- Circular elements (avatars, badges): `50%`

---

## Sizing — Minimum Readable Sizes

- **Category labels** (SETTING, STORYTELLER, etc.): minimum `11px` Cinzel 600 weight — must use colors with 7:1+ contrast ratio (e.g. `--text-secondary` or brighter). Do NOT use `--text-muted` or `--text-dim` (4.7:1) at this size.
- **Detail values** below category labels: minimum `15px`
- **Difficulty badges**: minimum `12px` Cinzel 700 weight with `4px 12px` padding
- **Italic subtitle text**: use `#8a9ab8` (`--text-secondary-bright`, 6.6:1) — italic reduces perceived contrast
- **Muted/dim text** (`--text-muted`, `--text-dim`): minimum `14px` — these colors sit at the 4.7:1 AA threshold and fail below that size

---

## Animations

### Shake
Used for form validation errors (e.g., incorrect password on modal).
- Keyframes: horizontal oscillation ±8px over 0.4s ease
- Applied via class toggle (e.g., `.modalShake`)
- CSS variable: defined globally in `globals.css`

---

## Particle Field

The floating gold particle animation appears on: Landing, Coming Soon.
- 35–40 particles, random positions, sizes 0.8–3.3px
- Color: `#c9a84c`, low opacity (0.08–0.33)
- Animation: slow vertical float, 6–20 second duration
- Must respect `prefers-reduced-motion` (disable animation when set)

---

## Footer

Standard footer across all pages:
- Text: `© 2026 CrucibleRPG · Every hero needs a crucible.`
- Font: Alegreya Sans, 14px
- Color: `#a08a48`
- Padding: `32px`, centered

---

## Brand Copy Reference

- **Brand slogan:** "Every hero needs a crucible."
- **Value proposition:** "Your story. Your choices. No table required."
- **Landing page CTA:** "Every Hero Needs a Crucible. Yours is waiting."
- **Voice:** Confident but not corporate, accessible but not childish, fantasy-flavored without being cheesy.

---

## Responsive / Mobile

### Breakpoints

```
Desktop:  1024px and up (current default — no changes needed)
Tablet:   768px – 1023px
Mobile:   below 768px
```

### Universal Mobile Rules (apply via `@media (max-width: 767px)` in each page's CSS module)

- **No horizontal overflow.** Nothing should cause horizontal scrolling. Fix oversized elements rather than hiding overflow.
- **Column stacking.** Any side-by-side layout (flexbox row, grid columns) stacks vertically on mobile.
- **Container padding.** Minimum 20px horizontal padding on mobile. Content should never touch screen edges.
- **Body text minimum 16px.** Prevents iOS auto-zoom on input focus. Inputs and textareas also minimum 16px.
- **Tap targets minimum 44px tall.** All buttons, links, and interactive elements must be at least 44px in their tappable area (padding counts). Includes nav links, CTA buttons, card click targets, and form controls.
- **Hero sections.** Reduce large vertical spacing on mobile so real content isn't pushed below the fold.
- **Card grids.** Multi-column card layouts go single-column on mobile. Cards should be full-width minus padding.
- **Images and decorative elements.** Scale down proportionally. Hide purely decorative elements (particle effects, floating icons) on mobile if they crowd content or hurt performance.
- **Font scaling.** Headings 40px+ on desktop should scale down on mobile. Use `clamp()` or media queries. Rough mobile targets: main headings 28–32px, subheadings 20–24px, body 16–18px.
- **Wordmark.** Must remain legible at 320px viewport width. Scale down if needed but keep proportions.
- **Sticky elements.** Fixed/sticky nav or footer bars: keep under 60px tall on mobile.
- **Modals and popups.** Should be nearly full-screen on mobile rather than floating centered with margins.

### Tablet Adjustments (apply via `@media (max-width: 1023px)`)

- Two-column grids can stay two-column if columns are wide enough (min 300px each). Otherwise stack.
- Reduce generous desktop padding/margins by ~30%.
- Hero sections can keep their layout but reduce vertical padding.

---

## Accessibility — Implementation Checklist

### Required (before launch):
- [ ] Semantic HTML: Replace `div`/`span` with `onClick` → proper `<button>` or `<a>` elements
- [ ] ARIA labels on all icon-only buttons (settings gear, reading mode toggle, sidebar tabs, bookmark stars)
- [ ] Focus indicators: visible `:focus-visible` styles (no `outline: "none"`)
- [ ] Keyboard navigation: `tabIndex`, `onKeyDown` on all interactive elements
- [ ] Form labeling: `<label>` or `aria-label` on all inputs
- [ ] `prefers-reduced-motion` media query to disable particle animations and transitions
- [ ] Skip-to-content link on all pages
- [ ] ARIA live regions for tab switches, popup opens, narrative feed updates

### Deferred (post-launch):
- [ ] Full screen reader testing with assistive technology
- [ ] Comprehensive device/browser accessibility testing


