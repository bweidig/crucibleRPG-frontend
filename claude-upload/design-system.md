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
| Card background | `#151a2c` | Cards, elevated surfaces, popups |
| Input background | `#0a0e1a` | Text inputs, textareas |
| Elevated card background | `#1a2038` | Cards, interactive surfaces, buttons that need to read clearly against bgMain |
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
| Muted text | `#7082a4` | ~4.7:1* | Labels, metadata, tab text |
| Dim text | `#6b83a3` | 4.7:1 | Tertiary info |
| Accent gold | `#c9a84c` | 7.9:1 | Active states, links, highlights |
| Accent bright | `#ddb84e` | 9.5:1 | CTAs, emphasis |
| Danger | `#e8845a` | 6.8:1 | Condition penalties, warnings |
| Success | `#8aba7a` | 8.1:1 | Resolution success, positive states |

*`--text-muted` achieves 4.7:1 mathematically but reads lower at light font weights. Use `--text-secondary` (#8a94a8, 5.9:1) for any text meant to be read at length. Reserve `--text-muted` for short labels at 14px+ and weight 400+ only.

### Marketing Page Text Rules

Body text on marketing pages (landing, pricing, FAQ, rulebook) must use:
- **`--text-secondary` (#8a94a8)** at **weight 400** for all body/description text
- **`--text-primary` (#c8c0b0)** for primary content the user must read
- **`--text-muted` (#7082a4)** only for short labels, metadata, and de-emphasized elements at 14px minimum

Do NOT use `--text-dim` (#6b83a3) or weight 300 for body text on marketing pages. These fail readability at paragraph length.

On the game layout (`/play`), `--text-muted` and `--text-dim` remain valid for sidebar metadata and tertiary info where the context is dense and the user is already engaged.

### Text Color Consolidation (April 2026)

Marketing pages use only two grey-blue text values: `--text-secondary` (#8a94a8) for body text and `--text-muted` (#7082a4) for de-emphasized metadata. `--text-secondary-bright` (#8a9ab8) and `--text-dim` (#6b83a3) are retained for game layout use but must NOT appear on marketing pages. When building new marketing pages, use `--text-secondary` as the default body text color.

**Gold Label Colors:**
| Role | Hex | CSS Variable | Usage |
|------|-----|-------------|-------|
| Muted gold labels | `#9a8545` | `--gold-muted` | Stat category labels (SETTING, TURNS, etc.), RPG wordmark |
| Footer text | `#a08a48` | `--gold-footer` | Footer copyright line |

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
| Primary border | `#252a40` | Panel borders, dividers, card outlines |
| Light border | `#161c34` | Subtle separators |

**Gold-Tinted Utility Tokens (solid hex, computed against bgMain):**
| Role | Hex | CSS Variable | Usage |
|------|-----|-------------|-------|
| Gold border faint | `#16181e` | `--border-gold-faint` | Subtle card/input borders on marketing pages |
| Gold border subtle | `#1f1f21` | `--border-gold-subtle` | Pricing cards, slightly warmer border |
| Gold border light | `#272522` | `--border-gold-light` | Visible warm border, pricing highlight |
| Gold bg faint | `#0e111b` | `--bg-gold-faint` | Feature cards, pricing free trial card |
| Gold bg subtle | `#13151d` | `--bg-gold-subtle` | Pricing subscription card, CTA hover |
| Gold bg light | `#191a1e` | `--bg-gold-light` | Active tab background, checkbox active |

---

## Fonts

### Font Stack
- **Cinzel** — Headers, labels, buttons, option keys
- **Alegreya** — Narrative body text, subtitles, italic descriptions
- **Alegreya Sans** — UI labels, stat names, metadata, body copy
- **JetBrains Mono** — Numbers, mechanical resolution, timestamps, turn counts
- **Lexie Readable** — Accessibility font (dyslexia-friendly), available as a toggle in display settings for gameplay and reading pages

### Font Import - Required Weights
When adding or modifying the font configuration in `app/layout.js`, all of these weights must be loaded to avoid faux bold/italic:
- **Cinzel**: 400, 600, 700, 900 (no italic - Cinzel has no italic variant)
- **Alegreya**: normal 400, 500, 700 / italic 400, 500, 700
- **Alegreya Sans**: normal 300, 400, 500, 700, 800 (no italic loaded - not used in the design)
- **JetBrains Mono**: variable font (all weights via next/font/google, no explicit weight array)
- **Lexie Readable**: loaded locally (Regular 400, Bold 700)

If a new weight or style is needed, add it to the import. Never use a weight/style that isn't loaded - browsers fake it and the text looks fuzzy.

**Key rule:** If you need italic text, use **Alegreya** (not Alegreya Sans). Alegreya Sans has no italic variant loaded.

### Weight Rules — Marketing Pages
- **Weight 300** (light): Do not use for body text on marketing pages. Reserved for game layout UI where text is short and high-contrast.
- **Weight 400** (regular): Default for all body text on marketing pages.
- **Weight 500** (medium): Alegreya italic taglines and subtitles only.
- **Weight 600** (semibold): Cinzel labels, section headers, secondary buttons.
- **Weight 700** (bold): Cinzel headings, primary buttons.
- **Weight 900** (black): Cinzel hero wordmark only.

### Font Scope
Fonts are assigned by page context, not globally.

**Marketing pages** (landing, pricing, FAQ, coming soon, auth, menu, saved games): Fonts are hardcoded per element. Cinzel for headers/labels, Alegreya italic for taglines and subtitles, Alegreya Sans for body text and UI labels. No user font settings apply. Do not modify these pages to reference `--body-font`.

**Game layout** (`/play`): The default reading font is Alegreya serif. Players can toggle to Lexie Readable (dyslexia-friendly) in the SettingsModal Display tab. When Lexie is enabled, all fonts switch to Lexie Readable except Cinzel (structural headers/labels). This includes Alegreya serif, Alegreya Sans, and JetBrains Mono. Font and text size preferences are stored in `crucible_display_settings` localStorage key and applied as CSS variable overrides on the page container.

**Reading pages** (rulebook, terms of service, privacy policy): Body text respects the Lexie Readable and text size settings from localStorage. The rulebook has its own small toggle for users who haven't visited `/play` or `/settings`. ToS and Privacy read the setting silently with no toggle UI. Cinzel headers and Alegreya italic taglines remain fixed.

**Settings page** (`/settings`): Display section includes the Lexie Readable toggle and text size picker with a note explaining scope: "Applies to gameplay and reading pages (rulebook, terms, privacy)."

### Font Inheritance Rule
`--body-font` is set on `:root` in `globals.css` and defaults to `var(--font-alegreya)`. The `/play` page overrides font CSS variables on its container when the user enables Lexie Readable. Reading pages apply the same overrides by reading from localStorage on mount.

Only hardcode font families for:
- `Cinzel` on section headers and labels (decorative/structural)
- Marketing page elements (which use explicit font assignments, not `--body-font`)

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
- Font: Cinzel, 15px, 700 weight, letter-spacing 0.1em
- Padding: `14px 28px`
- Border: none
- Border-radius: `6px`

### Secondary / Ghost Button
- Background: transparent
- Border: `1px solid #3a3328`
- Text: `#c9a84c`
- Font: Cinzel, 13px, 600 weight
- Padding: `12px 24px`
- Border-radius: `6px`

---

## Hover & Interaction Patterns

### Interactive Elements (buttons, links, clickable cards)
- **Primary CTA:** `translateY(-2px)` + `box-shadow: 0 4px 30px rgba(201,168,76,0.45)` (0.3s ease)
- **Secondary/Ghost CTA:** background fills to `--bg-gold-subtle`, border warms to `--border-card-hover`, text color shifts to `--accent-gold` (0.3s ease)
- **Nav links:** color shifts to `--accent-gold` (0.2s), underline scales from 0 to 1 via ::after (0.3s)
- **Clickable cards (showcase choice cards, saved game cards):** border warms to `rgba(201,168,76,0.2)`, background tints to `rgba(201,168,76,0.04)`, cursor: pointer

### Non-Interactive Cards (feature cards, info cards)
- Border warms to `rgba(201,168,76,0.25)`, background shifts to `--bg-card-elevated` (#1a2038)
- Heading text shifts to `--accent-gold`
- Transition: `border-color 0.4s ease, background 0.4s ease`
- Do NOT add `translateY`, `box-shadow`, or `cursor: pointer` — these signal clickability. Non-interactive cards should feel alive on hover but never suggest they are links or buttons.

### Focus-Visible (all interactive elements)
- `outline: 2px solid rgba(201,168,76,0.6); outline-offset: 3px; border-radius: 6px`
- Applied via `:focus-visible` — never `:focus` (which fires on mouse click)

### Universal Timing
- All hover transitions: 0.3s–0.4s ease
- Spring-out easing for card entrance animations: `cubic-bezier(0.16, 1, 0.3, 1)`

---

## Inputs

- Background: `#0a0e1a`
- Border: `1px solid rgba(201,168,76,0.15)` (decorative, transparency OK here)
- Border-radius: `6px`
- Padding: `14px 20px`
- Font: Alegreya Sans, 16px, 400 weight
- Text color: `#c8c0b0`
- Placeholder color: `#7082a4`
- Focus: gold ring `box-shadow: rgba(201,168,76,0.15) 0 0 0 3px, rgba(201,168,76,0.08) 0 0 16px` + border-color shift to `#564b2e`

### Chrome Autofill Override
Required in `globals.css` for all dark-theme forms. Prevents Chrome autofill from turning input backgrounds white.
```css
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px var(--bg-main) inset !important;
  -webkit-text-fill-color: #c8c0b0 !important;
  caret-color: #c8c0b0;
  transition: background-color 5000s ease-in-out 0s;
}
```

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

### Showcase / Demo Containers
- Border: `1px solid rgba(201,168,76,0.12)`
- Background: `rgba(21,26,44,0.5)`
- Border-radius: `8px`
- Padding: `36px 32px` (desktop), `28px 20px` (mobile)

### Border Radius
- Cards, containers, showcase: `8px`
- Buttons, inputs: `6px`
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

## Type Scale — Marketing Pages

Marketing pages use a constrained type scale. Do not introduce sizes between these steps.

| Size | Font | Weight | Usage |
|------|------|--------|-------|
| 80px | Cinzel | 900 | Hero wordmark (clamp down on mobile) |
| 36px | Alegreya italic | 500 | Hero tagline |
| 27px | Cinzel | 700 | Feature card headings |
| 24px | Cinzel | 700 | Step headings, section subheadings |
| 18px | Alegreya / Alegreya Sans | 400 | Featured body text, narrative showcase text, hero sub-tagline |
| 16px | Alegreya Sans | 400 | Standard body text, descriptions, FAQ answers |
| 15px | Cinzel | 700 | CTA button text |
| 14px | Cinzel | 600 | Section labels, metadata |
| 12px | Cinzel | 600 | Nav links |
| 11px | Cinzel | 600 | Category labels, chevron labels (requires 7:1+ contrast color) |

The body text cluster was consolidated from 16/17/18/19px to two sizes: 16px (standard) and 18px (featured). Do not add 17px or 19px body text sizes.

---

## Animations

### Shake
Used for form validation errors (e.g., incorrect password on modal).
- Keyframes: horizontal oscillation ±8px over 0.4s ease
- Applied via class toggle (e.g., `.modalShake`)
- CSS variable: defined globally in `globals.css`

---

## Particle Field

The floating gold particle animation appears on ALL pages: Landing, Coming Soon, Auth, Menu, Pricing, FAQ, Rulebook, Saved Games, Settings, Privacy, Terms. Hidden on mobile via `@media (max-width: 767px)`. Also appears on `/play` (game layout).

- 35–40 particles (60 on Coming Soon), random positions, sizes 0.8–3.3px
- Color: `#c9a84c`, low opacity (0.08–0.33)
- Animation: slow vertical float, 6–20 second duration
- Optional twinkle: 40% of particles get a secondary opacity pulse animation
- Depth layering: particles grouped into 3 size-based layers with cursor parallax (4/8/14px max shift)
- Must respect `prefers-reduced-motion` (disable all animation when set)
- GPU compositing: `will-change: transform, opacity` on particle elements

---

## Interactive Gameplay Showcase

Landing page centerpiece positioned between hero and features sections. Visitors click choice cards to see different dice-resolved narrative outcomes.

### Structure
Three scenarios cycle via NEXT SCENARIO button and dot navigation: Dark Fantasy (Bard voice), Industrial Sci-Fi (Noir voice), Noir Mystery (Whisper voice). Each scenario contains: genre label, storyteller name, narrative passage, three clickable choice cards, permanently disabled custom action input, dice result bar, and narrative outcome.

### First Load Behavior
First scenario renders immediately with all content visible (no typewriter animation). Choices appear unselected, waiting for user click. Subsequent scenarios triggered by NEXT SCENARIO use the full typewriter animation sequence.

### Interactivity
- Each scenario has 3 prefab results (9 total) covering Tier 2, 3, 4, and 5 outcomes
- Clicking a choice card highlights it (gold border + background), dims others to 0.35 opacity
- Dice bar and result text appear after selection (with fade-in on firstView, typewriter on subsequent scenarios)
- TRY ANOTHER button resets to choices within same scenario (fade out result, scroll to showcase top, restore choice cards)
- NEXT SCENARIO and dots visible from the moment choices appear (no selection required to advance)
- Custom action row permanently greyed out (opacity 0.35) with "Available in game" label in `--gold-muted` at 11px

### Dice Bar Format
DC X.X · Stat X.X [+ Skill +X.X] · Matched/Outmatched · Roll: X · Total: X.X · Tier N Result

### Dice Tier Colors
| Tier | CSS Class | Color |
|------|-----------|-------|
| Tier 2 Success | `.diceSuccess` | `#8ab060` |
| Tier 3 Costly Success | `.diceCostly` | `#d4a84c` |
| Tier 4 Small Mercy | `.diceMercy` | `#c9a84c` |
| Tier 5 Failure | `.diceFailure` | `#e8845a` |

### Typography
- Genre label: Cinzel 11px/600, letter-spacing 3px, `--accent-gold`
- Storyteller label: Alegreya Sans 12px, `--gold-muted` (#9a8545)
- Narrative text: Alegreya 18px, line-height 1.75, `#b8ad94`
- Choice letter: Cinzel 14px/600, `#564b2e` default / `--accent-gold` selected
- Choice text: Alegreya Sans 15px, line-height 1.55, `--text-muted` default / `--text-heading` selected
- Result text: Alegreya 18px, line-height 1.75, `#b8ad94`
- Dice bar: JetBrains Mono 14px, `--gold-muted`, letter-spacing 0.3px
- Buttons: Cinzel 12px/600, letter-spacing 2px, `--gold-muted`

### Animation Timing
- Narrative typewriter: 30ms per word (was 50ms, sped up for marketing context)
- Result typewriter: 25ms per word (was 40ms)
- Choice card entrance: slideInChoice 0.5s ease-out, staggered 120ms between each
- Dice bar entrance: fadeUpIn 0.5s ease-out
- Scenario crossfade: 200ms opacity transition with minHeight preservation to prevent layout collapse
- TRY ANOTHER reset: 250ms fade out on result/dice, 300ms fade in on restored choices
- Showcase container entrance: 0.6s opacity fade on IntersectionObserver trigger

### Choice Card States
- Default: bg `rgba(255,255,255,0.02)`, border `rgba(255,255,255,0.06)`, cursor pointer
- Hover (unselected): border `rgba(201,168,76,0.2)`, bg `rgba(201,168,76,0.04)`, letter turns gold
- Selected: bg `rgba(201,168,76,0.08)`, border `rgba(201,168,76,0.3)`
- Dimmed: opacity 0.35
- Focus-visible: `outline: 2px solid rgba(201,168,76,0.6); outline-offset: 2px`

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

## Storyteller Voices

Six narrator voices plus Custom, selected during character creation. Selection is purely narrative with no mechanical effect. Can be changed mid-game at any time.

| Voice | One-Liner | Technique |
|-------|-----------|-----------|
| Chronicler | The world as it is. | Factual, court-witness detail, no metaphor or simile |
| Bard | You are the hero of this story. | Grounded epic, earned emotional weight, never stacked similes |
| Trickster | The world has a sense of humor. | Observational, dry, one wry line per paragraph max |
| Poet | Every victory has a cost. | Sensory absence, specific images over abstraction |
| Whisper | Something is always wrong. | 90% warmth / 10% buried wrongness, one wrong detail per scene |
| Noir | Nobody is clean. | Read people by actions, one deduction per scene, earned cynicism |
| Custom | Define your own voice. | Player-defined via freeform text |

Font usage: storyteller names in Alegreya Sans, one-liners in Alegreya italic, narrator labels in Alegreya Sans at reduced size and `--gold-muted`.

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
