# Pricing Page v2 — Audit & Implementation Spec

**Page:** `/pricing` (`app/pricing/page.js` + `app/pricing/page.module.css`)
**Design system:** `docs/design-system.md`
**Visual reference:** See the HTML mockup in this project at `Pricing Page v2.html` — open it in a browser to see the target state.

This is a **v2** pass that pushes harder on the hero/free differentiation than the first audit. Where v1 gave the Hero card a subtle border + glow treatment, v2 elevates it into a materially different object so users immediately read it as the recommended plan.

---

## Changes to implement

### 1. Hero card — real visual differentiation

The Hero card should feel like a materially different object from the Free card — not just the same silhouette with different accents.

**Hero card (`priceCard--hero` / the subscription card):**

- Background: `linear-gradient(180deg, rgba(28,32,50,0.85) 0%, rgba(20,24,40,0.95) 100%)` — a darker panel distinct from the Free card
- Gradient gold border (top-to-bottom fade) via a pseudo-element:
  ```css
  .priceCard--hero {
    position: relative;
    border: 1px solid transparent;
    background-clip: padding-box;
  }
  .priceCard--hero::before {
    content: "";
    position: absolute; inset: 0;
    border-radius: 10px;
    padding: 1px;
    background: linear-gradient(180deg,
      rgba(201,168,76,0.55) 0%,
      rgba(201,168,76,0.12) 45%,
      rgba(201,168,76,0.05) 100%);
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
            mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
            mask-composite: exclude;
    pointer-events: none;
  }
  ```
- Shadow (deeper than v1):
  ```css
  box-shadow:
    0 16px 60px rgba(201,168,76,0.14),
    0 2px 0 rgba(201,168,76,0.08) inset,
    0 -1px 0 rgba(10,14,26,0.6) inset;
  ```
- Lift: `transform: translateY(-8px)` (desktop only — reset to `none` at `@media (max-width: 767px)`)
- Padding: `40px 32px` (4px more vertical than the Free card)

**Hero card top ribbon** — add a gold horizontal ribbon at the top edge:

```jsx
{/* Inside the Hero card, as the first child */}
<div className={styles.heroRibbon} />
```

```css
.priceCard--hero .heroRibbon {
  position: absolute;
  top: -1px; left: 32px; right: 32px;
  height: 3px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(201,168,76,0.9) 50%,
    transparent 100%);
  border-radius: 0 0 3px 3px;
}
```

The Free card keeps its current styling unchanged.

### 2. Dollar sign — quiet marker treatment

v1 sized the `$` at 24px/700. v2 makes it a quieter marker so the `9.99` dominates:

```css
.priceDollar {
  font-family: var(--font-cinzel);
  font-size: 22px;
  font-weight: 500;
  color: var(--text-muted);
  line-height: 1.15;
  align-self: flex-start;
  margin-top: 0.22em;
}
```

Keep Cinzel — do not switch to JetBrains Mono.

### 3. Price amount — larger, tighter

Bump the price numerals from 40px to 48px, with a hair of negative tracking:

```css
.priceAmount {
  font-family: var(--font-cinzel);
  font-size: 48px;
  font-weight: 900;
  color: var(--text-heading);
  line-height: 1.1;
  letter-spacing: -0.01em;
}
```

The Hero card now carries more visual weight; the price needs to hold its own.

### 4. Add small "USD" label

After the `/month` span, add a tiny currency label for international clarity:

```jsx
<span className={styles.priceUsd}>USD</span>
```

```css
.priceUsd {
  font-family: var(--font-cinzel);
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.2em;
  line-height: 1.15;
  margin-left: 6px;
  align-self: center;
  opacity: 0.6;
}
```

### 5. Hero card bullet order — benefits first, specs second

**Reorder the features list.** A turn count is a SKU; it should not be the opening line.

New order (verbatim):

1. **"Unlimited worlds, unlimited stories"**
2. **"Every storyteller, every setting"**
3. **"225 turns per month"** (was bullet 1)
4. **"Top-up packs when you need more"** (was "Buy extra turns if you need more")
5. **"Cancel anytime. No contracts."**

### 6. Free card — unchanged copy

Free card description, bullets, and button remain as they are in v1:

- Description: "One click and you're playing. See what your story becomes."
- Bullets: "Every feature. Every setting." / "1 world creation" / "All storytellers and settings" / "Saves carry over when you subscribe"

### 7. Line-height audit

No text element on the page should use the browser default `line-height: normal`. Set explicit line-heights everywhere:

- **1.15** for all Cinzel elements (headers, labels, badges, prices, buttons)
- **1.5** for all Alegreya Sans body text
- Elements already at 1.6–1.7 are fine — leave them

Audit every inline `style={{}}` prop and every CSS class. The current page has multiple elements with no `lineHeight` set.

### 8. Mobile card reorder

On screens below 768px, the Hero card should render **before** the Free card so mobile users see the paid plan first. Also reset the desktop lift on mobile.

```css
@media (max-width: 767px) {
  .priceCard--hero {
    order: -1;
    transform: none;  /* cancel the -8px lift */
  }
  .priceCard--free { order: 0; }
}
```

Both cards use `ScrollReveal` wrappers — apply the order to the wrapper, not the inner card. Test on a 375px viewport.

### 9. Focus-visible states

Add `:focus-visible` styles to `.btnPrimary`, `.btnSecondary`, and `.topupCard`:

```css
.btnPrimary:focus-visible,
.btnSecondary:focus-visible,
.topupCard:focus-visible {
  outline: 2px solid rgba(201,168,76,0.6);
  outline-offset: 3px;
  border-radius: 6px;
}
```

### 10. Top-up card cursor fix

**Remove `cursor: pointer`** from `.topupCard` in `page.module.css`. The cards aren't clickable yet. The pointer cursor will be re-added when Stripe is wired up.

### 11. Copy changes

Use these **verbatim** — do not rephrase:

| Location | Current | New |
|---|---|---|
| Sub-tagline (under H1) | "Every storyteller. Every setting. Start free or jump right in." | **"Every storyteller. Every setting. Start free or own the whole world."** |
| Free card description | "No credit card. No commitment. Just jump in." | **"One click and you're playing. See what your story becomes."** |
| Free card first feature bullet | "Full game. No locked features." | **"Every feature. Every setting."** |
| Hero card description | "Your monthly turns. Spend them however you want. Resets every billing cycle. Cancel anytime." | **"Your monthly turns. Combat, conversation, exploration. Spend them any way you like. Resets every billing cycle. Cancel anytime."** |
| Bottom CTA supporting text | "No group required. No prep time. Just you and a world waiting to see what you'll do." | **"Every choice leaves a mark. Start making yours."** |

### 12. H1 styling

Keep the H1 as Alegreya italic 500. **Bump the color** from `#9a9480` to `#b5ae94` for better legibility. Letter-spacing stays at `normal` / unset.

---

## Do not change

- Keep Cinzel for prices. Do not switch to JetBrains Mono.
- Do not add a yearly/annual billing toggle.
- Do not add turn anchoring copy like "≈ 15 sessions."
- Do not change the FAQ content.
- Do not change the top-up section copy.
- Do not change the bottom CTA heading ("Every Hero Needs a Crucible. Yours is waiting.").
- Do not add a "RECOMMENDED" pill badge — the gold ribbon + elevation does that job.

---

## Rationale — why v2 differs from v1

- **Hero differentiation:** v1's gold border + glow read as "slightly fancier Free card." Using a darker panel + gradient edge + 8px lift + ribbon makes the recommended plan feel materially different — it's a different *kind* of object on the page.
- **Bullet order:** Leading with "225 turns every month" is a spec-first sell. Leading with "Unlimited worlds, unlimited stories" sells the experience. Specs belong in position 3, not position 1.
- **`$` treatment:** A bold, full-color `$` competes with the numerals. Dropping it to weight 500 + text-muted lets the `9.99` dominate. The quiet "USD" label accomplishes clarity without repeating the `$`.
- **48px price:** With the Hero card now elevated, the price needs more visual weight to hold its own against the increased panel presence.

---

## Verification checklist

After implementing, confirm:

- [ ] Hero card has visibly darker panel than Free card
- [ ] Hero card has a gradient gold border (stronger at top, fading down)
- [ ] Hero card sits 8px higher than the Free card on desktop
- [ ] A gold ribbon runs across the top edge of the Hero card
- [ ] `$` reads as a small muted marker, not a competing glyph
- [ ] Price numerals are 48px
- [ ] "USD" label appears after "/month"
- [ ] Hero card bullets start with "Unlimited worlds, unlimited stories"
- [ ] "225 turns per month" is bullet 3, not bullet 1
- [ ] Zero elements with `line-height: normal` — grep for missing `lineHeight` in inline styles
- [ ] On a 375px viewport, Hero card appears above Free card **and** the `-8px` lift is cancelled
- [ ] Tab through the page — gold focus ring visible on both buttons and all three top-up cards
- [ ] Hovering top-up cards does NOT show pointer cursor
- [ ] All copy strings match exactly
- [ ] H1 is Alegreya italic 500, color `#b5ae94`, no letter-spacing
- [ ] No new colors introduced outside `colors_and_type.css` tokens (the `rgba(201,168,76,...)` and `rgba(20,24,40,...)` values for border/shadow/panel are standard design-system patterns)

---

## Reference files

- **`Pricing Page v2.html`** — Static HTML mockup with all v2 changes applied. Open in browser to see the visual target.
- **`docs/design-system.md`** — Full token inventory and component specs (already in your repo).
- **`colors_and_type.css`** — CSS variables (already in your repo).
